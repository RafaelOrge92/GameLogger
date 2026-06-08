"use server";

import { createClient } from "@/lib/supabase/server";

export async function addGameToCollection(
  gameId: string,
  title: string,
  platform: string,
  status: "owned" | "playing" | "completed" | "plan_to_play" | "dropped" = "owned",
  condition: "sealed" | "cib" | "box_and_game" | "loose" | "digital" = "cib",
  purchasePrice: number | null = null,
  notes: string | null = null,
  edition: string | null = null,
  coverUrl: string | null = null
) {
  const supabase = await createClient();

  // Verificar sesión
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: "Debes iniciar sesión para añadir juegos." };
  }

  // Insertar en la base de datos (collections)
  const { error } = await supabase
    .from('collections')
    .insert([
      {
        user_id: user.id,
        game_id: gameId.toString(),
        title: title,
        platform: platform || "PC", // Default fallback
        status: status,
        condition: condition,
        purchase_price: purchasePrice,
        notes: notes,
        edition: edition,
        cover_url: coverUrl
      }
    ]);

  if (error) {
    console.error("Error al añadir juego:", error);
    return { error: "Hubo un error al guardar el juego en tu colección." };
  }

  // Insertar en user_collection para que alimente las estadísticas del Dashboard
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
          region: 'PAL-ES', // Default region
          purchase_price: purchasePrice,
          acquired_at: new Date().toISOString()
        }
      ]);

    if (userColError) {
      console.error("Error al insertar en user_collection:", userColError);
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

  // Obtener el game_id antes de eliminar para borrar también de user_collection
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

  // Eliminar también de user_collection
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
  status: "owned" | "playing" | "completed" | "plan_to_play" | "dropped",
  condition: "sealed" | "cib" | "box_and_game" | "loose" | "digital",
  purchasePrice: number | null,
  notes: string | null,
  edition: string | null,
  region: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autenticado" };
  }

  // Update in collections
  const { error: collError } = await supabase
    .from("collections")
    .update({
      status,
      condition,
      purchase_price: purchasePrice,
      notes,
      edition
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (collError) {
    console.error("Error updating collection:", collError);
    return { error: "Error al actualizar los detalles en la base de datos." };
  }

  // Find game_id from collections to update user_collection
  const { data: gameInfo } = await supabase
    .from("collections")
    .select("game_id")
    .eq("id", id)
    .single();

  if (gameInfo) {
    const gameIdInt = parseInt(gameInfo.game_id);
    if (!isNaN(gameIdInt)) {
      let conditionState = "cib";
      if (condition === "sealed") {
        conditionState = "sealed";
      } else if (condition === "loose") {
        conditionState = "loose";
      }

      // Update in user_collection
      const { error: userColError } = await supabase
        .from("user_collection")
        .update({
          condition_state: conditionState,
          region,
          purchase_price: purchasePrice
        })
        .eq("game_id", gameIdInt)
        .eq("user_id", user.id);

      if (userColError) {
        console.error("Error updating user_collection:", userColError);
      }
    }
  }

  return { success: true };
}

