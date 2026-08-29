"use client";

import { useState, useRef } from "react";
import { NestedDropdown, SimpleDropdown } from "@/components/Dropdown";
import type {
  VideoModelId,
  VideoGenerationState,
  VideoAspectRatio,
  VideoDuration,
  VideoResolution,
  VideoModelConfig,
  VideoMode,
  VideoSpeed,
} from "@/lib/fal";
import { ChevronDownIcon, InfoIcon, EditIcon } from "../icons";
import { getModelGroups } from "../constants";
import ImageUploadSection from "./ImageUploadSection";
import PromptSection from "./PromptSection";

interface CreateVideoFormProps {
  // Video state
  videoState: VideoGenerationState;
  modelConfig: VideoModelConfig;
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
  // Preset selection
  onOpenPresetSelector?: () => void;
}

export default function CreateVideoForm({
  videoState,
  modelConfig,
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
  onOpenPresetSelector,
}: CreateVideoFormProps) {
  // Local UI state
  const [selectedPreset] = useState("General");

  // Dropdown visibility states
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showAspectDropdown, setShowAspectDropdown] = useState(false);
  const [showResolutionDropdown, setShowResolutionDropdown] = useState(false);
  const [showSpecialFxDropdown, setShowSpecialFxDropdown] = useState(false);

  // Dropdown trigger refs
  const modelTriggerRef = useRef<HTMLButtonElement>(null);
  const durationTriggerRef = useRef<HTMLButtonElement>(null);
  const aspectTriggerRef = useRef<HTMLButtonElement>(null);
  const resolutionTriggerRef = useRef<HTMLButtonElement>(null);
  const specialFxTriggerRef = useRef<HTMLButtonElement>(null);

  const handleModelChangeWithDropdown = (modelId: VideoModelId) => {
    onModelChange(modelId);
    setShowModelDropdown(false);
  };

  const handleDurationChangeWithDropdown = (duration: VideoDuration) => {
    onDurationChange(duration);
    setShowDurationDropdown(false);
  };

  const handleAspectChangeWithDropdown = (aspectRatio: VideoAspectRatio) => {
    onAspectChange(aspectRatio);
    setShowAspectDropdown(false);
  };

  const handleResolutionChangeWithDropdown = (resolution: VideoResolution) => {
    onResolutionChange(resolution);
    setShowResolutionDropdown(false);
  };

  const handleSpecialFxChangeWithDropdown = (fx: string) => {
    onUpdateVideoState({ specialFx: fx || undefined });
    setShowSpecialFxDropdown(false);
  };

  // Special FX options for Kling 2.5 Turbo
  const specialFxOptions = [
    { id: "", label: "None" },
    { id: "hug", label: "Hug" },
    { id: "kiss", label: "Kiss" },
    { id: "heart_gesture", label: "Heart Gesture" },
    { id: "squish", label: "Squish" },
    { id: "expansion", label: "Expansion" },
    { id: "fuzzyfuzzy", label: "Fuzzy" },
    { id: "bloombloom", label: "Bloom" },
    { id: "dizzydizzy", label: "Dizzy" },
    { id: "jelly_press", label: "Jelly Press" },
    { id: "jelly_slice", label: "Jelly Slice" },
    { id: "jelly_squish", label: "Jelly Squish" },
    { id: "jelly_jiggle", label: "Jelly Jiggle" },
    { id: "pixelpixel", label: "Pixel" },
    { id: "yearbook", label: "Yearbook" },
    { id: "instant_film", label: "Instant Film" },
    { id: "anime_figure", label: "Anime Figure" },
    { id: "rocketrocket", label: "Rocket" },
  ];

  return (
    <>
      {/* Preset Card */}
      <figure
        className="group relative aspect-[2.3] w-full cursor-pointer overflow-hidden rounded-xl select-none"
        onClick={onOpenPresetSelector}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-teal-800 to-amber-900" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 50%)",
          }}
        />
        <figcaption className="absolute bottom-0 left-0 z-10 w-full pr-1.5 pb-3 pl-3">
          <p className="font-heading w-full truncate text-lg font-bold text-pink-400 uppercase">
            {selectedPreset}
          </p>
          <p className="text-xs text-white">{modelConfig.name}</p>
        </figcaption>
        <button
          className="absolute top-1.5 right-1.5 z-20 flex h-6 items-center gap-1 rounded-lg border border-white/10 bg-black/60 px-2 text-xs text-white backdrop-blur-sm transition-colors hover:bg-pink-400 hover:text-black"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPresetSelector?.();
          }}
        >
          <EditIcon />
          Change
        </button>
      </figure>

      {/* Upload Image Section */}
      <ImageUploadSection
        supportsStartEndFrames={modelConfig.supportsStartEndFrames}
        startImageUrl={startImageUrl}
        endImageUrl={endImageUrl}
        isSwapping={isSwapping}
        startImageInputRef={startImageInputRef}
        endImageInputRef={endImageInputRef}
        onImageUpload={onImageUpload}
        onClearImage={onClearImage}
        onSwapImages={onSwapImages}
        singleImageUrl={videoState.imageUrl}
        mode={
          videoState.model === "veo-3.1"
            ? (videoState.mode as "image-to-video" | "first-last-frame")
            : undefined
        }
      />

      {/* Prompt Section */}
      <PromptSection
        prompt={videoState.prompt}
        maxLength={modelConfig.maxPromptLength}
        enhanceEnabled={videoState.enhanceEnabled}
        supportsPromptEnhancement={modelConfig.supportsPromptEnhancement}
        onPromptChange={(prompt) => onUpdateVideoState({ prompt })}
        onEnhanceToggle={() =>
          onUpdateVideoState({ enhanceEnabled: !videoState.enhanceEnabled })
        }
      />

      {/* Audio Toggle - Only show if model supports audio */}
      {modelConfig.supportsAudio && (
        <fieldset>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex flex-row items-center justify-between gap-1.5">
              <div className="flex shrink-0 items-center gap-1 text-sm text-white">
                <span className="font-medium">Audio</span>
                <button className="text-zinc-400">
                  <InfoIcon />
                </button>
              </div>
              <button
                onClick={() =>
                  onUpdateVideoState({
                    audioEnabled: !videoState.audioEnabled,
                  })
                }
                className={`relative inline-flex h-6 w-9 shrink-0 cursor-pointer items-center rounded-full transition ${
                  videoState.audioEnabled ? "bg-pink-400" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none absolute top-1/2 left-0.5 h-4 w-4 -translate-y-1/2 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                    videoState.audioEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </fieldset>
      )}

      {/* Veo 3.1 Mode & Speed Toggles */}
      {videoState.model === "veo-3.1" && (
        <fieldset>
          <div className="flex gap-2">
            {/* Mode Toggle */}
            <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 text-xs font-medium text-zinc-300">Mode</div>
              <div className="flex gap-1">
                <button
                  onClick={() => onUpdateVideoState({ mode: "image-to-video" as VideoMode })}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition ${
                    videoState.mode === "image-to-video"
                      ? "bg-pink-400 text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  Img2Vid
                </button>
                <button
                  onClick={() => onUpdateVideoState({ mode: "first-last-frame" as VideoMode })}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition ${
                    videoState.mode === "first-last-frame"
                      ? "bg-pink-400 text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  First/Last
                </button>
              </div>
            </div>

            {/* Speed Toggle */}
            <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 text-xs font-medium text-zinc-300">Speed</div>
              <div className="flex gap-1">
                <button
                  onClick={() => onUpdateVideoState({ speed: "standard" as VideoSpeed })}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition ${
                    (videoState.speed || "standard") === "standard"
                      ? "bg-pink-400 text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => onUpdateVideoState({ speed: "fast" as VideoSpeed })}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition ${
                    videoState.speed === "fast"
                      ? "bg-pink-400 text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  Fast
                </button>
              </div>
            </div>
          </div>
        </fieldset>
      )}

      {/* Model Selection */}
      <fieldset className="relative">
        <button
          ref={modelTriggerRef}
          onClick={() => setShowModelDropdown(!showModelDropdown)}
          className="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10"
        >
          <div className="grid">
            <span className="text-xs font-medium whitespace-nowrap text-zinc-300">
              Model
            </span>
            <div className="text-sm font-medium text-white">
              {modelConfig.name}
            </div>
          </div>
          <ChevronDownIcon />
        </button>
        <NestedDropdown
          isOpen={showModelDropdown}
          onClose={() => setShowModelDropdown(false)}
          value={videoState.model}
          onChange={(id) => handleModelChangeWithDropdown(id as VideoModelId)}
          triggerRef={modelTriggerRef}
          groups={getModelGroups()}
        />
      </fieldset>

      {/* Duration & Aspect Ratio */}
      <fieldset>
        <div className="flex w-full items-center gap-2">
          {/* Duration Dropdown */}
          <div className="relative flex-1">
            <button
              ref={durationTriggerRef}
              onClick={() => setShowDurationDropdown(!showDurationDropdown)}
              className="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10"
            >
              <div className="grid">
                <span className="text-xs font-medium whitespace-nowrap text-zinc-300">
                  Duration
                </span>
                <div className="text-sm font-medium text-white">
                  {videoState.duration}s
                </div>
              </div>
              <ChevronDownIcon />
            </button>
            <SimpleDropdown
              isOpen={showDurationDropdown}
              onClose={() => setShowDurationDropdown(false)}
              value={videoState.duration}
              onChange={(id) =>
                handleDurationChangeWithDropdown(id as VideoDuration)
              }
              triggerRef={durationTriggerRef}
              options={modelConfig.durations.map((d) => ({
                id: d,
                label: `${d} seconds`,
              }))}
            />
          </div>

          {/* Aspect Ratio Dropdown */}
          <div className="relative flex-1">
            <button
              ref={aspectTriggerRef}
              onClick={() => setShowAspectDropdown(!showAspectDropdown)}
              className="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10"
            >
              <div className="grid">
                <span className="text-xs font-medium whitespace-nowrap text-zinc-300">
                  Aspect Ratio
                </span>
                <div className="text-sm font-medium text-white">
                  {videoState.aspectRatio}
                </div>
              </div>
              <ChevronDownIcon />
            </button>
            <SimpleDropdown
              isOpen={showAspectDropdown}
              onClose={() => setShowAspectDropdown(false)}
              value={videoState.aspectRatio}
              onChange={(id) =>
                handleAspectChangeWithDropdown(id as VideoAspectRatio)
              }
              triggerRef={aspectTriggerRef}
              options={modelConfig.aspectRatios.map((ar) => ({
                id: ar,
                label: ar,
              }))}
            />
          </div>
        </div>
      </fieldset>

      {/* Resolution - Only show if model supports multiple resolutions */}
      {modelConfig.resolutions && modelConfig.resolutions.length > 0 && (
        <fieldset className="relative">
          <button
            ref={resolutionTriggerRef}
            onClick={() => setShowResolutionDropdown(!showResolutionDropdown)}
            className="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10"
          >
            <div className="grid">
              <span className="text-xs font-medium whitespace-nowrap text-zinc-300">
                Resolution
              </span>
              <div className="text-sm font-medium text-white">
                {videoState.resolution || modelConfig.resolutions[0]}
              </div>
            </div>
            <ChevronDownIcon />
          </button>
          <SimpleDropdown
            isOpen={showResolutionDropdown}
            onClose={() => setShowResolutionDropdown(false)}
            value={videoState.resolution || modelConfig.resolutions[0]}
            onChange={(id) =>
              handleResolutionChangeWithDropdown(id as VideoResolution)
            }
            triggerRef={resolutionTriggerRef}
            options={modelConfig.resolutions.map((res) => ({
              id: res,
              label: res,
            }))}
          />
        </fieldset>
      )}

      {/* Special FX - Only show for Kling 2.5 Turbo */}
      {modelConfig.supportsSpecialFx && (
        <fieldset className="relative">
          <button
            ref={specialFxTriggerRef}
            onClick={() => setShowSpecialFxDropdown(!showSpecialFxDropdown)}
            className="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10"
          >
            <div className="grid">
              <span className="text-xs font-medium whitespace-nowrap text-zinc-300">
                Special FX
              </span>
              <div className="text-sm font-medium text-white">
                {videoState.specialFx
                  ? specialFxOptions.find((o) => o.id === videoState.specialFx)
                      ?.label || "None"
                  : "None"}
              </div>
            </div>
            <ChevronDownIcon />
          </button>
          <SimpleDropdown
            isOpen={showSpecialFxDropdown}
            onClose={() => setShowSpecialFxDropdown(false)}
            value={videoState.specialFx || ""}
            onChange={(id) => handleSpecialFxChangeWithDropdown(id)}
            triggerRef={specialFxTriggerRef}
            options={specialFxOptions}
          />
        </fieldset>
      )}
    </>
  );
}
