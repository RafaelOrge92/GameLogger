import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGamePriceHistory } from "@/features/market/actions";

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

    // 1. Fetch user's inventory
    const { data: items, error: itemsError } = await supabase
      .from("user_collection")
      .select("game_id, condition_state, region, purchase_price, acquired_at")
      .eq("user_id", userId);

    if (itemsError) {
      console.error("Error fetching user_collection:", itemsError);
      return NextResponse.json(getEmptyResponse());
    }

    if (!items || items.length === 0) {
      return NextResponse.json(getEmptyResponse());
    }

    // 2. Fetch supporting data from collections table (platform, status, title)
    const { data: colls, error: collsError } = await supabase
      .from("collections")
      .select("game_id, platform, status, title")
      .eq("user_id", userId);

    if (collsError) {
      console.error("Error fetching collections:", collsError);
      return NextResponse.json(getEmptyResponse());
    }

    const collMap = new Map(colls?.map(c => [String(c.game_id), c]) || []);

    // 3. Enrich items with collections metadata and apply filters in memory
    const enrichedItems = items.map(item => {
      const collItem = collMap.get(String(item.game_id));
      return {
        ...item,
        title: collItem?.title || "Desconocido",
        platform: collItem?.platform || "Desconocido",
        status: collItem?.status || "owned"
      };
    });

    const filteredItems = enrichedItems.filter(item => {
      if (regionFilter && item.region !== regionFilter) return false;
      if (platformFilter && item.platform !== platformFilter) return false;
      return true;
    });

    if (filteredItems.length === 0) {
      return NextResponse.json(getEmptyResponse());
    }

    // 4. Fetch historical prices for all matching games in the collection
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

    const pricesList = prices || [];

    // --- CHART A: evolucion ---
    const dataPointsList: Array<{ label: string; year: number; month: number; date: number; endOfDate: Date }> = [];
    const today = new Date();

    let numDays = 0;
    if (range === "30d") numDays = 30;
    else if (range === "60d") numDays = 60;
    else if (range === "90d") numDays = 90;

    if (numDays > 0) {
      // Generate last numDays calendar days
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
        const day = d.getUTCDate();
        const monthIdx = d.getUTCMonth();
        const year = d.getUTCFullYear();
        const label = `${day} ${MONTH_NAMES[monthIdx]}`;
        const endOfDay = new Date(Date.UTC(year, monthIdx, day, 23, 59, 59, 999));
        
        dataPointsList.push({
          label,
          year,
          month: monthIdx,
          date: day,
          endOfDate: endOfDay
        });
      }
    } else {
      // Default to 12 months (1y)
      for (let i = 11; i >= 0; i--) {
        const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
        const monthIdx = d.getUTCMonth();
        const year = d.getUTCFullYear();
        const label = MONTH_NAMES[monthIdx];
        const lastDay = new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59, 999));
        
        dataPointsList.push({
          label,
          year,
          month: monthIdx,
          date: 1,
          endOfDate: lastDay
        });
      }
    }

    const evolucion = dataPointsList.map(point => {
      const itemsOwnedAtPoint = filteredItems.filter(item => new Date(item.acquired_at) <= point.endOfDate);
      
      let valorTotal = 0;
      let inversionTotal = 0;

      for (const ownedItem of itemsOwnedAtPoint) {
        inversionTotal += ownedItem.purchase_price ? Number(ownedItem.purchase_price) : 0;
        
        let itemPrice = ownedItem.purchase_price ? Number(ownedItem.purchase_price) : 0;
        for (let pIdx = pricesList.length - 1; pIdx >= 0; pIdx--) {
          const p = pricesList[pIdx];
          if (
            p.game_id === ownedItem.game_id &&
            p.condition_state === ownedItem.condition_state &&
            p.region === ownedItem.region &&
            new Date(p.recorded_date + "T23:59:59Z") <= point.endOfDate
          ) {
            itemPrice = Number(p.market_price_cleaned);
            break;
          }
        }
        valorTotal += itemPrice;
      }

      return {
        fecha: point.label,
        valorTotal: parseFloat(valorTotal.toFixed(2)),
        inversionTotal: parseFloat(inversionTotal.toFixed(2))
      };
    });

    // Precalculate current price for other groupings
    const itemsWithCurrentPrice = filteredItems.map(item => {
      let currentPrice = item.purchase_price ? Number(item.purchase_price) : 0;
      for (let pIdx = pricesList.length - 1; pIdx >= 0; pIdx--) {
        const p = pricesList[pIdx];
        if (
          p.game_id === item.game_id &&
          p.condition_state === item.condition_state &&
          p.region === item.region
        ) {
          currentPrice = Number(p.market_price_cleaned);
          break;
        }
      }
      return {
        ...item,
        currentPrice
      };
    });

    // --- CHART B: region ---
    const regionCounts: Record<string, number> = {};
    filteredItems.forEach(item => {
      const r = item.region || "Desconocida";
      regionCounts[r] = (regionCounts[r] || 0) + 1;
    });
    const region = Object.entries(regionCounts).map(([name, value]) => ({
      name,
      value
    }));

    // --- CHART C: sistemas ---
    const platformGroups: Record<string, { valor: number; cantidad: number }> = {};
    itemsWithCurrentPrice.forEach(item => {
      const platform = item.platform || "Desconocido";
      if (!platformGroups[platform]) {
        platformGroups[platform] = { valor: 0, cantidad: 0 };
      }
      platformGroups[platform].cantidad += 1;
      platformGroups[platform].valor += item.currentPrice;
    });
    const sistemas = Object.entries(platformGroups).map(([sistema, data]) => ({
      sistema,
      valor: parseFloat(data.valor.toFixed(2)),
      cantidad: data.cantidad
    }));

    // --- CHART D: estado ---
    const totalCount = filteredItems.length;
    const looseCount = filteredItems.filter(item => item.condition_state === "loose").length;
    const cibCount = filteredItems.filter(item => item.condition_state === "cib").length;
    const sealedCount = filteredItems.filter(item => item.condition_state === "sealed").length;

    const estado = [
      { subject: "Loose", A: totalCount > 0 ? Math.round((looseCount / totalCount) * 100) : 0, fullMark: 100 },
      { subject: "CIB", A: totalCount > 0 ? Math.round((cibCount / totalCount) * 100) : 0, fullMark: 100 },
      { subject: "Sealed", A: totalCount > 0 ? Math.round((sealedCount / totalCount) * 100) : 0, fullMark: 100 }
    ];

    // --- CHART E: backlog ---
    const STATUS_MAP: Record<string, string> = {
      playing: "Jugando",
      completed: "Completados",
      plan_to_play: "Pendientes",
      dropped: "Abandonado",
      owned: "En colección"
    };

    const backlogCounts: Record<string, number> = {
      "Jugando": 0,
      "Completados": 0,
      "Pendientes": 0,
      "Abandonado": 0,
      "En colección": 0
    };

    filteredItems.forEach(item => {
      const mappedStatus = STATUS_MAP[item.status] || "En colección";
      backlogCounts[mappedStatus] = (backlogCounts[mappedStatus] || 0) + 1;
    });

    const backlog = Object.entries(backlogCounts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);

    // --- COMPARATIVA STATS ---
    const itemsPriceHistories = await Promise.all(
      filteredItems.map(async (item) => {
        try {
          const sales = await getGamePriceHistory(
            String(item.game_id),
            item.title || "",
            item.platform
          );
          return { item, sales };
        } catch (err) {
          console.error(`Failed to get price history for game ${item.game_id}:`, err);
          return { item, sales: [] };
        }
      })
    );

    const comparativaEvolucion = dataPointsList.map(point => {
      let valorTotal = 0;

      for (const { item, sales } of itemsPriceHistories) {
        // Sort sales by date ascending
        const sortedSales = sales
          .filter(s => s.condition === item.condition_state)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let itemPrice = item.purchase_price ? Number(item.purchase_price) : 0;

        // Find the last sale before or on point.endOfDate
        let foundSale = null;
        for (let sIdx = sortedSales.length - 1; sIdx >= 0; sIdx--) {
          const sale = sortedSales[sIdx];
          if (new Date(sale.date) <= point.endOfDate) {
            foundSale = sale;
            break;
          }
        }

        if (foundSale) {
          itemPrice = foundSale.price;
        } else if (sortedSales.length > 0) {
          // Backward-fill: take the first sale in the future if none in the past
          itemPrice = sortedSales[0].price;
        }

        valorTotal += itemPrice;
      }

      return {
        fecha: point.label,
        valorTotal: parseFloat(valorTotal.toFixed(2))
      };
    });

    const precioActual = comparativaEvolucion.length > 0 
      ? comparativaEvolucion[comparativaEvolucion.length - 1].valorTotal 
      : 0;

    const precioMedio = comparativaEvolucion.length > 0
      ? parseFloat((comparativaEvolucion.reduce((sum, p) => sum + p.valorTotal, 0) / comparativaEvolucion.length).toFixed(2))
      : 0;

    const precioMaximo = comparativaEvolucion.length > 0
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
