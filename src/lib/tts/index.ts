export * from "./types";
export { createOpenAITTSProvider } from "./openai-tts";
export { createElevenLabsTTSProvider } from "./elevenlabs-tts";
export { createFishAudioTTSProvider } from "./fishaudio-tts";
export { createF5TTSProvider } from "./f5tts";

import type { ITTSProvider, TTSService } from "./types";
import { createOpenAITTSProvider } from "./openai-tts";
import { createElevenLabsTTSProvider } from "./elevenlabs-tts";
import { createFishAudioTTSProvider } from "./fishaudio-tts";
import { createF5TTSProvider } from "./f5tts";

/**
 * Create a TTS provider based on service type
 */
export function createTTSProvider(
  service: TTSService,
  apiKey: string
): ITTSProvider {
  switch (service) {
    case "openai":
      return createOpenAITTSProvider(apiKey);
    case "elevenlabs":
      return createElevenLabsTTSProvider(apiKey);
    case "fishaudio":
      return createFishAudioTTSProvider(apiKey);
    case "f5tts":
      return createF5TTSProvider(apiKey);
    default:
      throw new Error(`Unknown TTS service: ${service}`);
  }
}
