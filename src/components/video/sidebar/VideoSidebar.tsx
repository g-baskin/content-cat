"use client";

import type {
  VideoModelId,
  VideoGenerationState,
  VideoAspectRatio,
  VideoDuration,
  VideoResolution,
  VideoModelConfig,
} from "@/lib/fal";
import { SparkleIcon } from "../icons";
import CreateVideoForm from "./CreateVideoForm";

interface VideoSidebarProps {
  // Video generation state
  videoState: VideoGenerationState;
  modelConfig: VideoModelConfig;
  isGenerating: boolean;
  // Image upload state
  startImageUrl: string | null;
  endImageUrl: string | null;
  isSwapping: boolean;
  startImageInputRef: React.RefObject<HTMLInputElement | null>;
  endImageInputRef: React.RefObject<HTMLInputElement | null>;
  // Handlers
  onUpdateVideoState: (updates: Partial<VideoGenerationState>) => void;
  onModelChange: (modelId: VideoModelId) => void;
  onDurationChange: (duration: VideoDuration) => void;
  onAspectChange: (aspectRatio: VideoAspectRatio) => void;
  onResolutionChange: (resolution: VideoResolution) => void;
  onImageUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "start" | "end" | "single"
  ) => void;
  onClearImage: (type: "start" | "end" | "single") => void;
  onSwapImages: () => void;
  onGenerate: () => void;
  // Preset selection
  onOpenPresetSelector?: () => void;
}

export default function VideoSidebar({
  videoState,
  modelConfig,
  isGenerating,
  startImageUrl,
  endImageUrl,
  isSwapping,
  startImageInputRef,
  endImageInputRef,
  onUpdateVideoState,
  onModelChange,
  onDurationChange,
  onAspectChange,
  onResolutionChange,
  onImageUpload,
  onClearImage,
  onSwapImages,
  onGenerate,
  onOpenPresetSelector,
}: VideoSidebarProps) {
  return (
    <aside className="mb-4 ml-4 flex w-80 flex-col rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-medium text-white">Create Video</h2>
      </div>

      {/* Scrollable Content */}
      <div className="hide-scrollbar flex-1 space-y-2 overflow-y-auto px-4 py-4">
        <CreateVideoForm
          videoState={videoState}
          modelConfig={modelConfig}
          startImageUrl={startImageUrl}
          endImageUrl={endImageUrl}
          isSwapping={isSwapping}
          startImageInputRef={startImageInputRef}
          endImageInputRef={endImageInputRef}
          onUpdateVideoState={onUpdateVideoState}
          onModelChange={onModelChange}
          onDurationChange={onDurationChange}
          onAspectChange={onAspectChange}
          onResolutionChange={onResolutionChange}
          onImageUpload={onImageUpload}
          onClearImage={onClearImage}
          onSwapImages={onSwapImages}
          onOpenPresetSelector={onOpenPresetSelector}
        />
      </div>

      {/* Generate Button - Fixed at bottom */}
      <div className="px-4 pt-3 pb-4">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-pink-400 text-sm font-semibold text-black shadow-[inset_0px_-3px_rgba(0,0,0,0.25)] transition hover:bg-pink-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="size-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              Generating...
            </>
          ) : (
            <>
              Generate
              <SparkleIcon />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
