"use server";

import { searchModernGameDeals } from "./services/cheapshark";
import { searchEbayListings } from "./services/ebay";

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
