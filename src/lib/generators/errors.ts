/**
 * Error handling abstraction for all generators
 * Maps service-specific errors to common error codes
 */

import type { GeneratorErrorCode, GeneratorErrorResponse } from "./types";

/**
 * Parse any error and return standardized GeneratorErrorResponse
 * Specific generator implementations can override this for service-specific parsing
 */
export function parseGeneratorError(
  errorMessage: string,
  service: "fal" | "midjourney" | "freepik" | "google-gemini" = "fal"
): GeneratorErrorResponse {
  if (service === "midjourney") {
    return parseMidjourneyError(errorMessage);
  }
  if (service === "freepik") {
    return parseFreepikError(errorMessage);
  }
  return parseFalError(errorMessage);
}

/**
 * Parse FAL.ai specific errors
 */
export function parseFalError(errorMessage: string): GeneratorErrorResponse {
  const msg = errorMessage.toLowerCase();

  // API key issues
  if (
    msg.includes("401") ||
    msg.includes("unauthorized") ||
    msg.includes("invalid") ||
    msg.includes("authentication")
  ) {
    return {
      error: "API key is invalid. Check your key in Settings.",
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
  if (msg.includes("429") || msg.includes("rate") || msg.includes("too many")) {
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
      error: "Generation took too long. Try again.",
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
  return { error: "Something went wrong. Try again.", code: "UNKNOWN" };
}

/**
 * Parse Midjourney specific errors
 */
export function parseMidjourneyError(
  errorMessage: string
): GeneratorErrorResponse {
  const msg = errorMessage.toLowerCase();

  // API key issues
  if (
    msg.includes("401") ||
    msg.includes("unauthorized") ||
    msg.includes("invalid") ||
    msg.includes("authentication") ||
    msg.includes("invalid_api_key")
  ) {
    return {
      error: "API key is invalid. Check your Midjourney API key in Settings.",
      code: "INVALID_API_KEY",
    };
  }

  // Subscription/billing issues
  if (
    msg.includes("subscription") ||
    msg.includes("no_active_subscription") ||
    msg.includes("insufficient") ||
    msg.includes("quota")
  ) {
    return {
      error: "Active Midjourney subscription required.",
      code: "INSUFFICIENT_CREDITS",
    };
  }

  // Rate limiting
  if (
    msg.includes("429") ||
    msg.includes("rate_limited") ||
    msg.includes("too_many_requests")
  ) {
    return {
      error: "Midjourney rate limit reached. Wait a moment and try again.",
      code: "RATE_LIMITED",
    };
  }

  // Content policy
  if (
    msg.includes("policy") ||
    msg.includes("banned") ||
    msg.includes("inappropriate") ||
    msg.includes("content_filter")
  ) {
    return {
      error: "Content blocked by Midjourney. Try a different prompt.",
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

  // Network issues
  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("connection") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound")
  ) {
    return {
      error: "Connection to Midjourney failed. Check your internet.",
      code: "NETWORK_ERROR",
    };
  }

  // Default fallback
  return { error: "Midjourney generation failed. Try again.", code: "UNKNOWN" };
}

/**
 * Parse Freepik specific errors
 */
export function parseFreepikError(errorMessage: string): GeneratorErrorResponse {
  const msg = errorMessage.toLowerCase();

  // Access denied - preserve the original message about which model failed
  if (msg.includes("access") && msg.includes("model")) {
    return {
      error: errorMessage.replace("Freepik generation failed: ", ""),
      code: "INVALID_API_KEY",
    };
  }

  // General access denied
  if (msg.includes("access denied")) {
    return {
      error: "Your Freepik API key doesn't have access to this model. Try a different model.",
      code: "INVALID_API_KEY",
    };
  }

  // API key issues
  if (
    msg.includes("401") ||
    msg.includes("unauthorized") ||
    msg.includes("invalid") ||
    msg.includes("authentication")
  ) {
    return {
      error: "Freepik API key is invalid. Check your key in Settings.",
      code: "INVALID_API_KEY",
    };
  }

  // Credit/billing issues
  if (
    msg.includes("402") ||
    msg.includes("insufficient") ||
    msg.includes("credit") ||
    msg.includes("quota")
  ) {
    return {
      error: "Out of Freepik credits. Top up your account.",
      code: "INSUFFICIENT_CREDITS",
    };
  }

  // Rate limiting
  if (msg.includes("429") || msg.includes("rate") || msg.includes("too many")) {
    return {
      error: "Freepik rate limit reached. Wait a moment and try again.",
      code: "RATE_LIMITED",
    };
  }

  // Content policy
  if (
    msg.includes("policy") ||
    msg.includes("nsfw") ||
    msg.includes("prohibited") ||
    msg.includes("blocked")
  ) {
    return {
      error: "Content blocked by Freepik. Try a different prompt.",
      code: "CONTENT_POLICY",
    };
  }

  // Timeout
  if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("took too long")) {
    return {
      error: "Generation took too long. Try again.",
      code: "TASK_TIMEOUT",
    };
  }

  // Default fallback - preserve original error message for debugging
  if (errorMessage.includes("Freepik")) {
    return {
      error: errorMessage.replace("Freepik generation failed: ", ""),
      code: "UNKNOWN"
    };
  }
  return { error: "Freepik generation failed. Try again.", code: "UNKNOWN" };
}

/**
 * Check if error is a critical error that shouldn't be retried
 */
export function isCriticalError(errorCode: GeneratorErrorCode): boolean {
  return ["INVALID_API_KEY", "CONTENT_POLICY", "INSUFFICIENT_CREDITS"].includes(
    errorCode
  );
}

/**
 * Check if error is retriable (temporary/transient)
 */
export function isRetriableError(errorCode: GeneratorErrorCode): boolean {
  return [
    "RATE_LIMITED",
    "TASK_TIMEOUT",
    "NETWORK_ERROR",
  ].includes(errorCode);
}
