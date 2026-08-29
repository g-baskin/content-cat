import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-helpers";
import { getApiKey } from "@/lib/services/apiKeyService";
import { logger } from "@/lib/logger";
import {
  executeImageTool,
  getActiveProviderName,
  type ImageToolType,
} from "@/lib/image-tools";

const imageToolSchema = z.object({
  tool: z.enum([
    "sharpen",
    "upscale",
    "background-remove",
    "color-grade",
    "portrait-enhance",
    "lighting-fix",
    "product-photo",
    "style-transfer",
  ]),
  imageUrl: z.string().url("Valid image URL required"),
  options: z
    .object({
      strength: z.number().min(0).max(100).optional(),
      scale: z.enum(["2", "4"]).optional(),
      prompt: z.string().optional(),
      referenceImageUrl: z.string().url().optional(),
      preset: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parseResult = imageToolSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { tool, imageUrl, options } = parseResult.data;

    // Get API keys for providers
    const freepikApiKey = await getApiKey(user!.id, "freepik");
    const falApiKey = await getApiKey(user!.id, "fal");

    const config = {
      freepikApiKey: freepikApiKey || undefined,
      falApiKey: falApiKey || undefined,
    };

    // Check if any provider is available
    const providerName = getActiveProviderName(config);
    if (!providerName) {
      return NextResponse.json(
        {
          error:
            "No API key configured. Add your Freepik or FAL.ai key in Settings.",
        },
        { status: 400 }
      );
    }

    logger.info("Executing image tool", {
      tool,
      provider: providerName,
      userId: user!.id,
    });

    const result = await executeImageTool(
      config,
      tool as ImageToolType,
      imageUrl,
      options
    );

    if (!result.success) {
      logger.error("Image tool failed", {
        tool,
        provider: providerName,
        error: result.error,
      });
      return NextResponse.json(
        { error: result.error || "Tool operation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      provider: providerName,
    });
  } catch (error) {
    logger.error("Image tool error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
