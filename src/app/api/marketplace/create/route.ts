import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authentication and Security
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para realizar esta acción." },
        { status: 401 }
      );
    }

    // 2. Input Data (Payload JSON)
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Cuerpo de petición inválido o ausente." },
        { status: 400 }
      );
    }

    const { game_id, condition_state, region, offer_type, price_wanted } = body;

    // Validation
    if (game_id === undefined || game_id === null) {
      return NextResponse.json(
        { error: "El parámetro game_id es requerido." },
        { status: 400 }
      );
    }

    const gameIdNum = Number(game_id);
    if (isNaN(gameIdNum)) {
      return NextResponse.json(
        { error: "El parámetro game_id debe ser un número entero válido." },
        { status: 400 }
      );
    }

    if (!condition_state || !["loose", "cib", "sealed"].includes(condition_state)) {
      return NextResponse.json(
        { error: "El estado de conservación (condition_state) debe ser 'loose', 'cib' o 'sealed'." },
        { status: 400 }
      );
    }

    if (!region || typeof region !== "string") {
      return NextResponse.json(
        { error: "El parámetro region es requerido y debe ser un texto." },
        { status: 400 }
      );
    }

    if (!offer_type || !["sell", "trade", "both"].includes(offer_type)) {
      return NextResponse.json(
        { error: "El tipo de oferta (offer_type) debe ser 'sell', 'trade' o 'both'." },
        { status: 400 }
      );
    }

    let cleanPrice: number | null = null;
    if (offer_type === "sell" || offer_type === "both") {
      if (price_wanted === undefined || price_wanted === null || isNaN(Number(price_wanted)) || Number(price_wanted) < 0) {
        return NextResponse.json(
          { error: "Para venta o venta/intercambio se requiere un precio (price_wanted) numérico válido y mayor o igual a 0." },
          { status: 400 }
        );
      }
      cleanPrice = Number(price_wanted);
    } else {
      // For pure trade offers, price_wanted is optional and fallback to null
      cleanPrice = price_wanted !== undefined && price_wanted !== null && !isNaN(Number(price_wanted))
        ? Number(price_wanted)
        : null;
    }

    // 3. Validation: Verify that the user really owns this game_id in their public.collections
    const { data: ownItem, error: checkError } = await supabase
      .from("collections")
      .select("id")
      .eq("user_id", user.id)
      .eq("game_id", String(gameIdNum))
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking user ownership in collections:", checkError);
      return NextResponse.json(
        { error: "Error en la validación de propiedad de la colección." },
        { status: 500 }
      );
    }

    if (!ownItem) {
      return NextResponse.json(
        { error: "No puedes publicar una oferta para un juego que no posees en tu colección." },
        { status: 403 }
      );
    }

    // 4. Inserción: Insert into marketplace_offers table
    const { data: newOffer, error: insertError } = await supabase
      .from("marketplace_offers")
      .insert([
        {
          user_id: user.id,
          game_id: gameIdNum,
          condition_state,
          region,
          offer_type,
          price_wanted: cleanPrice,
          status: "active"
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting into marketplace_offers:", insertError);
      return NextResponse.json(
        { error: "No se pudo guardar la oferta de mercado." },
        { status: 500 }
      );
    }

    return NextResponse.json(newOffer, { status: 201 });

  } catch (error) {
    console.error("Error no controlado en el endpoint de ofertas de mercado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
