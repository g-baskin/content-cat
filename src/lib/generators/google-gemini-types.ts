/**
 * Google Gemini API Type Definitions
 * Based on Google Gemini API v1beta
 */

/**
 * Google Gemini model types
 */
export type GeminiModel = "gemini-2.5-flash-image" | "gemini-3-pro-image-preview";

/**
 * Supported aspect ratios for Gemini
 */
export type GeminiAspectRatio =
  | "1:1"
  | "2:3"
  | "3:2"
  | "3:4"
  | "4:3"
  | "4:5"
  | "5:4"
  | "9:16"
  | "16:9"
  | "21:9";

/**
 * Image size for Gemini 3 Pro (Flash uses default sizing)
 */
export type GeminiImageSize = "1K" | "2K" | "4K";

/**
 * Content part for Gemini API request
 */
export interface GeminiContentPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string; // base64 encoded
  };
}

/**
 * Gemini API request body
 */
export interface GeminiGenerationRequest {
  contents: Array<{
    parts: GeminiContentPart[];
  }>;
  generationConfig?: {
    responseModalities?: string[];
    aspectRatio?: GeminiAspectRatio;
    imageSize?: GeminiImageSize;
  };
  tools?: Array<{
    google_search?: object;
  }>;
}

/**
 * Gemini API response
 */
export interface GeminiGenerationResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        inline_data?: {
          mime_type: string;
          data: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage_metadata?: {
    prompt_token_count: number;
    candidates_token_count: number;
    total_token_count: number;
  };
}
