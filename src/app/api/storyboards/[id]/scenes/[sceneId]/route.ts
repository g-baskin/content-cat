import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// Schema for updating a scene
const updateSceneSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  prompt: z.string().min(1).max(5000).optional(),
  duration: z.number().int().min(4).max(20).optional(),
  aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:3", "3:4"]).optional(),
  service: z.enum(["fal", "openai", "runway", "pika", "luma"]).optional(),
  model: z.string().optional(),
  status: z.enum(["pending", "generating", "complete", "failed"]).optional(),
  videoUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  error: z.string().optional().nullable(),
  negativePrompt: z.string().max(500).optional().nullable(),
  seed: z.number().int().optional().nullable(),
  cfgScale: z.number().min(0).max(1).optional(),
  enableAudio: z.boolean().optional(),
  startImageUrl: z.string().url().optional().nullable(),
  endImageUrl: z.string().url().optional().nullable(),
  transition: z.enum(["cut", "fade", "dissolve", "wipe"]).optional(),
  transitionDuration: z.number().min(0).max(2).optional(),
  dialogueText: z.string().max(1000).optional().nullable(),
  dialogueVoice: z.string().optional().nullable(),
  dialogueUrl: z.string().url().optional().nullable(),
});

// GET /api/storyboards/[id]/scenes/[sceneId] - Get a single scene
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id: storyboardId, sceneId } = await params;

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

    const scene = await prisma.scene.findFirst({
      where: { id: sceneId, storyboardId },
    });

    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    return NextResponse.json({ scene });
  } catch (error) {
    console.error("Error fetching scene:", error);
    return NextResponse.json(
      { error: "Failed to fetch scene" },
      { status: 500 }
    );
  }
}

// PUT /api/storyboards/[id]/scenes/[sceneId] - Update a scene
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id: storyboardId, sceneId } = await params;

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

    // Verify scene exists
    const existing = await prisma.scene.findFirst({
      where: { id: sceneId, storyboardId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    const body = await request.json();
    const parseResult = updateSceneSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid request body" },
        { status: 400 }
      );
    }

    const scene = await prisma.scene.update({
      where: { id: sceneId },
      data: parseResult.data,
    });

    // Update storyboard total duration if duration changed
    if (parseResult.data.duration !== undefined) {
      await updateStoryboardDuration(storyboardId);
    }

    return NextResponse.json({ scene });
  } catch (error) {
    console.error("Error updating scene:", error);
    return NextResponse.json(
      { error: "Failed to update scene" },
      { status: 500 }
    );
  }
}

// DELETE /api/storyboards/[id]/scenes/[sceneId] - Delete a scene
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id: storyboardId, sceneId } = await params;

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

    // Get the scene to delete
    const sceneToDelete = await prisma.scene.findFirst({
      where: { id: sceneId, storyboardId },
    });

    if (!sceneToDelete) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    // Delete the scene
    await prisma.scene.delete({
      where: { id: sceneId },
    });

    // Shift remaining scenes to fill the gap
    await prisma.scene.updateMany({
      where: {
        storyboardId,
        order: { gt: sceneToDelete.order },
      },
      data: {
        order: { decrement: 1 },
      },
    });

    // Update storyboard total duration
    await updateStoryboardDuration(storyboardId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scene:", error);
    return NextResponse.json(
      { error: "Failed to delete scene" },
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
