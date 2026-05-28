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

interface MockGameConfig {
  keywords: string[];
  displayName: string;
  basePriceCib: number;
  looseMultiplier: number;
  sealedMultiplier: number;
  titles: {
    loose: string[];
    cib: string[];
    sealed: string[];
  };
}

const MOCK_GAMES: MockGameConfig[] = [
  {
    keywords: ["pokemon stadium", "pokémon stadium"],
    displayName: "Pokémon Stadium",
    basePriceCib: 85,
    looseMultiplier: 0.35,
    sealedMultiplier: 3.2,
    titles: {
      loose: ["Pokemon Stadium N64 suelto", "Cartucho Pokemon Stadium Nintendo 64", "Pokemon Stadium Solo Cartucho"],
      cib: ["Pokemon Stadium N64 Completo PAL ESP", "Pokemon Stadium Nintendo 64 CIB España", "Pokemon Stadium N64 con caja y manual ESP"],
      sealed: ["Pokemon Stadium N64 Precintado", "Pokemon Stadium Nintendo 64 Nuevo Precintado", "Pokemon Stadium N64 Sealed PAL ES"]
    }
  },
  {
    keywords: ["terranigma"],
    displayName: "Terranigma",
    basePriceCib: 320,
    looseMultiplier: 0.3,
    sealedMultiplier: 3.5,
    titles: {
      loose: ["Terranigma SNES solo cartucho", "Cartucho Terranigma Super Nintendo", "Terranigma SNES loose PAL ESP"],
      cib: ["Terranigma SNES Completo PAL ESP", "Terranigma Super Nintendo CIB Caja e Instrucciones", "Terranigma SNES CIB España excelente estado"],
      sealed: ["Terranigma SNES Precintado Original", "Terranigma Super Nintendo Nuevo Precintado", "Terranigma SNES Sealed PAL España"]
    }
  },
  {
    keywords: ["final fantasy vii", "final fantasy 7", "ff7", "ffvii"],
    displayName: "Final Fantasy VII",
    basePriceCib: 65,
    looseMultiplier: 0.5,
    sealedMultiplier: 6.0,
    titles: {
      loose: ["Final Fantasy VII PS1 discos sueltos", "Final Fantasy VII PSX solo discos", "FF7 PS1 sin manual ni caja"],
      cib: ["Final Fantasy VII PS1 Completo Black Label ESP", "Final Fantasy VII PSX CIB España", "Final Fantasy VII PlayStation 1 completo PAL ES"],
      sealed: ["Final Fantasy VII PS1 Precintado Original", "Final Fantasy 7 PSX Nuevo Precintado", "Final Fantasy VII PlayStation 1 Sealed Black Label"]
    }
  },
  {
    keywords: ["ocarina of time", "zelda ocarina"],
    displayName: "The Legend of Zelda: Ocarina of Time",
    basePriceCib: 120,
    looseMultiplier: 0.35,
    sealedMultiplier: 4.5,
    titles: {
      loose: ["Zelda Ocarina of Time N64 cartucho", "Zelda Ocarina N64 solo cartucho", "Zelda Ocarina of Time Nintendo 64 loose"],
      cib: ["Zelda Ocarina of Time N64 Completo PAL ESP", "Zelda Ocarina of Time Nintendo 64 CIB España", "Zelda Ocarina of Time N64 caja y manual ESP"],
      sealed: ["Zelda Ocarina of Time N64 Precintado", "Zelda Ocarina of Time Nintendo 64 Sealed PAL", "Zelda Ocarina of Time N64 Nuevo Precintado"]
    }
  },
  {
    keywords: ["super mario world"],
    displayName: "Super Mario World",
    basePriceCib: 80,
    looseMultiplier: 0.25,
    sealedMultiplier: 5.0,
    titles: {
      loose: ["Super Mario World SNES cartucho suelto", "Cartucho Super Mario World Super Nintendo", "Super Mario World SNES loose"],
      cib: ["Super Mario World SNES Completo España", "Super Mario World Super Nintendo CIB PAL ESP", "Super Mario World SNES con caja y manual"],
      sealed: ["Super Mario World SNES Precintado", "Super Mario World Super Nintendo Sealed Original", "Super Mario World SNES Nuevo Precintado"]
    }
  },
  {
    keywords: ["sonic the hedgehog"],
    displayName: "Sonic the Hedgehog",
    basePriceCib: 25,
    looseMultiplier: 0.4,
    sealedMultiplier: 6.0,
    titles: {
      loose: ["Sonic the Hedgehog Mega Drive suelto", "Cartucho Sonic Megadrive", "Sonic the Hedgehog Sega Genesis loose"],
      cib: ["Sonic the Hedgehog Mega Drive Completo PAL ESP", "Sonic the Hedgehog Megadrive CIB España", "Sonic 1 Megadrive completo caja e instrucciones"],
      sealed: ["Sonic the Hedgehog Mega Drive Precintado", "Sonic the Hedgehog Megadrive Sealed Original", "Sonic 1 Megadrive Nuevo Precintado"]
    }
  },
  {
    keywords: ["symphony of the night", "castlevania sotn"],
    displayName: "Castlevania: Symphony of the Night",
    basePriceCib: 350,
    looseMultiplier: 0.3,
    sealedMultiplier: 4.0,
    titles: {
      loose: ["Castlevania Symphony of the Night PS1 discos sueltos", "Castlevania SOTN PS1 loose", "Castlevania SotN PSX solo disco"],
      cib: ["Castlevania Symphony of the Night PS1 Completo PAL ESP", "Castlevania SOTN PSX CIB España", "Castlevania Symphony of the Night PlayStation 1 completo"],
      sealed: ["Castlevania Symphony of the Night PS1 Precintado", "Castlevania SOTN PSX Sealed Original", "Castlevania Symphony of the Night PS1 Nuevo Precintado"]
    }
  },
  {
    keywords: ["chrono trigger"],
    displayName: "Chrono Trigger",
    basePriceCib: 800,
    looseMultiplier: 0.25,
    sealedMultiplier: 4.5,
    titles: {
      loose: ["Chrono Trigger SNES cartucho", "Chrono Trigger Super Nintendo solo cartucho", "Chrono Trigger SNES loose NTSC-U"],
      cib: ["Chrono Trigger SNES Completo CIB NTSC-U", "Chrono Trigger Super Nintendo CIB con mapa y manuales", "Chrono Trigger SNES completo excelente estado"],
      sealed: ["Chrono Trigger SNES Precintado Original", "Chrono Trigger Super Nintendo Sealed NTSC", "Chrono Trigger SNES Nuevo Precintado"]
    }
  },
  {
    keywords: ["metroid prime"],
    displayName: "Metroid Prime",
    basePriceCib: 45,
    looseMultiplier: 0.4,
    sealedMultiplier: 5.0,
    titles: {
      loose: ["Metroid Prime GameCube disco suelto", "Metroid Prime GC loose sin caja", "Metroid Prime GameCube solo disco"],
      cib: ["Metroid Prime GameCube Completo PAL ESP", "Metroid Prime Gamecube CIB España", "Metroid Prime Game Cube completo caja e instrucciones"],
      sealed: ["Metroid Prime GameCube Precintado", "Metroid Prime Gamecube Sealed Original", "Metroid Prime GameCube Nuevo Precintado"]
    }
  },
  {
    keywords: ["metal gear solid"],
    displayName: "Metal Gear Solid",
    basePriceCib: 55,
    looseMultiplier: 0.4,
    sealedMultiplier: 5.0,
    titles: {
      loose: ["Metal Gear Solid PS1 discos sueltos", "Metal Gear Solid PSX loose sin manual", "MGS PS1 solo discos"],
      cib: ["Metal Gear Solid PS1 Completo PAL ESP", "Metal Gear Solid PSX CIB España", "Metal Gear Solid PlayStation 1 completo PAL ES"],
      sealed: ["Metal Gear Solid PS1 Precintado Original", "Metal Gear Solid PSX Sealed", "Metal Gear Solid PS1 Nuevo Precintado"]
    }
  }
];

