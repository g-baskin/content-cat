export interface Scene {
  id: string;
  storyboardId: string;
  order: number;
  name: string | null;
  prompt: string;
  duration: number;
  aspectRatio: string;
  service: string;
  model: string;
  status: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
  negativePrompt: string | null;
  seed: number | null;
  cfgScale: number | null;
  enableAudio: boolean;
  startImageUrl: string | null;
  endImageUrl: string | null;
  transition: string | null;
  transitionDuration: number | null;
  dialogueText: string | null;
  dialogueVoice: string | null;
  dialogueUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Storyboard {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: string;
  totalDuration: number;
  aspectRatio: string;
  finalVideoId: string | null;
  createdAt: string;
  updatedAt: string;
  scenes: Scene[];
  finalVideo: {
    id: string;
    url: string;
  } | null;
}

export type TransitionType = "cut" | "fade" | "dissolve" | "wipe";

export type SceneStatus = "pending" | "generating" | "complete" | "failed";

export type StoryboardStatus = "draft" | "generating" | "complete" | "failed";
