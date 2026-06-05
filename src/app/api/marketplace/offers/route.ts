import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface IGDBGame {
  id: number;
  name: string;
  coverUrl: string | null;
  platforms: string[];
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // 1. Capture Filters from Query Params
    const { searchParams } = new URL(req.url);
    const offerType = searchParams.get("offer_type");
    const conditionState = searchParams.get("condition_state");
    const region = searchParams.get("region");

    // 2. Query Supabase for active marketplace offers
    let query = supabase
      .from("marketplace_offers")
      .select(`
        id,
        user_id,
        game_id,
        condition_state,
        region,
        offer_type,
        price_wanted,
        status,
        created_at,
        profiles (
          username,
          avatar_url
        )
      `)
      .eq("status", "active");

    // Conditionally apply filters if provided
    if (offerType && offerType !== "all") {
      // If client requests 'sell', we match both 'sell' and 'both'
      if (offerType === "sell") {
        query = query.in("offer_type", ["sell", "both"]);
      } else if (offerType === "trade") {
        // If client requests 'trade', we match both 'trade' and 'both'
        query = query.in("offer_type", ["trade", "both"]);
      } else {
        query = query.eq("offer_type", offerType);
      }
    }

    if (conditionState && conditionState !== "all") {
      query = query.eq("condition_state", conditionState);
    }

    if (region && region !== "all") {
      query = query.eq("region", region);
    }

    // Sort by newest offers first
    query = query.order("created_at", { ascending: false });

    const { data: offers, error: dbError } = await query;

    if (dbError) {
      console.error("Database error fetching marketplace offers:", dbError);
      return NextResponse.json(
        { error: "Error al obtener las ofertas del servidor de base de datos." },
        { status: 500 }
      );
    }

    // Return empty array early if no offers found
    if (!offers || offers.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // 3. Extract unique game IDs to batch query IGDB and user collections for platforms
    const uniqueGameIds = Array.from(
      new Set(offers.map((offer: any) => Number(offer.game_id)).filter((id) => !isNaN(id)))
    );

    // 4. Batch query IGDB API to fetch titles and covers
    const igdbGamesMap = new Map<number, IGDBGame>();

    if (uniqueGameIds.length > 0) {
      try {
        const idsStr = uniqueGameIds.join(",");
        const response = await fetch("https://api.igdb.com/v4/games", {
          method: "POST",
          headers: {
            "Client-ID": process.env.IGDB_CLIENT_ID || "",
            "Authorization": `Bearer ${process.env.IGDB_ACCESS_TOKEN || ""}`,
            "Accept": "application/json",
          },
          body: `where id = (${idsStr}); fields name, cover.url, platforms.name; limit 500;`,
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            data.forEach((game: any) => {
              igdbGamesMap.set(Number(game.id), {
                id: game.id,
                name: game.name,
                coverUrl: game.cover?.url
                  ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
                  : null,
                platforms: game.platforms?.map((p: any) => p.name) || [],
              });
            });
          }
        } else {
          console.warn("IGDB API query failed for marketplace offers, falling back.");
        }
      } catch (err) {
        console.error("Error connecting to IGDB API for marketplace offers:", err);
      }
    }

    // 5. Query user collections to resolve platform of specific listed game items
    // Since collections.game_id is text, convert uniqueGameIds to strings
    const uniqueGameIdsStr = uniqueGameIds.map(String);
    const uniqueUserIds = Array.from(new Set(offers.map((offer: any) => offer.user_id)));

    const platformMap = new Map<string, string>(); // Key: "userId_gameId", Value: platform

    if (uniqueGameIdsStr.length > 0 && uniqueUserIds.length > 0) {
      try {
        const { data: collections, error: collError } = await supabase
          .from("collections")
          .select("user_id, game_id, platform")
          .in("game_id", uniqueGameIdsStr)
          .in("user_id", uniqueUserIds);

        if (!collError && collections) {
          collections.forEach((c: any) => {
            platformMap.set(`${c.user_id}_${c.game_id}`, c.platform);
          });
        }
      } catch (err) {
        console.error("Error retrieving platforms from user collections:", err);
      }
    }

    // 6. Format and cross-reference results
    const enrichedOffers = offers.map((offer: any) => {
      const gameIdNum = Number(offer.game_id);
      const igdbGame = igdbGamesMap.get(gameIdNum);
      const profile = Array.isArray(offer.profiles)
        ? offer.profiles[0]
        : offer.profiles;

      // Determine platform from collection first, otherwise fall back to first IGDB platform or "Retro"
      const collectionKey = `${offer.user_id}_${offer.game_id}`;
      let platform = platformMap.get(collectionKey);
      if (!platform) {
        if (igdbGame && igdbGame.platforms && igdbGame.platforms.length > 0) {
          // Normalize names slightly or use the first one
          platform = igdbGame.platforms[0];
        } else {
          platform = "Retro";
        }
      }

      return {
        id: offer.id,
        game_id: gameIdNum,
        title: igdbGame ? igdbGame.name : "Juego Desconocido",
        platform: platform,
        coverUrl: igdbGame ? igdbGame.coverUrl : null,
        condition_state: offer.condition_state,
        region: offer.region,
        offer_type: offer.offer_type,
        price_wanted: offer.price_wanted !== null ? Number(offer.price_wanted) : null,
        created_at: offer.created_at,
        user: {
          username: profile?.username || "Usuario",
          avatar_url: profile?.avatar_url || null,
        },
      };
    });

    return NextResponse.json(enrichedOffers, { status: 200 });

  } catch (error) {
    console.error("Unhandled error in marketplace offers API route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
