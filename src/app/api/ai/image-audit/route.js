import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    // 1. Fallback to mock simulation if GEMINI_API_KEY is not configured
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not defined. Using mock vision auditor.");
      
      // Artificial delay to mimic AI inference latency
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const fileLower = (fileName || "").toLowerCase();
      
      // Simple mock filter: block images containing 'blocked' or 'nsfw' or 'ofensivo' in filename
      if (fileLower.includes("blocked") || fileLower.includes("nsfw") || fileLower.includes("ofensivo")) {
        return NextResponse.json({
          success: true,
          isAllowed: false,
          recognizedGame: null,
        });
      }

      // Mock recognition logic based on filename keywords
      let recognizedGame = null;
      if (fileLower.includes("mario")) {
        recognizedGame = { gameTitle: "Super Mario 64", platform: "N64" };
      } else if (fileLower.includes("silent")) {
        recognizedGame = { gameTitle: "Silent Hill", platform: "PlayStation" };
      } else if (fileLower.includes("chrono")) {
        recognizedGame = { gameTitle: "Chrono Trigger", platform: "SNES" };
      } else if (fileLower.includes("zelda")) {
        recognizedGame = { gameTitle: "The Legend of Zelda: Ocarina of Time", platform: "Nintendo 64" };
      }

      return NextResponse.json({
        success: true,
        isAllowed: true,
        recognizedGame,
      });
    }

    // 2. Initialize Gemini client and perform real Vision Auditing
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
      You are an automated security and moderation system for a physical retro videogame marketplace.
      Analyze the attached image and reply strictly in JSON format.

      Task A (Moderation):
      Check if the image contains: pornography, nudity, sexual organs, explicit violence, gore, hate symbols, or is completely unrelated to a physical videogame (e.g., cartridge, box art, disc, instruction manual, or console).
      If the image is unsafe OR is NOT related to a videogame, set "isAllowed" to false. Otherwise, set "isAllowed" to true.

      Task B (Recognition):
      If "isAllowed" is true, attempt to identify the exact name of the videogame and platform visible in the cover/label.
      Provide the result under "recognizedGame" as {"gameTitle": string, "platform": string}. If you are not sure or cannot recognize it, set "recognizedGame" to null.

      Do NOT return any explanation, and do NOT wrap the JSON inside markdown blocks (such as \`\`\`json). Return exactly the raw JSON structure:
      {
        "isAllowed": boolean,
        "recognizedGame": {
          "gameTitle": string,
          "platform": string
        } | null
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
      const parsed = JSON.parse(responseText);
      return NextResponse.json({
        success: true,
        isAllowed: !!parsed.isAllowed,
        recognizedGame: parsed.recognizedGame || null,
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
