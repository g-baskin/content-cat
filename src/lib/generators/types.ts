/**
 * Generator Abstraction Layer
 * Common interfaces for all image generation providers
 */

/**
 * Common error codes used across all generators
 */
export type GeneratorErrorCode =
  | "NO_API_KEY"
  | "INVALID_API_KEY"
  | "INSUFFICIENT_CREDITS"
  | "RATE_LIMITED"
  | "CONTENT_POLICY"
  | "INVALID_PROMPT"
  | "TASK_TIMEOUT"
  | "NETWORK_ERROR"
  | "UNKNOWN";

/**
 * Standardized error response for all generators
 */
export interface GeneratorErrorResponse {
  error: string;
  code: GeneratorErrorCode;
}

/**
 * Generator service type
 */
export type GeneratorService = "fal" | "midjourney" | "google-gemini" | "freepik";

/**
 * Generated image structure
 */
export interface GeneratedImage {
  url: string;
  width?: number;
  height?: number;
  contentType?: string;
}

/**
 * Base options for image generation (common across all generators)
 */
export interface BaseGenerationRequest {
  prompt: string;
  numImages?: number;
  aspectRatio?: string;
  outputFormat?: string;
  seed?: number;
  enableSafetyChecker?: boolean;
}

/**
 * Options for image editing (reference images)
 */
export interface BaseEditRequest extends BaseGenerationRequest {
  imageUrls: string[];
  strength?: number;
}

/**
 * Standardized response from any generator
 */
export interface GeneratorResponse {
  success: true;
  images: GeneratedImage[];
  resultUrls: string[];
  seed?: number;
  description?: string;
  jobId?: string; // For async generators like Midjourney
}

/**
 * Generator capabilities/features
 */
export interface GeneratorCapabilities {
  supportedAspectRatios: string[];
  supportedFormats: string[];
  maxImages: number;
  maxReferenceImages: number;
  supportsWebSearch: boolean;
  supportsEditing: boolean;
  isAsync: boolean; // true for Midjourney, false for FAL
  models: string[];
}

/**
 * Main generator interface that all providers must implement
 */
export interface IImageGenerator {
  /**
   * Generate image from text prompt
   */
  generateImage(request: BaseGenerationRequest): Promise<GeneratorResponse>;

  /**
   * Edit/manipulate image with reference images
   */
  editImage(request: BaseEditRequest): Promise<GeneratorResponse>;

  /**
   * Get capabilities of this generator
   */
  getCapabilities(): GeneratorCapabilities;

  /**
   * Get the service type (fal, midjourney, etc)
   */
  getService(): GeneratorService;

  /**
   * Set the model to use (optional - not all generators support this)
   */
  setModel?(model: string): void;

  /**
   * For async generators, check job status
   */
  getJobStatus?(jobId: string): Promise<GeneratorResponse | { status: string }>;

  /**
   * Validate if API key is working
   */
  validateApiKey?(): Promise<boolean>;
}
