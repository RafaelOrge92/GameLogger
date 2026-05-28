/**
 * POST /api/cron/update-prices
 *
 * Daily cron job — updates historical_prices for every unique game in
 * user_collection. Intended to be called by Vercel Cron or an external
 * scheduler (e.g. GitHub Actions, cron-job.org).
 *
 * Security: The route is protected by a shared secret sent in the
 * "Authorization" header as a Bearer token:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Flow:
 *   1. Authenticate the request via CRON_SECRET.
 *   2. Query user_collection for all distinct (game_id, region) pairs,
 *      then fetch the game title from the `collections` table (cached title).
 *   3. For each game, fetch sold eBay ES listings.
 *   4. Classify each listing into 'loose' | 'cib' | 'sealed'.
 *   5. Apply IQR outlier filtering to each condition segment.
 *   6. Upsert one row per (game_id, condition_state, region) into
 *      historical_prices for today's date.
 *   7. Return a summary JSON so logs are easy to inspect.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  fetchSoldListings,
  classifyCondition,
  type ConditionState,
} from '@/features/market/services/ebay-pricing';
import { cleanPricesIQR } from '@/features/market/utils/priceStats';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameTarget {
  game_id: number;
  region: string;
  title: string; // resolved from collections table
}

interface SegmentResult {
  game_id: number;
  region: string;
  condition_state: ConditionState;
  market_price_cleaned: number;
  sample_size: number; // how many listings after IQR cleaning
}

interface CronSummary {
  started_at: string;
  finished_at: string;
  games_processed: number;
  games_failed: number;
  segments_upserted: number;
  errors: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITIONS: ConditionState[] = ['loose', 'cib', 'sealed'];

// Minimum number of cleaned samples needed to record a price.
// Avoids writing a "price" from a single outlier-free listing.
const MIN_SAMPLES = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Rounds to 2 decimal places — safe for NUMERIC(10,2) in Postgres. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Checks the CRON_SECRET header. Returns true if the request is authorised. */
function isAuthorised(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // If no secret is configured, only allow in development.
  if (!cronSecret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[cron] CRON_SECRET not set — allowing request in dev mode.');
      return true;
    }
    return false;
  }

  const authHeader = req.headers.get('authorization') ?? '';
  return authHeader === `Bearer ${cronSecret}`;
}

// ─── Step 1: Resolve game targets from the DB ─────────────────────────────────

