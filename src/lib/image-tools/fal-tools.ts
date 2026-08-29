import { fal } from "@fal-ai/client";
import { logger } from "@/lib/logger";
import type {
  ImageToolProvider,
  ImageToolOptions,
  ImageToolResult,
} from "./types";

// Type for fal.subscribe result
interface FalResult {
  image?: { url: string };
  images?: Array<{ url: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FalSubscribe = (modelId: string, options: any) => Promise<FalResult>;

// Configure fal client
function configureFal(apiKey: string) {
  fal.config({
    credentials: apiKey,
  });
}

export function createFalProvider(apiKey: string): ImageToolProvider {
  configureFal(apiKey);
  const subscribe = fal.subscribe as FalSubscribe;

  return {
    name: "fal",

    async sharpen(
      imageUrl: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _options?: ImageToolOptions
    ): Promise<ImageToolResult> {
      try {
        const result = await subscribe("fal-ai/clarity-upscaler", {
          input: {
            image_url: imageUrl,
            scale: 1, // No upscaling, just enhancement
            creativity: 0.1, // Low creativity for sharpening
            resemblance: 0.9, // High resemblance to original
            output_format: "png",
          },
          logs: true,
        });

        const outputUrl = result?.image?.url || result?.images?.[0]?.url;

        if (!outputUrl) {
          return { success: false, error: "No output image returned" };
        }

        return { success: true, url: outputUrl };
      } catch (error) {
        logger.error("FAL sharpen error", { error });
        return { success: false, error: "Failed to sharpen image" };
      }
    },

    async upscale(
      imageUrl: string,
      options?: ImageToolOptions
    ): Promise<ImageToolResult> {
      try {
        const scale = parseInt(options?.scale || "2");

        const result = await subscribe("fal-ai/clarity-upscaler", {
          input: {
            image_url: imageUrl,
            scale: scale,
            creativity: 0.2,
            resemblance: 0.8,
            output_format: "png",
          },
          logs: true,
        });

        const outputUrl = result?.image?.url || result?.images?.[0]?.url;

        if (!outputUrl) {
          return { success: false, error: "No output image returned" };
        }

        return { success: true, url: outputUrl };
      } catch (error) {
        logger.error("FAL upscale error", { error });
        return { success: false, error: "Failed to upscale image" };
      }
    },

    async backgroundRemove(imageUrl: string): Promise<ImageToolResult> {
      try {
        const result = await subscribe("fal-ai/bria/rmbg/2", {
          input: {
            image_url: imageUrl,
          },
          logs: true,
        });

        const outputUrl = result?.image?.url || result?.images?.[0]?.url;

        if (!outputUrl) {
          return { success: false, error: "No output image returned" };
        }

        return { success: true, url: outputUrl };
      } catch (error) {
        logger.error("FAL background remove error", { error });
        return { success: false, error: "Failed to remove background" };
      }
    },

    async colorGrade(
      imageUrl: string,
      options?: ImageToolOptions
    ): Promise<ImageToolResult> {
      try {
        const presetPrompts: Record<string, string> = {
          cinematic:
            "Apply cinematic color grading with teal and orange tones, dramatic contrast",
          vintage:
            "Apply vintage film look with faded blacks, warm highlights, and grain",
          vibrant:
            "Enhance colors to be more vibrant and saturated, increase contrast",
          moody:
            "Apply moody color grading with deep shadows, desaturated midtones",
          warm: "Apply warm color grading with golden tones, soft highlights",
          cool: "Apply cool color grading with blue tones, crisp shadows",
        };

        const preset = options?.preset || "cinematic";
        const prompt = presetPrompts[preset] || presetPrompts.cinematic;

        const result = await subscribe("fal-ai/flux/dev/image-to-image", {
          input: {
            image_url: imageUrl,
            prompt: prompt,
            strength: 0.3, // Low strength to preserve image
            num_inference_steps: 28,
            guidance_scale: 3.5,
          },
          logs: true,
        });

        const outputUrl = result?.images?.[0]?.url || result?.image?.url;

        if (!outputUrl) {
          return { success: false, error: "No output image returned" };
        }

        return { success: true, url: outputUrl };
      } catch (error) {
        logger.error("FAL color grade error", { error });
        return { success: false, error: "Failed to color grade image" };
      }
    },

    async portraitEnhance(
      imageUrl: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _options?: ImageToolOptions
    ): Promise<ImageToolResult> {
      try {
        const result = await subscribe("fal-ai/retoucher", {
          input: {
            image_url: imageUrl,
            output_format: "png",
          },
          logs: true,
        });

        const outputUrl = result?.image?.url || result?.images?.[0]?.url;

        if (!outputUrl) {
          return { success: false, error: "No output image returned" };
        }

        return { success: true, url: outputUrl };
      } catch (error) {
        logger.error("FAL portrait enhance error", { error });
        return { success: false, error: "Failed to enhance portrait" };
      }
    },

    async lightingFix(
      imageUrl: string,
      options?: ImageToolOptions
    ): Promise<ImageToolResult> {
      try {
        // Use FLUX image-to-image for lighting correction
        const result = await subscribe("fal-ai/flux/dev/image-to-image", {
          input: {
            image_url: imageUrl,
            prompt:
              options?.prompt ||
              "Fix lighting, remove harsh shadows, add natural even illumination, well-lit scene",
            strength: 0.25, // Low strength to preserve image
            num_inference_steps: 28,
            guidance_scale: 3.5,
          },
          logs: true,
        });

        const outputUrl = result?.images?.[0]?.url || result?.image?.url;

        if (!outputUrl) {
          return { success: false, error: "No output image returned" };
        }

        return { success: true, url: outputUrl };
      } catch (error) {
        logger.error("FAL lighting fix error", { error });
        return { success: false, error: "Failed to fix lighting" };
      }
    },

    async productPhoto(
      imageUrl: string,
      options?: ImageToolOptions
    ): Promise<ImageToolResult> {
      try {
        const result = await subscribe("fal-ai/bria/product-shot", {
          input: {
            image_url: imageUrl,
            prompt:
              options?.prompt ||
              "Professional product photography, clean white studio background, soft lighting",
            seed: Math.floor(Math.random() * 1000000),
          },
          logs: true,
        });

        const outputUrl = result?.image?.url || result?.images?.[0]?.url;

        if (!outputUrl) {
          return { success: false, error: "No output image returned" };
        }

        return { success: true, url: outputUrl };
      } catch (error) {
        logger.error("FAL product photo error", { error });
        return { success: false, error: "Failed to enhance product photo" };
      }
    },

    async styleTransfer(
      imageUrl: string,
      options?: ImageToolOptions
    ): Promise<ImageToolResult> {
      try {
        const strength = (options?.strength ?? 70) / 100; // Convert 0-100 to 0-1

        const result = await subscribe("fal-ai/flux/dev/image-to-image", {
          input: {
            image_url: imageUrl,
            prompt:
              options?.prompt ||
              "Transform image with artistic style, maintain composition",
            strength: strength,
            num_inference_steps: 28,
            guidance_scale: 3.5,
          },
          logs: true,
        });

        const outputUrl = result?.images?.[0]?.url || result?.image?.url;

        if (!outputUrl) {
          return { success: false, error: "No output image returned" };
        }

        return { success: true, url: outputUrl };
      } catch (error) {
        logger.error("FAL style transfer error", { error });
        return { success: false, error: "Failed to transfer style" };
      }
    },
  };
}
