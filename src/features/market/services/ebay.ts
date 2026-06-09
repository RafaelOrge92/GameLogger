"use server";

import { classifyCondition } from "./ebay-pricing";

// Cache token in memory during the execution lifecycle
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0; // Epoch timestamp in ms

interface EbayListing {
  id: string;
  title: string;
  price: string;
  currency: string;
  itemUrl: string;
  imageUrl: string | null;
  condition: string;
}

/**
 * Retrieves an access token from eBay using the Client Credentials flow.
 */
async function getEbayAccessToken(): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const environment = process.env.EBAY_ENVIRONMENT || "production"; // default to production

  if (!clientId || !clientSecret) {
    throw new Error("eBay credentials not configured. Please check EBAY_CLIENT_ID and EBAY_CLIENT_SECRET in .env.local");
  }

  // Check if cached token is still valid (with a 60-second buffer)
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  const tokenUrl = environment === "sandbox"
    ? "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
    : "https://api.ebay.com/identity/v1/oauth2/token";

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${authHeader}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope", // scope for buy.browse is included in default application scopes
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("eBay Token Error Response:", errorText);
    throw new Error(`Failed to obtain eBay access token: ${response.statusText}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // expires_in is in seconds
  tokenExpiresAt = Date.now() + (data.expires_in * 1000);

  return cachedToken!;
}

/**
 * Searches eBay listings for a specific game query.
 */
export async function searchEbayListings(query: string): Promise<EbayListing[]> {
  if (!query) return [];

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  // Gracefully handle missing credentials instead of crashing
  if (!clientId || !clientSecret) {
    console.warn("eBay credentials not found in environment variables. Returning empty search results.");
    return [];
  }

  try {
    const accessToken = await getEbayAccessToken();
    const environment = process.env.EBAY_ENVIRONMENT || "production";
    const marketplace = process.env.EBAY_MARKETPLACE || "EBAY_ES"; // Default to Spain

    const baseUrl = environment === "sandbox"
      ? "https://api.sandbox.ebay.com/buy/browse/v1"
      : "https://api.ebay.com/buy/browse/v1";

    // Build search request
    // Request up to 100 items to classify them and extract the most relevant per condition
    const searchUrl = `${baseUrl}/item_summary/search?q=${encodeURIComponent(query)}&limit=100`;

    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-EBAY-C-MARKETPLACE-ID": marketplace,
        "Accept": "application/json",
      },
      next: { revalidate: 1800 } // Cache searches for 30 minutes
    });

    if (!response.ok) {
      // If unauthorized or token expired, clear cache and try once more
      if (response.status === 401) {
        cachedToken = null;
        tokenExpiresAt = 0;
      }
      console.error("eBay Browse API Error:", await response.text());
      return [];
    }

    const data = await response.json();
    
    if (!data.itemSummaries || !Array.isArray(data.itemSummaries)) {
      return [];
    }

    const items: EbayListing[] = data.itemSummaries.map((item: any) => {
      // Classify condition based on title
      const cond = classifyCondition(item.title) || "cib";
      return {
        id: item.itemId,
        title: item.title,
        price: item.price?.value || "0.00",
        currency: item.price?.currency || "EUR",
        itemUrl: item.itemWebUrl,
        imageUrl: item.image?.imageUrl || null,
        condition: cond,
      };
    });

    // Group items by condition
    const looseGroup = items.filter(i => i.condition === "loose");
    const cibGroup = items.filter(i => i.condition === "cib");
    const sealedGroup = items.filter(i => i.condition === "sealed");

    // Sort descending by price and take up to 2 items
    const processGroup = (group: any[]) => {
      return group
        .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        .slice(0, 2);
    };

    // Combine results: first sealed, then cib, then loose
    const finalResults = [
      ...processGroup(sealedGroup),
      ...processGroup(cibGroup),
      ...processGroup(looseGroup)
    ];

    return finalResults;

  } catch (error) {
    console.error("Error fetching eBay listings:", error);
    return [];
  }
}
