/**
 * FAL.ai Video Generator
 * Implements the IVideoGenerator interface for FAL.ai models
 * Supports: Kling 2.6, Kling 2.5 Turbo, Wan 2.6, Veo 3.1
 */

import {
  type IVideoGenerator,
  type VideoGeneratorService,
  type VideoGeneratorCapabilities,
  type VideoGeneratorResponse,
  type TextToVideoRequest,
  type ImageToVideoRequest,
  type FirstLastFrameRequest,
  type VideoJobStatus,
} from "./types";
import {
  createKling26Client,
  createKling25TurboClient,
  createWan26Client,
  createVeo31Client,
  type Kling26Client,
  type Kling25TurboClient,
  type Wan26Client,
  type Veo31Client,
} from "@/lib/fal";

export type FalVideoModel =
  | "kling-2.6"
  | "kling-2.5-turbo"
  | "wan-2.6"
  | "veo-3.1";

const FAL_CAPABILITIES: Record<FalVideoModel, VideoGeneratorCapabilities> = {
  "kling-2.6": {
    supportedModes: ["text-to-video", "image-to-video"],
    supportedDurations: [5, 10],
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportedResolutions: [],
    maxPromptLength: 2500,
    supportsAudio: true,
    supportsNegativePrompt: true,
    isAsync: true,
    models: ["kling-2.6"],
  },
  "kling-2.5-turbo": {
    supportedModes: ["text-to-video", "image-to-video"],
    supportedDurations: [5, 10],
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportedResolutions: [],
    maxPromptLength: 2500,
    supportsAudio: false,
    supportsNegativePrompt: true,
    isAsync: true,
    models: ["kling-2.5-turbo"],
  },
  "wan-2.6": {
    supportedModes: ["text-to-video", "image-to-video"],
    supportedDurations: [5, 10, 15],
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    supportedResolutions: ["720p", "1080p"],
    maxPromptLength: 2500,
    supportsAudio: false,
    supportsNegativePrompt: true,
    isAsync: true,
    models: ["wan-2.6"],
  },
  "veo-3.1": {
    supportedModes: ["image-to-video", "first-last-frame"],
    supportedDurations: [4, 6, 8],
    supportedAspectRatios: ["auto", "16:9", "9:16", "1:1"],
    supportedResolutions: ["720p", "1080p"],
    maxPromptLength: 5000,
    supportsAudio: true,
    supportsNegativePrompt: false,
    isAsync: true,
    models: ["veo-3.1"],
  },
};

/**
 * FAL.ai Video Generator implementation
 */
export class FalVideoGenerator implements IVideoGenerator {
  private apiKey: string;
  private model: FalVideoModel;
  private kling26Client: Kling26Client | null = null;
  private kling25TurboClient: Kling25TurboClient | null = null;
  private wan26Client: Wan26Client | null = null;
  private veo31Client: Veo31Client | null = null;

