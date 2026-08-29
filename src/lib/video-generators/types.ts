/**
 * Video Generator Abstraction Layer
 * Common interfaces for all video generation providers
 */

/**
 * Common error codes used across all video generators
 */
export type VideoGeneratorErrorCode =
  | "NO_API_KEY"
  | "INVALID_API_KEY"
  | "INSUFFICIENT_CREDITS"
  | "RATE_LIMITED"
  | "CONTENT_POLICY"
  | "INVALID_PROMPT"
  | "TASK_TIMEOUT"
  | "NETWORK_ERROR"
  | "UNSUPPORTED_MODE"
  | "UNKNOWN";

/**
 * Standardized error response for all video generators
 */
export interface VideoGeneratorErrorResponse {
  error: string;
  code: VideoGeneratorErrorCode;
}

/**
 * Video generator service type
 */
export type VideoGeneratorService =
  | "fal"
  | "openai"
  | "runway"
  | "pika"
  | "luma";

/**
 * Video generation mode
 */
export type VideoGenerationMode =
  | "text-to-video"
  | "image-to-video"
  | "first-last-frame";

/**
 * Generated video structure
 */
export interface GeneratedVideo {
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  contentType?: string;
}

/**
 * Base options for text-to-video generation
 */
export interface TextToVideoRequest {
  prompt: string;
  duration?: number; // seconds
  aspectRatio?: string;
  resolution?: string;
  negativePrompt?: string;
  seed?: number;
  enableAudio?: boolean;
  cfgScale?: number;
  speed?: "standard" | "fast";
}

/**
 * Options for image-to-video generation
 */
export interface ImageToVideoRequest extends TextToVideoRequest {
  imageUrl: string;
  endImageUrl?: string; // For first/last frame interpolation
  strength?: number;
}

/**
 * Options for first/last frame video generation
 */
export interface FirstLastFrameRequest extends TextToVideoRequest {
  firstFrameUrl: string;
  lastFrameUrl: string;
}

/**
 * Standardized response from any video generator
 */
export interface VideoGeneratorResponse {
  success: true;
  video: GeneratedVideo;
  videoUrl: string;
  seed?: number;
  jobId?: string; // For async generators
}

/**
 * Video generator capabilities/features
 */
export interface VideoGeneratorCapabilities {
  supportedModes: VideoGenerationMode[];
  supportedDurations: number[]; // seconds
  supportedAspectRatios: string[];
  supportedResolutions: string[];
  maxPromptLength: number;
  supportsAudio: boolean;
  supportsNegativePrompt: boolean;
  isAsync: boolean;
  models: string[];
}

/**
 * Job status for async generators
 */
export interface VideoJobStatus {
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  video?: GeneratedVideo;
  error?: string;
}

/**
 * Main video generator interface that all providers must implement
 */
export interface IVideoGenerator {
  /**
   * Generate video from text prompt
   */
  generateTextToVideo(
    request: TextToVideoRequest
  ): Promise<VideoGeneratorResponse>;

  /**
   * Generate video from image
   */
  generateImageToVideo(
    request: ImageToVideoRequest
  ): Promise<VideoGeneratorResponse>;

  /**
   * Generate video from first and last frame
   * Optional - not all generators support this
   */
  generateFirstLastFrame?(
    request: FirstLastFrameRequest
  ): Promise<VideoGeneratorResponse>;

  /**
   * Get capabilities of this generator
   */
  getCapabilities(): VideoGeneratorCapabilities;

  /**
   * Get the service type (fal, openai, runway, etc)
   */
  getService(): VideoGeneratorService;

  /**
   * Get current model
   */
  getModel(): string;

  /**
   * Set the model to use (optional - not all generators support this)
   */
  setModel?(model: string): void;

  /**
   * For async generators, check job status
   */
  getJobStatus?(jobId: string): Promise<VideoJobStatus>;

  /**
   * Validate if API key is working
   */
  validateApiKey?(): Promise<boolean>;
}
