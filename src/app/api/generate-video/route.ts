import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getVideoGeneratorClient,
  parseVideoGeneratorError,
  getServiceForModel,
  type VideoGeneratorService,
} from "@/lib/video-generators";
import { prisma } from "@/lib/prisma";
import { getApiKey } from "@/lib/services/apiKeyService";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { withTimeout, TIMEOUTS, TimeoutError } from "@/lib/utils/timeout";
import { requireAuth } from "@/lib/auth-helpers";
import { logger } from "@/lib/logger";
import { resolveImageForFal } from "@/lib/storage";

// All supported models across all services
const ALL_MODELS = [
  // FAL.ai models
  "kling-2.6",
  "kling-2.5-turbo",
  "wan-2.6",
  "veo-3.1",
  // OpenAI Sora models
  "sora-2",
  "sora-2-pro",
  // Runway models
  "gen-3-alpha",
  "gen-3-alpha-turbo",
  // Pika models
  "pika-2.0",
  "pika-1.5",
  // Luma models
  "dream-machine",
  "dream-machine-1.5",
] as const;

// Zod schema for video generation request
const generateVideoSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(5000, "Prompt too long"),
  // Service can be explicitly specified or inferred from model
  service: z
    .enum(["fal", "openai", "runway", "pika", "luma"])
    .optional(),
  model: z.enum(ALL_MODELS).default("kling-2.6"),
  mode: z
    .enum(["text-to-video", "image-to-video", "first-last-frame"])
    .default("text-to-video"),
  duration: z.number().int().min(4).max(20).default(5),
  aspectRatio: z
    .enum(["auto", "16:9", "9:16", "1:1", "4:3", "3:4", "21:9"])
    .default("16:9"),
  resolution: z.enum(["480p", "720p", "1080p"]).optional(),
  audioEnabled: z.boolean().default(false),
  enhanceEnabled: z.boolean().default(false),
  imageUrl: z.string().optional().nullable(),
  endImageUrl: z.string().optional().nullable(),
  negativePrompt: z.string().max(500).optional().nullable(),
  cfgScale: z.number().min(0).max(1).default(0.5),
  seed: z.number().int().optional().nullable(),
  speed: z.enum(["standard", "fast"]).default("standard"),
  // Legacy fields for Veo 3.1 first/last frame mode
  firstFrameUrl: z.string().optional().nullable(),
  lastFrameUrl: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  // Rate limiting for expensive generation operations
  const clientId = getClientIdentifier(request);
  const rateLimitResult = await checkRateLimit(
    clientId,
    RATE_LIMITS.generation
  );

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "Too many requests. Please wait before generating more videos.",
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  let service: VideoGeneratorService = "fal";

  try {
    const body = await request.json();
    const parseResult = generateVideoSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      prompt,
      service: requestedService,
      model,
      mode,
      aspectRatio,
      duration,
      resolution,
      audioEnabled,
      imageUrl,
      endImageUrl,
      negativePrompt,
      cfgScale,
      seed,
      speed,
      firstFrameUrl,
      lastFrameUrl,
    } = parseResult.data;

    // Determine which service to use
    // Priority: explicit service > inferred from model > default to fal
    if (requestedService) {
      service = requestedService;
    } else {
      const inferredService = getServiceForModel(model);
      if (inferredService) {
        service = inferredService;
      }
    }

    // Get API key for the service
    const apiKey = await getApiKey(user!.id, service);
    if (!apiKey) {
      const serviceNames: Record<VideoGeneratorService, string> = {
        fal: "fal.ai",
        openai: "OpenAI",
        runway: "Runway",
        pika: "Pika",
        luma: "Luma",
      };
      return NextResponse.json(
        {
          error: `No API key. Add your ${serviceNames[service]} key in Settings.`,
          code: "NO_API_KEY",
        },
        { status: 400 }
      );
    }

    // Log input for debugging (sanitized)
    logger.debug("Video generation request", {
      service,
      model,
      mode,
      aspectRatio,
      duration,
      audioEnabled,
      hasImageUrl: !!imageUrl,
      hasEndImageUrl: !!endImageUrl,
      hasFirstFrameUrl: !!firstFrameUrl,
      hasLastFrameUrl: !!lastFrameUrl,
      speed,
    });

    // Resolve local file URLs to base64 for services that can't access local URLs
    // Convert null to undefined for type compatibility
    const resolvedImageUrl = await resolveImageForFal(imageUrl ?? undefined);
    const resolvedEndImageUrl = await resolveImageForFal(endImageUrl ?? undefined);
    const resolvedFirstFrameUrl = await resolveImageForFal(firstFrameUrl ?? undefined);
    const resolvedLastFrameUrl = await resolveImageForFal(lastFrameUrl ?? undefined);
    const resolvedNegativePrompt = negativePrompt ?? undefined;
    const resolvedSeed = seed ?? undefined;

    // Get the generator client
    const generator = await getVideoGeneratorClient(service, apiKey, model);

    // Check if the mode is supported
    const capabilities = generator.getCapabilities();
    if (!capabilities.supportedModes.includes(mode)) {
      return NextResponse.json(
        {
          error: `${mode} is not supported by ${model}. Supported modes: ${capabilities.supportedModes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Generate video with timeout protection
    const generateVideo = async () => {
      // First/last frame mode (Veo 3.1 only)
      if (mode === "first-last-frame") {
        if (!generator.generateFirstLastFrame) {
          throw new Error(`First-last-frame mode is not supported by ${model}`);
        }
        if (!resolvedFirstFrameUrl || !resolvedLastFrameUrl) {
          throw new Error(
            "First frame and last frame URLs are required for first-last-frame mode"
          );
        }
        return generator.generateFirstLastFrame({
          prompt,
          firstFrameUrl: resolvedFirstFrameUrl,
          lastFrameUrl: resolvedLastFrameUrl,
          duration,
          aspectRatio,
          resolution,
          negativePrompt: resolvedNegativePrompt,
          seed: resolvedSeed,
          enableAudio: audioEnabled,
          cfgScale,
          speed,
        });
      }

      // Image-to-video mode
      if (mode === "image-to-video") {
        if (!resolvedImageUrl) {
          throw new Error("Image URL is required for image-to-video mode");
        }
        return generator.generateImageToVideo({
          prompt,
          imageUrl: resolvedImageUrl,
          endImageUrl: resolvedEndImageUrl,
          duration,
          aspectRatio,
          resolution,
          negativePrompt: resolvedNegativePrompt,
          seed: resolvedSeed,
          enableAudio: audioEnabled,
          cfgScale,
          speed,
        });
      }

      // Text-to-video mode (default)
      return generator.generateTextToVideo({
        prompt,
        duration,
        aspectRatio,
        resolution,
        negativePrompt: resolvedNegativePrompt,
        seed: resolvedSeed,
        enableAudio: audioEnabled,
        cfgScale,
        speed,
      });
    };

    const result = await withTimeout(
      generateVideo(),
      TIMEOUTS.VIDEO_GENERATION,
      "Video generation timed out. Please try again."
    );

    // Save the video to the database
    const video = await prisma.generatedVideo.create({
      data: {
        userId: user!.id,
        url: result.videoUrl,
        thumbnailUrl: imageUrl || result.video.thumbnailUrl || null,
        prompt,
        model,
        duration: duration || 5,
        aspectRatio: aspectRatio || "16:9",
        resolution,
        startImageUrl: imageUrl,
        endImageUrl,
        audioEnabled: audioEnabled || false,
      },
    });

    return NextResponse.json({
      success: true,
      video,
      videoUrl: result.videoUrl,
      seed: result.seed,
      id: video.id,
      jobId: result.jobId,
    });
  } catch (error: unknown) {
    logger.error("Video generation error", {
      error: error instanceof Error ? error.message : "Unknown error",
      service,
    });

    // Handle timeout errors specifically
    if (error instanceof TimeoutError) {
      return NextResponse.json(
        { error: error.message, code: "TASK_TIMEOUT" },
        { status: 504 }
      );
    }

    const errorMsg =
      error instanceof Error ? error.message : "Failed to generate video";
    const parsed = parseVideoGeneratorError(errorMsg, service);
    return NextResponse.json(parsed, { status: 500 });
  }
}
