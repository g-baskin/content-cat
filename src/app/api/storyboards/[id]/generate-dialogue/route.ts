import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { createTTSProvider, type TTSService } from "@/lib/tts";
import { ensureUploadDir } from "@/lib/storage";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      sceneId,
      service = "openai",
      voiceId,
      speed = 1.0,
    } = body as {
      sceneId?: string;
      service?: TTSService;
      voiceId?: string;
      speed?: number;
    };

    // Verify storyboard ownership
    const storyboard = await prisma.storyboard.findUnique({
      where: { id, userId: user!.id },
      include: {
        scenes: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!storyboard) {
      return NextResponse.json(
        { error: "Storyboard not found" },
        { status: 404 }
      );
    }

    // Get API key
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        userId: user!.id,
        service: service === "openai" ? "openai" : "elevenlabs",
      },
    });

    if (!apiKeyRecord) {
      return NextResponse.json(
        { error: `No API key found for ${service}` },
        { status: 400 }
      );
    }

    const provider = createTTSProvider(service, apiKeyRecord.key);

    // Get default voice if not provided
    let effectiveVoiceId = voiceId;
    if (!effectiveVoiceId) {
      const voices = await provider.getVoices();
      effectiveVoiceId = voices[0]?.id;
    }

    if (!effectiveVoiceId) {
      return NextResponse.json(
        { error: "No voice available" },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await ensureUploadDir();
    const uploadDir = join(process.cwd(), "uploads", "dialogue");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate dialogue for specified scene or all scenes
    const scenesToProcess = sceneId
      ? storyboard.scenes.filter((s) => s.id === sceneId)
      : storyboard.scenes.filter((s) => s.dialogueText && !s.dialogueUrl);

    const results: { sceneId: string; audioUrl: string; success: boolean }[] = [];

    for (const scene of scenesToProcess) {
      if (!scene.dialogueText) continue;

      // Use scene's voice preference or default
      const sceneVoice = scene.dialogueVoice || effectiveVoiceId;

      const result = await provider.generateSpeech({
        text: scene.dialogueText,
        voiceId: sceneVoice,
        speed,
      });

      if (result.success && result.audioBuffer) {
        // Save audio file
        const filename = `${randomUUID()}.mp3`;
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, result.audioBuffer);

        const audioUrl = `/api/files/dialogue/${filename}`;

        // Update scene with dialogue URL
        await prisma.scene.update({
          where: { id: scene.id },
          data: {
            dialogueUrl: audioUrl,
            dialogueVoice: sceneVoice,
          },
        });

        results.push({ sceneId: scene.id, audioUrl, success: true });
      } else {
        results.push({ sceneId: scene.id, audioUrl: "", success: false });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      processed: results.length,
    });
  } catch (error) {
    console.error("Generate dialogue error:", error);
    return NextResponse.json(
      { error: "Failed to generate dialogue" },
      { status: 500 }
    );
  }
}
