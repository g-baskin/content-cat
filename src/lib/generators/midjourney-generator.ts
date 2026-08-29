/**
 * Midjourney Image Generator
 * Implements the IImageGenerator interface for Midjourney API
 * Note: Midjourney is async-based, so this implementation handles polling
 */

import {
  type IImageGenerator,
  type GeneratorService,
  type BaseGenerationRequest,
  type BaseEditRequest,
  type GeneratorResponse,
  type GeneratorCapabilities,
} from "./types";
import { parseMidjourneyError } from "./errors";
import type {
  MidjourneyJobResponse,
  MidjourneySubmitRequest,
  MidjourneyAspectRatio,
  MidjourneyModel,
} from "./midjourney-types";

const MIDJOURNEY_CAPABILITIES: GeneratorCapabilities = {
  supportedAspectRatios: ["1-1", "3-2", "2-3", "4-3", "3-4", "16-9", "9-16", "9-21", "21-9"],
  supportedFormats: ["png", "webp"],
  maxImages: 4, // Midjourney generates 4 variations
  maxReferenceImages: 0, // Midjourney has limited image editing
  supportsWebSearch: false,
  supportsEditing: false, // Limited editing capability
  isAsync: true,
  models: ["midjourney", "niji-6"],
};

const MIDJOURNEY_API_BASE = "https://api.midjourney.com/v2";
const POLLING_TIMEOUT = 600000; // 10 minutes
const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLING_ATTEMPTS = POLLING_TIMEOUT / POLLING_INTERVAL;

/**
 * Midjourney Generator implementation
 */
export class MidjourneyGenerator implements IImageGenerator {
  private apiKey: string;
  private model: MidjourneyModel;
  private pollingAttempts = 0;

  constructor(apiKey: string, model: MidjourneyModel = "midjourney") {
    if (!apiKey) {
      throw new Error("API key is required for Midjourney generator");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Generate image from text prompt
   * Returns immediately with job ID, actual generation happens async
   */
  async generateImage(request: BaseGenerationRequest): Promise<GeneratorResponse> {
    try {
      const submitRequest = this.mapToMidjourneyRequest(request);
      const jobResponse = await this.submitJob(submitRequest);

      // Poll for completion (simplified - in production, use webhooks)
      const result = await this.waitForCompletion(jobResponse.id);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate image";
      const parsed = parseMidjourneyError(message);
      throw new Error(`${parsed.error} (${parsed.code})`);
    }
  }

  /**
   * Edit/manipulate image (limited support in Midjourney)
   * For Midjourney, this would use remix or variation endpoints
   */
  async editImage(request: BaseEditRequest): Promise<GeneratorResponse> {
    try {
      // Midjourney doesn't support traditional image editing like FAL
      // Instead, we could use remix mode with the prompt
      const submitRequest = this.mapToMidjourneyRequest(request);
      submitRequest.remix = true;

      const jobResponse = await this.submitJob(submitRequest);
      const result = await this.waitForCompletion(jobResponse.id);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to edit image";
      const parsed = parseMidjourneyError(message);
      throw new Error(`${parsed.error} (${parsed.code})`);
    }
  }

  /**
   * Get generator capabilities
   */
  getCapabilities(): GeneratorCapabilities {
    return MIDJOURNEY_CAPABILITIES;
  }

  /**
   * Get service type
   */
  getService(): GeneratorService {
    return "midjourney";
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<MidjourneyJobResponse> {
    const response = await fetch(`${MIDJOURNEY_API_BASE}/jobs/${jobId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get job status: ${error}`);
    }

    return response.json();
  }

  /**
   * Set the model to use
   */
  setModel(model: MidjourneyModel): void {
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
   * Map standardized request to Midjourney-specific format
   */
  private mapToMidjourneyRequest(request: BaseGenerationRequest): MidjourneySubmitRequest {
    const midjourneyRequest: MidjourneySubmitRequest = {
      prompt: request.prompt,
      model: this.model,
      quality: "standard",
      seed: request.seed,
    };

    // Map aspect ratio (standardized uses colons, Midjourney uses dashes)
    if (request.aspectRatio) {
      const aspectRatio = request.aspectRatio
        .replace(":", "-")
        .toLowerCase() as MidjourneyAspectRatio;
      midjourneyRequest.aspect_ratio = aspectRatio;
    }

    // Niji mode
    if (this.model === "niji-6") {
      midjourneyRequest.niji = true;
    }

    return midjourneyRequest;
  }

  /**
   * Submit a job to Midjourney API
   */
  private async submitJob(request: MidjourneySubmitRequest): Promise<MidjourneyJobResponse> {
    const response = await fetch(`${MIDJOURNEY_API_BASE}/imagine`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Midjourney API error: ${error}`);
    }

    const data: MidjourneyJobResponse = await response.json();
    return data;
  }

  /**
   * Wait for job completion with polling
   */
  private async waitForCompletion(jobId: string): Promise<GeneratorResponse> {
    const startTime = Date.now();
    this.pollingAttempts = 0;

    while (this.pollingAttempts < MAX_POLLING_ATTEMPTS) {
      try {
        const job = await this.getJobStatus(jobId);

        if (job.status === "completed" && job.image_urls) {
          return {
            success: true,
            images: job.image_urls.map((url) => ({ url })),
            resultUrls: job.image_urls,
            jobId: job.id,
          };
        }

        if (job.status === "failed") {
          throw new Error(`Job failed: ${job.error || "Unknown error"}`);
        }

        // Still processing, wait and retry
        await this.sleep(POLLING_INTERVAL);
        this.pollingAttempts++;
      } catch (error) {
        // If not a job status error, retry
        if (error instanceof Error && !error.message.includes("Failed to get job status")) {
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
