"use server";

import { searchModernGameDeals } from "./services/cheapshark";
import { searchEbayListings } from "./services/ebay";
import { fetchSoldListings, classifyCondition } from "./services/ebay-pricing";
import { createClient } from "@/lib/supabase/server";

interface MarketData {
  cheapsharkDeals: any[];
  ebayListings: any[];
}

/**
 * Fetches market prices from both CheapShark (digital) and eBay (physical) in parallel.
 */
export async function getGameMarketData(title: string): Promise<MarketData> {
  if (!title) {
    return { cheapsharkDeals: [], ebayListings: [] };
  }

  try {
    const [cheapsharkDeals, ebayListings] = await Promise.all([
      searchModernGameDeals(title).catch((err) => {
        console.error("Failed to fetch CheapShark deals:", err);
        return [];
      }),
      searchEbayListings(title).catch((err) => {
        console.error("Failed to fetch eBay listings:", err);
        return [];
      })
    ]);

    return {
      cheapsharkDeals,
      ebayListings
    };
  } catch (error) {
    console.error("Error in getGameMarketData server action:", error);
    return {
      cheapsharkDeals: [],
      ebayListings: []
    };
  }
}

interface HistoricalSale {
  id: string;
  date: string; // ISO String
  price: number;
  condition: "loose" | "cib" | "sealed";
  platform: string;
  isRealEbay?: boolean;
}

/**
 * Fetches historical and real-time sold prices for a game.
 * Combines database historical clean prices and live eBay sold listings.
 */
export async function getGamePriceHistory(
  gameId: string,
  title: string,
  platform?: string
): Promise<HistoricalSale[]> {
  const sales: HistoricalSale[] = [];
  const selectedPlatform = platform || "All";

  // 1. Try to fetch historical prices from Supabase
  try {
    const numericGameId = parseInt(gameId, 10);
    if (!isNaN(numericGameId)) {
      const supabase = await createClient();
      const { data: dbPrices, error } = await supabase
        .from("historical_prices")
        .select("id, recorded_date, market_price_cleaned, condition_state, region")
        .eq("game_id", numericGameId)
        .order("recorded_date", { ascending: false });

      if (error) {
        console.error("Error fetching historical_prices from DB:", error);
      } else if (dbPrices && dbPrices.length > 0) {
        dbPrices.forEach((row: any) => {
          sales.push({
            id: `db-${row.id}`,
            date: new Date(row.recorded_date).toISOString(),
            price: Number(row.market_price_cleaned),
            condition: row.condition_state as "loose" | "cib" | "sealed",
            platform: selectedPlatform,
          });
        });
      }
    }
  } catch (dbErr) {
    console.error("Database price history lookup failed:", dbErr);
  }

  // 2. Fetch live sold listings from eBay ES in real-time
  try {
    const ebaySold = await fetchSoldListings(title);
    if (ebaySold && ebaySold.length > 0) {
      ebaySold.forEach((item, index) => {
        const cond = classifyCondition(item.title);
        sales.push({
          id: `ebay-${index}-${Date.now()}`,
          date: item.date || new Date().toISOString(),
          price: item.price,
          condition: cond || "cib", // default to cib
          platform: selectedPlatform,
          isRealEbay: true,
        });
      });
    }
  } catch (ebayErr) {
    console.error("eBay sold listings real-time fetch failed:", ebayErr);
  }

  // Sort combined results by date descending
  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
