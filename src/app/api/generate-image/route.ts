import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGeneratorClient, parseGeneratorError } from "@/lib/generators";
import type {
  ProviderImageResolution,
  RequestedImageResolution,
} from "@/lib/generators/types";
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
import { prisma } from "@/lib/prisma";
import { createFalProvider } from "@/lib/image-tools/fal-tools";

const IMAGE_RESOLUTIONS = [
  "1K",
  "2K",
  "4K",
  "8K",
] as const satisfies readonly RequestedImageResolution[];

// Zod schema for image generation request
const generateImageSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(2500, "Prompt too long"),
  service: z
    .enum(["fal", "midjourney", "google-gemini", "freepik"])
    .default("fal"),
  model: z.string().default("nano-banana-pro"),
  aspectRatio: z.string().default("1:1"),
  resolution: z.enum(IMAGE_RESOLUTIONS).optional(),
  outputFormat: z.enum(["png", "jpeg", "webp"]).default("png"),
  imageUrls: z
    .array(z.string())
    .max(10, "Maximum 10 reference images")
    .optional(),
  numImages: z.number().int().min(1).max(6).default(1),
  enableWebSearch: z.boolean().default(false),
  enableSafetyChecker: z.boolean().default(true),
  strength: z.number().min(0).max(1).optional(),
  guidanceScale: z.number().min(1).max(20).optional(),
  seed: z.number().int().optional(),
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
        error: "Too many requests. Please wait before generating more images.",
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  let service: "fal" | "midjourney" | "google-gemini" | "freepik" = "fal";

  try {
    const body = await request.json();
    const parseResult = generateImageSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      prompt,
      service: parsedService,
      model,
      aspectRatio,
      resolution,
      outputFormat,
      imageUrls,
      numImages,
      enableSafetyChecker,
      strength,
      seed,
    } = parseResult.data;

    service = parsedService;

    if (
      (resolution === "4K" || resolution === "8K") &&
      (service !== "fal" || model !== "nano-banana-pro")
    ) {
      return NextResponse.json(
        { error: "4K and 8K output require FAL.ai Nano Banana Pro" },
        { status: 400 }
      );
    }

    // Get API key for the requested service
    const apiKey = await getApiKey(user!.id, service);
    if (!apiKey) {
      return NextResponse.json(
        {
          error: `No API key configured for ${service}. Add your key in Settings.`,
          code: "NO_API_KEY",
        },
        { status: 400 }
      );
    }

    // Resolve image URLs for services that need it
    const resolvedImageUrls: string[] = [];
    if (imageUrls && Array.isArray(imageUrls)) {
      for (const url of imageUrls) {
        const resolved = await resolveImageForFal(url);
        if (resolved) {
          resolvedImageUrls.push(resolved);
        }
      }

      // Validate image sizes
      const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
      for (const url of resolvedImageUrls) {
        if (url && url.length > MAX_IMAGE_SIZE) {
          return NextResponse.json(
            {
              error:
                "Reference image is too large. Please use a smaller image (max 5MB).",
            },
            { status: 400 }
          );
        }
      }
    }

    // Get the generator client
    const generator = await getGeneratorClient(service, apiKey);

    // Set the model if specified and generator supports it
    if (model && generator.setModel) {
      generator.setModel(model);
    }

    // Check if generator supports editing with images
    const capabilities = generator.getCapabilities();
    if (resolvedImageUrls.length > 0 && !capabilities.supportsEditing) {
      return NextResponse.json(
        {
          error: `Image editing is not supported with ${service}`,
        },
        { status: 400 }
      );
    }

    // Prepare request
    const providerResolution: ProviderImageResolution | undefined =
      resolution === "8K" ? "4K" : resolution;
    const generationRequest = {
      prompt,
      numImages,
      aspectRatio,
      resolution: providerResolution,
      outputFormat,
      enableSafetyChecker,
      seed,
      strength,
    };

    // Execute generation with timeout
    let result = await withTimeout(
      resolvedImageUrls.length > 0
        ? generator.editImage({
            ...generationRequest,
            imageUrls: resolvedImageUrls,
          })
        : generator.generateImage(generationRequest),
      TIMEOUTS.IMAGE_GENERATION,
      "Image generation timed out. Please try again."
    );
    let warning: string | undefined;

    if (resolution === "8K") {
      try {
        const upscaler = createFalProvider(apiKey);
        const images = await Promise.all(
          result.images.map(async (image) => {
            if (Math.max(image.width ?? 0, image.height ?? 0) >= 8192) {
              return image;
            }
            const upscaled = await withTimeout(
              upscaler.upscale(image.url, { scale: 2 }),
              TIMEOUTS.IMAGE_GENERATION,
              "8K upscale timed out"
            );
            if (!upscaled.success || !upscaled.url) {
              throw new Error(upscaled.error || "8K upscale failed");
            }
            return {
              ...image,
              url: upscaled.url,
              width: upscaled.width,
              height: upscaled.height,
            };
          })
        );
        result = {
          ...result,
          images,
          resultUrls: images.map((image) => image.url),
        };
      } catch (upscaleError) {
        warning = "Generated at 4K, but automatic 8K upscaling failed";
        logger.error("Automatic 8K upscale failed", {
          error:
            upscaleError instanceof Error
              ? upscaleError.message
              : "Unknown upscale error",
        });
      }
    }

    // Save to database
    for (const imageUrl of result.resultUrls) {
      await prisma.generatedImage.create({
        data: {
          userId: user!.id,
          url: imageUrl,
          prompt,
          aspectRatio: aspectRatio || "1:1",
          generator: service,
          generatorModel: model,
        },
      });
    }

    return NextResponse.json({
      success: true,
      images: result.images,
      resultUrls: result.resultUrls,
      description: result.description,
      seed: result.seed,
      jobId: result.jobId,
      requestedResolution: resolution,
      deliveredResolution: resolution === "8K" && warning ? "4K" : resolution,
      warning,
    });
  } catch (error) {
    logger.error("Image generation error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Handle timeout errors specifically
    if (error instanceof TimeoutError) {
      return NextResponse.json(
        { error: error.message, code: "TASK_TIMEOUT" },
        { status: 504 }
      );
    }

    const errorMsg =
      error instanceof Error ? error.message : "Failed to generate image";
    const parsed = parseGeneratorError(errorMsg, service);
    return NextResponse.json(parsed, { status: 500 });
  }
}
