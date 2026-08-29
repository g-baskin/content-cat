export type TTSService = "openai" | "elevenlabs" | "fishaudio" | "f5tts";

export interface Voice {
  id: string;
  name: string;
  previewUrl?: string;
  language?: string;
  gender?: "male" | "female" | "neutral";
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  speed?: number; // 0.5 to 2.0, default 1.0
  pitch?: number; // -20 to 20, default 0 (ElevenLabs only)
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  audioBuffer?: Buffer;
  duration?: number;
  error?: string;
}

export interface ITTSProvider {
  /**
   * Generate speech from text
   */
  generateSpeech(request: TTSRequest): Promise<TTSResponse>;

  /**
   * Get available voices
   */
  getVoices(): Promise<Voice[]>;

  /**
   * Get the service name
   */
  getService(): TTSService;
}
