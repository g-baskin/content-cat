import type { AspectRatio } from "@/lib/fal/video-config";

export interface VideoPreset {
  id: string;
  name: string;
  description: string;
  suggestedPrompt: string;
  aspectRatio: AspectRatio;
  duration: string;
  style?: string;
}

export const videoPresets: Record<string, VideoPreset> = {
  "video-ads": {
    id: "video-ads",
    name: "Video Ads",
    description: "Create scroll-stopping video ads that convert",
    suggestedPrompt:
      "A dynamic, attention-grabbing video ad with smooth transitions, bold text overlays, and engaging visuals. Professional product showcase with cinematic lighting and quick cuts to maintain viewer attention.",
    aspectRatio: "9:16",
    duration: "5s",
    style: "cinematic",
  },
  "horror-shorts": {
    id: "horror-shorts",
    name: "Horror Shorts",
    description: "Terrifying short-form content that keeps viewers hooked",
    suggestedPrompt:
      "A dark, atmospheric horror scene with subtle movements in the shadows. Eerie lighting, fog effects, and unsettling camera movements create tension and suspense.",
    aspectRatio: "9:16",
    duration: "5s",
    style: "dark",
  },
  educational: {
    id: "educational",
    name: "Educational",
    description: "Engaging explainers and tutorials that teach",
    suggestedPrompt:
      "A clean, professional educational video with clear visuals, animated diagrams, and smooth transitions. Well-lit scene with focus on clarity and comprehension.",
    aspectRatio: "16:9",
    duration: "10s",
    style: "clean",
  },
  "funny-shorts": {
    id: "funny-shorts",
    name: "Funny Shorts",
    description: "Comedy content that gets shares and laughs",
    suggestedPrompt:
      "A humorous, lighthearted scene with exaggerated expressions and comedic timing. Bright, energetic visuals with playful camera movements and surprise elements.",
    aspectRatio: "9:16",
    duration: "5s",
    style: "vibrant",
  },
  "viral-shorts": {
    id: "viral-shorts",
    name: "Viral Shorts",
    description: "Trending formats optimized for maximum reach",
    suggestedPrompt:
      "An eye-catching, trend-aware video with satisfying visuals and smooth transitions. Dynamic camera movements, vibrant colors, and elements designed for maximum engagement.",
    aspectRatio: "9:16",
    duration: "5s",
    style: "trendy",
  },
  "personal-branding": {
    id: "personal-branding",
    name: "Personal Branding",
    description: "Build your online presence with professional content",
    suggestedPrompt:
      "A professional, polished personal brand video with confident presentation. Clean background, perfect lighting, and smooth movements that convey expertise and trustworthiness.",
    aspectRatio: "9:16",
    duration: "5s",
    style: "professional",
  },
};

export function getVideoPreset(presetId: string): VideoPreset | null {
  return videoPresets[presetId] || null;
}

export function getAllVideoPresets(): VideoPreset[] {
  return Object.values(videoPresets);
}
