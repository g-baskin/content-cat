/**
 * Google Gemini Image Generator
 * Implements the IImageGenerator interface for Google Gemini API
 */

import {
  type IImageGenerator,
  type GeneratorService,
  type BaseGenerationRequest,
  type BaseEditRequest,
  type GeneratorResponse,
  type GeneratorCapabilities,
} from "./types";
import type { GeminiModel, GeminiAspectRatio, GeminiGenerationRequest } from "./google-gemini-types";

const GEMINI_CAPABILITIES: GeneratorCapabilities = {
  supportedAspectRatios: ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
  supportedFormats: ["png", "jpeg"],
  maxImages: 1, // Gemini generates one image per request
  maxReferenceImages: 14,
  supportsWebSearch: true,
  supportsEditing: true,
  isAsync: false,
  models: ["gemini-2.5-flash-image", "gemini-3-pro-image-preview"],
};

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Google Gemini Generator implementation
 */
export class GeminiGenerator implements IImageGenerator {
  private apiKey: string;
  private model: GeminiModel;

  constructor(apiKey: string, model: GeminiModel = "gemini-2.5-flash-image") {
    if (!apiKey) {
      throw new Error("API key is required for Google Gemini generator");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Generate image from text prompt
   */
  async generateImage(request: BaseGenerationRequest): Promise<GeneratorResponse> {
    try {
      const response = await this.callGeminiApi({
        prompt: request.prompt,
        aspectRatio: (request.aspectRatio || "1:1") as GeminiAspectRatio,
      });

      return {
        success: true,
        images: response.images,
        resultUrls: response.imageUrls,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate image";
      throw new Error(`Gemini generation failed: ${message}`);
    }
  }

  /**
   * Edit image with reference images
   */
  async editImage(request: BaseEditRequest): Promise<GeneratorResponse> {
    try {
      const response = await this.callGeminiApi({
        prompt: request.prompt,
        imageUrls: request.imageUrls,
        aspectRatio: (request.aspectRatio || "1:1") as GeminiAspectRatio,
      });

      return {
        success: true,
        images: response.images,
        resultUrls: response.imageUrls,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to edit image";
      throw new Error(`Gemini editing failed: ${message}`);
    }
  }

  /**
   * Get generator capabilities
   */
  getCapabilities(): GeneratorCapabilities {
    return GEMINI_CAPABILITIES;
  }

  /**
   * Get service type
   */
  getService(): GeneratorService {
    return "google-gemini";
  }

  /**
   * Set the model to use
   */
  setModel(model: GeminiModel): void {
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
   * Call Gemini API for image generation
   */
  private async callGeminiApi(params: {
    prompt: string;
    imageUrls?: string[];
    aspectRatio: GeminiAspectRatio;
  }): Promise<{ images: Array<{ url: string }>; imageUrls: string[] }> {
    // Build content parts
    const contentParts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];

    // Add prompt
    contentParts.push({
      text: params.prompt,
    });

    // Add reference images if provided
    if (params.imageUrls && params.imageUrls.length > 0) {
      for (const imageUrl of params.imageUrls) {
        contentParts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: imageUrl, // Assume this is already base64
          },
        });
      }
    }

    // Build request
    const request: GeminiGenerationRequest = {
      contents: [
        {
          parts: contentParts,
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
        aspectRatio: params.aspectRatio,
      },
    };

    // Make API call
    const response = await fetch(
      `${GEMINI_API_BASE}/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();

    // Extract image from response
    interface GeminiResponse {
      candidates?: Array<{
        content?: {
          parts?: Array<{ inline_data?: { data: string; mime_type: string } }>;
        };
      }>;
    }

    const responseData = data as GeminiResponse;
    if (
      !responseData.candidates ||
      !responseData.candidates[0] ||
      !responseData.candidates[0].content ||
      !responseData.candidates[0].content.parts
    ) {
      throw new Error("No image data in response");
    }

    const imageParts = responseData.candidates[0].content.parts.filter(
      (part) => part.inline_data
    );

    if (imageParts.length === 0) {
      throw new Error("No image generated");
    }

    // Convert base64 images to data URLs
    const imageUrls = imageParts.map((part): string => {
      const base64 = part.inline_data?.data;
      const mimeType = part.inline_data?.mime_type || "image/jpeg";
      return `data:${mimeType};base64,${base64}`;
    });

    return {
      images: imageUrls.map((url: string) => ({ url })),
      imageUrls,
    };
  }
}
