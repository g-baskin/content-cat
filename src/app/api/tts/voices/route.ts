import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getApiKey } from "@/lib/services/apiKeyService";
import { createTTSProvider, type TTSService } from "@/lib/tts";

// Map TTS service to the API key service name in database
function getApiKeyService(ttsService: TTSService): string {
  switch (ttsService) {
    case "openai":
      return "openai";
    case "elevenlabs":
      return "elevenlabs";
    case "fishaudio":
      return "fishaudio";
    case "f5tts":
      return "fal"; // F5-TTS uses FAL.ai
    default:
      return ttsService;
  }
}

export async function GET(request: Request) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const service = (searchParams.get("service") || "openai") as TTSService;
    const apiKeyService = getApiKeyService(service);

    const apiKey = await getApiKey(user!.id, apiKeyService);

    if (!apiKey) {
      const serviceName = service === "f5tts" ? "FAL.ai (for F5-TTS)" : service;
      return NextResponse.json(
        { error: `No API key found for ${serviceName}` },
        { status: 400 }
      );
    }

    const provider = createTTSProvider(service, apiKey);
    const voices = await provider.getVoices();

    return NextResponse.json({ voices, service });
  } catch (error) {
    console.error("TTS voices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch voices" },
      { status: 500 }
    );
  }
}
