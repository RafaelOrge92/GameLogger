"use server";

import { classifyCondition, isGameTitle } from "./ebay-pricing";


let cachedToken: string | null = null;
let tokenExpiresAt: number = 0; 

interface EbayListing {
  id: string;
  title: string;
  price: string;
  currency: string;
  itemUrl: string;
  imageUrl: string | null;
  condition: string;
  marketRegion?: "ES" | "US";
}



 
export async function getEbayAccessToken(): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const environment = process.env.EBAY_ENVIRONMENT || "production"; 

  if (!clientId || !clientSecret) {
    throw new Error("eBay credentials not configured. Please check EBAY_CLIENT_ID and EBAY_CLIENT_SECRET in .env.local");
  }

  
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
      scope: "https://api.ebay.com/oauth/api_scope", 
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("eBay Token Error Response:", errorText);
    throw new Error(`Failed to obtain eBay access token: ${response.statusText}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  
  tokenExpiresAt = Date.now() + (data.expires_in * 1000);

  return cachedToken!;
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

export async function searchEbayListings(query: string, region: "ES" | "US" = "ES"): Promise<EbayListing[]> {
  if (!query) return [];

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  
  if (!clientId || !clientSecret) {
    console.warn("eBay credentials not found in environment variables. Returning empty search results.");
    return [];
  }

  try {
    const accessToken = await getEbayAccessToken();
    const environment = process.env.EBAY_ENVIRONMENT || "production";
    const marketplace = region === "US" ? "EBAY_US" : "EBAY_ES";

    const baseUrl = environment === "sandbox"
      ? "https://api.sandbox.ebay.com/buy/browse/v1"
      : "https://api.ebay.com/buy/browse/v1";

    const cleanedQuery = cleanQueryForEbay(query);

    
    
    const searchUrl = `${baseUrl}/item_summary/search?q=${encodeURIComponent(cleanedQuery)}&category_ids=1249&limit=50`;

    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-EBAY-C-MARKETPLACE-ID": marketplace,
        "Accept": "application/json",
      },
      next: { revalidate: 1800 } 
    });

    if (!response.ok) {
      
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

    const items: EbayListing[] = data.itemSummaries
      .filter((item: any) => item.title && isGameTitle(item.title))
      .map((item: any) => {
        
        const cond = classifyCondition(item.title) || "cib";
        return {
          id: item.itemId,
          title: item.title,
          price: item.price?.value || "0.00",
          currency: item.price?.currency || (region === "US" ? "USD" : "EUR"),
          itemUrl: item.itemWebUrl,
          imageUrl: item.image?.imageUrl || null,
          condition: cond,
          marketRegion: region,
        };
      });

    
    const looseGroup = items.filter(i => i.condition === "loose");
    const cibGroup = items.filter(i => i.condition === "cib");
    const sealedGroup = items.filter(i => i.condition === "sealed");

    
    const processGroup = (group: any[]) => {
      return group
        .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        .slice(0, 2);
    };

    
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
