import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";
import sharp from "sharp";
import crypto from "crypto";

export async function POST(req) {
  try {
    const body = await req.json();
    const { image, mimeType, fileName } = body;

    if (!image) {
      return NextResponse.json(
        { error: "No se proporcionó ninguna imagen." },
        { status: 400 }
      );
    }

    // Extract base64 clean data (strip data:image/jpeg;base64, if present)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Ensure Gemini API Key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "La clave de API de Gemini (GEMINI_API_KEY) no está configurada." },
        { status: 500 }
      );
    }

    // 2. Initialize Gemini client and perform real Vision Auditing with Structured JSON output
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const systemPrompt = `
      You are an automated security and moderation system for a physical retro videogame marketplace and collection manager.
      Analyze the attached image and reply strictly in JSON format.

      Task A (Moderation and Validation):
      1. First, check if the image contains real-world explicit pornography, real-world explicit nudity, real sexual organs, real-world extreme violence (real blood/gore/mutilation), or real-world hate symbols. If it does, set "isAllowed" to false.
         - IMPORTANT: Videogame covers, anime drawings, illustrations of fictional characters, fantasy monsters (like Pokémon, dragons, demons), and standard cartoon combat or box artwork do NOT count as explicit violence, gore, or nudity. Fictional retro game covers are 100% ALLOWED and VALID.
      2. Second, verify if the image is related to a physical video game. The image IS ALLOWED and VALID if it shows:
         - The front of the game box/case (cover art / label).
         - The back of the game box/case.
         - The game disc, cartridge, or card.
         - The game instruction manual, inserts, or map.
         - The console, retro systems, accessories, or original packaging.
         - An open game case (showing the disc/cartridge inside the box/case).
         - The image may be rotated 90 degrees, 180 degrees, or upside down. Mentally rotate it to read it. It is perfectly valid if the game case is sitting on a table, bed, carpet, or blanket.
      If the image is completely unrelated to video games (e.g. general selfies, landscapes, household items that are not consoles/games, animals), set "isAllowed" to false. Otherwise, set "isAllowed" to true.

      Task B (Recognition):
      If "isAllowed" is true, attempt to identify the exact name of the videogame and platform visible in the cover, case, disc, cartridge, or manual.
      Provide the result under "gameTitle" as a string and "platform" as a string. If you are not sure or cannot recognize it, set them to null.

      Do NOT return any explanation, and do NOT wrap the JSON inside markdown blocks (such as \`\`\`json). Return exactly the raw JSON structure:
      {
        "isAllowed": boolean,
        "gameTitle": string | null,
        "platform": string | null
      }
    `;

    const result = await model.generateContent([
      systemPrompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType || "image/jpeg",
        },
      },
    ]);

    const responseText = result.response.text().trim();
    
    // Safely parse JSON response
    try {
      const cleanedResponse = responseText
        .replace(/^```json\s*/i, "")
        .replace(/```$/, "")
        .trim();
      const parsed = JSON.parse(cleanedResponse);
      
      // Normalize gameTitle or recognizedGame to be tolerant and match frontend expectation
      const rawRecognized = parsed.gameTitle || parsed.recognizedGame || null;
      const recognizedGame = rawRecognized 
        ? (typeof rawRecognized === "string" ? { gameTitle: rawRecognized, platform: parsed.platform || null } : rawRecognized)
        : null;

      let publicUrl = null;
      if (parsed.isAllowed) {
        try {
          const buffer = Buffer.from(base64Data, "base64");
          const optimizedBuffer = await sharp(buffer)
            .resize({ width: 1080, withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer();

          const supabase = createAdminClient();
          const cleanFileName = (fileName || "game_photo")
            .replace(/\.[^/.]+$/, "")
            .replace(/[^a-zA-Z0-9_]/g, "_");
          const uniqueFileName = `${cleanFileName}_${crypto.randomUUID()}.webp`;

          const { error: uploadError } = await supabase.storage
            .from("game-photos")
            .upload(uniqueFileName, optimizedBuffer, {
              contentType: "image/webp",
              upsert: true
            });

          if (uploadError) {
            console.warn("Storage upload failed, attempting to create bucket:", uploadError);
            // Create bucket if it doesn't exist
            await supabase.storage.createBucket("game-photos", {
              public: true
            });
            const { error: retryError } = await supabase.storage
              .from("game-photos")
              .upload(uniqueFileName, optimizedBuffer, {
                contentType: "image/webp",
                upsert: true
              });
            if (retryError) throw retryError;
          }

          const { data } = supabase.storage
            .from("game-photos")
            .getPublicUrl(uniqueFileName);
          
          publicUrl = data?.publicUrl || null;
        } catch (storageError) {
          console.error("Supabase Storage upload/optimization error:", storageError);
          throw storageError;
        }
      }

      return NextResponse.json({
        success: true,
        isAllowed: !!parsed.isAllowed,
        recognizedGame,
        publicUrl,
      });
    } catch (parseError) {
      console.error("Gemini Vision response parse error. Response was:", responseText, parseError);
      
      // Fallback in case of parsing errors
      return NextResponse.json({
        success: true,
        isAllowed: true,
        recognizedGame: null,
      });
    }
  } catch (error) {
    console.error("Unhandled error in image audit API route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor durante la auditoría de imagen." },
      { status: 500 }
    );
  }
}
