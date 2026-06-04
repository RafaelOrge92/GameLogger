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
