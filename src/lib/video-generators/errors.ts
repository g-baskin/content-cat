/**
 * Error handling abstraction for all video generators
 * Maps service-specific errors to common error codes
 */

import type {
  VideoGeneratorErrorCode,
  VideoGeneratorErrorResponse,
  VideoGeneratorService,
} from "./types";

/**
 * Parse any error and return standardized VideoGeneratorErrorResponse
 * Routes to service-specific parsers
 */
export function parseVideoGeneratorError(
  errorMessage: string,
  service: VideoGeneratorService = "fal"
): VideoGeneratorErrorResponse {
  switch (service) {
    case "openai":
      return parseOpenAIVideoError(errorMessage);
    case "runway":
      return parseRunwayError(errorMessage);
    case "pika":
      return parsePikaError(errorMessage);
    case "luma":
      return parseLumaError(errorMessage);
    case "fal":
    default:
      return parseFalVideoError(errorMessage);
  }
}

/**
 * Parse FAL.ai video specific errors
 */
export function parseFalVideoError(
  errorMessage: string
): VideoGeneratorErrorResponse {
  const msg = errorMessage.toLowerCase();

  // API key issues
  if (
    msg.includes("401") ||
    msg.includes("unauthorized") ||
    msg.includes("invalid") ||
    msg.includes("authentication")
  ) {
    return {
      error: "API key is invalid. Check your fal.ai key in Settings.",
      code: "INVALID_API_KEY",
    };
  }

  // Credit/billing issues
  if (
    msg.includes("402") ||
    msg.includes("insufficient") ||
    msg.includes("credit") ||
    msg.includes("balance") ||
    msg.includes("quota") ||
    msg.includes("payment")
  ) {
    return {
      error: "Out of credits. Top up your fal.ai account.",
      code: "INSUFFICIENT_CREDITS",
    };
  }

  // Rate limiting
  if (
    msg.includes("429") ||
    msg.includes("rate") ||
    msg.includes("too many")
  ) {
    return {
      error: "Too many requests. Wait a moment and try again.",
      code: "RATE_LIMITED",
    };
  }

  // Content policy
  if (
    msg.includes("policy") ||
    msg.includes("content") ||
    msg.includes("nsfw") ||
    msg.includes("prohibited") ||
    msg.includes("blocked") ||
    msg.includes("safety")
  ) {
    return {
      error: "Content blocked by safety filters. Try a different prompt.",
      code: "CONTENT_POLICY",
    };
  }

  // Timeout
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return {
      error: "Video generation took too long. Try again.",
      code: "TASK_TIMEOUT",
    };
  }

  // Network issues
  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound")
  ) {
    return {
      error: "Connection failed. Check your internet.",
      code: "NETWORK_ERROR",
    };
  }

  // Default fallback
  return { error: "Video generation failed. Try again.", code: "UNKNOWN" };
}

/**
 * Parse OpenAI Sora specific errors
 */
export function parseOpenAIVideoError(
  errorMessage: string
): VideoGeneratorErrorResponse {
  const msg = errorMessage.toLowerCase();

  // API key issues
  if (
    msg.includes("401") ||
    msg.includes("unauthorized") ||
    msg.includes("invalid_api_key") ||
    msg.includes("incorrect api key")
  ) {
    return {
      error: "OpenAI API key is invalid. Check your key in Settings.",
      code: "INVALID_API_KEY",
    };
  }

  // Billing/quota issues
  if (
    msg.includes("402") ||
    msg.includes("insufficient_quota") ||
    msg.includes("billing") ||
    msg.includes("exceeded")
  ) {
    return {
      error: "OpenAI credits exhausted. Top up your account.",
      code: "INSUFFICIENT_CREDITS",
    };
  }

  // Rate limiting
  if (msg.includes("429") || msg.includes("rate_limit")) {
    return {
      error: "OpenAI rate limit reached. Wait and try again.",
      code: "RATE_LIMITED",
    };
  }

  // Content policy
  if (
    msg.includes("content_policy") ||
    msg.includes("moderation") ||
    msg.includes("safety_system") ||
    msg.includes("refused")
  ) {
    return {
      error: "Content blocked by OpenAI. Try a different prompt.",
      code: "CONTENT_POLICY",
    };
  }

  // Model access
  if (msg.includes("model_not_found") || msg.includes("access")) {
    return {
      error: "Your account doesn't have access to Sora. Check OpenAI eligibility.",
      code: "INVALID_API_KEY",
    };
  }

  // Timeout
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return {
      error: "Generation took too long. Try again.",
      code: "TASK_TIMEOUT",
    };
  }

  // Default fallback
  return { error: "OpenAI video generation failed. Try again.", code: "UNKNOWN" };
}

/**
 * Parse Runway specific errors
 */
