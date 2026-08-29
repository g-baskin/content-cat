import { logger } from "@/lib/logger";
import type {
  ImageToolProvider,
  ImageToolOptions,
  ImageToolResult,
} from "./types";

const FREEPIK_API_BASE = "https://api.freepik.com/v1/ai";
const POLLING_TIMEOUT = 300000; // 5 minutes
const POLLING_INTERVAL = 3000; // 3 seconds

interface FreepikTaskResponse {
  data: {
    task_id?: string;
    id?: string;
    status: string;
    generated?: Array<string | { url: string }>;
    result?: { url: string };
  };
}

async function pollForCompletion(
  apiKey: string,
  endpoint: string,
  taskId: string
): Promise<string | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < POLLING_TIMEOUT) {
    await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));

    const response = await fetch(`${FREEPIK_API_BASE}${endpoint}/${taskId}`, {
      headers: {
        "x-freepik-api-key": apiKey,
      },
    });

    if (!response.ok) continue;

    const data: FreepikTaskResponse = await response.json();
    const status = data.data.status?.toLowerCase();

    if (status === "completed") {
      // Handle different response formats
      if (data.data.generated && data.data.generated.length > 0) {
        const first = data.data.generated[0];
        return typeof first === "string" ? first : first.url;
      }
      if (data.data.result?.url) {
        return data.data.result.url;
      }
    }

    if (status === "failed") {
      return null;
    }
  }

  return null;
}

