"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function followUser(followingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión para seguir a este usuario." };
  }

  if (user.id === followingId) {
    return { error: "No puedes seguirte a ti mismo." };
  }

  const { error } = await supabase
    .from("follows")
    .insert([{ follower_id: user.id, following_id: followingId }]);

  if (error) {
    console.error("Error al seguir usuario:", error);
    return { error: "No se pudo seguir al usuario." };
  }

  return { success: true };
}

export async function unfollowUser(followingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión." };
  }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) {
    console.error("Error al dejar de seguir usuario:", error);
    return { error: "No se pudo dejar de seguir al usuario." };
  }

  return { success: true };
}

export async function checkFollowStatus(followingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from("follows")
    .select("*")
    .eq("follower_id", user.id)
    .eq("following_id", followingId)
    .maybeSingle();

  if (error) {
    console.error("Error checking follow status:", error);
    return false;
  }

  return !!data;
}

export async function getNotifications() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "No autenticado", data: [] };
  }

  let { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener notificaciones:", error);
    return { error: error.message, data: [] };
  }

  if (!data || data.length === 0) {
    const mockNotifs = [
      {
        user_id: user.id,
        type: "trade",
        sender_username: "retro_collector",
        game_title: "Chrono Trigger",
        is_read: false
      },
      {
        user_id: user.id,
        type: "want",
        sender_username: "pixel_art",
        game_title: "Silent Hill",
        is_read: false
      }
    ];

    const { data: insertedData, error: insertError } = await supabase
      .from("notifications")
      .insert(mockNotifs)
      .select();

    if (insertError) {
      console.error("Error al sembrar notificaciones de prueba:", insertError);
    } else if (insertedData) {
      data = insertedData;
    }
  }

  return { success: true, data: data || [] };
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error al marcar notificaciones como leídas:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error al marcar notificación como leída:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function getTradeOfferDetails(tradeOfferId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { data, error } = await supabase
    .from("trade_offers")
    .select("*")
    .eq("id", tradeOfferId)
    .single();

  if (error) {
    console.error("Error fetching trade offer details:", error);
    return { error: "No se pudo cargar la propuesta." };
  }

  return { success: true, data };
}

export async function respondToTradeOffer(
  tradeOfferId: string,
  status: "accepted" | "rejected"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { error: tradeError } = await supabase
    .from("trade_offers")
    .update({ status })
    .eq("id", tradeOfferId)
    .eq("receiver_id", user.id);

  if (tradeError) {
    console.error("Error updating trade offer status:", tradeError);
    return { error: "No se pudo actualizar el estado de la propuesta." };
  }

  
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("trade_offer_id", tradeOfferId)
    .eq("user_id", user.id);

  return { success: true };
}


