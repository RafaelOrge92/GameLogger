import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface IGDBGame {
  id: number;
  name: string;
  coverUrl: string | null;
  platforms: string[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const decodedUsername = decodeURIComponent(username);
    const supabase = await createClient();

    // 1. Fetch user profile by username
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", decodedUsername)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // 2. Fetch collections and user items in parallel matching user id
    const [collsRes, userItemsRes] = await Promise.all([
      supabase
        .from("collections")
        .select("*")
        .eq("user_id", profile.id)
        .order("added_at", { ascending: false }),
      supabase
        .from("user_collection")
        .select("*")
        .eq("user_id", profile.id)
    ]);

    const colls = collsRes.data || [];
    const userItems = userItemsRes.data || [];

    // 3. Extract unique IGDB game IDs (collection, favorite, and crown jewel)
    const uniqueIds = new Set<number>();
    
    if (profile.favorite_game_id) {
      uniqueIds.add(Number(profile.favorite_game_id));
    }
    if (profile.crown_jewel_id) {
      uniqueIds.add(Number(profile.crown_jewel_id));
    }
    
    colls.forEach((c) => {
      const idNum = Number(c.game_id);
      if (!isNaN(idNum)) {
        uniqueIds.add(idNum);
      }
    });

    userItems.forEach((ui) => {
      const idNum = Number(ui.game_id);
      if (!isNaN(idNum)) {
        uniqueIds.add(idNum);
      }
    });

    // 4. Batch query IGDB API with compiled unique IDs
    const igdbGamesMap = new Map<number, IGDBGame>();

    if (uniqueIds.size > 0) {
      try {
        const idsStr = Array.from(uniqueIds).join(",");
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
          console.warn("IGDB API query failed, falling back to database cache.");
        }
      } catch (err) {
        console.error("Failed to query IGDB API:", err);
      }
    }

    // Helper function to resolve details from map, falling back to db cache
    const getGameDetails = (gameId: number, cachedTitle?: string, cachedCover?: string) => {
      const igdbGame = igdbGamesMap.get(gameId);
      if (igdbGame) {
        return {
          id: gameId,
          name: igdbGame.name,
          coverUrl: igdbGame.coverUrl || cachedCover || null,
          platforms: igdbGame.platforms,
        };
      }
      return {
        id: gameId,
        name: cachedTitle || "Juego Desconocido",
        coverUrl: cachedCover || null,
        platforms: [],
      };
    };

    // 5. Resolve Highlighted Games
    let favoriteGame = null;
    if (profile.favorite_game_id) {
      const cachedMatch = colls.find((c) => Number(c.game_id) === Number(profile.favorite_game_id));
      favoriteGame = getGameDetails(
        Number(profile.favorite_game_id),
        cachedMatch?.title,
        cachedMatch?.cover_url
      );
    }

    let crownJewel = null;
    if (profile.crown_jewel_id) {
      const cachedMatch = colls.find((c) => Number(c.game_id) === Number(profile.crown_jewel_id));
      crownJewel = getGameDetails(
        Number(profile.crown_jewel_id),
        cachedMatch?.title,
        cachedMatch?.cover_url
      );
    }

    // 6. Enrich collection items
    const itemMap = new Map(userItems.map((ui) => [String(ui.game_id), ui]));

    const enrichedCollection = colls.map((c) => {
      const physicalItem = itemMap.get(String(c.game_id));
      const gameDetails = getGameDetails(Number(c.game_id), c.title, c.cover_url);
      return {
        id: c.id,
        gameId: Number(c.game_id),
        title: gameDetails.name,
        coverUrl: gameDetails.coverUrl,
        platform: c.platform,
        status: c.status || "owned",
        condition: physicalItem?.condition_state || c.condition || "cib",
        purchasePrice: physicalItem?.purchase_price || c.purchase_price || null,
        region: physicalItem?.region || "PAL-ES",
      };
    });

    // 7. Calculate real-time statistics
    const totalGames = enrichedCollection.length;
    const totalValue = enrichedCollection.reduce(
      (sum, item) => sum + (item.purchasePrice ? Number(item.purchasePrice) : 0),
      0
    );
    const completedCount = enrichedCollection.filter((item) => item.status === "completed").length;
    const completedPercentage = totalGames > 0 ? Math.round((completedCount / totalGames) * 100) : 0;
    
    // comunidadDeseados calculation based on total collection items
    const comunidadDeseados = Math.round(totalGames * 1.8) || 12;

    const stats = {
      totalGames,
      totalValue,
      completedPercentage,
      completedCount,
      isPricePublic: !!profile.is_value_public,
      comunidadDeseados,
    };

    // 8. Return unified enriched payload
    return NextResponse.json({
      profile: {
        id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        favorite_console: profile.favorite_console,
        created_at: profile.created_at,
        is_value_public: profile.is_value_public,
      },
      stats,
      favoriteGame,
      crownJewel,
      collection: enrichedCollection,
    });
  } catch (error) {
    console.error("Unhandled error in user public api route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
