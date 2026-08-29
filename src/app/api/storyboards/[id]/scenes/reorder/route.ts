import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// Schema for reordering scenes
const reorderScenesSchema = z.object({
  // Array of scene IDs in the new order
  sceneIds: z.array(z.string().uuid()).min(1),
});

// PUT /api/storyboards/[id]/scenes/reorder - Reorder scenes in a storyboard
export async function PUT(
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
          select: { id: true },
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
    const parseResult = reorderScenesSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid request body" },
        { status: 400 }
      );
    }

    const { sceneIds } = parseResult.data;

    // Verify all scene IDs belong to this storyboard
    const existingSceneIds = new Set(storyboard.scenes.map((s) => s.id));
    for (const sceneId of sceneIds) {
      if (!existingSceneIds.has(sceneId)) {
        return NextResponse.json(
          { error: `Scene ${sceneId} does not belong to this storyboard` },
          { status: 400 }
        );
      }
    }

    // Update each scene's order in a transaction
    await prisma.$transaction(
      sceneIds.map((sceneId, index) =>
        prisma.scene.update({
          where: { id: sceneId },
          data: { order: index },
        })
      )
    );

    // Fetch updated scenes
    const scenes = await prisma.scene.findMany({
      where: { storyboardId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ scenes });
  } catch (error) {
    console.error("Error reordering scenes:", error);
    return NextResponse.json(
      { error: "Failed to reorder scenes" },
      { status: 500 }
    );
  }
}
