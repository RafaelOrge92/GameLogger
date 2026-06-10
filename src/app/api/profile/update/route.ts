import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handleUpdate(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { username, avatar_url, favorite_console, bio, favorite_game_id, crown_jewel_id, is_value_public } = body;

    
    if (!username || typeof username !== "string" || !username.trim()) {
      return NextResponse.json(
        { error: "El nombre de usuario no puede estar vacío." },
        { status: 400 }
      );
    }
    const formattedUsername = username.trim();

    
    if (bio && bio.length > 150) {
      return NextResponse.json(
        { error: "La biografía no puede superar los 150 caracteres." },
        { status: 400 }
      );
    }

    
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        username: formattedUsername,
        avatar_url,
        favorite_console,
        bio,
        favorite_game_id: favorite_game_id ? Number(favorite_game_id) : null,
        crown_jewel_id: crown_jewel_id ? Number(crown_jewel_id) : null,
        is_value_public: is_value_public !== undefined ? !!is_value_public : false,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile in Supabase:", updateError);
      
      
      if (updateError.code === "23505") {
        return NextResponse.json(
          { error: "El nombre de usuario ya está en uso." },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: "Error al actualizar el perfil en la base de datos." },
        { status: 500 }
      );
    }

    
    
    if (formattedUsername || avatar_url !== undefined) {
      const updateData: Record<string, any> = {};
      if (formattedUsername) updateData.full_name = formattedUsername;
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

      await supabase.auth.updateUser({
        data: updateData
      });
    }

    return NextResponse.json({
      success: true,
      message: "¡Perfil actualizado con éxito!"
    });

  } catch (error) {
    console.error("Unhandled error in profile update handler:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleUpdate(req);
}

export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}
