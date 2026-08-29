import type { ITTSProvider, TTSRequest, TTSResponse, Voice, TTSService } from "./types";

const FISHAUDIO_API_BASE = "https://api.fish.audio/v1";

// Default voices from Fish Audio
const DEFAULT_VOICES: Voice[] = [
  { id: "default", name: "Default Voice", gender: "neutral" },
  { id: "aria", name: "Aria", gender: "female" },
  { id: "roger", name: "Roger", gender: "male" },
  { id: "sarah", name: "Sarah", gender: "female" },
  { id: "george", name: "George", gender: "male" },
];

interface FishAudioVoice {
  _id: string;
  title: string;
  description?: string;
  cover_image?: string;
  samples?: Array<{ url: string }>;
}

export class FishAudioTTSProvider implements ITTSProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getService(): TTSService {
    return "fishaudio";
  }

  async getVoices(): Promise<Voice[]> {
    try {
      // Fetch public models from Fish Audio
      const response = await fetch(`${FISHAUDIO_API_BASE}/models?page=1&page_size=20&sort=score`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        console.error("Fish Audio voices error:", await response.text());
        return DEFAULT_VOICES;
      }

      const data = await response.json();
      const voices: Voice[] = (data.items || []).map((v: FishAudioVoice) => ({
        id: v._id,
        name: v.title || "Unnamed Voice",
        previewUrl: v.samples?.[0]?.url,
      }));

      // Add default voices if API returned some
      return voices.length > 0 ? voices : DEFAULT_VOICES;
    } catch (error) {
      console.error("Failed to fetch Fish Audio voices:", error);
      return DEFAULT_VOICES;
    }
  }

  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      const { text, voiceId } = request;

      const response = await fetch(`${FISHAUDIO_API_BASE}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text,
          reference_id: voiceId === "default" ? undefined : voiceId,
          format: "mp3",
          mp3_bitrate: 128,
          normalize: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fish Audio TTS error:", errorText);
        return {
          success: false,
          error: `Fish Audio API error: ${response.status}`,
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
      console.error("Fish Audio TTS error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate speech",
      };
    }
  }
}

export function createFishAudioTTSProvider(apiKey: string): ITTSProvider {
  return new FishAudioTTSProvider(apiKey);
}
