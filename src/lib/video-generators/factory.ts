/**
 * Video Generator Factory
 * Creates the appropriate video generator based on service type
 */

import type { IVideoGenerator, VideoGeneratorService } from "./types";
import { FalVideoGenerator, type FalVideoModel } from "./fal-generator";
import { OpenAIVideoGenerator, type SoraModel } from "./openai-generator";
import { RunwayVideoGenerator, type RunwayModel } from "./runway-generator";
import { PikaVideoGenerator, type PikaModel } from "./pika-generator";
import { LumaVideoGenerator, type LumaModel } from "./luma-generator";

/**
 * Model mapping for each service
 */
export const VIDEO_SERVICE_MODELS: Record<VideoGeneratorService, string[]> = {
  fal: ["kling-2.6", "kling-2.5-turbo", "wan-2.6", "veo-3.1"],
  openai: ["sora-2", "sora-2-pro"],
  runway: ["gen-3-alpha", "gen-3-alpha-turbo"],
  pika: ["pika-2.0", "pika-1.5"],
  luma: ["dream-machine", "dream-machine-1.5"],
};

/**
 * Default models for each service
 */
export const DEFAULT_VIDEO_MODELS: Record<VideoGeneratorService, string> = {
  fal: "kling-2.6",
  openai: "sora-2",
  runway: "gen-3-alpha",
  pika: "pika-2.0",
  luma: "dream-machine",
};

/**
 * Get the service for a given model
 */
export function getServiceForModel(model: string): VideoGeneratorService | null {
  for (const [service, models] of Object.entries(VIDEO_SERVICE_MODELS)) {
    if (models.includes(model)) {
      return service as VideoGeneratorService;
    }
  }
  return null;
}

/**
 * Check if a model is valid for a service
 */
export function isValidModelForService(
  model: string,
  service: VideoGeneratorService
): boolean {
  return VIDEO_SERVICE_MODELS[service]?.includes(model) ?? false;
}

/**
 * Create a video generator client for the specified service
 *
 * @param service - The video generation service to use
 * @param apiKey - API key for the service
 * @param model - Optional model to use (defaults to service's default model)
 * @returns Configured video generator instance
 */
export async function getVideoGeneratorClient(
  service: VideoGeneratorService,
  apiKey: string,
  model?: string
): Promise<IVideoGenerator> {
  // Validate model if provided
  if (model && !isValidModelForService(model, service)) {
    throw new Error(
      `Model "${model}" is not valid for service "${service}". ` +
        `Valid models: ${VIDEO_SERVICE_MODELS[service].join(", ")}`
    );
  }

  switch (service) {
    case "fal":
      return new FalVideoGenerator(
        apiKey,
        (model || DEFAULT_VIDEO_MODELS.fal) as FalVideoModel
      );

    case "openai":
      return new OpenAIVideoGenerator(
        apiKey,
        (model || DEFAULT_VIDEO_MODELS.openai) as SoraModel
      );

    case "runway":
      return new RunwayVideoGenerator(
        apiKey,
        (model || DEFAULT_VIDEO_MODELS.runway) as RunwayModel
      );

    case "pika":
      return new PikaVideoGenerator(
        apiKey,
        (model || DEFAULT_VIDEO_MODELS.pika) as PikaModel
      );

    case "luma":
      return new LumaVideoGenerator(
        apiKey,
        (model || DEFAULT_VIDEO_MODELS.luma) as LumaModel
      );

    default:
      throw new Error(`Unknown video generator service: ${service}`);
  }
}

/**
 * Get all available video models across all services
 */
export function getAllVideoModels(): string[] {
  return Object.values(VIDEO_SERVICE_MODELS).flat();
}

/**
 * Get display name for a service
 */
export function getServiceDisplayName(service: VideoGeneratorService): string {
  const names: Record<VideoGeneratorService, string> = {
    fal: "FAL.ai",
    openai: "OpenAI Sora",
    runway: "Runway",
    pika: "Pika",
    luma: "Luma Dream Machine",
  };
  return names[service];
}

/**
 * Get display name for a model
 */
export function getModelDisplayName(model: string): string {
  const names: Record<string, string> = {
    // FAL.ai models
    "kling-2.6": "Kling 2.6 Pro",
    "kling-2.5-turbo": "Kling 2.5 Turbo",
    "wan-2.6": "Wan 2.6",
    "veo-3.1": "Veo 3.1",
    // OpenAI models
    "sora-2": "Sora 2",
    "sora-2-pro": "Sora 2 Pro",
    // Runway models
    "gen-3-alpha": "Gen-3 Alpha",
    "gen-3-alpha-turbo": "Gen-3 Alpha Turbo",
    // Pika models
    "pika-2.0": "Pika 2.0",
    "pika-1.5": "Pika 1.5",
    // Luma models
    "dream-machine": "Dream Machine",
    "dream-machine-1.5": "Dream Machine 1.5",
  };
  return names[model] || model;
}
