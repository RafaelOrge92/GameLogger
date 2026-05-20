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
  edition: string | null = null
) {
  const supabase = await createClient();

  // Verificar sesión
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: "Debes iniciar sesión para añadir juegos." };
  }

  // Insertar en la base de datos
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
        edition: edition
      }
    ]);

  if (error) {
    console.error("Error al añadir juego:", error);
    return { error: "Hubo un error al guardar el juego en tu colección." };
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

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error al eliminar juego:", error);
    return { error: error.message };
  }

  return { success: true };
}
