import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// Schema for creating a scene
const createSceneSchema = z.object({
  name: z.string().max(100).optional(),
  prompt: z.string().max(5000).default(""),
  duration: z.number().int().min(4).max(20).default(5),
  aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:3", "3:4"]).optional(),
  service: z.enum(["fal", "openai", "runway", "pika", "luma"]).default("fal"),
  model: z.string().default("kling-2.6"),
  negativePrompt: z.string().max(500).optional(),
  seed: z.number().int().optional(),
  cfgScale: z.number().min(0).max(1).optional(),
  enableAudio: z.boolean().default(false),
  startImageUrl: z.string().url().optional().nullable(),
  endImageUrl: z.string().url().optional().nullable(),
  transition: z.enum(["cut", "fade", "dissolve", "wipe"]).default("cut"),
  transitionDuration: z.number().min(0).max(2).default(0.5),
  dialogueText: z.string().max(1000).optional(),
  dialogueVoice: z.string().optional(),
  // Insert at specific position, otherwise append to end
  insertAt: z.number().int().min(0).optional(),
});

// GET /api/storyboards/[id]/scenes - Get all scenes for a storyboard
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id: storyboardId } = await params;

  try {
    // Verify storyboard ownership
    const storyboard = await prisma.storyboard.findFirst({
      where: { id: storyboardId, userId: user!.id },
    });

    if (!storyboard) {
      return NextResponse.json(
        { error: "Storyboard not found" },
        { status: 404 }
      );
    }

    const scenes = await prisma.scene.findMany({
      where: { storyboardId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ scenes });
  } catch (error) {
    console.error("Error fetching scenes:", error);
    return NextResponse.json(
      { error: "Failed to fetch scenes" },
      { status: 500 }
    );
  }
}

// POST /api/storyboards/[id]/scenes - Add a new scene to a storyboard
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id: storyboardId } = await params;

  try {
    // Verify storyboard ownership
    const storyboard = await prisma.storyboard.findFirst({
      where: { id: storyboardId, userId: user!.id },
      include: {
        scenes: {
          orderBy: { order: "desc" },
          take: 1,
        },
      },
    });

    if (!storyboard) {
      return NextResponse.json(
        { error: "Storyboard not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parseResult = createSceneSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid request body" },
        { status: 400 }
      );
    }

    const { insertAt, ...sceneData } = parseResult.data;

    // Determine the order for the new scene
    let newOrder: number;
    if (insertAt !== undefined) {
      // Insert at specific position - shift existing scenes
      await prisma.scene.updateMany({
        where: {
          storyboardId,
          order: { gte: insertAt },
        },
        data: {
          order: { increment: 1 },
        },
      });
      newOrder = insertAt;
    } else {
      // Append to end
      const lastScene = storyboard.scenes[0];
      newOrder = lastScene ? lastScene.order + 1 : 0;
    }

    // Use storyboard aspect ratio if not specified
    const aspectRatio = sceneData.aspectRatio || storyboard.aspectRatio;

    const scene = await prisma.scene.create({
      data: {
        storyboardId,
        order: newOrder,
        ...sceneData,
        aspectRatio,
      },
    });

    // Update storyboard total duration
    await updateStoryboardDuration(storyboardId);

    return NextResponse.json({ scene }, { status: 201 });
  } catch (error) {
    console.error("Error creating scene:", error);
    return NextResponse.json(
      { error: "Failed to create scene" },
      { status: 500 }
    );
  }
}

// Helper to recalculate total duration
async function updateStoryboardDuration(storyboardId: string) {
  const scenes = await prisma.scene.findMany({
    where: { storyboardId },
    select: { duration: true, transitionDuration: true },
  });

  const totalDuration = scenes.reduce((sum, scene) => {
    return sum + scene.duration + (scene.transitionDuration || 0);
  }, 0);

  await prisma.storyboard.update({
    where: { id: storyboardId },
    data: { totalDuration: Math.round(totalDuration) },
  });
}
