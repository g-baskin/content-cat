/**
 * FAL.ai Image Generator
 * Implements the IImageGenerator interface for FAL.ai service
 */

import {
  createNanoBananaProClient,
  createSeedream45Client,
  type NanoBananaProAspectRatio,
  type NanoBananaProResolution,
  type NanoBananaProOutputFormat,
  type Seedream45AspectRatio,
  type Seedream45OutputFormat,
} from "@/lib/fal";
import {
  type IImageGenerator,
  type GeneratorService,
  type BaseGenerationRequest,
  type BaseEditRequest,
  type GeneratorResponse,
  type GeneratorCapabilities,
} from "./types";
import { parseFalError } from "./errors";

const FAL_CAPABILITIES: GeneratorCapabilities = {
  supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "9:21"],
  supportedFormats: ["png", "jpeg", "webp"],
  maxImages: 6,
  maxReferenceImages: 14,
  supportsWebSearch: true,
  supportsEditing: true,
  isAsync: false,
  models: ["nano-banana-pro", "seedream-4.5"],
};

/**
 * FAL Generator implementation
 */
export class FalGenerator implements IImageGenerator {
  private apiKey: string;
  private model: "nano-banana-pro" | "seedream-4.5";

  constructor(apiKey: string, model: "nano-banana-pro" | "seedream-4.5" = "nano-banana-pro") {
    if (!apiKey) {
      throw new Error("API key is required for FAL generator");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Generate image from text prompt
   */
  async generateImage(request: BaseGenerationRequest): Promise<GeneratorResponse> {
    try {
      if (this.model === "seedream-4.5") {
        return this.generateImageSeedream(request);
      } else {
        return this.generateImageNanoBanana(request);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate image";
      const parsed = parseFalError(message);
      throw new Error(`${parsed.error} (${parsed.code})`);
    }
  }

  /**
   * Edit image with reference images
   */
  async editImage(request: BaseEditRequest): Promise<GeneratorResponse> {
    try {
      if (this.model === "seedream-4.5") {
        return this.editImageSeedream(request);
      } else {
        return this.editImageNanoBanana(request);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to edit image";
      const parsed = parseFalError(message);
      throw new Error(`${parsed.error} (${parsed.code})`);
    }
  }

  /**
   * Get generator capabilities
   */
  getCapabilities(): GeneratorCapabilities {
    return FAL_CAPABILITIES;
  }

  /**
   * Get service type
   */
  getService(): GeneratorService {
    return "fal";
  }

  /**
   * Set the model to use
   */
  setModel(model: "nano-banana-pro" | "seedream-4.5"): void {
    this.model = model;
  }

  /**
   * Get current model
   */
  getModel(): string {
    return this.model;
  }

  // Private methods for specific models

  private async generateImageNanoBanana(
    request: BaseGenerationRequest
  ): Promise<GeneratorResponse> {
    const client = createNanoBananaProClient(this.apiKey);

    const result = await client.generateImage({
      prompt: request.prompt,
      aspect_ratio: (request.aspectRatio || "1:1") as NanoBananaProAspectRatio,
      resolution: (request.outputFormat === "webp" ? "1K" : "1K") as NanoBananaProResolution,
      output_format: (request.outputFormat || "png") as NanoBananaProOutputFormat,
      num_images: request.numImages || 1,
      enable_safety_checker: request.enableSafetyChecker ?? true,
    });

    return {
      success: true,
      images: result.images,
      resultUrls: result.images.map((img) => img.url),
      description: result.description,
      seed: result.seed,
    };
  }

  private async editImageNanoBanana(
    request: BaseEditRequest
  ): Promise<GeneratorResponse> {
    const client = createNanoBananaProClient(this.apiKey);

    const result = await client.editImage({
      prompt: request.prompt,
      image_urls: request.imageUrls,
      aspect_ratio: (request.aspectRatio || "auto") as NanoBananaProAspectRatio,
      resolution: "1K" as NanoBananaProResolution,
      output_format: (request.outputFormat || "png") as NanoBananaProOutputFormat,
      num_images: request.numImages || 1,
      enable_safety_checker: request.enableSafetyChecker ?? true,
    });

    return {
      success: true,
      images: result.images,
      resultUrls: result.images.map((img) => img.url),
      description: result.description,
      seed: result.seed,
    };
  }

  private async generateImageSeedream(
    request: BaseGenerationRequest
  ): Promise<GeneratorResponse> {
    const client = createSeedream45Client(this.apiKey);

    const result = await client.generateImage({
      prompt: request.prompt,
      aspect_ratio: (request.aspectRatio || "1:1") as Seedream45AspectRatio,
      output_format: (request.outputFormat || "png") as Seedream45OutputFormat,
      num_images: request.numImages || 1,
      enable_safety_checker: request.enableSafetyChecker ?? true,
      seed: request.seed,
    });

    return {
      success: true,
      images: result.images,
      resultUrls: result.images.map((img) => img.url),
      seed: result.seed,
    };
  }

  private async editImageSeedream(
    request: BaseEditRequest
  ): Promise<GeneratorResponse> {
    const client = createSeedream45Client(this.apiKey);

    const result = await client.editImage({
      prompt: request.prompt,
      image_urls: request.imageUrls,
      aspect_ratio: (request.aspectRatio || "1:1") as Seedream45AspectRatio,
      output_format: (request.outputFormat || "png") as Seedream45OutputFormat,
      num_images: request.numImages || 1,
      enable_safety_checker: request.enableSafetyChecker ?? true,
      strength: request.strength,
      seed: request.seed,
    });

    return {
      success: true,
      images: result.images,
      resultUrls: result.images.map((img) => img.url),
      seed: result.seed,
    };
  }
}
