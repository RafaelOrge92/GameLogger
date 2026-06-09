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

// ─── Token cache (module-level, lives for the lifetime of the server process) ─

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

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

// ─── Token management ─────────────────────────────────────────────────────────

async function getEbayAccessToken(): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID!;
  const clientSecret = process.env.EBAY_CLIENT_SECRET!;

  if (!clientId || !clientSecret) {
    throw new Error('EBAY_CLIENT_ID / EBAY_CLIENT_SECRET not configured.');
  }

  // Return cached token if still valid (with 60s safety buffer)
  if (cachedToken && tokenExpiresAt > Date.now() + 60_000) {
    return cachedToken;
  }

  const isSandbox = process.env.EBAY_ENVIRONMENT === 'sandbox';
  const tokenUrl = isSandbox
    ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
    : 'https://api.ebay.com/identity/v1/oauth2/token';

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope',
    }),
    // Never cache the token request itself
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay token fetch failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  cachedToken = json.access_token as string;
  tokenExpiresAt = Date.now() + json.expires_in * 1000;

  return cachedToken!;
}

// ─── Condition classifier ─────────────────────────────────────────────────────

const CONDITION_RULES: Array<{ keywords: string[]; state: ConditionState }> = [
  {
    // Sealed / factory new — must be checked FIRST (higher precedence)
    keywords: ['precintado', 'sealed', 'nuevo a estrenar', 'new sealed', 'factory sealed'],
    state: 'sealed',
  },
  {
    // Complete In Box
    keywords: [
      'completo', 'cib', 'complete in box', 'caja y manual', 'con caja',
      'con manual', 'boxed', 'complet',
    ],
    state: 'cib',
  },
  {
    // Loose — cartridge/disc only
    keywords: [
      'cartucho', 'solo disco', 'solo cartucho', 'loose', 'sin caja',
      'sin manual', 'solo juego', 'only game', 'cart only',
    ],
    state: 'loose',
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

// ─── Finding API — fetch completed/sold items ─────────────────────────────────

/**
 * Fetches recently SOLD eBay ES listings for a game title using the
 * legacy Finding API (findCompletedItems).
 *
 * Returns an empty array on any error so the caller can continue with
 * the next game without crashing the entire cron run.
 */
export async function fetchSoldListings(
  gameTitle: string,
  maxResults = 100,
): Promise<EbayRawListing[]> {
  try {
    const token = await getEbayAccessToken();
    const isSandbox = process.env.EBAY_ENVIRONMENT === 'sandbox';

    // The Finding API endpoint (XML REST variant)
    const baseUrl = isSandbox
      ? 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1'
      : 'https://svcs.ebay.com/services/search/FindingService/v1';

    const params = new URLSearchParams({
      'OPERATION-NAME': 'findCompletedItems',
      'SERVICE-VERSION': '1.13.0',
      'SECURITY-APPNAME': process.env.EBAY_CLIENT_ID!,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      // Filter to only successfully sold items (not just "ended")
      'itemFilter(0).name': 'SoldItemsOnly',
      'itemFilter(0).value': 'true',
      // eBay ES site ID = 186
      'itemFilter(1).name': 'LocatedIn',
      'itemFilter(1).value': 'ES',
      // Video Games category (1249) keeps results tight
      'categoryId': '1249',
      'keywords': gameTitle,
      'paginationInput.entriesPerPage': String(Math.min(maxResults, 100)),
      'sortOrder': 'EndTimeSoonest',
    });

    const res = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EBAY-SOA-GLOBAL-ID': 'EBAY-ES',
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

      if (!title || isNaN(price) || price <= 0) continue;

      listings.push({ title, price, date });
    }

    return listings;
  } catch (err) {
    console.error(`[eBay] Unexpected error fetching "${gameTitle}":`, err);
    return [];
  }
}