export function parseRunwayError(
  errorMessage: string
): VideoGeneratorErrorResponse {
  const msg = errorMessage.toLowerCase();

  // API key issues
  if (
    msg.includes("401") ||
    msg.includes("unauthorized") ||
    msg.includes("invalid") ||
    msg.includes("api key")
  ) {
    return {
      error: "Runway API key is invalid. Check your key in Settings.",
      code: "INVALID_API_KEY",
    };
  }

  // Credit issues
  if (
    msg.includes("credits") ||
    msg.includes("insufficient") ||
    msg.includes("quota")
  ) {
    return {
      error: "Out of Runway credits. Top up your account.",
      code: "INSUFFICIENT_CREDITS",
    };
  }

  // Rate limiting
  if (msg.includes("429") || msg.includes("rate") || msg.includes("limit")) {
    return {
      error: "Runway rate limit reached. Wait and try again.",
      code: "RATE_LIMITED",
    };
  }

  // Content policy
  if (
    msg.includes("moderation") ||
    msg.includes("content") ||
    msg.includes("policy") ||
    msg.includes("blocked")
  ) {
    return {
      error: "Content blocked by Runway. Try a different prompt.",
      code: "CONTENT_POLICY",
    };
  }

  // Timeout
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return {
      error: "Generation took too long. Try again.",
      code: "TASK_TIMEOUT",
    };
  }

  // Default fallback
  return { error: "Runway generation failed. Try again.", code: "UNKNOWN" };
}

/**
 * Parse Pika specific errors
 */
export function parsePikaError(
  errorMessage: string
): VideoGeneratorErrorResponse {
  const msg = errorMessage.toLowerCase();

  // API key issues
  if (
    msg.includes("401") ||
    msg.includes("unauthorized") ||
    msg.includes("invalid") ||
    msg.includes("api key")
  ) {
    return {
      error: "Pika API key is invalid. Check your key in Settings.",
      code: "INVALID_API_KEY",
    };
  }

  // Credit issues
  if (
    msg.includes("credits") ||
    msg.includes("insufficient") ||
    msg.includes("quota")
  ) {
    return {
      error: "Out of Pika credits. Top up your account.",
      code: "INSUFFICIENT_CREDITS",
    };
  }

  // Rate limiting
  if (msg.includes("429") || msg.includes("rate") || msg.includes("limit")) {
    return {
      error: "Pika rate limit reached. Wait and try again.",
      code: "RATE_LIMITED",
    };
  }

  // Content policy
  if (
    msg.includes("content") ||
    msg.includes("policy") ||
    msg.includes("blocked") ||
    msg.includes("moderation")
  ) {
    return {
      error: "Content blocked by Pika. Try a different prompt.",
      code: "CONTENT_POLICY",
    };
  }

  // Timeout
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return {
      error: "Generation took too long. Try again.",
      code: "TASK_TIMEOUT",
    };
  }

  // Default fallback
  return { error: "Pika generation failed. Try again.", code: "UNKNOWN" };
}

/**
 * Parse Luma specific errors
 */
export function parseLumaError(
  errorMessage: string
): VideoGeneratorErrorResponse {
  const msg = errorMessage.toLowerCase();

  // API key issues
  if (
    msg.includes("401") ||
    msg.includes("unauthorized") ||
    msg.includes("invalid") ||
    msg.includes("api key")
  ) {
    return {
      error: "Luma API key is invalid. Check your key in Settings.",
      code: "INVALID_API_KEY",
    };
  }

  // Credit issues
  if (
    msg.includes("credits") ||
    msg.includes("insufficient") ||
    msg.includes("quota") ||
    msg.includes("limit")
  ) {
    return {
      error: "Out of Luma credits. Top up your account.",
      code: "INSUFFICIENT_CREDITS",
    };
  }

  // Rate limiting
  if (msg.includes("429") || msg.includes("rate")) {
    return {
      error: "Luma rate limit reached. Wait and try again.",
      code: "RATE_LIMITED",
    };
  }

  // Content policy
  if (
    msg.includes("content") ||
    msg.includes("policy") ||
    msg.includes("blocked") ||
    msg.includes("moderation")
  ) {
    return {
      error: "Content blocked by Luma. Try a different prompt.",
      code: "CONTENT_POLICY",
    };
  }

  // Timeout
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return {
      error: "Generation took too long. Try again.",
      code: "TASK_TIMEOUT",
    };
  }

  // Default fallback
  return { error: "Luma generation failed. Try again.", code: "UNKNOWN" };
}

/**
 * Check if error is a critical error that shouldn't be retried
 */
export function isCriticalError(errorCode: VideoGeneratorErrorCode): boolean {
  return ["INVALID_API_KEY", "CONTENT_POLICY", "INSUFFICIENT_CREDITS"].includes(
    errorCode
  );
}

/**
 * Check if error is retriable (temporary/transient)
 */
export function isRetriableError(errorCode: VideoGeneratorErrorCode): boolean {
  return ["RATE_LIMITED", "TASK_TIMEOUT", "NETWORK_ERROR"].includes(errorCode);
}
