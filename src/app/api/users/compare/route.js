import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


const normalizeTitle = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .trim()
    .replace(/[^a-z0-9]/g, ""); 
};

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

    
    const setAColl = new Set(collA.map((item) => normalizeTitle(item.title)));
    const setBColl = new Set(collB.map((item) => normalizeTitle(item.title)));
    const setAWish = new Set(wishlistA.map((item) => normalizeTitle(item.title)));

    
    
    const coincidencias = collA.filter((item) => setBColl.has(normalizeTitle(item.title)));

    
    const soloMios = collA.filter((item) => !setBColl.has(normalizeTitle(item.title)));

    
    const soloSuyos = collB.filter((item) => !setAColl.has(normalizeTitle(item.title)));

    
    const matchDeseados = collB.filter((item) => setAWish.has(normalizeTitle(item.title)));

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
