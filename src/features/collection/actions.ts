"use server";

import { createClient } from "@/lib/supabase/server";

export async function addGameToCollection(
  gameId: string,
  title: string,
  platform: string,
  status: "collection" | "wishlist" = "collection",
  condition: "sealed" | "cib" | "box_and_game" | "loose" | "digital" = "cib",
  purchasePrice: number | null = null,
  notes: string | null = null,
  edition: string | null = null,
  coverUrl: string | null = null,
  region: string = "PAL-ES",
  imagesUrls: string[] = []
) {
  const supabase = await createClient();

  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: "Debes iniciar sesión para añadir juegos." };
  }

  
  const { error } = await supabase
    .from('collections')
    .insert([
      {
        user_id: user.id,
        game_id: gameId.toString(),
        title: title,
        platform: platform || "PC", 
        status: status,
        condition: condition,
        purchase_price: purchasePrice,
        notes: notes,
        edition: edition,
        cover_url: coverUrl,
        images_urls: imagesUrls
      }
    ]);

  if (error) {
    console.error("Error al añadir juego:", error);
    return { error: "Hubo un error al guardar el juego en tu colección." };
  }

  if (status === "collection") {
    
    const gameIdInt = parseInt(gameId);
    if (!isNaN(gameIdInt)) {
      let conditionState = 'cib';
      if (condition === 'sealed') {
        conditionState = 'sealed';
      } else if (condition === 'loose') {
        conditionState = 'loose';
      }

      const { error: userColError } = await supabase
        .from('user_collection')
        .insert([
          {
            user_id: user.id,
            game_id: gameIdInt,
            condition_state: conditionState,
            region: region,
            purchase_price: purchasePrice,
            acquired_at: new Date().toISOString()
          }
        ]);

      if (userColError) {
        console.error("Error al insertar en user_collection:", userColError);
      }
    }
  }

  return { success: true };
}

export async function getCollection() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autenticado", data: [] };
  }

  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("added_at", { ascending: false });

  if (error) {
    console.error("Error al obtener colección:", error);
    return { error: error.message, data: [] };
  }

  return { success: true, data };
}

export async function removeGameFromCollection(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autenticado" };
  }

  
  const { data: gameToDelete } = await supabase
    .from("collections")
    .select("game_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error al eliminar juego:", error);
    return { error: error.message };
  }

  
  if (gameToDelete) {
    const gameIdInt = parseInt(gameToDelete.game_id);
    if (!isNaN(gameIdInt)) {
      await supabase
        .from("user_collection")
        .delete()
        .eq("game_id", gameIdInt)
        .eq("user_id", user.id);
    }
  }

  return { success: true };
}

export async function updateGameInCollection(
  id: string,
  status: "collection" | "wishlist",
  condition: "sealed" | "cib" | "box_and_game" | "loose" | "digital",
  purchasePrice: number | null,
  notes: string | null,
  edition: string | null,
  region: string,
  imagesUrls: string[] = []
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autenticado" };
  }

  
  const { error: collError } = await supabase
    .from("collections")
    .update({
      status,
      condition,
      purchase_price: purchasePrice,
      notes,
      edition,
      images_urls: imagesUrls
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (collError) {
    console.error("Error updating collection:", collError);
    return { error: "Error al actualizar los detalles en la base de datos." };
  }

  
  const { data: gameInfo } = await supabase
    .from("collections")
    .select("game_id")
    .eq("id", id)
    .single();

  if (gameInfo) {
    const gameIdInt = parseInt(gameInfo.game_id);
    if (!isNaN(gameIdInt)) {
      if (status === "wishlist") {
        await supabase
          .from("user_collection")
          .delete()
          .eq("game_id", gameIdInt)
          .eq("user_id", user.id);
      } else {
        let conditionState = "cib";
        if (condition === "sealed") {
          conditionState = "sealed";
        } else if (condition === "loose") {
          conditionState = "loose";
        }

        const { data: existingCol } = await supabase
          .from("user_collection")
          .select("id")
          .eq("game_id", gameIdInt)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingCol) {
          await supabase
            .from("user_collection")
            .update({
              condition_state: conditionState,
              region,
              purchase_price: purchasePrice
            })
            .eq("game_id", gameIdInt)
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("user_collection")
            .insert({
              user_id: user.id,
              game_id: gameIdInt,
              condition_state: conditionState,
              region,
              purchase_price: purchasePrice,
              acquired_at: new Date().toISOString()
            });
        }
      }
    }
  }

  return { success: true };
}

export async function addGameToWishlist(
  gameId: string,
  title: string,
  coverUrl: string | null,
  platform: string | null,
  targetUserId?: string | null
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Debes iniciar sesión para añadir a tus deseos." };
  }

  const { error } = await supabase
    .from("collections")
    .insert([
      {
        user_id: user.id,
        game_id: gameId.toString(),
        title: title,
        cover_url: coverUrl,
        platform: platform || "PC",
        status: "wishlist",
        condition: "cib"
      }
    ]);

  if (error) {
    if (error.code === "23505") {
      return { error: "Este juego ya está en tu lista de deseos." };
    }
    console.error("Error al añadir a deseos:", error);
    return { error: "Hubo un error al guardar el juego en tus deseos." };
  }

  
  if (targetUserId && targetUserId !== user.id) {
    try {
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      
      const senderUsername = senderProfile?.username || user.email?.split("@")[0] || "coleccionista";

      const { error: notifError } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: targetUserId,
            type: "want",
            sender_username: senderUsername,
            game_title: title,
            is_read: false
          }
        ]);

      if (notifError) {
        console.error("Error creating want notification:", notifError);
      }
    } catch (err) {
      console.error("Failed to insert want notification:", err);
    }
  }

  return { success: true };
}


