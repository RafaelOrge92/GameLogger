import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";







 
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión." },
        { status: 401 }
      );
    }

    const { data: items, error: dbError } = await supabase
      .from("collections")
      .select("id, game_id, title, cover_url, platform, condition")
      .eq("user_id", user.id)
      .order("title", { ascending: true });

    if (dbError) {
      console.error("Error fetching user collection:", dbError);
      return NextResponse.json(
        { error: "Error al obtener la colección." },
        { status: 500 }
      );
    }

    
    
    return NextResponse.json(items ?? [], { status: 200 });
  } catch (error) {
    console.error("Unhandled error in collection/list:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
