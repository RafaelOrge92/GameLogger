import { createClient } from "@/lib/supabase/server";
import { getGameByIdIGDB } from "@/features/market/services/igdb";
import { checkFollowStatus } from "@/features/social/actions";
import ProfileClient from "./ProfileClient";

export async function generateMetadata({ params }) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  return {
    title: `${decodedUsername} - Colección de Videojuegos en RetroLogger`,
    description: `Explora la biblioteca, vitrina de destacados y valoración de la colección de videojuegos retro de ${decodedUsername}.`,
  };
}

export default async function UserProfilePage({ params }) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const supabase = await createClient();

  // 1. Fetch user profile by username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", decodedUsername)
    .maybeSingle();

  let displayProfile = null;
  let displayCollection = [];
  let displayStats = {};
  let displayFav = null;
  let displayCrown = null;
  let isFollowing = false;
  let currentUser = null;

  // Fetch current session for checking edit permissions / following relationship
  const { data: { user: sessionUser } } = await supabase.auth.getUser();
  currentUser = sessionUser;

  if (profileError || !profile) {
    // FALLBACK TO MOCK DATA (For local environment or not found profiles)
    console.log(`Profile for user '${decodedUsername}' not found or error occurred, using mock data.`);
    
    displayProfile = {
      id: "mock-user-uuid",
      username: decodedUsername,
      avatar_url: "/retro_avatar.png",
      bio: "¡Hola! Soy un coleccionista apasionado de los sistemas de 8 y 16 bits. Me encanta restaurar cartuchos y buscar rarezas Complete-In-Box (CIB). Bienvenido a mi estantería retro.",
      favorite_console: "Super Nintendo (SNES)",
      created_at: "2024-03-01T12:00:00Z"
    };

    displayCollection = [
      { id: "mock-1", gameId: "119133", title: "Chrono Trigger", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co87df.jpg", platform: "SNES", status: "completed", condition: "cib", purchasePrice: "320" },
      { id: "mock-2", gameId: "68", title: "Super Mario Sunshine", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co68sg.jpg", platform: "GameCube", status: "completed", condition: "cib", purchasePrice: "34" },
      { id: "mock-3", gameId: "33", title: "Metal Gear Solid", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/cobpao.jpg", platform: "PlayStation", status: "completed", condition: "cib", purchasePrice: "55" },
      { id: "mock-4", gameId: "40", title: "Zelda: Ocarina of Time", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co3nnx.jpg", platform: "Nintendo 64", status: "playing", condition: "loose", purchasePrice: "120" },
      { id: "mock-5", gameId: "29", title: "Castlevania: Symphony of the Night", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co53m8.jpg", platform: "PlayStation", status: "completed", condition: "sealed", purchasePrice: "350" },
      { id: "mock-6", gameId: "54", title: "Pokémon Stadium", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1yyd.jpg", platform: "Nintendo 64", status: "plan_to_play", condition: "loose", purchasePrice: "85" },
      { id: "mock-7", gameId: "61", title: "Terranigma", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co26g4.jpg", platform: "SNES", status: "completed", condition: "cib", purchasePrice: "320" },
      { id: "mock-8", gameId: "68", title: "Final Fantasy VII", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/cobn9o.jpg", platform: "PlayStation", status: "completed", condition: "cib", purchasePrice: "65" },
      { id: "mock-9", gameId: "75", title: "Metroid Prime", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co6m4m.jpg", platform: "GameCube", status: "completed", condition: "loose", purchasePrice: "45" },
      { id: "mock-10", gameId: "100", title: "Super Metroid", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co87df.jpg", platform: "SNES", status: "completed", condition: "cib", purchasePrice: "180" },
      { id: "mock-11", gameId: "101", title: "Banjo-Kazooie", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1yyd.jpg", platform: "Nintendo 64", status: "playing", condition: "loose", purchasePrice: "60" },
      { id: "mock-12", gameId: "102", title: "Silent Hill", coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/cobpao.jpg", platform: "PlayStation", status: "completed", condition: "cib", purchasePrice: "150" }
    ];

    displayStats = {
      totalGames: 142,
      totalValue: 5280.00,
      completedPercentage: 59,
      completedCount: 84,
      isPricePublic: true,
      isMock: true,
      comunidadDeseados: 86
    };

    displayFav = {
      id: 119133,
      name: "Chrono Trigger",
      coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co87df.jpg",
      platforms: ["SNES"]
    };

    displayCrown = {
      id: 29,
      name: "Castlevania: Symphony of the Night",
      coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co53m8.jpg",
      platforms: ["PlayStation"]
    };
    
    // Simulate isFollowing state locally
    isFollowing = false;
  } else {
    // REAL PROFILE RESOLVED
    displayProfile = profile;

    // Check if the authenticated user follows this user
    if (currentUser) {
      isFollowing = await checkFollowStatus(profile.id);
    }

    // 2. Fetch collections (status, platform, title, cover_url)
    const { data: colls } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", profile.id)
      .order("added_at", { ascending: false });

    // 3. Fetch user_collection (condition_state, region, purchase_price)
    const { data: userItems } = await supabase
      .from("user_collection")
      .select("*")
      .eq("user_id", profile.id);

    // Merge collections data and physical condition data in memory
    const collList = colls || [];
    const itemMap = new Map(userItems?.map(ui => [String(ui.game_id), ui]) || []);

    displayCollection = collList.map(c => {
      const physicalItem = itemMap.get(String(c.game_id));
      return {
        id: c.id,
        gameId: c.game_id,
        title: c.title,
        coverUrl: c.cover_url,
        platform: c.platform,
        status: c.status || "owned",
        condition: physicalItem?.condition_state || c.condition || "cib",
        purchasePrice: physicalItem?.purchase_price || c.purchase_price || null,
        region: physicalItem?.region || "PAL-ES"
      };
    });

    // Calculate real stats
    const totalGames = displayCollection.length;
    const totalValue = displayCollection.reduce(
      (sum, item) => sum + (item.purchasePrice ? Number(item.purchasePrice) : 0), 
      0
    );
    const completedCount = displayCollection.filter(item => item.status === "completed").length;
    const completedPercentage = totalGames > 0 ? Math.round((completedCount / totalGames) * 100) : 0;

    displayStats = {
      totalGames,
      totalValue,
      completedPercentage,
      completedCount,
      isPricePublic: !!profile.is_value_public,
      isMock: false,
      comunidadDeseados: Math.round(totalGames * 1.8) || 12
    };

    // 4. Resolve Featured Games (favorite_game_id and crown_jewel_id)
    const promises = [];

    if (profile.favorite_game_id) {
      // Find in local collections first to avoid network requests
      const match = displayCollection.find(c => String(c.gameId) === String(profile.favorite_game_id));
      if (match) {
        displayFav = {
          id: profile.favorite_game_id,
          name: match.title,
          coverUrl: match.coverUrl,
          platforms: [match.platform]
        };
      } else {
        promises.push(
          getGameByIdIGDB(Number(profile.favorite_game_id))
            .then(game => { if (game) displayFav = game; })
            .catch(() => null)
        );
      }
    }

    if (profile.crown_jewel_id) {
      // Find in local collections first
      const match = displayCollection.find(c => String(c.gameId) === String(profile.crown_jewel_id));
      if (match) {
        displayCrown = {
          id: profile.crown_jewel_id,
          name: match.title,
          coverUrl: match.coverUrl,
          platforms: [match.platform]
        };
      } else {
        promises.push(
          getGameByIdIGDB(Number(profile.crown_jewel_id))
            .then(game => { if (game) displayCrown = game; })
            .catch(() => null)
        );
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto py-4">
      <ProfileClient
        profile={displayProfile}
        initialIsFollowing={isFollowing}
        currentUser={currentUser}
        collection={displayCollection}
        stats={displayStats}
        favoriteGame={displayFav}
        crownJewel={displayCrown}
      />
    </div>
  );
}
