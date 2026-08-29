import type { ITTSProvider, TTSRequest, TTSResponse, Voice, TTSService } from "./types";
import { fal } from "@fal-ai/client";

// F5-TTS uses voice cloning - these are sample reference voices
// Users can add their own reference audio for custom voice cloning
const DEFAULT_VOICES: Voice[] = [
  {
    id: "https://github.com/SWivid/F5-TTS/raw/main/tests/ref_audio/test_en_1_ref_short.wav",
    name: "English Female (Sample)",
    gender: "female",
    language: "en"
  },
  {
    id: "https://github.com/SWivid/F5-TTS/raw/main/tests/ref_audio/test_zh_1_ref_short.wav",
    name: "Chinese Female (Sample)",
    gender: "female",
    language: "zh"
  },
];

export class F5TTSProvider implements ITTSProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Configure FAL client with the API key
    fal.config({
      credentials: apiKey,
    });
  }

  getService(): TTSService {
    return "f5tts";
  }

  async getVoices(): Promise<Voice[]> {
    // F5-TTS uses reference audio for voice cloning
    // Return default sample voices - users can provide custom reference audio URLs
    return DEFAULT_VOICES;
  }

  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      const { text, voiceId } = request;

      // voiceId is the reference audio URL for F5-TTS
      const refAudioUrl = voiceId || DEFAULT_VOICES[0].id;

      const result = await fal.subscribe("fal-ai/f5-tts", {
        input: {
          gen_text: text,
          ref_audio_url: refAudioUrl,
          model_type: "F5-TTS",
          remove_silence: true,
        },
      });

      // Type the result
      const data = result.data as {
        audio_url?: {
          url: string;
          content_type?: string;
          file_size?: number;
        };
      };

      if (!data.audio_url?.url) {
        return {
          success: false,
          error: "No audio URL in response",
        };
      }

      // Fetch the audio file
      const audioResponse = await fetch(data.audio_url.url);
      if (!audioResponse.ok) {
        return {
          success: false,
          error: "Failed to download generated audio",
        };
      }

      const arrayBuffer = await audioResponse.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      // Estimate duration (rough: ~150 words per minute)
      const wordCount = text.split(/\s+/).length;
      const estimatedDuration = (wordCount / 150) * 60;

      return {
        success: true,
        audioBuffer,
        audioUrl: data.audio_url.url,
        duration: estimatedDuration,
      };
    } catch (error) {
      console.error("F5-TTS error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate speech",
      };
    }
  }
}

export function createF5TTSProvider(apiKey: string): ITTSProvider {
  return new F5TTSProvider(apiKey);
}
