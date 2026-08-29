/**
 * Generator Factory
 * Creates appropriate generator instances based on service type
 */

import type { IImageGenerator, GeneratorService } from "./types";

/**
 * Get a generator instance based on service type
 * @param service - Generator service ("fal", "midjourney", "google-gemini", or "freepik")
 * @param apiKey - API key for the service
 * @returns Generator instance implementing IImageGenerator
 */
export async function getGeneratorClient(
  service: GeneratorService,
  apiKey: string
): Promise<IImageGenerator> {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  switch (service) {
    case "fal":
      const { FalGenerator } = await import("./fal-generator");
      return new FalGenerator(apiKey);

    case "midjourney":
      const { MidjourneyGenerator } = await import("./midjourney-generator");
      return new MidjourneyGenerator(apiKey);

    case "google-gemini":
      const { GeminiGenerator } = await import("./google-gemini-generator");
      return new GeminiGenerator(apiKey);

    case "freepik":
      const { FreepikGenerator } = await import("./freepik-generator");
      return new FreepikGenerator(apiKey);

    default:
      throw new Error(`Unknown generator service: ${service}`);
  }
}

/**
 * Note: Synchronous initialization is not supported due to dynamic imports.
 * Use getGeneratorClient() which is async and handles all services.
 */

/**
 * Check if a generator service is async (requires polling/callbacks)
 */
export function isAsyncGenerator(service: GeneratorService): boolean {
  return service === "midjourney";
}