  constructor(apiKey: string, model: FalVideoModel = "kling-2.6") {
    if (!apiKey) {
      throw new Error("API key is required for FAL.ai video generator");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Get or create the appropriate client for the current model
   */
  private getClient(): Kling26Client | Kling25TurboClient | Wan26Client | Veo31Client {
    switch (this.model) {
      case "kling-2.6":
        if (!this.kling26Client) {
          this.kling26Client = createKling26Client(this.apiKey);
        }
        return this.kling26Client;
      case "kling-2.5-turbo":
        if (!this.kling25TurboClient) {
          this.kling25TurboClient = createKling25TurboClient(this.apiKey);
        }
        return this.kling25TurboClient;
      case "wan-2.6":
        if (!this.wan26Client) {
          this.wan26Client = createWan26Client(this.apiKey);
        }
        return this.wan26Client;
      case "veo-3.1":
        if (!this.veo31Client) {
          this.veo31Client = createVeo31Client(this.apiKey);
        }
        return this.veo31Client;
      default:
        throw new Error(`Unknown model: ${this.model}`);
    }
  }

  /**
   * Generate video from text prompt
   */
  async generateTextToVideo(
    request: TextToVideoRequest
  ): Promise<VideoGeneratorResponse> {
    const capabilities = this.getCapabilities();
    if (!capabilities.supportedModes.includes("text-to-video")) {
      throw new Error(`Text-to-video is not supported by ${this.model}`);
    }

    try {
      switch (this.model) {
        case "kling-2.6": {
          const client = this.getClient() as Kling26Client;
          const result = await client.generateTextToVideo({
            prompt: request.prompt,
            duration: String(request.duration || 5) as "5" | "10",
            aspect_ratio: (request.aspectRatio || "16:9") as "16:9" | "9:16" | "1:1",
            negative_prompt: request.negativePrompt,
            cfg_scale: request.cfgScale,
            generate_audio: request.enableAudio,
            seed: request.seed,
          });
          return this.formatResponse(result);
        }

        case "kling-2.5-turbo": {
          const client = this.getClient() as Kling25TurboClient;
          const result = await client.generateTextToVideo({
            prompt: request.prompt,
            duration: String(request.duration || 5) as "5" | "10",
            aspect_ratio: (request.aspectRatio || "16:9") as "16:9" | "9:16" | "1:1",
            negative_prompt: request.negativePrompt,
            cfg_scale: request.cfgScale,
            seed: request.seed,
          });
          return this.formatResponse(result);
        }

        case "wan-2.6": {
          const client = this.getClient() as Wan26Client;
          const result = await client.generateTextToVideo({
            prompt: request.prompt,
            duration: String(request.duration || 5) as "5" | "10" | "15",
            aspect_ratio: (request.aspectRatio || "16:9") as
              | "16:9"
              | "9:16"
              | "1:1"
              | "4:3"
              | "3:4",
            resolution: (request.resolution || "720p") as "720p" | "1080p",
            negative_prompt: request.negativePrompt,
            seed: request.seed,
          });
          return this.formatResponse(result);
        }

        default:
          throw new Error(`Text-to-video is not supported by ${this.model}`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate video";
      throw new Error(`FAL.ai video generation failed: ${message}`);
    }
  }

  /**
   * Generate video from image
   */
  async generateImageToVideo(
    request: ImageToVideoRequest
  ): Promise<VideoGeneratorResponse> {
    const capabilities = this.getCapabilities();
    if (!capabilities.supportedModes.includes("image-to-video")) {
      throw new Error(`Image-to-video is not supported by ${this.model}`);
    }

    if (!request.imageUrl) {
      throw new Error("Image URL is required for image-to-video generation");
    }

    try {
      switch (this.model) {
        case "kling-2.6": {
          const client = this.getClient() as Kling26Client;
          const result = await client.generateImageToVideo({
            prompt: request.prompt,
            image_url: request.imageUrl,
            duration: String(request.duration || 5) as "5" | "10",
            aspect_ratio: (request.aspectRatio || "16:9") as "16:9" | "9:16" | "1:1",
            negative_prompt: request.negativePrompt,
            cfg_scale: request.cfgScale,
            generate_audio: request.enableAudio,
            last_image_url: request.endImageUrl,
            seed: request.seed,
          });
          return this.formatResponse(result);
        }

        case "kling-2.5-turbo": {
          const client = this.getClient() as Kling25TurboClient;
          const result = await client.generateImageToVideo({
            prompt: request.prompt,
            image_url: request.imageUrl,
            duration: String(request.duration || 5) as "5" | "10",
            aspect_ratio: (request.aspectRatio || "16:9") as "16:9" | "9:16" | "1:1",
            negative_prompt: request.negativePrompt,
            cfg_scale: request.cfgScale,
            tail_image_url: request.endImageUrl,
            seed: request.seed,
          });
          return this.formatResponse(result);
        }

        case "wan-2.6": {
          const client = this.getClient() as Wan26Client;
          const result = await client.generateImageToVideo({
            prompt: request.prompt,
            image_url: request.imageUrl,
            duration: String(request.duration || 5) as "5" | "10" | "15",
            aspect_ratio: (request.aspectRatio || "16:9") as
              | "16:9"
              | "9:16"
              | "1:1"
              | "4:3"
              | "3:4",
            resolution: (request.resolution || "720p") as "720p" | "1080p",
            negative_prompt: request.negativePrompt,
            seed: request.seed,
          });
          return this.formatResponse(result);
        }

        case "veo-3.1": {
          const client = this.getClient() as Veo31Client;
          const result = await client.generateImageToVideo({
            prompt: request.prompt,
            image_url: request.imageUrl,
            duration: `${request.duration || 8}s` as "4s" | "6s" | "8s",
            aspect_ratio: (request.aspectRatio || "auto") as
              | "auto"
              | "16:9"
              | "9:16"
              | "1:1",
            resolution: (request.resolution || "720p") as "720p" | "1080p",
            generate_audio: request.enableAudio ?? true,
            speed: request.speed || "standard",
          });
          return this.formatResponse(result);
        }

        default:
          throw new Error(`Image-to-video is not supported by ${this.model}`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate video";
      throw new Error(`FAL.ai video generation failed: ${message}`);
    }
  }

  /**
   * Generate video from first and last frame (Veo 3.1 only)
   */
  async generateFirstLastFrame(
    request: FirstLastFrameRequest
  ): Promise<VideoGeneratorResponse> {
    if (this.model !== "veo-3.1") {
      throw new Error(`First-last-frame mode is only supported by Veo 3.1`);
    }

    if (!request.firstFrameUrl || !request.lastFrameUrl) {
      throw new Error(
        "Both first frame and last frame URLs are required"
      );
    }

    try {
      const client = this.getClient() as Veo31Client;
      const result = await client.generateVideo({
        prompt: request.prompt,
        first_frame_url: request.firstFrameUrl,
        last_frame_url: request.lastFrameUrl,
        duration: `${request.duration || 8}s` as "4s" | "6s" | "8s",
        aspect_ratio: (request.aspectRatio || "auto") as
          | "auto"
          | "16:9"
          | "9:16"
          | "1:1",
        resolution: (request.resolution || "720p") as "720p" | "1080p",
        generate_audio: request.enableAudio ?? true,
        speed: request.speed || "standard",
      });
      return this.formatResponse(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate video";
      throw new Error(`FAL.ai video generation failed: ${message}`);
    }
  }

  /**
   * Format the FAL.ai response to standardized format
   */
  private formatResponse(result: {
    video: { url: string };
    seed?: number;
  }): VideoGeneratorResponse {
    return {
      success: true,
      video: {
        url: result.video.url,
      },
      videoUrl: result.video.url,
      seed: result.seed,
    };
  }

  /**
   * Get generator capabilities for current model
   */
  getCapabilities(): VideoGeneratorCapabilities {
    return FAL_CAPABILITIES[this.model];
  }

  /**
   * Get service type
   */
  getService(): VideoGeneratorService {
    return "fal";
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
    if (!Object.keys(FAL_CAPABILITIES).includes(model)) {
      throw new Error(
        `Unknown FAL.ai video model: ${model}. Supported: ${Object.keys(FAL_CAPABILITIES).join(", ")}`
      );
    }
    this.model = model as FalVideoModel;
    // Reset clients when model changes
    this.kling26Client = null;
    this.kling25TurboClient = null;
    this.wan26Client = null;
    this.veo31Client = null;
  }

  /**
   * Get job status - FAL.ai handles polling internally
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getJobStatus(_jobId: string): Promise<VideoJobStatus> {
    // FAL.ai uses fal.subscribe which handles polling internally
    // This method is provided for interface compatibility
    return {
      status: "completed",
    };
  }
}

/**
 * Create a new FAL.ai video generator
 */
export function createFalVideoGenerator(
  apiKey: string,
  model: FalVideoModel = "kling-2.6"
): FalVideoGenerator {
  return new FalVideoGenerator(apiKey, model);
}
