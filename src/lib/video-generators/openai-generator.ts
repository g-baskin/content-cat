/**
 * OpenAI Sora Video Generator
 * Implements the IVideoGenerator interface for OpenAI's Sora API
 * Models: sora-2 (fast), sora-2-pro (high quality)
 */

import OpenAI from "openai";
import {
  type IVideoGenerator,
  type VideoGeneratorService,
  type VideoGeneratorCapabilities,
  type VideoGeneratorResponse,
  type TextToVideoRequest,
  type ImageToVideoRequest,
  type VideoJobStatus,
} from "./types";

export type SoraModel = "sora-2" | "sora-2-pro";

// OpenAI uses specific duration values
type SoraDuration = "4" | "8" | "12";

// OpenAI uses specific size values (width x height)
type SoraSize = "720x1280" | "1280x720" | "1024x1792" | "1792x1024";

const SORA_CAPABILITIES: VideoGeneratorCapabilities = {
  supportedModes: ["text-to-video", "image-to-video"],
  supportedDurations: [4, 8, 12], // seconds
  supportedAspectRatios: ["16:9", "9:16"],
  supportedResolutions: ["720p", "1080p"],
  maxPromptLength: 4000,
  supportsAudio: true,
  supportsNegativePrompt: false,
  isAsync: true,
  models: ["sora-2", "sora-2-pro"],
};

const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLING_TIME = 600000; // 10 minutes

/**
 * OpenAI Sora Video Generator implementation
 */
export class OpenAIVideoGenerator implements IVideoGenerator {
  private client: OpenAI;
  private model: SoraModel;

  constructor(apiKey: string, model: SoraModel = "sora-2") {
    if (!apiKey) {
      throw new Error("API key is required for OpenAI Sora generator");
    }
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * Generate video from text prompt
   */
  async generateTextToVideo(
    request: TextToVideoRequest
  ): Promise<VideoGeneratorResponse> {
    try {
      // Map duration to Sora format
      const seconds = this.mapDuration(request.duration);
      // Map aspect ratio to Sora size format
      const size = this.mapAspectRatioToSize(request.aspectRatio);

      // Create video generation request
      const response = await this.client.videos.create({
        model: this.model,
        prompt: request.prompt,
        seconds,
        size,
      });

      // Poll for completion
      const result = await this.waitForCompletion(response.id);
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate video";
      throw new Error(`OpenAI Sora generation failed: ${message}`);
    }
  }

  /**
   * Generate video from image
   * Note: OpenAI uses input_reference for image input which requires file upload
   */
  async generateImageToVideo(
    request: ImageToVideoRequest
  ): Promise<VideoGeneratorResponse> {
    if (!request.imageUrl) {
      throw new Error("Image URL is required for image-to-video generation");
    }

    try {
      // Map duration to Sora format
      const seconds = this.mapDuration(request.duration);
      // Map aspect ratio to Sora size format
      const size = this.mapAspectRatioToSize(request.aspectRatio);

      // For image-to-video, we need to fetch the image and pass it as a file
      // OpenAI's input_reference accepts Uploadable (File, Blob, etc.)
      const imageResponse = await fetch(request.imageUrl);
      const imageBlob = await imageResponse.blob();
      const imageFile = new File([imageBlob], "input.png", {
        type: imageBlob.type || "image/png",
      });

      // Create video generation request with image reference
      const response = await this.client.videos.create({
        model: this.model,
        prompt: request.prompt,
        seconds,
        size,
        input_reference: imageFile,
      });

      // Poll for completion
      const result = await this.waitForCompletion(response.id);
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate video";
      throw new Error(`OpenAI Sora generation failed: ${message}`);
    }
  }

  /**
   * Map duration in seconds to Sora format
   */
  private mapDuration(duration?: number): SoraDuration {
    if (!duration || duration <= 4) return "4";
    if (duration <= 8) return "8";
    return "12";
  }

  /**
   * Map aspect ratio to Sora size format
   */
  private mapAspectRatioToSize(ratio?: string): SoraSize {
    switch (ratio) {
      case "9:16":
        return "720x1280"; // Portrait
      case "16:9":
      default:
        return "1280x720"; // Landscape
    }
  }

  /**
   * Poll for video completion
   */
  private async waitForCompletion(
    jobId: string
  ): Promise<VideoGeneratorResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < MAX_POLLING_TIME) {
      const video = await this.client.videos.retrieve(jobId);

      if (video.status === "completed") {
        // Download the video content to get the URL
        // OpenAI returns a Response object that we need to handle
        const videoContent = await this.client.videos.downloadContent(jobId, {
          variant: "video",
        });

        // The response is a ReadableStream, we need to get the URL from headers
        // or construct a blob URL
        const videoUrl = videoContent.url;

        return {
          success: true,
          video: {
            url: videoUrl,
            duration: parseInt(video.seconds),
          },
          videoUrl: videoUrl,
          jobId,
        };
      }

      if (video.status === "failed") {
        const errorMessage = video.error?.message || "Unknown error";
        throw new Error(`Video generation failed: ${errorMessage}`);
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
      const video = await this.client.videos.retrieve(jobId);

      switch (video.status) {
        case "completed": {
          // Get the video URL
          const videoContent = await this.client.videos.downloadContent(
            jobId,
            { variant: "video" }
          );
          return {
            status: "completed",
            video: { url: videoContent.url },
            progress: 100,
          };
        }
        case "failed":
          return {
            status: "failed",
            error: video.error?.message || "Unknown error",
          };
        case "in_progress":
          return {
            status: "processing",
            progress: video.progress,
          };
        case "queued":
        default:
          return {
            status: "pending",
            progress: 0,
          };
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
    return SORA_CAPABILITIES;
  }

  /**
   * Get service type
   */
  getService(): VideoGeneratorService {
    return "openai";
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
    if (!["sora-2", "sora-2-pro"].includes(model)) {
      throw new Error(
        `Unknown Sora model: ${model}. Supported: sora-2, sora-2-pro`
      );
    }
    this.model = model as SoraModel;
  }
}

/**
 * Create a new OpenAI Sora video generator
 */
export function createOpenAIVideoGenerator(
  apiKey: string,
  model: SoraModel = "sora-2"
): OpenAIVideoGenerator {
  return new OpenAIVideoGenerator(apiKey, model);
}
