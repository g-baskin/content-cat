"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { apiFetch } from "@/lib/csrf";
import {
  type ImageToolType,
  TOOL_DISPLAY_NAMES,
  COLOR_GRADE_PRESETS,
} from "@/lib/image-tools/types";

interface ImageToolModalProps {
  tool: ImageToolType;
  onClose: () => void;
  onSaveToGallery?: (url: string, prompt: string) => Promise<void>;
}

// Icons
const UploadIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default function ImageToolModal({
  tool,
  onClose,
  onSaveToGallery,
}: ImageToolModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Tool-specific options
  const [strength, setStrength] = useState(50);
  const [scale, setScale] = useState<"2" | "4">("2");
  const [colorPreset, setColorPreset] = useState("cinematic");
  const [prompt, setPrompt] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload to server
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        toast.error("Failed to upload image");
        return;
      }

      const data = await response.json();
      setSourceImage(data.url);
      setResultImage(null);
      setShowResult(false);
    } catch {
      toast.error("Failed to upload image");
    }
  };

  const handleReferenceSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        toast.error("Failed to upload reference image");
        return;
      }

      const data = await response.json();
      setReferenceImage(data.url);
    } catch {
      toast.error("Failed to upload reference image");
    }
  };

  const handleProcess = async () => {
    if (!sourceImage) {
      toast.error("Please upload an image first");
      return;
    }

    if (tool === "style-transfer" && !referenceImage && !prompt) {
      toast.error("Please provide a reference image or style prompt");
      return;
    }

    setIsProcessing(true);

    try {
      const options: Record<string, unknown> = {};

      // Add tool-specific options
      switch (tool) {
        case "sharpen":
        case "portrait-enhance":
          options.strength = strength;
          break;
        case "upscale":
          options.scale = scale;
          break;
        case "color-grade":
          options.preset = colorPreset;
          break;
        case "product-photo":
        case "lighting-fix":
          if (prompt) options.prompt = prompt;
          break;
        case "style-transfer":
          options.strength = strength;
          if (prompt) options.prompt = prompt;
          if (referenceImage) options.referenceImageUrl = referenceImage;
          break;
      }

      const response = await apiFetch("/api/image-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool,
          imageUrl: sourceImage,
          options: Object.keys(options).length > 0 ? options : undefined,
        }),
        timeout: 300000, // 5 minutes
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to process image");
        return;
      }

      setResultImage(result.url);
      setShowResult(true);
      toast.success(`${TOOL_DISPLAY_NAMES[tool]} complete!`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to process image"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToGallery = async () => {
    if (!resultImage || !onSaveToGallery) return;

    try {
      await onSaveToGallery(
        resultImage,
        `${TOOL_DISPLAY_NAMES[tool]} enhanced`
      );
      toast.success("Saved to gallery!");
    } catch {
      toast.error("Failed to save to gallery");
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;

    try {
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tool}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download image");
    }
  };

  const renderToolOptions = () => {
    switch (tool) {
      case "sharpen":
      case "portrait-enhance":
        return (
          <div className="space-y-3">
            <label className="block text-sm text-zinc-400">
              Strength: {strength}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={strength}
              onChange={(e) => setStrength(parseInt(e.target.value))}
              className="w-full accent-pink-500"
            />
          </div>
        );

      case "upscale":
        return (
          <div className="space-y-3">
            <label className="block text-sm text-zinc-400">Scale</label>
            <div className="flex gap-2">
              {(["2", "4"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    scale === s
                      ? "bg-pink-500 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        );

      case "color-grade":
        return (
          <div className="space-y-3">
            <label className="block text-sm text-zinc-400">Preset</label>
            <div className="grid grid-cols-2 gap-2">
              {COLOR_GRADE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setColorPreset(preset.value)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    colorPreset === preset.value
                      ? "bg-pink-500 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        );

      case "product-photo":
      case "lighting-fix":
        return (
          <div className="space-y-3">
            <label className="block text-sm text-zinc-400">
              {tool === "product-photo"
                ? "Background Description (optional)"
                : "Lighting Description (optional)"}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                tool === "product-photo"
                  ? "e.g., Clean white studio background, soft lighting"
                  : "e.g., Natural daylight, soft shadows"
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-sm text-white placeholder:text-zinc-500 focus:border-pink-500 focus:outline-none"
              rows={3}
            />
          </div>
        );

      case "style-transfer":
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="block text-sm text-zinc-400">
                Reference Image (optional)
              </label>
              <button
                onClick={() => referenceInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-600 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-400 transition hover:border-pink-500 hover:text-pink-400"
              >
                {referenceImage ? (
                  <span className="text-green-400">Reference uploaded</span>
                ) : (
                  <>
                    <UploadIcon />
                    Upload Style Reference
                  </>
                )}
              </button>
              <input
                ref={referenceInputRef}
                type="file"
                accept="image/*"
                onChange={handleReferenceSelect}
                className="hidden"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm text-zinc-400">
                Style Prompt (optional)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Oil painting style, impressionist"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-sm text-white placeholder:text-zinc-500 focus:border-pink-500 focus:outline-none"
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm text-zinc-400">
                Strength: {strength}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={strength}
                onChange={(e) => setStrength(parseInt(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>
          </div>
        );

      case "background-remove":
      default:
        return (
          <p className="text-sm text-zinc-400">
            No additional options needed. Click Process to continue.
          </p>
        );
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-black/90 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-zinc-800 p-2 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
      >
        <CloseIcon />
      </button>

      {/* Left Panel - Image Preview */}
      <div className="flex flex-1 items-center justify-center p-8">
        {sourceImage ? (
          <div className="relative h-full w-full max-w-3xl">
            <div className="relative aspect-square h-full w-full">
              <Image
                src={showResult && resultImage ? resultImage : sourceImage}
                alt="Preview"
                fill
                unoptimized
                className="rounded-xl object-contain"
              />
            </div>

            {/* Before/After Toggle */}
            {resultImage && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/60 p-1 backdrop-blur-sm">
                <button
                  onClick={() => setShowResult(false)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    !showResult
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Before
                </button>
                <button
                  onClick={() => setShowResult(true)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    showResult
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  After
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-80 w-80 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 transition hover:border-pink-500 hover:bg-zinc-900"
          >
            <div className="rounded-full bg-zinc-800 p-4">
              <UploadIcon />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">Upload an image</p>
              <p className="mt-1 text-xs text-zinc-500">PNG, JPG up to 10MB</p>
            </div>
          </button>
        )}
      </div>

      {/* Right Panel - Controls */}
      <div className="flex w-96 flex-col border-l border-zinc-800 bg-zinc-900/50">
        <div className="border-b border-zinc-800 p-6">
          <h2 className="text-xl font-bold text-white">
            {TOOL_DISPLAY_NAMES[tool]}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {tool === "sharpen" && "Enhance image clarity and details"}
            {tool === "upscale" && "Increase resolution without losing quality"}
            {tool === "background-remove" && "Remove the background instantly"}
            {tool === "color-grade" && "Apply professional color grading"}
            {tool === "portrait-enhance" && "Enhance portrait photos"}
            {tool === "lighting-fix" && "Fix lighting and shadows"}
            {tool === "product-photo" && "Create professional product shots"}
            {tool === "style-transfer" && "Apply artistic styles"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Button (if image already selected) */}
          {sourceImage && (
            <div className="mb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-700"
              >
                <UploadIcon />
                Change Image
              </button>
            </div>
          )}

          {/* Tool-specific Options */}
          {sourceImage && renderToolOptions()}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-zinc-800 p-6 space-y-3">
          {resultImage ? (
            <>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                  <DownloadIcon />
                  Download
                </button>
                {onSaveToGallery && (
                  <button
                    onClick={handleSaveToGallery}
                    className="flex-1 rounded-lg bg-pink-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-pink-600"
                  >
                    Save to Gallery
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setResultImage(null);
                  setShowResult(false);
                }}
                className="w-full rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                Process Again
              </button>
            </>
          ) : (
            <button
              onClick={handleProcess}
              disabled={!sourceImage || isProcessing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <SpinnerIcon />
                  Processing...
                </>
              ) : (
                "Process"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
