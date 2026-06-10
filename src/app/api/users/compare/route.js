import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { targetUserId } = body;
    
    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId es requerido" }, { status: 400 });
    }

    const userAId = user.id;
    const userBId = targetUserId;

    // Fetch all items from collections table for both users in parallel
    const [collARes, collBRes] = await Promise.all([
      supabase.from("collections").select("*").eq("user_id", userAId),
      supabase.from("collections").select("*").eq("user_id", userBId),
    ]);

    if (collARes.error || collBRes.error) {
      console.error("Database query error comparing collections:", {
        collAError: collARes.error,
        collBError: collBRes.error,
      });
      return NextResponse.json({ error: "Error de base de datos" }, { status: 500 });
    }

    const allItemsA = collARes.data || [];
    const allItemsB = collBRes.data || [];

    // Filter items into collections and wishlists (supporting backward compatible statuses)
    const isCollection = (item) =>
      item.status === "collection" ||
      item.status === "owned" ||
      item.status === "playing" ||
      item.status === "completed";

    const isWishlist = (item) =>
      item.status === "wishlist" ||
      item.status === "plan_to_play" ||
      item.status === "dropped";

    const collA = allItemsA.filter(isCollection);
    const wishlistA = allItemsA.filter(isWishlist);

    const collB = allItemsB.filter(isCollection);

    // Create Sets of game_id for O(1) lookups, converting keys to String for safety
    const setAColl = new Set(collA.map((item) => String(item.game_id)));
    const setBColl = new Set(collB.map((item) => String(item.game_id)));
    const setAWish = new Set(wishlistA.map((item) => String(item.game_id)));

    // Crossing logic under simplified rules:
    // 1. coincidencias: Games both users have in 'collection'
    const coincidencias = collA.filter((item) => setBColl.has(String(item.game_id)));

    // 2. soloMios: Games Authenticated A has in 'collection' but B does NOT
    const soloMios = collA.filter((item) => !setBColl.has(String(item.game_id)));

    // 3. soloSuyos: Games Target B has in 'collection' but A does NOT
    const soloSuyos = collB.filter((item) => !setAColl.has(String(item.game_id)));

    // 4. matchDeseados: Games B has in 'collection' that A has in 'wishlist'
    const matchDeseados = collB.filter((item) => setAWish.has(String(item.game_id)));

    return NextResponse.json({
      coincidencias: coincidencias || [],
      soloMios: soloMios || [],
      soloSuyos: soloSuyos || [],
      matchDeseados: matchDeseados || [],
    });
  } catch (err) {
    console.error("Unexpected error in compare collections route:", err);
    return NextResponse.json({ error: "Error inesperado del servidor" }, { status: 500 });
  }
}
