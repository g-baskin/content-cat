import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getApiKey } from "@/lib/services/apiKeyService";
import { createTTSProvider, type TTSService } from "@/lib/tts";
import { ensureUploadDir } from "@/lib/storage";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      text,
      voiceId,
      service = "openai",
      speed = 1.0,
    } = body as {
      text: string;
      voiceId: string;
      service?: TTSService;
      speed?: number;
    };

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: "Missing required fields: text, voiceId" },
        { status: 400 }
      );
    }

    const apiKeyService = service === "f5tts" ? "fal" : service;
    const apiKey = await getApiKey(user!.id, apiKeyService);

    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key found for ${service}` },
        { status: 400 }
      );
    }

    const provider = createTTSProvider(service, apiKey);
    const result = await provider.generateSpeech({
      text,
      voiceId,
      speed,
    });

    if (!result.success || !result.audioBuffer) {
      return NextResponse.json(
        { error: result.error || "Failed to generate speech" },
        { status: 500 }
      );
    }

    // Save audio to storage
    await ensureUploadDir();
    const uploadDir = join(process.cwd(), "uploads", "tts");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filename = `${randomUUID()}.mp3`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, result.audioBuffer);

    const audioUrl = `/api/files/tts/${filename}`;

    return NextResponse.json({
      success: true,
      audioUrl,
      duration: result.duration,
    });
  } catch (error) {
    console.error("TTS generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
