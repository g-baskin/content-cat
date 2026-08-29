/**
 * Video Generators Module
 * Unified video generation abstraction layer supporting multiple providers
 */

// Types
export type {
  VideoGeneratorErrorCode,
  VideoGeneratorErrorResponse,
  VideoGeneratorService,
  VideoGenerationMode,
  GeneratedVideo,
  TextToVideoRequest,
  ImageToVideoRequest,
  FirstLastFrameRequest,
  VideoGeneratorResponse,
  VideoGeneratorCapabilities,
  VideoJobStatus,
  IVideoGenerator,
} from "./types";

// Error handling
export {
  parseVideoGeneratorError,
  parseFalVideoError,
  parseOpenAIVideoError,
  parseRunwayError,
  parsePikaError,
  parseLumaError,
  isCriticalError,
  isRetriableError,
} from "./errors";

// Factory
export {
  getVideoGeneratorClient,
  getServiceForModel,
  isValidModelForService,
  getAllVideoModels,
  getServiceDisplayName,
  getModelDisplayName,
  VIDEO_SERVICE_MODELS,
  DEFAULT_VIDEO_MODELS,
} from "./factory";

// FAL.ai Generator
export {
  FalVideoGenerator,
  createFalVideoGenerator,
  type FalVideoModel,
} from "./fal-generator";

// OpenAI Sora Generator
export {
  OpenAIVideoGenerator,
  createOpenAIVideoGenerator,
  type SoraModel,
} from "./openai-generator";

// Runway Generator
export {
  RunwayVideoGenerator,
  createRunwayVideoGenerator,
  type RunwayModel,
} from "./runway-generator";

// Pika Generator
export {
  PikaVideoGenerator,
  createPikaVideoGenerator,
  type PikaModel,
} from "./pika-generator";

// Luma Generator
export {
  LumaVideoGenerator,
  createLumaVideoGenerator,
  type LumaModel,
} from "./luma-generator";
