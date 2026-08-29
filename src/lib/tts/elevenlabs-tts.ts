import type { ITTSProvider, TTSRequest, TTSResponse, Voice, TTSService } from "./types";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

// Default voices that are always available
const DEFAULT_VOICES: Voice[] = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "female" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", gender: "female" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", gender: "female" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", gender: "male" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", gender: "female" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", gender: "male" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", gender: "male" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", gender: "male" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", gender: "male" },
];

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels?: {
    gender?: string;
    accent?: string;
    description?: string;
  };
  preview_url?: string;
}

export class ElevenLabsTTSProvider implements ITTSProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getService(): TTSService {
    return "elevenlabs";
  }

  async getVoices(): Promise<Voice[]> {
    try {
      const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        console.error("ElevenLabs voices error:", await response.text());
        return DEFAULT_VOICES;
      }

      const data = await response.json();
      const voices: Voice[] = data.voices.map((v: ElevenLabsVoice) => ({
        id: v.voice_id,
        name: v.name,
        previewUrl: v.preview_url,
        gender: v.labels?.gender as "male" | "female" | undefined,
      }));

      return voices;
    } catch (error) {
      console.error("Failed to fetch ElevenLabs voices:", error);
      return DEFAULT_VOICES;
    }
  }

  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      const { text, voiceId, speed = 1.0 } = request;

      // ElevenLabs uses stability and similarity_boost instead of speed
      // We'll map speed to stability inversely (faster = less stable)
      const stability = Math.max(0, Math.min(1, 1.5 - speed * 0.5));

      const response = await fetch(
        `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": this.apiKey,
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability,
              similarity_boost: 0.75,
              style: 0,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs TTS error:", errorText);
        return {
          success: false,
          error: `ElevenLabs API error: ${response.status}`,
        };
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      // Estimate duration (rough: ~150 words per minute)
      const wordCount = text.split(/\s+/).length;
      const estimatedDuration = (wordCount / 150) * 60;

      return {
        success: true,
        audioBuffer,
        duration: estimatedDuration,
      };
    } catch (error) {
      console.error("ElevenLabs TTS error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate speech",
      };
    }
  }
}

export function createElevenLabsTTSProvider(apiKey: string): ITTSProvider {
  return new ElevenLabsTTSProvider(apiKey);
}
