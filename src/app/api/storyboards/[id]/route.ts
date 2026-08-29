import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// Schema for updating a storyboard
const updateStoryboardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:3", "3:4"]).optional(),
  status: z.enum(["draft", "generating", "complete", "failed"]).optional(),
});

// GET /api/storyboards/[id] - Get a single storyboard with all scenes
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  try {
    const storyboard = await prisma.storyboard.findFirst({
      where: {
        id,
        userId: user!.id,
      },
      include: {
        scenes: {
          orderBy: { order: "asc" },
        },
        finalVideo: true,
      },
    });

    if (!storyboard) {
      return NextResponse.json(
        { error: "Storyboard not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ storyboard });
  } catch (error) {
    console.error("Error fetching storyboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch storyboard" },
      { status: 500 }
    );
  }
}

// PUT /api/storyboards/[id] - Update a storyboard
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  try {
    // Verify ownership
    const existing = await prisma.storyboard.findFirst({
      where: { id, userId: user!.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Storyboard not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parseResult = updateStoryboardSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid request body" },
        { status: 400 }
      );
    }

    const storyboard = await prisma.storyboard.update({
      where: { id },
      data: parseResult.data,
      include: {
        scenes: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ storyboard });
  } catch (error) {
    console.error("Error updating storyboard:", error);
    return NextResponse.json(
      { error: "Failed to update storyboard" },
      { status: 500 }
    );
  }
}

// DELETE /api/storyboards/[id] - Delete a storyboard
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  try {
    // Verify ownership
    const existing = await prisma.storyboard.findFirst({
      where: { id, userId: user!.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Storyboard not found" },
        { status: 404 }
      );
    }

    await prisma.storyboard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting storyboard:", error);
    return NextResponse.json(
      { error: "Failed to delete storyboard" },
      { status: 500 }
    );
  }
}
