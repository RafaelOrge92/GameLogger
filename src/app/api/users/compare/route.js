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

    // Run parallel queries to fetch collections and wishlist
    const [collARes, collBRes, wishlistARes] = await Promise.all([
      supabase.from("collections").select("*").eq("user_id", userAId),
      supabase.from("collections").select("*").eq("user_id", userBId),
      supabase.from("wishlists").select("*").eq("user_id", userAId),
    ]);

    if (collARes.error || collBRes.error || wishlistARes.error) {
      console.error("Database query error comparing collections:", {
        collAError: collARes.error,
        collBError: collBRes.error,
        wishlistAError: wishlistARes.error,
      });
      return NextResponse.json({ error: "Error de base de datos" }, { status: 500 });
    }

    const collA = collARes.data || [];
    const collB = collBRes.data || [];
    const wishlistA = wishlistARes.data || [];

    // Create Sets of game_id for O(1) lookups
    const setA = new Set(collA.map((item) => String(item.game_id)));
    const setB = new Set(collB.map((item) => String(item.game_id)));
    const setWishlistA = new Set(wishlistA.map((item) => String(item.game_id)));

    // Crossing logic:
    // 1. coincidencias: Games in both collections
    const coincidencias = collA.filter((item) => setB.has(String(item.game_id)));

    // 2. soloMios: Games in A but not in B
    const soloMios = collA.filter((item) => !setB.has(String(item.game_id)));

    // 3. soloSuyos: Games in B but not in A
    const soloSuyos = collB.filter((item) => !setA.has(String(item.game_id)));

    // 4. matchDeseados: Games in B's collection and also A's wishlist
    const matchDeseados = collB.filter((item) => setWishlistA.has(String(item.game_id)));

    return NextResponse.json({
      coincidencias,
      soloMios,
      soloSuyos,
      matchDeseados,
    });
  } catch (err) {
    console.error("Unexpected error in compare collections route:", err);
    return NextResponse.json({ error: "Error inesperado del servidor" }, { status: 500 });
  }
}
