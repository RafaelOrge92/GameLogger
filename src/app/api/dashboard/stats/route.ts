import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const userId = user.id;

    // Get optional query filters and range
    const { searchParams } = new URL(req.url);
    const regionFilter = searchParams.get("region");
    const platformFilter = searchParams.get("platform");
    const range = searchParams.get("range") || "1y";

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 — Single bulk query: user_collection joined with collections.
    // Avoids two round-trips and the N+1 per-game pattern entirely.
    // ─────────────────────────────────────────────────────────────────────────
    const [
      { data: items, error: itemsError },
      { data: colls, error: collsError }
    ] = await Promise.all([
      supabase
        .from("user_collection")
        .select("game_id, condition_state, region, purchase_price, acquired_at")
        .eq("user_id", userId),
      supabase
        .from("collections")
        .select("game_id, platform, status, title")
        .eq("user_id", userId)
    ]);

    if (itemsError) {
      console.error("Error fetching user_collection:", itemsError);
      return NextResponse.json(getEmptyResponse());
    }
    if (collsError) {
      console.error("Error fetching collections:", collsError);
    }

    if (!items || items.length === 0) {
      return NextResponse.json(getEmptyResponse());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2 — Build a lookup map from collections and enrich items in memory.
    // ─────────────────────────────────────────────────────────────────────────
    const collMap = new Map((colls ?? []).map(c => [String(c.game_id), c]));

    const enrichedItems = items.map(item => {
      const collItem = collMap.get(String(item.game_id));
      return {
        ...item,
        title: collItem?.title || "Desconocido",
        platform: collItem?.platform || "Desconocido",
        status: collItem?.status || "owned"
      };
    });

    // Apply filters in memory — no extra DB round-trip.
    const filteredItems = enrichedItems.filter(item => {
      if (regionFilter && item.region !== regionFilter) return false;
      if (platformFilter && item.platform !== platformFilter) return false;
      return true;
    });

    if (filteredItems.length === 0) {
      return NextResponse.json(getEmptyResponse());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3 — Single bulk query for historical prices.
    // One query for ALL relevant game_ids — no N+1, no external APIs.
    // ─────────────────────────────────────────────────────────────────────────
    const gameIds = Array.from(new Set(filteredItems.map(item => item.game_id)));

    const { data: prices, error: pricesError } = await supabase
      .from("historical_prices")
      .select("game_id, condition_state, region, market_price_cleaned, recorded_date")
      .in("game_id", gameIds)
      .order("recorded_date", { ascending: true });

    if (pricesError) {
      console.error("Error fetching historical_prices:", pricesError);
      return NextResponse.json(getEmptyResponse());
    }

    // pricesList is sorted ascending by recorded_date.
    const pricesList = prices ?? [];

    // ─────────────────────────────────────────────────────────────────────────
    // Helper: find the latest market price for an item at or before `cutoff`.
    // Iterates from the end of the sorted array — O(n) worst case but very
    // fast in practice because the array is already sorted ascending.
    // ─────────────────────────────────────────────────────────────────────────
    function latestPriceAt(
      item: { game_id: number | string; condition_state: string; region: string; purchase_price: any },
      cutoff: Date
    ): number {
      const fallback = item.purchase_price ? Number(item.purchase_price) : 0;
      for (let i = pricesList.length - 1; i >= 0; i--) {
        const p = pricesList[i];
        if (
          p.game_id === item.game_id &&
          p.condition_state === item.condition_state &&
          p.region === item.region &&
          new Date(p.recorded_date + "T23:59:59Z") <= cutoff
        ) {
          return Number(p.market_price_cleaned);
        }
      }
      return fallback;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4 — Build the time-series date points.
    // ─────────────────────────────────────────────────────────────────────────
    const dataPointsList: Array<{ label: string; year: number; month: number; date: number; endOfDate: Date }> = [];
    const today = new Date();

    let numDays = 0;
    if (range === "30d") numDays = 30;
    else if (range === "60d") numDays = 60;
    else if (range === "90d") numDays = 90;

    if (numDays > 0) {
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
        const day = d.getUTCDate();
        const monthIdx = d.getUTCMonth();
        const year = d.getUTCFullYear();
        dataPointsList.push({
          label: `${day} ${MONTH_NAMES[monthIdx]}`,
          year,
          month: monthIdx,
          date: day,
          endOfDate: new Date(Date.UTC(year, monthIdx, day, 23, 59, 59, 999))
        });
      }
    } else {
      // Default: last 12 calendar months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
        const monthIdx = d.getUTCMonth();
        const year = d.getUTCFullYear();
        dataPointsList.push({
          label: MONTH_NAMES[monthIdx],
          year,
          month: monthIdx,
          date: 1,
          endOfDate: new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59, 999))
        });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHART A — Evolución: portfolio value vs. total investment over time.
    // ─────────────────────────────────────────────────────────────────────────
    const evolucion = dataPointsList.map(point => {
      const itemsOwnedAtPoint = filteredItems.filter(
        item => new Date(item.acquired_at) <= point.endOfDate
      );

      let valorTotal = 0;
      let inversionTotal = 0;

      for (const ownedItem of itemsOwnedAtPoint) {
        inversionTotal += ownedItem.purchase_price ? Number(ownedItem.purchase_price) : 0;
        valorTotal += latestPriceAt(ownedItem, point.endOfDate);
      }

      return {
        fecha: point.label,
        valorTotal: parseFloat(valorTotal.toFixed(2)),
        inversionTotal: parseFloat(inversionTotal.toFixed(2))
      };
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Pre-compute current market price for each item once — reused by
    // CHART C (sistemas) and CHART E (comparativa).
    // ─────────────────────────────────────────────────────────────────────────
    const now = new Date();
    const itemsWithCurrentPrice = filteredItems.map(item => ({
      ...item,
      currentPrice: latestPriceAt(item, now)
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // CHART B — Región: count of items per market region.
    // ─────────────────────────────────────────────────────────────────────────
    const regionCounts = filteredItems.reduce<Record<string, number>>((acc, item) => {
      const r = item.region || "Desconocida";
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});

    const region = Object.entries(regionCounts).map(([name, value]) => ({ name, value }));

    // ─────────────────────────────────────────────────────────────────────────
    // CHART C — Sistemas: value and count per platform.
    // ─────────────────────────────────────────────────────────────────────────
    const platformGroups = itemsWithCurrentPrice.reduce<Record<string, { valor: number; cantidad: number }>>(
      (acc, item) => {
        const platform = item.platform || "Desconocido";
        if (!acc[platform]) acc[platform] = { valor: 0, cantidad: 0 };
        acc[platform].cantidad += 1;
        acc[platform].valor += item.currentPrice;
        return acc;
      },
      {}
    );

    const sistemas = Object.entries(platformGroups).map(([sistema, data]) => ({
      sistema,
      valor: parseFloat(data.valor.toFixed(2)),
      cantidad: data.cantidad
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // CHART D — Estado: radar percentages per physical condition.
    // ─────────────────────────────────────────────────────────────────────────
    const totalCount = filteredItems.length;
    const conditionCounts = filteredItems.reduce<Record<string, number>>((acc, item) => {
      const c = item.condition_state || "loose";
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});

    const estado = ["loose", "cib", "sealed"].map(cond => ({
      subject: cond === "loose" ? "Loose" : cond === "cib" ? "CIB" : "Sealed",
      A: totalCount > 0 ? Math.round(((conditionCounts[cond] ?? 0) / totalCount) * 100) : 0,
      fullMark: 100
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // CHART E — Backlog: count of items per play status.
    // ─────────────────────────────────────────────────────────────────────────
    const STATUS_MAP: Record<string, string> = {
      playing: "Jugando",
      completed: "Completados",
      plan_to_play: "Pendientes",
      dropped: "Abandonado",
      owned: "En colección"
    };

    const backlogCounts = filteredItems.reduce<Record<string, number>>((acc, item) => {
      const label = STATUS_MAP[item.status] || "En colección";
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const backlog = Object.entries(backlogCounts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);

    // ─────────────────────────────────────────────────────────────────────────
    // CHART F — Comparativa: portfolio value over the selected range window.
    // 100 % pure Supabase data — no IGDB, no eBay, no external calls.
    // Reuses the same `pricesList` bulk-fetched above via `latestPriceAt`.
    // ─────────────────────────────────────────────────────────────────────────
    const comparativaEvolucion = dataPointsList.map(point => {
      // Only count items already in the collection at this point in time
      const ownedAtPoint = filteredItems.filter(
        item => new Date(item.acquired_at) <= point.endOfDate
      );

      const valorTotal = ownedAtPoint.reduce(
        (sum, item) => sum + latestPriceAt(item, point.endOfDate),
        0
      );

      return {
        fecha: point.label,
        valorTotal: parseFloat(valorTotal.toFixed(2))
      };
    });

    const precioActual =
      comparativaEvolucion.length > 0
        ? comparativaEvolucion[comparativaEvolucion.length - 1].valorTotal
        : 0;

    const precioMedio =
      comparativaEvolucion.length > 0
        ? parseFloat(
            (
              comparativaEvolucion.reduce((sum, p) => sum + p.valorTotal, 0) /
              comparativaEvolucion.length
            ).toFixed(2)
          )
        : 0;

    const precioMaximo =
      comparativaEvolucion.length > 0
        ? parseFloat(Math.max(...comparativaEvolucion.map(p => p.valorTotal)).toFixed(2))
        : 0;

    const comparativa = {
      chartData: comparativaEvolucion,
      precioActual,
      precioMedio,
      precioMaximo
    };

    return NextResponse.json({
      evolucion,
      region,
      sistemas,
      estado,
      backlog,
      comparativa
    });

  } catch (error) {
    console.error("Unhandled error in dashboard stats endpoint:", error);
    return NextResponse.json(getEmptyResponse(), { status: 200 }); // Graceful fallback
  }
}

function getEmptyResponse() {
  return {
    evolucion: [],
    region: [],
    sistemas: [],
    estado: [],
    backlog: [],
    comparativa: {
      chartData: [],
      precioActual: 0,
      precioMedio: 0,
      precioMaximo: 0
    }
  };
}
