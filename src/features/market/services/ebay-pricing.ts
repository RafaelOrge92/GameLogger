/**
 * eBay Pricing Service — Cron-oriented version
 *
 * Responsibilities:
 *  1. Obtain and cache an eBay OAuth2 application token.
 *  2. Search eBay ES for completed/sold listings of a given game title.
 *  3. Parse and normalise the raw item list.
 *
 * NOTE: eBay's Browse API does NOT expose sold/completed listings directly.
 * The correct endpoint for sold items is the Finding API (findCompletedItems),
 * which is an XML-based legacy API still fully supported for this use case.
 * We use that here so the IQR filter works on real transaction data, not
 * just active listings.
 *
 * Sandbox caveat: The sandbox Finding API returns empty or dummy results for
 * most queries. Switch EBAY_ENVIRONMENT=production when ready for real data.
 */

import { getEbayAccessToken } from "./ebay";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConditionState = 'loose' | 'cib' | 'sealed';

export interface EbayRawListing {
  title: string;
  price: number; // EUR
  date?: string; // ISO Date string of the sale
}

export interface ClassifiedListing extends EbayRawListing {
  condition: ConditionState | null; // null = unclassified / skip
}

// ─── Condition classifier ─────────────────────────────────────────────────────

const CONDITION_RULES: Array<{ keywords: string[]; state: ConditionState }> = [
  {
    // Sealed / factory new — must be checked FIRST (higher precedence)
    keywords: [
      'precintado', 'precintada', 'sealed', 'nuevo a estrenar', 'new sealed', 
      'factory sealed', 'brand new', 'nuevo precintado', 'sin abrir', 'unopened'
    ],
    state: 'sealed',
  },
  {
    // Loose — cartridge/disc only — checked BEFORE CIB to prevent false classification (e.g. "sin caja ni manual")
    keywords: [
      'cartucho', 'solo disco', 'solo cartucho', 'loose', 'sin caja',
      'sin manual', 'solo juego', 'only game', 'cart only', 'suelto', 
      'disco suelto', 'solo el disco', 'only disc', 'only cartridge', 
      'sin caja ni manual', 'sin caratula', 'sin portada', 'solo dvd', 
      'no box', 'no manual', 'disc only', 'no cover', 'solo el cd', 
      'cd suelto', 'solo cd', 'sin instrucciones'
    ],
    state: 'loose',
  },
  {
    // Complete In Box
    keywords: [
      'completo', 'cib', 'complete in box', 'caja y manual', 'con caja',
      'con manual', 'boxed', 'complet', 'caja original', 'with manual',
      'manuales', 'manual original', 'instrucciones'
    ],
    state: 'cib',
  },
];

export function classifyCondition(title: string): ConditionState | null {
  const lower = title.toLowerCase();

  for (const rule of CONDITION_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.state;
    }
  }

  // Could not determine condition from title — caller will skip this listing
  return null;
}

export function isGameTitle(title: string): boolean {
  const lower = title.toLowerCase();
  const forbidden = [
    "amiibo",
    "figura",
    "figure",
    "figurine",
    "statue",
    "estatua",
    "guia",
    "guide",
    "poster",
    "soundtrack",
    "banda sonora",
    "controller",
    "mando",
    "caja vacia",
    "caja vacía",
    "empty box",
    "box only",
    "solo caja",
    "solo manual",
    "manual only",
    "sin juego",
    "no game",
    "no disc",
    "sin disco",
    "sin cartucho",
    "no cartridge",
    "case only",
    "solo caratula",
    "solo portada",
    "acrylic case",
    "caja acrilica",
    "funda protectora",
    "protector",
    "moneda",
    "coin",
    "llavero",
    "keychain",
    "peluche",
    "plush",
    "console",
    "consola",
    "joystick"
  ];
  return !forbidden.some(word => lower.includes(word));
}

// ─── Finding API — fetch completed/sold items ─────────────────────────────────

/**
 * Fetches recently SOLD eBay ES listings for a game title using the
 * legacy Finding API (findCompletedItems).
 *
 * Returns an empty array on any error so the caller can continue with
 * the next game without crashing the entire cron run.
 */
