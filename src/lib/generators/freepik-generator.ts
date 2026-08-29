/**
 * Freepik Image Generator
 * Implements the IImageGenerator interface for Freepik API
 * Note: Freepik is async-based, so this implementation handles polling
 */

import {
  type IImageGenerator,
  type GeneratorService,
  type BaseGenerationRequest,
  type BaseEditRequest,
  type GeneratorResponse,
  type GeneratorCapabilities,
} from "./types";
import type { FreepikModel, FreepikGenerationRequest, FreepikTaskResponse, FreepikTaskStatusResponse } from "./freepik-types";

const FREEPIK_CAPABILITIES: GeneratorCapabilities = {
  supportedAspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16"],
  supportedFormats: ["png", "jpeg"],
  maxImages: 4,
  maxReferenceImages: 0,
  supportsWebSearch: false,
  supportsEditing: false,
  isAsync: true,
  models: ["realism", "fluid", "zen", "flexible", "super_real", "editorial_portraits"],
};

const FREEPIK_API_BASE = "https://api.freepik.com/v1/ai";
const POLLING_TIMEOUT = 600000; // 10 minutes
const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLING_ATTEMPTS = POLLING_TIMEOUT / POLLING_INTERVAL;

/**
 * Freepik Generator implementation
 */
export class FreepikGenerator implements IImageGenerator {
  private apiKey: string;
  private model: FreepikModel;
  private pollingAttempts = 0;

