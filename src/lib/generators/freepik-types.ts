/**
 * Freepik API Type Definitions
 * Based on Freepik API documentation
 */

/**
 * Freepik model types
 */
export type FreepikModel =
  // Mystic endpoint models
  | "realism"
  | "fluid"
  | "zen"
  | "flexible"
  | "super_real"
  | "editorial_portraits"
  // Text-to-image endpoint models
  | "flux-dev"
  | "flux-pro"
  | "seedream-v4"
  | "hyperflux";

/**
 * Freepik job status types
 */
export type FreepikJobStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Image generation request for Freepik
 */
export interface FreepikGenerationRequest {
  prompt: string;
  model?: FreepikModel;
  aspect_ratio?: string;
  num_images?: number;
  quality?: "standard" | "hd";
  webhook_url?: string;
  webhook_secret?: string;
}

/**
 * Image editing request for Freepik (Seedream 4 Edit)
 */
export interface FreepikEditRequest extends FreepikGenerationRequest {
  image_url: string;
  instructions: string;
}

/**
 * Freepik API task response (from creation)
 */
export interface FreepikTaskResponse {
  data: {
    task_id: string;
    status: string;
    generated: Array<{
      url: string;
      width?: number;
      height?: number;
    }>;
  };
}

/**
 * Freepik API task status response (from polling)
 */
export interface FreepikTaskStatusResponse {
  data: {
    id?: string;
    task_id: string;
    status: string;
    prompt?: string;
    model?: FreepikModel;
    result?: {
      images: Array<{
        url: string;
        width?: number;
        height?: number;
      }>;
    };
    generated?: Array<string | { url: string; width?: number; height?: number }>;
    has_nsfw?: boolean[];
    error?: {
      message: string;
      code: string;
    };
    created_at?: string;
    updated_at?: string;
    expires_at?: string;
  };
}

/**
 * Webhook payload from Freepik
 */
export interface FreepikWebhookPayload {
  id: string;
  status: FreepikJobStatus;
  prompt: string;
  result?: {
    images: Array<{
      url: string;
      width?: number;
      height?: number;
    }>;
  };
  error?: {
    message: string;
    code: string;
  };
  created_at: string;
  updated_at: string;
}
