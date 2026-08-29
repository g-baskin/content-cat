/**
 * Image Generator Abstraction Layer
 * Central export point for all generator-related utilities
 */

// Types
export type {
  IImageGenerator,
  GeneratorService,
  BaseGenerationRequest,
  BaseEditRequest,
  GeneratorResponse,
  GeneratorCapabilities,
  GeneratedImage,
  GeneratorErrorCode,
  GeneratorErrorResponse,
} from "./types";

// Implementations
export { FalGenerator } from "./fal-generator";
export { MidjourneyGenerator } from "./midjourney-generator";
export { GeminiGenerator } from "./google-gemini-generator";
export { FreepikGenerator } from "./freepik-generator";

// Factory
export { getGeneratorClient, isAsyncGenerator } from "./factory";

// Error handling
export {
  parseGeneratorError,
  parseFalError,
  parseMidjourneyError,
  isCriticalError,
  isRetriableError,
} from "./errors";

// Midjourney types
export type {
  MidjourneyJobStatus,
  MidjourneyModel,
  MidjourneyAspectRatio,
  MidjourneySubmitRequest,
  MidjourneyJobResponse,
} from "./midjourney-types";

// Google Gemini types
export type { GeminiModel, GeminiAspectRatio } from "./google-gemini-types";

// Freepik types
export type { FreepikModel, FreepikJobStatus } from "./freepik-types";
