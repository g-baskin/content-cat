import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-helpers";
import { getApiKey } from "@/lib/services/apiKeyService";
import { logger } from "@/lib/logger";

const FREEPIK_API_BASE = "https://api.freepik.com/v1/ai";
const POLLING_TIMEOUT = 300000; // 5 minutes
const POLLING_INTERVAL = 3000; // 3 seconds

const upscaleSchema = z.object({
  imageUrl: z.string().url("Valid image URL required"),
  scale: z.enum(["2", "4"]).default("2"),
});

interface FreepikUpscaleResponse {
  data: {
    task_id: string;
    status: string;
    generated?: string[];
  };
}

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parseResult = upscaleSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { imageUrl, scale } = parseResult.data;

    // Get Freepik API key
    const apiKey = await getApiKey(user!.id, "freepik");
    if (!apiKey) {
      return NextResponse.json(
        { error: "No Freepik API key configured. Add your key in Settings." },
        { status: 400 }
      );
    }

    // Submit upscale job
    const submitResponse = await fetch(`${FREEPIK_API_BASE}/image-upscaler`, {
      method: "POST",
      headers: {
        "x-freepik-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: imageUrl,
        scale: parseInt(scale),
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      logger.error("Freepik upscale submit failed", { error: errorText });
      return NextResponse.json(
        { error: "Failed to start upscale job" },
        { status: 500 }
      );
    }

    const submitData: FreepikUpscaleResponse = await submitResponse.json();
    const taskId = submitData.data.task_id;

    // Poll for completion
    const startTime = Date.now();
    while (Date.now() - startTime < POLLING_TIMEOUT) {
      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));

      const statusResponse = await fetch(
        `${FREEPIK_API_BASE}/image-upscaler/${taskId}`,
        {
          headers: {
            "x-freepik-api-key": apiKey,
          },
        }
      );

      if (!statusResponse.ok) {
        continue;
      }

      const statusData: FreepikUpscaleResponse = await statusResponse.json();
      const status = statusData.data.status;

      if (status === "COMPLETED" || status === "completed") {
        const generated = statusData.data.generated || [];
        if (generated.length > 0) {
          return NextResponse.json({
            success: true,
            url: generated[0],
          });
        }
      }

      if (status === "FAILED" || status === "failed") {
        return NextResponse.json(
          { error: "Upscale job failed" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Upscale timed out" },
      { status: 504 }
    );
  } catch (error) {
    logger.error("Upscale error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to upscale image" },
      { status: 500 }
    );
  }
}
