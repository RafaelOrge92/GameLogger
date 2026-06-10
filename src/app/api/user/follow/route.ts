import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para realizar esta acción." },
        { status: 401 }
      );
    }

    const followerId = user.id;

    
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Cuerpo de petición inválido o ausente." },
        { status: 400 }
      );
    }

    const { following_id } = body;

    if (!following_id) {
      return NextResponse.json(
        { error: "El parámetro following_id es requerido." },
        { status: 400 }
      );
    }

    
    if (followerId === following_id) {
      return NextResponse.json(
        { error: "No puedes seguirte a ti mismo." },
        { status: 400 }
      );
    }

    
    const { data: existingFollow, error: selectError } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", followerId)
      .eq("following_id", following_id)
      .maybeSingle();

    if (selectError) {
      console.error("Error al consultar la tabla follows:", selectError);
      return NextResponse.json(
        { error: "Error en la consulta a la base de datos." },
        { status: 500 }
      );
    }

    if (!existingFollow) {
      
      const { error: insertError } = await supabase
        .from("follows")
        .insert([{ follower_id: followerId, following_id: following_id }]);

      if (insertError) {
        console.error("Error al insertar relación de seguimiento:", insertError);
        return NextResponse.json(
          { error: "No se pudo seguir al usuario." },
          { status: 500 }
        );
      }

      return NextResponse.json({ status: "followed" });
    } else {
      
      const { error: deleteError } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", followerId)
        .eq("following_id", following_id);

      if (deleteError) {
        console.error("Error al eliminar relación de seguimiento:", deleteError);
        return NextResponse.json(
          { error: "No se pudo dejar de seguir al usuario." },
          { status: 500 }
        );
      }

      return NextResponse.json({ status: "unfollowed" });
    }
  } catch (error) {
    console.error("Error no controlado en la API de follow:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
