import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// Schema for creating a storyboard
const createStoryboardSchema = z.object({
  name: z.string().min(1).max(100).default("Untitled Storyboard"),
  description: z.string().max(500).optional(),
  aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:3", "3:4"]).default("16:9"),
});

// GET /api/storyboards - List all storyboards for the user
export async function GET() {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const storyboards = await prisma.storyboard.findMany({
      where: { userId: user!.id },
      include: {
        scenes: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            order: true,
            name: true,
            status: true,
            thumbnailUrl: true,
            duration: true,
          },
        },
        _count: {
          select: { scenes: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ storyboards });
  } catch (error) {
    console.error("Error fetching storyboards:", error);
    return NextResponse.json(
      { error: "Failed to fetch storyboards" },
      { status: 500 }
    );
  }
}

// POST /api/storyboards - Create a new storyboard
export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parseResult = createStoryboardSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid request body" },
        { status: 400 }
      );
    }

    const { name, description, aspectRatio } = parseResult.data;

    const storyboard = await prisma.storyboard.create({
      data: {
        userId: user!.id,
        name,
        description,
        aspectRatio,
      },
      include: {
        scenes: true,
      },
    });

    return NextResponse.json({ storyboard }, { status: 201 });
  } catch (error) {
    console.error("Error creating storyboard:", error);
    return NextResponse.json(
      { error: "Failed to create storyboard" },
      { status: 500 }
    );
  }
}
