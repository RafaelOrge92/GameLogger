




















 

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  fetchSoldListings,
  classifyCondition,
  type ConditionState,
} from '@/features/market/services/ebay-pricing';
import { cleanPricesIQR } from '@/features/market/utils/priceStats';



interface GameTarget {
  game_id: number;
  region: string;
  title: string; 
}

interface SegmentResult {
  game_id: number;
  region: string;
  condition_state: ConditionState;
  market_price_cleaned: number;
  sample_size: number; 
}

interface CronSummary {
  started_at: string;
  finished_at: string;
  games_processed: number;
  games_failed: number;
  segments_upserted: number;
  errors: string[];
}



const CONDITIONS: ConditionState[] = ['loose', 'cib', 'sealed'];



const MIN_SAMPLES = 3;



 
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



async function resolveGameTargets(): Promise<GameTarget[]> {
  const supabase = createAdminClient();

  
  
  const { data: collectionItems, error: collectionError } = await supabase
    .from('user_collection')
    .select('game_id, region');

  if (collectionError) {
    throw new Error(`Failed to query user_collection: ${collectionError.message}`);
  }

  if (!collectionItems || collectionItems.length === 0) {
    return [];
  }

  
  const seen = new Set<string>();
  const unique: Array<{ game_id: number; region: string }> = [];

  for (const row of collectionItems) {
    const key = `${row.game_id}::${row.region}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ game_id: row.game_id, region: row.region });
    }
  }

  
  const gameIds = [...new Set(unique.map((u) => u.game_id))];

  const { data: collectionTitles, error: titleError } = await supabase
    .from('collections')
    
    .select('game_id, title')
    .in('game_id', gameIds.map(String));

  if (titleError) {
    throw new Error(`Failed to resolve game titles: ${titleError.message}`);
  }

  
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
    .filter((t) => t.title !== ''); 
}



async function processGame(target: GameTarget): Promise<SegmentResult[]> {
  const { game_id, region, title } = target;

  
  const listings = await fetchSoldListings(title);

  if (listings.length === 0) {
    return [];
  }

  
  const grouped: Record<ConditionState, number[]> = {
    loose: [],
    cib: [],
    sealed: [],
  };

  for (const listing of listings) {
    const condition = classifyCondition(listing.title);
    if (condition === null) continue; 
    grouped[condition].push(listing.price);
  }

  const results: SegmentResult[] = [];

  for (const condition of CONDITIONS) {
    const rawPrices = grouped[condition];

    if (rawPrices.length === 0) continue;

    const stats = cleanPricesIQR(rawPrices);

    
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



async function upsertPrices(segments: SegmentResult[]): Promise<void> {
  if (segments.length === 0) return;

  const supabase = createAdminClient();

  const rows = segments.map(({ game_id, region, condition_state, market_price_cleaned }) => ({
    game_id,
    region,
    condition_state,
    market_price_cleaned,
    recorded_date: new Date().toISOString().split('T')[0], 
  }));

  const { error } = await supabase
    .from('historical_prices')
    .upsert(rows, {
      onConflict: 'game_id,condition_state,region,recorded_date',
      ignoreDuplicates: false, 
    });

  if (error) {
    throw new Error(`Failed to upsert historical_prices: ${error.message}`);
  }
}



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
        
        const msg = `Failed to process game_id=${target.game_id} "${target.title}" (${target.region}): ${String(gameErr)}`;
        console.error('[cron]', msg);
        summary.errors.push(msg);
        summary.games_failed++;
      }

      
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





export const dynamic = 'force-dynamic';
export const maxDuration = 300; 
