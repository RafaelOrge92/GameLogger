















 

import { getEbayAccessToken } from "./ebay";



export type ConditionState = 'loose' | 'cib' | 'sealed';

export interface EbayRawListing {
  title: string;
  price: number; 
  date?: string; 
}

export interface ClassifiedListing extends EbayRawListing {
  condition: ConditionState | null; 
}



const CONDITION_RULES: Array<{ keywords: string[]; state: ConditionState }> = [
  {
    
    keywords: [
      'precintado', 'precintada', 'sealed', 'nuevo a estrenar', 'new sealed', 
      'factory sealed', 'brand new', 'nuevo precintado', 'sin abrir', 'unopened'
    ],
    state: 'sealed',
  },
  {
    
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









 
function cleanQueryForEbay(query: string): string {
  let cleaned = query;
  
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
  
  
  cleaned = cleaned.replace(/[\.\:\-\,\(\)]/g, " ");
  
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
      
      'itemFilter(0).name': 'SoldItemsOnly',
      'itemFilter(0).value': 'true',
      
      'itemFilter(1).name': 'LocatedIn',
      'itemFilter(1).value': locationVal,
      
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
      next: { revalidate: 7200 }, 
    });

    if (!res.ok) {
      console.error(
        `[eBay] findCompletedItems HTTP ${res.status} for "${gameTitle}":`,
        await res.text(),
      );
      return [];
    }

    const json = await res.json();

    
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
