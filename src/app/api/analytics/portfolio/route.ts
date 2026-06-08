import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CollectionItem {
  game_id: number;
  condition_state: string;
  region: string;
  purchase_price: number | null;
  acquired_at: string;
}

interface PriceRecord {
  game_id: number;
  condition_state: string;
  region: string;
  market_price_cleaned: number;
  recorded_date: string; // "YYYY-MM-DD"
}

interface PortfolioPoint {
  date: string;      // "YYYY-MM-DD"
  label: string;     // "1 Ene", "15 Mar", …
  inversion: number;
  valorActual: number;
  valorMedio: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Línea 2 — Valor Actual (MAX):
 * Busca el precio más alto disponible para el juego hasta cutoffIso.
 * Si no hay ningún registro previo al corte, usa el registro más antiguo
 * disponible (nearest-neighbor forward) en lugar de caer a purchase_price.
 * Fallback final: purchase_price.
 */
function maxPriceAt(
  item: CollectionItem,
  cutoffIso: string,
  pricesByGameId: Map<number, PriceRecord[]>
): number {
  const fallback = item.purchase_price ? Number(item.purchase_price) : 0;
  const records = pricesByGameId.get(item.game_id);
  if (!records || records.length === 0) return fallback;

  // Pass 1: max of all records on or before cutoff
  let max = -Infinity;
  for (const p of records) {
    if (p.recorded_date > cutoffIso) break; // sorted asc
    const v = Number(p.market_price_cleaned);
    if (v > max) max = v;
  }

  if (max !== -Infinity) return max;

  // Pass 2: no past data — use the earliest future record (nearest-neighbor)
  // This happens when the cron ran today and we're plotting past days
  return Number(records[0].market_price_cleaned);
}

/**
 * Línea 3 — Valor Medio (AVG) por condition_state:
 * Precio más reciente disponible con la misma condition_state hasta cutoffIso.
 * Si no hay registros previos, usa el registro disponible más antiguo
 * (nearest-neighbor forward). Fallback final: purchase_price.
 *
 * NOTA: historical_prices guarda UNA fila por (game_id, condition, region, fecha)
 * ya promediada (IQR-average) por el cron. No hace falta promediar aquí.
 */
function avgPriceForConditionAt(
  item: CollectionItem,
  cutoffIso: string,
  pricesByGameAndCondition: Map<string, PriceRecord[]>
): number {
  const fallback = item.purchase_price ? Number(item.purchase_price) : 0;
  const key = `${item.game_id}::${item.condition_state}`;
  const records = pricesByGameAndCondition.get(key);

  // If no records for this condition, try ANY condition for this game
  // so we don't silently fall back to purchase_price when there IS market data
  const effectiveRecords = records && records.length > 0
    ? records
    : null;

  if (!effectiveRecords) return fallback;

  // Pass 1: most recent record on or before cutoff
  let latest: PriceRecord | null = null;
  for (const p of effectiveRecords) {
    if (p.recorded_date > cutoffIso) break; // sorted asc
    latest = p;
  }

  if (latest) return Number(latest.market_price_cleaned);

  // Pass 2: no past data — use the earliest future record (nearest-neighbor)
  return Number(effectiveRecords[0].market_price_cleaned);
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    // ── 1. Parse query params ─────────────────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const rawRange = searchParams.get("range") || "30d";
    const platformFilter = searchParams.get("platform") || "";
    const regionFilter = searchParams.get("region") || "";

    let numDays = 30;
    if (rawRange === "60d") numDays = 60;
    else if (rawRange === "90d") numDays = 90;

    const today = new Date();
    const cutoffStart = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - numDays + 1)
    );
    const cutoffStartIso = isoDate(cutoffStart);

    // ── 2. Fetch user_collection + collections (for platform filter) ───────────
    const [
      { data: items, error: itemsError },
      { data: colls, error: collsError },
    ] = await Promise.all([
      supabase
        .from("user_collection")
        .select("game_id, condition_state, region, purchase_price, acquired_at")
        .eq("user_id", user.id),
      supabase
        .from("collections")
        .select("game_id, platform")
        .eq("user_id", user.id),
    ]);

    if (itemsError) {
      console.error("[portfolio] user_collection error:", itemsError);
      return NextResponse.json(emptyResponse());
    }
    if (!items || items.length === 0) {
      return NextResponse.json(emptyResponse());
    }

    // Apply filters in memory — no extra DB round-trip
    const collMap = new Map((colls ?? []).map((c) => [String(c.game_id), c]));

    const filteredItems = items.filter((item) => {
      if (regionFilter && item.region !== regionFilter) return false;
      if (platformFilter) {
        const coll = collMap.get(String(item.game_id));
        if (!coll || coll.platform !== platformFilter) return false;
      }
      return true;
    });

    if (filteredItems.length === 0) {
      return NextResponse.json(emptyResponse());
    }

    // ── 3. Bulk fetch historical_prices for the relevant game_ids ──────────────
    const gameIds = Array.from(new Set(filteredItems.map((i) => i.game_id)));

    const { data: prices, error: pricesError } = await supabase
      .from("historical_prices")
      .select("game_id, condition_state, region, market_price_cleaned, recorded_date")
      .in("game_id", gameIds)
      .order("recorded_date", { ascending: true });

    if (pricesError) {
      console.error("[portfolio] historical_prices error:", pricesError);
      return NextResponse.json(emptyResponse());
    }

    const pricesList: PriceRecord[] = (prices ?? []).map((p) => ({
      game_id: Number(p.game_id),
      condition_state: p.condition_state,
      region: p.region,
      market_price_cleaned: Number(p.market_price_cleaned),
      recorded_date: p.recorded_date,
    }));

    // ── 4. Build fast lookup indexes ──────────────────────────────────────────

    // Index A: game_id → all price records (for MAX calculation)
    const pricesByGameId = new Map<number, PriceRecord[]>();
    for (const p of pricesList) {
      const list = pricesByGameId.get(p.game_id) ?? [];
      list.push(p);
      pricesByGameId.set(p.game_id, list);
    }

    // Index B: "game_id::condition_state" → price records sorted ascending (for AVG)
    const pricesByGameAndCondition = new Map<string, PriceRecord[]>();
    for (const p of pricesList) {
      const key = `${p.game_id}::${p.condition_state}`;
      const list = pricesByGameAndCondition.get(key) ?? [];
      list.push(p);
      pricesByGameAndCondition.set(key, list);
    }

    // ── 5. Build day-by-day date range ────────────────────────────────────────
    const datePoints: Array<{ iso: string; label: string }> = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i)
      );
      const day = d.getUTCDate();
      const monthIdx = d.getUTCMonth();
      const year = d.getUTCFullYear();
      const iso = isoDate(d);

      // Tick density: show every day for 30d, every other for 60d, every 3rd for 90d
      let label = "";
      if (numDays <= 30) {
        label = `${day} ${MONTH_NAMES[monthIdx]}`;
      } else if (numDays <= 60 && i % 2 === 0) {
        label = `${day} ${MONTH_NAMES[monthIdx]}`;
      } else if (numDays <= 90 && i % 3 === 0) {
        label = `${day} ${MONTH_NAMES[monthIdx]}`;
      } else {
        label = ""; // hidden tick — data point still exists
      }

      datePoints.push({ iso, label: label || `${day} ${MONTH_NAMES[monthIdx]}` });
    }

    // ── 6. Compute the 3 series for each day ─────────────────────────────────
    const chartData: PortfolioPoint[] = datePoints.map(({ iso, label }) => {
      // Only count items already owned at this point in time
      const owned = filteredItems.filter(
        (item) => item.acquired_at && item.acquired_at.slice(0, 10) <= iso
      );

      let inversion = 0;
      let valorActual = 0;
      let valorMedio = 0;

      for (const item of owned) {
        const paid = item.purchase_price ? Number(item.purchase_price) : 0;
        inversion += paid;
        valorActual += maxPriceAt(item, iso, pricesByGameId);
        valorMedio += avgPriceForConditionAt(item, iso, pricesByGameAndCondition);
      }

      return {
        date: iso,
        label,
        inversion: round2(inversion),
        valorActual: round2(valorActual),
        valorMedio: round2(valorMedio),
      };
    });

    // ── 7. Summary stats ─────────────────────────────────────────────────────
    const last = chartData[chartData.length - 1];
    const inversionTotal = last?.inversion ?? 0;
    const valorActualActual = last?.valorActual ?? 0;
    const valorMedioActual = last?.valorMedio ?? 0;

    const gananciaAbsoluta = round2(valorActualActual - inversionTotal);
    const gananciaPct =
      inversionTotal > 0
        ? round2(((valorActualActual - inversionTotal) / inversionTotal) * 100)
        : 0;

    return NextResponse.json({
      chartData,
      summary: {
        inversionTotal,
        valorActualActual,
        valorMedioActual,
        gananciaAbsoluta,
        gananciaPct,
      },
      // Debug info — remove after confirming chart is working
      _debug: {
        totalPriceRecords: pricesList.length,
        samplePrice: pricesList[0] ?? null,
        firstChartPoint: chartData[0] ?? null,
        lastChartPoint: chartData[chartData.length - 1] ?? null,
        numItems: filteredItems.length,
        uniqueGameIds: gameIds.length,
      },
    });
  } catch (error) {
    console.error("[portfolio] Unhandled error:", error);
    return NextResponse.json(emptyResponse(), { status: 200 });
  }
}

function emptyResponse() {
  return {
    chartData: [],
    summary: {
      inversionTotal: 0,
      valorActualActual: 0,
      valorMedioActual: 0,
      gananciaAbsoluta: 0,
      gananciaPct: 0,
    },
  };
}
