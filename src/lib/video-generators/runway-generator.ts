/**
 * Runway Gen-3 Video Generator
 * Implements the IVideoGenerator interface for Runway's Gen-3 Alpha API
 *
 * API Reference: https://docs.runwayml.com/
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

export type RunwayModel = "gen-3-alpha" | "gen-3-alpha-turbo";

const RUNWAY_API_BASE = "https://api.runwayml.com/v1";

const RUNWAY_CAPABILITIES: VideoGeneratorCapabilities = {
  supportedModes: ["text-to-video", "image-to-video"],
  supportedDurations: [5, 10],
  supportedAspectRatios: ["16:9", "9:16", "1:1"],
  supportedResolutions: ["720p", "1080p"],
  maxPromptLength: 2000,
  supportsAudio: false,
  supportsNegativePrompt: false,
  isAsync: true,
  models: ["gen-3-alpha", "gen-3-alpha-turbo"],
};

const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLING_TIME = 600000; // 10 minutes

/**
 * Runway Gen-3 Video Generator implementation
 */
export class RunwayVideoGenerator implements IVideoGenerator {
  private apiKey: string;
  private model: RunwayModel;

  constructor(apiKey: string, model: RunwayModel = "gen-3-alpha") {
    if (!apiKey) {
      throw new Error("API key is required for Runway generator");
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
      // Create generation task
      const response = await fetch(`${RUNWAY_API_BASE}/generation`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "X-Runway-Version": "2024-09-13",
        },
        body: JSON.stringify({
          model: this.model,
          promptText: request.prompt,
          duration: request.duration || 5,
          ratio: this.mapAspectRatio(request.aspectRatio),
          resolution: request.resolution || "720p",
          seed: request.seed,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Runway API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const taskId = data.id;

      // Poll for completion
      return await this.waitForCompletion(taskId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate video";
      throw new Error(`Runway generation failed: ${message}`);
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
      // Create generation task with image
      const response = await fetch(`${RUNWAY_API_BASE}/generation`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "X-Runway-Version": "2024-09-13",
        },
        body: JSON.stringify({
          model: this.model,
          promptText: request.prompt,
          promptImage: request.imageUrl,
          duration: request.duration || 5,
          ratio: this.mapAspectRatio(request.aspectRatio),
          resolution: request.resolution || "720p",
          seed: request.seed,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Runway API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const taskId = data.id;

      // Poll for completion
      return await this.waitForCompletion(taskId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate video";
      throw new Error(`Runway generation failed: ${message}`);
    }
  }

  /**
   * Map aspect ratio to Runway format
   */
  private mapAspectRatio(ratio?: string): string {
    switch (ratio) {
      case "16:9":
        return "16:9";
      case "9:16":
        return "9:16";
      case "1:1":
        return "1:1";
      default:
        return "16:9";
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
      const response = await fetch(`${RUNWAY_API_BASE}/tasks/${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "X-Runway-Version": "2024-09-13",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check task status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "SUCCEEDED") {
        if (data.output?.url) {
          return {
            success: true,
            video: {
              url: data.output.url,
            },
            videoUrl: data.output.url,
            jobId: taskId,
          };
        }
        throw new Error("Video completed but no URL returned");
      }

      if (data.status === "FAILED") {
        throw new Error(
          `Video generation failed: ${data.failure || "Unknown error"}`
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
      const response = await fetch(`${RUNWAY_API_BASE}/tasks/${jobId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "X-Runway-Version": "2024-09-13",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.status}`);
      }

      const data = await response.json();

      switch (data.status) {
        case "SUCCEEDED":
          return {
            status: "completed",
            video: data.output?.url ? { url: data.output.url } : undefined,
          };
        case "FAILED":
          return {
            status: "failed",
            error: data.failure || "Unknown error",
          };
        case "RUNNING":
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
    return RUNWAY_CAPABILITIES;
  }

  /**
   * Get service type
   */
  getService(): VideoGeneratorService {
    return "runway";
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
    if (!["gen-3-alpha", "gen-3-alpha-turbo"].includes(model)) {
      throw new Error(
        `Unknown Runway model: ${model}. Supported: gen-3-alpha, gen-3-alpha-turbo`
      );
    }
    this.model = model as RunwayModel;
  }
}

/**
 * Create a new Runway video generator
 */
export function createRunwayVideoGenerator(
  apiKey: string,
  model: RunwayModel = "gen-3-alpha"
): RunwayVideoGenerator {
  return new RunwayVideoGenerator(apiKey, model);
}
