/**
 * Luma Dream Machine Video Generator
 * Implements the IVideoGenerator interface for Luma's API
 *
 * API Reference: https://lumalabs.ai/dream-machine/api
 */

import {
  type IVideoGenerator,
  type VideoGeneratorService,
  type VideoGeneratorCapabilities,
  type VideoGeneratorResponse,
  type TextToVideoRequest,
  type ImageToVideoRequest,
  type VideoJobStatus,
} from "./types";

export type LumaModel = "dream-machine" | "dream-machine-1.5";

const LUMA_API_BASE = "https://api.lumalabs.ai/dream-machine/v1";

const LUMA_CAPABILITIES: VideoGeneratorCapabilities = {
  supportedModes: ["text-to-video", "image-to-video"],
  supportedDurations: [5, 10],
  supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
  supportedResolutions: ["720p", "1080p"],
  maxPromptLength: 2000,
  supportsAudio: false,
  supportsNegativePrompt: false,
  isAsync: true,
  models: ["dream-machine", "dream-machine-1.5"],
};

const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLING_TIME = 600000; // 10 minutes

/**
 * Luma Dream Machine Video Generator implementation
 */
export class LumaVideoGenerator implements IVideoGenerator {
  private apiKey: string;
  private model: LumaModel;

  constructor(apiKey: string, model: LumaModel = "dream-machine") {
    if (!apiKey) {
      throw new Error("API key is required for Luma generator");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Generate video from text prompt
   */
  async generateTextToVideo(
    request: TextToVideoRequest
  ): Promise<VideoGeneratorResponse> {
    try {
      const response = await fetch(`${LUMA_API_BASE}/generations`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: request.prompt,
          aspect_ratio: request.aspectRatio || "16:9",
          loop: false,
          callback_url: null,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Luma API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const generationId = data.id;

      // Poll for completion
      return await this.waitForCompletion(generationId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate video";
      throw new Error(`Luma generation failed: ${message}`);
    }
  }

  /**
   * Generate video from image
   */
  async generateImageToVideo(
    request: ImageToVideoRequest
  ): Promise<VideoGeneratorResponse> {
    if (!request.imageUrl) {
      throw new Error("Image URL is required for image-to-video generation");
    }

    try {
      const keyframes: Record<string, { type: string; url: string }> = {
        frame0: {
          type: "image",
          url: request.imageUrl,
        },
      };

      // If end image is provided, add it as the last frame
      if (request.endImageUrl) {
        keyframes["frame1"] = {
          type: "image",
          url: request.endImageUrl,
        };
      }

      const response = await fetch(`${LUMA_API_BASE}/generations`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: request.prompt,
          aspect_ratio: request.aspectRatio || "16:9",
          keyframes,
          loop: false,
          callback_url: null,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Luma API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const generationId = data.id;

      // Poll for completion
      return await this.waitForCompletion(generationId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate video";
      throw new Error(`Luma generation failed: ${message}`);
    }
  }

  /**
   * Poll for video completion
   */
  private async waitForCompletion(
    generationId: string
  ): Promise<VideoGeneratorResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < MAX_POLLING_TIME) {
      const response = await fetch(
        `${LUMA_API_BASE}/generations/${generationId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to check generation status: ${response.status}`);
      }

      const data = await response.json();

      if (data.state === "completed") {
        if (data.assets?.video) {
          return {
            success: true,
            video: {
              url: data.assets.video,
              thumbnailUrl: data.assets.thumbnail,
            },
            videoUrl: data.assets.video,
            jobId: generationId,
          };
        }
        throw new Error("Video completed but no URL returned");
      }

      if (data.state === "failed") {
        throw new Error(
          `Video generation failed: ${data.failure_reason || "Unknown error"}`
        );
      }

      // Wait before polling again
      await this.sleep(POLLING_INTERVAL);
    }

    throw new Error("Video generation timed out");
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<VideoJobStatus> {
    try {
      const response = await fetch(
        `${LUMA_API_BASE}/generations/${jobId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.status}`);
      }

      const data = await response.json();

      switch (data.state) {
        case "completed":
          return {
            status: "completed",
            video: data.assets?.video
              ? { url: data.assets.video, thumbnailUrl: data.assets.thumbnail }
              : undefined,
          };
        case "failed":
          return {
            status: "failed",
            error: data.failure_reason || "Unknown error",
          };
        case "processing":
        case "dreaming":
          return {
            status: "processing",
          };
        default:
          return { status: "pending" };
      }
    } catch (error) {
      return {
        status: "failed",
        error: error instanceof Error ? error.message : "Failed to get status",
      };
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get generator capabilities
   */
  getCapabilities(): VideoGeneratorCapabilities {
    return LUMA_CAPABILITIES;
  }

  /**
   * Get service type
   */
  getService(): VideoGeneratorService {
    return "luma";
  }

  /**
   * Get current model
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Set the model to use
   */
  setModel(model: string): void {
    if (!["dream-machine", "dream-machine-1.5"].includes(model)) {
      throw new Error(
        `Unknown Luma model: ${model}. Supported: dream-machine, dream-machine-1.5`
      );
    }
    this.model = model as LumaModel;
  }
}

/**
 * Create a new Luma video generator
 */
export function createLumaVideoGenerator(
  apiKey: string,
  model: LumaModel = "dream-machine"
): LumaVideoGenerator {
  return new LumaVideoGenerator(apiKey, model);
}