function generateMockHistory(config: MockGameConfig, platform: string): HistoricalSale[] {
  const list: HistoricalSale[] = [];
  
  // A simple pseudo-random number generator that is stable for each run
  let seed = config.displayName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  function rand() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  // Generate 12 sales over the last 12 months (roughly 1 per month)
  for (let i = 0; i < 12; i++) {
    const daysAgo = Math.floor(i * 30 + rand() * 25 + 5);
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    
    // Condition probabilities: 40% loose, 50% cib, 10% sealed
    const r = rand();
    let condition: "loose" | "cib" | "sealed" = "cib";
    let price = config.basePriceCib;
    let titleOptions = config.titles.cib;

    if (r < 0.4) {
      condition = "loose";
      price = config.basePriceCib * config.looseMultiplier;
      titleOptions = config.titles.loose;
    } else if (r > 0.9) {
      condition = "sealed";
      price = config.basePriceCib * config.sealedMultiplier;
      titleOptions = config.titles.sealed;
    }

    // Add price variation +/- 12%
    const variation = 0.88 + rand() * 0.24;
    const finalPrice = parseFloat((price * variation).toFixed(2));
    
    // Choose title
    const titleIndex = Math.floor(rand() * titleOptions.length);
    const title = titleOptions[titleIndex];

    list.push({
      id: `mock-${config.displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}`,
      date,
      price: finalPrice,
      condition,
      platform,
      isRealEbay: false
    });
  }

  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  // 3. Fallback to mock data for the 10 specific retro games if we got absolutely nothing
  if (sales.length === 0) {
    const lowerTitle = title.toLowerCase();
    const matchedConfig = MOCK_GAMES.find(cfg => 
      cfg.keywords.some(kw => lowerTitle.includes(kw))
    );
    if (matchedConfig) {
      const mockSales = generateMockHistory(matchedConfig, selectedPlatform);
      sales.push(...mockSales);
    }
  }

  // Sort combined results by date descending
  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
