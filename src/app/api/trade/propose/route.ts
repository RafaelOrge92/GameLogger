import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para proponer intercambios." },
        { status: 401 }
      );
    }

    
    const body = await req.json();
    const { receiver_id, game_id, message } = body;

    if (!receiver_id || !game_id || !message) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: receiver_id, game_id, o message." },
        { status: 400 }
      );
    }

    if (user.id === receiver_id) {
      return NextResponse.json(
        { error: "No puedes proponer un intercambio contigo mismo." },
        { status: 400 }
      );
    }

    
    const { data: senderProfile, error: senderError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (senderError || !senderProfile) {
      return NextResponse.json(
        { error: "No se pudo resolver el perfil del remitente." },
        { status: 500 }
      );
    }

    const senderUsername = senderProfile.username || user.email?.split("@")[0] || "coleccionista";

    
    const { data: collectionItem } = await supabase
      .from("collections")
      .select("title")
      .eq("user_id", receiver_id)
      .eq("game_id", game_id.toString())
      .limit(1)
      .maybeSingle();

    const gameTitle = collectionItem?.title || "Videojuego";

    
    const { data: tradeOffer, error: tradeError } = await supabase
      .from("trade_offers")
      .insert([
        {
          sender_id: user.id,
          receiver_id,
          game_id: game_id.toString(),
          message,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (tradeError || !tradeOffer) {
      console.error("Database error creating trade offer:", tradeError);
      return NextResponse.json(
        { error: "Hubo un error al guardar la propuesta de intercambio." },
        { status: 500 }
      );
    }

    
    const { error: notifError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: receiver_id,
          type: "trade",
          sender_username: senderUsername,
          game_title: gameTitle,
          is_read: false,
          trade_offer_id: tradeOffer.id,
        },
      ]);

    if (notifError) {
      console.error("Database error creating notification alert:", notifError);
    }

    return NextResponse.json({ success: true, tradeOffer });
  } catch (error) {
    console.error("Unhandled error in trade propose API route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
