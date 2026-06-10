import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";



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
  recorded_date: string; 
}

interface PortfolioPoint {
  date: string;      
  label: string;     
  inversion: number;
  valorActual: number;
  valorMedio: number;
}



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
    if (p.recorded_date > cutoffIso) break; 
    const v = Number(p.market_price_cleaned);
    if (v > max) max = v;
  }

  if (max !== -Infinity) return max;

  
  
  return Number(records[0].market_price_cleaned);
}









 
function avgPriceForConditionAt(
  item: CollectionItem,
  cutoffIso: string,
  pricesByGameAndCondition: Map<string, PriceRecord[]>
): number {
  const fallback = item.purchase_price ? Number(item.purchase_price) : 0;
  const key = `${item.game_id}::${item.condition_state}`;
  const records = pricesByGameAndCondition.get(key);

  
  
  const effectiveRecords = records && records.length > 0
    ? records
    : null;

  if (!effectiveRecords) return fallback;

  
  let latest: PriceRecord | null = null;
  for (const p of effectiveRecords) {
    if (p.recorded_date > cutoffIso) break; 
    latest = p;
  }

  if (latest) return Number(latest.market_price_cleaned);

  
  return Number(effectiveRecords[0].market_price_cleaned);
}



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

    

    
    const pricesByGameId = new Map<number, PriceRecord[]>();
    for (const p of pricesList) {
      const list = pricesByGameId.get(p.game_id) ?? [];
      list.push(p);
      pricesByGameId.set(p.game_id, list);
    }

    
    const pricesByGameAndCondition = new Map<string, PriceRecord[]>();
    for (const p of pricesList) {
      const key = `${p.game_id}::${p.condition_state}`;
      const list = pricesByGameAndCondition.get(key) ?? [];
      list.push(p);
      pricesByGameAndCondition.set(key, list);
    }

    
    const datePoints: Array<{ iso: string; label: string }> = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i)
      );
      const day = d.getUTCDate();
      const monthIdx = d.getUTCMonth();
      const year = d.getUTCFullYear();
      const iso = isoDate(d);

      
      let label = "";
      if (numDays <= 30) {
        label = `${day} ${MONTH_NAMES[monthIdx]}`;
      } else if (numDays <= 60 && i % 2 === 0) {
        label = `${day} ${MONTH_NAMES[monthIdx]}`;
      } else if (numDays <= 90 && i % 3 === 0) {
        label = `${day} ${MONTH_NAMES[monthIdx]}`;
      } else {
        label = ""; 
      }

      datePoints.push({ iso, label: label || `${day} ${MONTH_NAMES[monthIdx]}` });
    }

    
    const chartData: PortfolioPoint[] = datePoints.map(({ iso, label }) => {
      
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