export function createFreepikProvider(apiKey: string): ImageToolProvider {
  const headers = {
    "x-freepik-api-key": apiKey,
    "Content-Type": "application/json",
  };

  return {
    name: "freepik",

    async sharpen(
      imageUrl: string,
      options?: ImageToolOptions
    ): Promise<ImageToolResult> {
      try {
        // Use precision upscaler with scale=1 for sharpen-only effect
        const response = await fetch(
          `${FREEPIK_API_BASE}/image-upscaler-precision-v2`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              image: imageUrl,
              scale_factor: 1, // No upscaling, just enhancement
              sharpen: options?.strength ?? 50,
              ultra_detail: 30,
              flavor: "photo",
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          logger.error("Freepik sharpen failed", { error });
          return { success: false, error: "Failed to sharpen image" };
        }

        const data: FreepikTaskResponse = await response.json();
        const taskId = data.data.task_id || data.data.id;

        if (!taskId) {
          return { success: false, error: "No task ID returned" };
        }

        const resultUrl = await pollForCompletion(
          apiKey,
          "/image-upscaler-precision-v2",
          taskId
        );

        if (!resultUrl) {
          return { success: false, error: "Sharpen timed out or failed" };
        }

        return { success: true, url: resultUrl };
      } catch (error) {
        logger.error("Freepik sharpen error", { error });
        return { success: false, error: "Failed to sharpen image" };
      }
    },

    async upscale(
      imageUrl: string,
      options?: ImageToolOptions
    ): Promise<ImageToolResult> {
      try {
        const response = await fetch(`${FREEPIK_API_BASE}/image-upscaler`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            image: imageUrl,
            scale: parseInt(options?.scale || "2"),
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          logger.error("Freepik upscale failed", { error });
          return { success: false, error: "Failed to upscale image" };
        }

        const data: FreepikTaskResponse = await response.json();
        const taskId = data.data.task_id || data.data.id;

        if (!taskId) {
          return { success: false, error: "No task ID returned" };
        }

        const resultUrl = await pollForCompletion(
          apiKey,
          "/image-upscaler",
          taskId
        );

        if (!resultUrl) {
          return { success: false, error: "Upscale timed out or failed" };
        }

        return { success: true, url: resultUrl };
      } catch (error) {
        logger.error("Freepik upscale error", { error });
        return { success: false, error: "Failed to upscale image" };
      }
    },

    async backgroundRemove(imageUrl: string): Promise<ImageToolResult> {
      try {
        // Background removal uses form-urlencoded
        const response = await fetch(
          `${FREEPIK_API_BASE}/beta/remove-background`,
          {
            method: "POST",
            headers: {
              "x-freepik-api-key": apiKey,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ image_url: imageUrl }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          logger.error("Freepik background remove failed", { error });
          return { success: false, error: "Failed to remove background" };
        }

        const data = await response.json();
        // Background removal returns URL directly (5 min expiry)
        const resultUrl = data.data?.url || data.data?.result?.url;

        if (!resultUrl) {
          return { success: false, error: "No result URL returned" };
        }

        return { success: true, url: resultUrl };
      } catch (error) {
        logger.error("Freepik background remove error", { error });
        return { success: false, error: "Failed to remove background" };
      }
    },

    async colorGrade(
      imageUrl: string,
      options?: ImageToolOptions
    ): Promise<ImageToolResult> {
      try {
        // Use image-relight for color grading
        const presetSettings: Record<
          string,
          { brightness: number; contrast: number; saturation: number }
        > = {
          cinematic: { brightness: -10, contrast: 30, saturation: -10 },
          vintage: { brightness: 5, contrast: 20, saturation: -20 },
          vibrant: { brightness: 10, contrast: 20, saturation: 40 },
          moody: { brightness: -20, contrast: 40, saturation: -15 },
          warm: { brightness: 10, contrast: 15, saturation: 20 },
          cool: { brightness: 0, contrast: 20, saturation: -10 },
        };

        const preset = options?.preset || "cinematic";
        const settings = presetSettings[preset] || presetSettings.cinematic;

        const response = await fetch(`${FREEPIK_API_BASE}/image-relight`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            image: imageUrl,
            brightness: settings.brightness,
            contrast: settings.contrast,
            saturation: settings.saturation,
            style: preset === "cinematic" ? "cinematic" : "smooth",
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          logger.error("Freepik color grade failed", { error });
          return { success: false, error: "Failed to color grade image" };
        }

        const data: FreepikTaskResponse = await response.json();
        const taskId = data.data.task_id || data.data.id;

        if (!taskId) {
          return { success: false, error: "No task ID returned" };
        }

        const resultUrl = await pollForCompletion(
          apiKey,
          "/image-relight",
          taskId
        );

        if (!resultUrl) {
          return { success: false, error: "Color grade timed out or failed" };
        }

        return { success: true, url: resultUrl };
      } catch (error) {
        logger.error("Freepik color grade error", { error });
        return { success: false, error: "Failed to color grade image" };
      }
    },

    async portraitEnhance(
      imageUrl: string,
      options?: ImageToolOptions
    ): Promise<ImageToolResult> {
      try {
        // Use precision upscaler optimized for portraits
        const response = await fetch(
          `${FREEPIK_API_BASE}/image-upscaler-precision-v2`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              image: imageUrl,
              scale_factor: 2,
              sharpen: options?.strength ?? 30,
              ultra_detail: options?.strength ?? 50,
              smart_grain: 5,
              flavor: "photo", // Best for portraits
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          logger.error("Freepik portrait enhance failed", { error });
          return { success: false, error: "Failed to enhance portrait" };
        }

        const data: FreepikTaskResponse = await response.json();
        const taskId = data.data.task_id || data.data.id;

        if (!taskId) {
          return { success: false, error: "No task ID returned" };
        }

        const resultUrl = await pollForCompletion(
          apiKey,
          "/image-upscaler-precision-v2",
          taskId
        );

        if (!resultUrl) {
          return {
            success: false,
            error: "Portrait enhance timed out or failed",
          };
        }

        return { success: true, url: resultUrl };
      } catch (error) {
        logger.error("Freepik portrait enhance error", { error });
        return { success: false, error: "Failed to enhance portrait" };
      }
    },

    async lightingFix(
      imageUrl: string,
      options?: ImageToolOptions
    ): Promise<ImageToolResult> {
      try {
        const response = await fetch(`${FREEPIK_API_BASE}/image-relight`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            image: imageUrl,
            prompt:
              options?.prompt ||
              "Natural, even lighting with soft shadows. Well-lit scene.",
            brightness: 15,
            contrast: 20,
            style: "smooth",
            interpolate_from_original: true,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          logger.error("Freepik lighting fix failed", { error });
          return { success: false, error: "Failed to fix lighting" };
        }

        const data: FreepikTaskResponse = await response.json();
        const taskId = data.data.task_id || data.data.id;

        if (!taskId) {
          return { success: false, error: "No task ID returned" };
        }

        const resultUrl = await pollForCompletion(
          apiKey,
          "/image-relight",
          taskId
        );

        if (!resultUrl) {
          return { success: false, error: "Lighting fix timed out or failed" };
        }

        return { success: true, url: resultUrl };
      } catch (error) {
        logger.error("Freepik lighting fix error", { error });
        return { success: false, error: "Failed to fix lighting" };
      }
    },

    async productPhoto(
      imageUrl: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _options?: ImageToolOptions
    ): Promise<ImageToolResult> {
      try {
        // Use precision upscaler with sublime flavor for product photos
        const response = await fetch(
          `${FREEPIK_API_BASE}/image-upscaler-precision-v2`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              image: imageUrl,
              scale_factor: 2,
              sharpen: 40,
              ultra_detail: 70,
              smart_grain: 3,
              flavor: "sublime", // Optimized for product photos
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          logger.error("Freepik product photo failed", { error });
          return { success: false, error: "Failed to enhance product photo" };
        }

        const data: FreepikTaskResponse = await response.json();
        const taskId = data.data.task_id || data.data.id;

        if (!taskId) {
          return { success: false, error: "No task ID returned" };
        }

        const resultUrl = await pollForCompletion(
          apiKey,
          "/image-upscaler-precision-v2",
          taskId
        );

        if (!resultUrl) {
          return {
            success: false,
            error: "Product photo enhancement timed out or failed",
          };
        }

        return { success: true, url: resultUrl };
      } catch (error) {
        logger.error("Freepik product photo error", { error });
        return { success: false, error: "Failed to enhance product photo" };
      }
    },

    async styleTransfer(
      imageUrl: string,
      options?: ImageToolOptions
    ): Promise<ImageToolResult> {
      try {
        if (!options?.referenceImageUrl) {
          return {
            success: false,
            error: "Reference image required for style transfer",
          };
        }

        const response = await fetch(
          `${FREEPIK_API_BASE}/image-style-transfer`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              image: imageUrl,
              reference_image: options.referenceImageUrl,
              prompt: options.prompt || "Apply the style from the reference",
              style_strength: options.strength ?? 70,
              structure_strength: 50,
              flavor: "faithful",
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          logger.error("Freepik style transfer failed", { error });
          return { success: false, error: "Failed to transfer style" };
        }

        const data: FreepikTaskResponse = await response.json();
        const taskId = data.data.task_id || data.data.id;

        if (!taskId) {
          return { success: false, error: "No task ID returned" };
        }

        const resultUrl = await pollForCompletion(
          apiKey,
          "/image-style-transfer",
          taskId
        );

        if (!resultUrl) {
          return {
            success: false,
            error: "Style transfer timed out or failed",
          };
        }

        return { success: true, url: resultUrl };
      } catch (error) {
        logger.error("Freepik style transfer error", { error });
        return { success: false, error: "Failed to transfer style" };
      }
    },
  };
}