async function resolveGameTargets(): Promise<GameTarget[]> {
  const supabase = createAdminClient();

  // Pull every distinct (game_id, region) pair that any user has in their
  // inventory — these are the market segments we need prices for today.
  const { data: collectionItems, error: collectionError } = await supabase
    .from('user_collection')
    .select('game_id, region');

  if (collectionError) {
    throw new Error(`Failed to query user_collection: ${collectionError.message}`);
  }

  if (!collectionItems || collectionItems.length === 0) {
    return [];
  }

  // Deduplicate by (game_id, region)
  const seen = new Set<string>();
  const unique: Array<{ game_id: number; region: string }> = [];

  for (const row of collectionItems) {
    const key = `${row.game_id}::${row.region}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ game_id: row.game_id, region: row.region });
    }
  }

  // Resolve titles from the `collections` table (cached titles = no IGDB calls)
  const gameIds = [...new Set(unique.map((u) => u.game_id))];

  const { data: collectionTitles, error: titleError } = await supabase
    .from('collections')
    // game_id in `collections` is TEXT (per existing schema)
    .select('game_id, title')
    .in('game_id', gameIds.map(String));

  if (titleError) {
    throw new Error(`Failed to resolve game titles: ${titleError.message}`);
  }

  // Build a lookup map: game_id (number) → title string
  const titleMap = new Map<number, string>();
  for (const row of collectionTitles ?? []) {
    titleMap.set(Number(row.game_id), row.title);
  }

  return unique
    .map(({ game_id, region }) => ({
      game_id,
      region,
      title: titleMap.get(game_id) ?? '',
    }))
    .filter((t) => t.title !== ''); // skip if we couldn't resolve a title
}

// ─── Step 2-5: Fetch, classify, filter, average for one game ──────────────────

async function processGame(target: GameTarget): Promise<SegmentResult[]> {
  const { game_id, region, title } = target;

  // Fetch sold listings from eBay ES
  const listings = await fetchSoldListings(title);

  if (listings.length === 0) {
    return [];
  }

  // Group prices by classified condition
  const grouped: Record<ConditionState, number[]> = {
    loose: [],
    cib: [],
    sealed: [],
  };

  for (const listing of listings) {
    const condition = classifyCondition(listing.title);
    if (condition === null) continue; // unclassifiable — skip
    grouped[condition].push(listing.price);
  }

  const results: SegmentResult[] = [];

  for (const condition of CONDITIONS) {
    const rawPrices = grouped[condition];

    if (rawPrices.length === 0) continue;

    const stats = cleanPricesIQR(rawPrices);

    // Skip if we don't have enough reliable data points after IQR cleaning
    if (stats.cleanedPrices.length < MIN_SAMPLES) {
      console.log(
        `[cron] Skipping ${title} / ${condition} / ${region} — ` +
        `only ${stats.cleanedPrices.length} clean sample(s) (min ${MIN_SAMPLES}).`,
      );
      continue;
    }

    results.push({
      game_id,
      region,
      condition_state: condition,
      market_price_cleaned: round2(stats.average),
      sample_size: stats.cleanedPrices.length,
    });
  }

  return results;
}

// ─── Step 6: Upsert into historical_prices ────────────────────────────────────

async function upsertPrices(segments: SegmentResult[]): Promise<void> {
  if (segments.length === 0) return;

  const supabase = createAdminClient();

  const rows = segments.map(({ game_id, region, condition_state, market_price_cleaned }) => ({
    game_id,
    region,
    condition_state,
    market_price_cleaned,
    recorded_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  }));

  const { error } = await supabase
    .from('historical_prices')
    .upsert(rows, {
      onConflict: 'game_id,condition_state,region,recorded_date',
      ignoreDuplicates: false, // update if re-run on the same day
    });

  if (error) {
    throw new Error(`Failed to upsert historical_prices: ${error.message}`);
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const summary: CronSummary = {
    started_at: new Date().toISOString(),
    finished_at: '',
    games_processed: 0,
    games_failed: 0,
    segments_upserted: 0,
    errors: [],
  };

  console.log('[cron] update-prices started at', summary.started_at);

  try {
    const targets = await resolveGameTargets();

    if (targets.length === 0) {
      summary.finished_at = new Date().toISOString();
      console.log('[cron] No game targets found. Nothing to do.');
      return NextResponse.json({ ...summary, message: 'No games in collection.' });
    }

    console.log(`[cron] Processing ${targets.length} unique (game, region) targets.`);

    // Process games sequentially to avoid slamming the eBay API rate limits.
    // If you have a large collection and time allows, you could batch these
    // in groups of N with Promise.allSettled.
    for (const target of targets) {
      try {
        const segments = await processGame(target);

        if (segments.length > 0) {
          await upsertPrices(segments);
          summary.segments_upserted += segments.length;
          console.log(
            `[cron] ✓ ${target.title} (${target.region}) — ` +
            `${segments.length} segment(s) upserted: ` +
            segments.map((s) => `${s.condition_state}=€${s.market_price_cleaned} (n=${s.sample_size})`).join(', '),
          );
        } else {
          console.log(`[cron] ○ ${target.title} (${target.region}) — no segments with enough data.`);
        }

        summary.games_processed++;
      } catch (gameErr) {
        // A single game failure MUST NOT stop the entire cron run.
        const msg = `Failed to process game_id=${target.game_id} "${target.title}" (${target.region}): ${String(gameErr)}`;
        console.error('[cron]', msg);
        summary.errors.push(msg);
        summary.games_failed++;
      }

      // Small delay between games to be a polite eBay API citizen (~1 req/sec)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (fatalErr) {
    const msg = `Fatal cron error: ${String(fatalErr)}`;
    console.error('[cron]', msg);
    summary.errors.push(msg);
    summary.finished_at = new Date().toISOString();
    return NextResponse.json(summary, { status: 500 });
  }

  summary.finished_at = new Date().toISOString();
  console.log('[cron] update-prices finished at', summary.finished_at);
  console.log('[cron] Summary:', JSON.stringify(summary, null, 2));

  return NextResponse.json(summary, { status: 200 });
}

// ─── Vercel Cron config ───────────────────────────────────────────────────────
// This tells Vercel to call this route every day at 03:00 UTC.
// Vercel will automatically inject the CRON_SECRET as a Bearer token.
// See: https://vercel.com/docs/cron-jobs
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes — increase if your collection is large