  constructor(apiKey: string, model: FreepikModel = "flux-dev") {
    if (!apiKey) {
      throw new Error("API key is required for Freepik generator");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Generate image from text prompt
   */
  async generateImage(request: BaseGenerationRequest): Promise<GeneratorResponse> {
    try {
      const submitRequest = this.mapToFreepikRequest(request);
      const taskResponse = await this.submitJob(submitRequest);

      // Poll for completion using task_id
      const jobId = taskResponse.data.task_id;
      const result = await this.waitForCompletion(jobId);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate image";
      throw new Error(`Freepik generation failed: ${message}`);
    }
  }

  /**
   * Edit image with reference images
   * Currently not supported by Freepik API
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async editImage(_request: BaseEditRequest): Promise<GeneratorResponse> {
    throw new Error("Image editing is not supported by Freepik API");
  }

  /**
   * Get generator capabilities
   */
  getCapabilities(): GeneratorCapabilities {
    return FREEPIK_CAPABILITIES;
  }

  /**
   * Get service type
   */
  getService(): GeneratorService {
    return "freepik";
  }

  /**
   * Poll job status (private - used internally for polling)
   */
  private async pollJobStatus(jobId: string): Promise<FreepikTaskStatusResponse> {
    const endpoint = this.getFreepikEndpoint();
    const response = await fetch(`${FREEPIK_API_BASE}${endpoint}/${jobId}`, {
      method: "GET",
      headers: {
        "x-freepik-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to poll job status: ${error}`);
    }

    return response.json();
  }

  /**
   * Set the model to use
   */
  setModel(model: FreepikModel): void {
    this.model = model;
  }

  /**
   * Get current model
   */
  getModel(): string {
    return this.model;
  }

  // Private methods

  /**
   * Map standardized request to Freepik-specific format
   */
  private mapToFreepikRequest(request: BaseGenerationRequest): FreepikGenerationRequest {
    // Map standard aspect ratios to Freepik format
    const aspectRatioMap: Record<string, string> = {
      "1:1": "square_1_1",
      "auto": "square_1_1",
      "16:9": "widescreen_16_9",
      "9:16": "social_story_9_16",
      "4:3": "classic_4_3",
      "3:4": "traditional_3_4",
      "3:2": "social_landscape_3_2",
      "2:3": "social_portrait_2_3",
    };

    const freepikAspectRatio = aspectRatioMap[request.aspectRatio || "1:1"] || "square_1_1";

    // For Mystic models, include the model parameter
    if (this.isMysticModel()) {
      return {
        prompt: request.prompt,
        model: this.model,
        aspect_ratio: freepikAspectRatio,
        num_images: request.numImages || 1,
      };
    }

    // For text-to-image endpoints (Flux, Seedream, etc.)
    return {
      prompt: request.prompt,
      aspect_ratio: freepikAspectRatio,
      num_images: request.numImages || 1,
    };
  }

  /**
   * Submit a job to Freepik API
   */
  private async submitJob(request: FreepikGenerationRequest): Promise<FreepikTaskResponse> {
    const endpoint = this.getFreepikEndpoint();
    const fullUrl = `${FREEPIK_API_BASE}${endpoint}`;

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "x-freepik-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      // Check for access denied errors (could be API key issue or content filter)
      if (error.includes("Access Denied")) {
        // Check if it's likely a content filter issue (403 from CDN)
        if (response.status === 403 && error.includes("html")) {
          throw new Error("Your prompt was blocked by Freepik's content filter. Try a different prompt.");
        }
        throw new Error(`Your API key doesn't have access to the "${this.model}" model. Try a different model or upgrade your Freepik plan.`);
      }
      throw new Error(`Freepik API error (${this.model}): ${response.status} - ${error.substring(0, 200)}`);
    }

    const data: FreepikTaskResponse = await response.json();
    return data;
  }

  /**
   * Get the appropriate Freepik endpoint based on model
   */
  private getFreepikEndpoint(): string {
    // Map models to their specific endpoints
    const endpointMap: Record<string, string> = {
      // Text-to-image endpoints
      "flux-dev": "/text-to-image/flux-dev",
      "flux-pro": "/text-to-image/flux-pro-v1-1",
      "seedream-v4": "/text-to-image/seedream-v4",
      "hyperflux": "/text-to-image/hyperflux",
      // Mystic endpoint models
      "realism": "/mystic",
      "fluid": "/mystic",
      "zen": "/mystic",
      "flexible": "/mystic",
      "super_real": "/mystic",
      "editorial_portraits": "/mystic",
    };

    return endpointMap[this.model] || "/text-to-image/flux-dev";
  }

  /**
   * Check if the model uses the Mystic endpoint
   */
  private isMysticModel(): boolean {
    return ["realism", "fluid", "zen", "flexible", "super_real", "editorial_portraits"].includes(this.model);
  }

  /**
   * Wait for job completion with polling
   */
  private async waitForCompletion(jobId: string): Promise<GeneratorResponse> {
    const startTime = Date.now();
    this.pollingAttempts = 0;

    while (this.pollingAttempts < MAX_POLLING_ATTEMPTS) {
      try {
        const response = await this.pollJobStatus(jobId);
        const task = response.data;

        // Check if completed
        if (task.status === "COMPLETED" || task.status === "completed") {
          // Handle both string arrays and object arrays for generated images
          let images: Array<{ url: string; width?: number; height?: number }> = [];

          if (task.result?.images) {
            images = task.result.images;
          } else if (task.generated && task.generated.length > 0) {
            images = task.generated.map((img) => {
              if (typeof img === "string") {
                return { url: img };
              }
              return img;
            });
          }

          if (images.length > 0) {
            return {
              success: true,
              images: images.map((img) => ({
                url: img.url,
                width: img.width,
                height: img.height,
              })),
              resultUrls: images.map((img) => img.url),
              jobId: task.task_id,
            };
          }
        }

        // Check if failed
        if (task.status === "FAILED" || task.status === "failed") {
          throw new Error(`Job failed: ${task.error?.message || "Unknown error"}`);
        }

        // Still processing, wait and retry
        await this.sleep(POLLING_INTERVAL);
        this.pollingAttempts++;
      } catch (error) {
        // If not a job status error, retry
        if (error instanceof Error && !error.message.includes("Failed to poll")) {
          throw error;
        }
        await this.sleep(POLLING_INTERVAL);
        this.pollingAttempts++;
      }

      // Check timeout
      if (Date.now() - startTime > POLLING_TIMEOUT) {
        throw new Error("Generation took too long. Try again.");
      }
    }

    throw new Error("Generation polling timeout");
  }

  /**
   * Sleep utility for polling delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
