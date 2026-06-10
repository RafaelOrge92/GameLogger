"use server";

import { searchModernGameDeals } from "./services/cheapshark";
import { searchEbayListings } from "./services/ebay";
import { fetchSoldListings, classifyCondition } from "./services/ebay-pricing";
import { createClient } from "@/lib/supabase/server";

interface MarketData {
  cheapsharkDeals: any[];
  ebayListings: any[];
}



 
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, defaultValue: T): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`eBay API call exceeded timeout of ${timeoutMs}ms. Using default/fallback value.`);
      resolve(defaultValue);
    }, timeoutMs);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise
  ]);
}



 
export async function getGameMarketData(title: string): Promise<MarketData> {
  if (!title) {
    return { cheapsharkDeals: [], ebayListings: [] };
  }

  try {
    const [cheapsharkDeals, ebayListingsES, ebayListingsUS] = await Promise.all([
      searchModernGameDeals(title).catch((err) => {
        console.error("Failed to fetch CheapShark deals:", err);
        return [];
      }),
      withTimeout(
        searchEbayListings(title, "ES").catch((err) => {
          console.error("Failed to fetch eBay ES listings:", err);
          return [];
        }),
        3500,
        []
      ),
      withTimeout(
        searchEbayListings(title, "US").catch((err) => {
          console.error("Failed to fetch eBay US listings:", err);
          return [];
        }),
        3500,
        []
      )
    ]);

    return {
      cheapsharkDeals,
      ebayListings: [...ebayListingsES, ...ebayListingsUS]
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
  date: string; 
  price: number;
  condition: "loose" | "cib" | "sealed";
  platform: string;
  isRealEbay?: boolean;
  marketRegion?: "ES" | "US";
}






 
export async function getGamePriceHistory(
  gameId: string,
  title: string,
  platform?: string
): Promise<HistoricalSale[]> {
  const sales: HistoricalSale[] = [];
  const selectedPlatform = platform || "All";

  try {
    const [dbPricesResult, ebaySoldResultES, ebaySoldResultUS] = await Promise.all([
      
      (async () => {
        const numericGameId = parseInt(gameId, 10);
        if (isNaN(numericGameId)) return [];
        const supabase = await createClient();
        const { data: dbPrices, error } = await supabase
          .from("historical_prices")
          .select("id, recorded_date, market_price_cleaned, condition_state, region")
          .eq("game_id", numericGameId)
          .order("recorded_date", { ascending: false });

        if (error) {
          console.error("Error fetching historical_prices from DB:", error);
          return [];
        }
        return dbPrices || [];
      })().catch((dbErr) => {
        console.error("Database price history lookup failed:", dbErr);
        return [];
      }),
      
      withTimeout(
        fetchSoldListings(title, "ES").catch((ebayErr) => {
          console.error("eBay ES sold listings real-time fetch failed:", ebayErr);
          return [];
        }),
        3500,
        []
      ),
      
      withTimeout(
        fetchSoldListings(title, "US").catch((ebayErr) => {
          console.error("eBay US sold listings real-time fetch failed:", ebayErr);
          return [];
        }),
        3500,
        []
      )
    ]);

    
    if (dbPricesResult && dbPricesResult.length > 0) {
      dbPricesResult.forEach((row: any) => {
        sales.push({
          id: `db-${row.id}`,
          date: new Date(row.recorded_date).toISOString(),
          price: Number(row.market_price_cleaned),
          condition: row.condition_state as "loose" | "cib" | "sealed",
          platform: selectedPlatform,
          marketRegion: (row.region && (row.region.includes("US") || row.region.includes("NTSC"))) ? "US" : "ES"
        });
      });
    }

    
    if (ebaySoldResultES && ebaySoldResultES.length > 0) {
      ebaySoldResultES.forEach((item, index) => {
        const cond = classifyCondition(item.title);
        sales.push({
          id: `ebay-es-${index}-${Date.now()}`,
          date: item.date || new Date().toISOString(),
          price: item.price,
          condition: cond || "cib",
          platform: selectedPlatform,
          isRealEbay: true,
          marketRegion: "ES"
        });
      });
    }

    
    if (ebaySoldResultUS && ebaySoldResultUS.length > 0) {
      ebaySoldResultUS.forEach((item, index) => {
        const cond = classifyCondition(item.title);
        sales.push({
          id: `ebay-us-${index}-${Date.now()}`,
          date: item.date || new Date().toISOString(),
          price: item.price,
          condition: cond || "cib",
          platform: selectedPlatform,
          isRealEbay: true,
          marketRegion: "US"
        });
      });
    }
  } catch (error) {
    console.error("Error in parallel fetch in getGamePriceHistory:", error);
  }

  
  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
