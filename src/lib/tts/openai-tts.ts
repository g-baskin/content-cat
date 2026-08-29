import OpenAI from "openai";
import type { ITTSProvider, TTSRequest, TTSResponse, Voice, TTSService } from "./types";

// OpenAI TTS voices
const OPENAI_VOICES: Voice[] = [
  { id: "alloy", name: "Alloy", gender: "neutral" },
  { id: "echo", name: "Echo", gender: "male" },
  { id: "fable", name: "Fable", gender: "neutral" },
  { id: "onyx", name: "Onyx", gender: "male" },
  { id: "nova", name: "Nova", gender: "female" },
  { id: "shimmer", name: "Shimmer", gender: "female" },
];

export class OpenAITTSProvider implements ITTSProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  getService(): TTSService {
    return "openai";
  }

  async getVoices(): Promise<Voice[]> {
    // OpenAI has fixed voices, no API to fetch them
    return OPENAI_VOICES;
  }

  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      const { text, voiceId, speed = 1.0 } = request;

      // Validate voice
      const validVoice = OPENAI_VOICES.find((v) => v.id === voiceId);
      if (!validVoice) {
        return {
          success: false,
          error: `Invalid voice ID: ${voiceId}. Valid options: ${OPENAI_VOICES.map((v) => v.id).join(", ")}`,
        };
      }

      // Clamp speed to valid range
      const clampedSpeed = Math.max(0.25, Math.min(4.0, speed));

      const response = await this.client.audio.speech.create({
        model: "tts-1-hd",
        voice: voiceId as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
        input: text,
        speed: clampedSpeed,
        response_format: "mp3",
      });

      // Get the audio as a buffer
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      // Estimate duration (rough: ~150 words per minute at speed 1.0)
      const wordCount = text.split(/\s+/).length;
      const estimatedDuration = (wordCount / 150) * 60 / speed;

      return {
        success: true,
        audioBuffer,
        duration: estimatedDuration,
      };
    } catch (error) {
      console.error("OpenAI TTS error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate speech",
      };
    }
  }
}

export function createOpenAITTSProvider(apiKey: string): ITTSProvider {
  return new OpenAITTSProvider(apiKey);
}
