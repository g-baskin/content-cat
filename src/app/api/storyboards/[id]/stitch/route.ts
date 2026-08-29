import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { stitchScenes, cleanupJob, type StitchScene } from "@/lib/video-stitcher";
import { saveFileFromPath } from "@/lib/storage";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;

    // Fetch storyboard with scenes
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

    // Filter to only completed scenes with video URLs
    const completedScenes = storyboard.scenes.filter(
      (s) => s.status === "complete" && s.videoUrl
    );

    if (completedScenes.length === 0) {
      return NextResponse.json(
        { error: "No completed scenes to stitch" },
        { status: 400 }
      );
    }

    // Update storyboard status
    await prisma.storyboard.update({
      where: { id },
      data: { status: "generating" },
    });

    // Prepare scenes for stitching
    const stitchSceneData: StitchScene[] = completedScenes.map((scene) => ({
      id: scene.id,
      order: scene.order,
      videoUrl: scene.videoUrl!,
      duration: scene.duration,
      transition: scene.transition,
      transitionDuration: scene.transitionDuration,
      dialogueUrl: scene.dialogueUrl,
    }));

    // Stitch scenes together
    const result = await stitchScenes(stitchSceneData, {
      outputFormat: "mp4",
      resolution: "1080p",
      fps: 30,
    });

    if (!result.success || !result.outputPath) {
      await prisma.storyboard.update({
        where: { id },
        data: { status: "failed" },
      });

      return NextResponse.json(
        { error: result.error || "Failed to stitch video" },
        { status: 500 }
      );
    }

    // Save stitched video to storage
    const videoUrl = await saveFileFromPath(
      result.outputPath,
      "storyboards",
      ".mp4"
    );

    // Clean up temp files
    cleanupJob(result.outputPath);

    // Create GeneratedVideo record and link to storyboard
    const generatedVideo = await prisma.generatedVideo.create({
      data: {
        userId: user!.id,
        prompt: `Storyboard: ${storyboard.name}`,
        model: "stitched",
        aspectRatio: storyboard.aspectRatio,
        duration: storyboard.totalDuration,
        url: videoUrl,
      },
    });

    // Update storyboard with final video
    await prisma.storyboard.update({
      where: { id },
      data: {
        status: "complete",
        finalVideoId: generatedVideo.id,
        totalDuration: completedScenes.reduce((sum, s) => sum + s.duration, 0),
      },
    });

    return NextResponse.json({
      success: true,
      videoUrl,
      videoId: generatedVideo.id,
    });
  } catch (error) {
    console.error("Stitch error:", error);

    // Try to update storyboard status
    try {
      const { id } = await params;
      await prisma.storyboard.update({
        where: { id },
        data: { status: "failed" },
      });
    } catch {
      // Ignore cleanup errors
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to stitch video",
      },
      { status: 500 }
    );
  }
}