function cleanQueryForEbay(query: string): string {
  let cleaned = query;
  // Reemplazar plataformas comunes
  cleaned = cleaned.replace(/nintendo wii/i, "Wii");
  cleaned = cleaned.replace(/playstation 1|playstation 1|ps1|psx/i, "PS1");
  cleaned = cleaned.replace(/playstation 2|ps2/i, "PS2");
  cleaned = cleaned.replace(/playstation 3|ps3/i, "PS3");
  cleaned = cleaned.replace(/playstation 4|ps4/i, "PS4");
  cleaned = cleaned.replace(/playstation 5|ps5/i, "PS5");
  cleaned = cleaned.replace(/nintendo switch|switch/i, "Switch");
  cleaned = cleaned.replace(/nintendo 64|n64/i, "N64");
  cleaned = cleaned.replace(/super nintendo|snes/i, "SNES");
  cleaned = cleaned.replace(/sega mega drive|mega drive/i, "Mega Drive");
  cleaned = cleaned.replace(/game boy advance|gba/i, "GBA");
  cleaned = cleaned.replace(/game boy color|gbc/i, "GBC");
  cleaned = cleaned.replace(/game boy/i, "Game Boy");
  cleaned = cleaned.replace(/nintendo ds|nds/i, "DS");
  cleaned = cleaned.replace(/nintendo 3ds|3ds/i, "3DS");
  
  // Limpiar caracteres especiales que confunden a la API de eBay
  cleaned = cleaned.replace(/[\.\:\-\,\(\)]/g, " ");
  // Eliminar espacios múltiples
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  return cleaned;
}

export async function fetchSoldListings(
  gameTitle: string,
  region: "ES" | "US" = "ES",
  maxResults = 100,
): Promise<EbayRawListing[]> {
  try {
    const token = await getEbayAccessToken();
    const isSandbox = process.env.EBAY_ENVIRONMENT === 'sandbox';
    const cleanedTitle = cleanQueryForEbay(gameTitle);

    // The Finding API endpoint (XML REST variant)
    const baseUrl = isSandbox
      ? 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1'
      : 'https://svcs.ebay.com/services/search/FindingService/v1';

    const globalId = region === "US" ? "EBAY-US" : "EBAY-ES";
    const locationVal = region === "US" ? "US" : "ES";

    const params = new URLSearchParams({
      'OPERATION-NAME': 'findCompletedItems',
      'SERVICE-VERSION': '1.13.0',
      'SECURITY-APPNAME': process.env.EBAY_CLIENT_ID!,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      // Filter to only successfully sold items (not just "ended")
      'itemFilter(0).name': 'SoldItemsOnly',
      'itemFilter(0).value': 'true',
      // eBay LocatedIn
      'itemFilter(1).name': 'LocatedIn',
      'itemFilter(1).value': locationVal,
      // Video Games category (1249) keeps results tight
      'categoryId': '1249',
      'keywords': cleanedTitle,
      'paginationInput.entriesPerPage': String(Math.min(maxResults, 100)),
      'sortOrder': 'EndTimeSoonest',
    });

    const res = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EBAY-SOA-GLOBAL-ID': globalId,
      },
      next: { revalidate: 7200 }, // Cache completed listings searches for 2 hours to speed up the interface
    });

    if (!res.ok) {
      console.error(
        `[eBay] findCompletedItems HTTP ${res.status} for "${gameTitle}":`,
        await res.text(),
      );
      return [];
    }

    const json = await res.json();

    // Navigate the Finding API JSON envelope
    const searchResult =
      json?.findCompletedItemsResponse?.[0]?.searchResult?.[0];

    if (!searchResult || searchResult['@count'] === '0') {
      return [];
    }

    const items: any[] = searchResult.item ?? [];

    const listings: EbayRawListing[] = [];

    for (const item of items) {
      const title: string = item.title?.[0] ?? '';
      const priceRaw = item.sellingStatus?.[0]?.convertedCurrentPrice?.[0];
      const price = parseFloat(priceRaw?.['__value__'] ?? '0');
      const date = item.listingInfo?.[0]?.endTime?.[0] ?? new Date().toISOString();

      if (!title || !isGameTitle(title) || isNaN(price) || price <= 0) continue;

      listings.push({ title, price, date });
    }

    return listings;
  } catch (err) {
    console.error(`[eBay] Unexpected error fetching "${gameTitle}":`, err);
    return [];
  }
}
