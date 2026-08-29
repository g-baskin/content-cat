/**
 * Pika Video Generator
 * Implements the IVideoGenerator interface for Pika's API
 *
 * API Reference: https://pika.art/api
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

export type PikaModel = "pika-2.0" | "pika-1.5";

const PIKA_API_BASE = "https://api.pika.art/v2";

const PIKA_CAPABILITIES: VideoGeneratorCapabilities = {
  supportedModes: ["text-to-video", "image-to-video"],
  supportedDurations: [3, 4, 5],
  supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
  supportedResolutions: ["720p", "1080p"],
  maxPromptLength: 2000,
  supportsAudio: false,
  supportsNegativePrompt: true,
  isAsync: true,
  models: ["pika-2.0", "pika-1.5"],
};

const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLING_TIME = 600000; // 10 minutes

/**
 * Pika Video Generator implementation
 */
export class PikaVideoGenerator implements IVideoGenerator {
  private apiKey: string;
  private model: PikaModel;

  constructor(apiKey: string, model: PikaModel = "pika-2.0") {
    if (!apiKey) {
      throw new Error("API key is required for Pika generator");
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
      const response = await fetch(`${PIKA_API_BASE}/generate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: request.prompt,
          negative_prompt: request.negativePrompt,
          duration: request.duration || 4,
          aspect_ratio: request.aspectRatio || "16:9",
          fps: 24,
          seed: request.seed,
          motion: "normal", // normal, slow, fast
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pika API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const taskId = data.id;

      // Poll for completion
      return await this.waitForCompletion(taskId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate video";
      throw new Error(`Pika generation failed: ${message}`);
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
      const response = await fetch(`${PIKA_API_BASE}/animate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          image_url: request.imageUrl,
          prompt: request.prompt,
          negative_prompt: request.negativePrompt,
          duration: request.duration || 4,
          fps: 24,
          seed: request.seed,
          motion_strength: request.strength || 0.5,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pika API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const taskId = data.id;

      // Poll for completion
      return await this.waitForCompletion(taskId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate video";
      throw new Error(`Pika generation failed: ${message}`);
    }
  }

  /**
   * Poll for video completion
   */
  private async waitForCompletion(
    taskId: string
  ): Promise<VideoGeneratorResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < MAX_POLLING_TIME) {
      const response = await fetch(`${PIKA_API_BASE}/task/${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check task status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "completed") {
        if (data.video_url) {
          return {
            success: true,
            video: {
              url: data.video_url,
              duration: data.duration,
            },
            videoUrl: data.video_url,
            seed: data.seed,
            jobId: taskId,
          };
        }
        throw new Error("Video completed but no URL returned");
      }

      if (data.status === "failed") {
        throw new Error(
          `Video generation failed: ${data.error || "Unknown error"}`
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
      const response = await fetch(`${PIKA_API_BASE}/task/${jobId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.status}`);
      }

      const data = await response.json();

      switch (data.status) {
        case "completed":
          return {
            status: "completed",
            video: data.video_url ? { url: data.video_url } : undefined,
          };
        case "failed":
          return {
            status: "failed",
            error: data.error || "Unknown error",
          };
        case "processing":
          return {
            status: "processing",
            progress: data.progress,
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
    return PIKA_CAPABILITIES;
  }

  /**
   * Get service type
   */
  getService(): VideoGeneratorService {
    return "pika";
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
    if (!["pika-2.0", "pika-1.5"].includes(model)) {
      throw new Error(
        `Unknown Pika model: ${model}. Supported: pika-2.0, pika-1.5`
      );
    }
    this.model = model as PikaModel;
  }
}

/**
 * Create a new Pika video generator
 */
export function createPikaVideoGenerator(
  apiKey: string,
  model: PikaModel = "pika-2.0"
): PikaVideoGenerator {
  return new PikaVideoGenerator(apiKey, model);
}
