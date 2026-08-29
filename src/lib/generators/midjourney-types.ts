/**
 * Midjourney API Type Definitions
 * Based on Midjourney API v2 specification
 */

/**
 * Midjourney job status types
 */
export type MidjourneyJobStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Midjourney model types
 */
export type MidjourneyModel = "midjourney" | "niji-6";

/**
 * Midjourney upscale mode
 */
export type UpscaleMode = "default" | "light" | "detailed";

/**
 * Image quality settings
 */
export type QualityLevel = "hd" | "standard";

/**
 * Aspect ratio format for Midjourney (uses dashes instead of colons)
 */
export type MidjourneyAspectRatio =
  | "1-1"
  | "3-2"
  | "2-3"
  | "4-3"
  | "3-4"
  | "16-9"
  | "9-16"
  | "9-21"
  | "21-9";

/**
 * Request to submit a job to Midjourney
 */
export interface MidjourneySubmitRequest {
  prompt: string;
  aspect_ratio?: MidjourneyAspectRatio;
  model?: MidjourneyModel;
  quality?: QualityLevel;
  style?: string; // e.g., "raw", "niji", "expressive"
  niji?: boolean; // Use niji-6 model
  seed?: number;
  remix?: boolean;
  upscale?: boolean;
  upscale_mode?: UpscaleMode;
  webhook_url?: string; // For async callbacks
  webhook_secret?: string;
}

/**
 * Response from Midjourney API
 */
export interface MidjourneyJobResponse {
  id: string; // Job ID
  status: MidjourneyJobStatus;
  prompt: string;
  image_urls?: string[];
  progress?: number; // 0-100
  error?: string;
  error_code?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

/**
 * Webhook payload from Midjourney
 */
export interface MidjourneyWebhookPayload {
  id: string;
  status: MidjourneyJobStatus;
  prompt: string;
  image_urls?: string[];
  progress?: number;
  error?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Midjourney API error response
 */
export interface MidjourneyErrorResponse {
  error: {
    message: string;
    code: string;
    type: string;
  };
}

/**
 * Polling state for async operations
 */
export interface PollingState {
  jobId: string;
  startTime: number;
  attempts: number;
}
