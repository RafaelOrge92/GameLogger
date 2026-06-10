import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para buscar usuarios." },
        { status: 401 }
      );
    }

    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    const trimmedQuery = query.trim();

    
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, favorite_console")
      .ilike("username", `%${trimmedQuery}%`)
      .limit(10);

    if (error) {
      console.error("Error querying profiles in search API:", error);
      return NextResponse.json(
        { error: "Error al realizar la búsqueda." },
        { status: 500 }
      );
    }

    return NextResponse.json(profiles || []);

  } catch (error) {
    console.error("Unhandled error in user search API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
