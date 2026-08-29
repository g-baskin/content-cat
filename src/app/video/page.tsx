"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/csrf";
import Header from "@/components/Header";
import PresetSelector from "@/components/PresetSelector";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import {
  VideoSidebar,
  VideoHistoryView,
  HowItWorksSection,
  FolderIcon,
  BookIcon,
} from "@/components/video";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useVideoGeneration, useVideos, useImageUpload } from "@/hooks";
import { getVideoPreset } from "@/lib/constants/video-presets";
import type { VideoModelId } from "@/lib/fal";

function VideoPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const presetId = searchParams.get("preset");

  const [showPresetSelector, setShowPresetSelector] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isCreatingStoryboard, setIsCreatingStoryboard] = useState(false);
  const presetAppliedRef = useRef(false);

  // Video history management (SWR-cached)
  const {
    videos: generatedVideos,
    isLoading: isLoadingVideos,
    showResults,
    setShowResults,
    hasMore,
    isLoadingMore,
    addVideo,
    loadMore: loadMoreVideos,
    deleteVideo,
    downloadVideo,
    copyPrompt,
  } = useVideos();

  // Video generation state
  const {
    videoState,
    modelConfig,
    pendingCount,
    isGenerating,
    updateVideoState,
    handleModelChange,
    handleDurationChange,
    handleAspectChange,
    handleResolutionChange,
    handleGenerate,
    handleRerunVideo,
  } = useVideoGeneration({
    onVideoGenerated: (video) => {
      addVideo(video);
    },
  });

  // Image upload handling
  const {
    startImageUrl,
    endImageUrl,
    isSwapping,
    startImageInputRef,
    endImageInputRef,
    handleImageUpload,
    clearImage,
    swapImages,
    resetImages,
    attachImageFromResult,
  } = useImageUpload({
    onStartImageChange: (url) => updateVideoState({ imageUrl: url }),
    onEndImageChange: (url) => updateVideoState({ endImageUrl: url }),
    onSingleImageChange: (url) => updateVideoState({ imageUrl: url }),
    onModeChange: (mode) => updateVideoState({ mode }),
  });

  // Apply preset from URL on initial load
  useEffect(() => {
    if (presetId && !presetAppliedRef.current) {
      const preset = getVideoPreset(presetId);
      if (preset) {
        presetAppliedRef.current = true;
        updateVideoState({
          prompt: preset.suggestedPrompt,
          aspectRatio: preset.aspectRatio,
        });
      }
    }
  }, [presetId, updateVideoState]);

  // Handle model change with image reset
  const handleModelChangeWithReset = (modelId: VideoModelId) => {
    handleModelChange(modelId, {
      onStartEndFrameReset: resetImages,
    });
  };

  // Handle generate with results view
  const handleGenerateWithView = async () => {
    const success = await handleGenerate();
    if (success) {
      setShowResults(true);
    }
  };

  // Handle attach images from video result
  const handleAttachImages = (imageUrl?: string) => {
    if (imageUrl) {
      attachImageFromResult(imageUrl, modelConfig.supportsStartEndFrames);
    }
  };

  // Video delete with confirmation
  const handleDeleteWithConfirm = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      deleteVideo(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  // Create storyboard with current video settings as first scene
  const handleCreateStoryboard = async () => {
    setIsCreatingStoryboard(true);
    try {
      // Create a new storyboard
      const storyboardRes = await apiFetch("/api/storyboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Storyboard",
          description: videoState.prompt || "Created from video page",
        }),
      });

      if (!storyboardRes.ok) {
        if (storyboardRes.status === 401) {
          toast.error("Please log in to create storyboards");
          router.push("/login");
          return;
        }
        throw new Error("Failed to create storyboard");
      }

      const storyboard = await storyboardRes.json();

      // Add the first scene with current settings
      const sceneRes = await apiFetch(
        `/api/storyboards/${storyboard.id}/scenes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: videoState.prompt || "",
            duration: videoState.duration || 5,
            aspectRatio: videoState.aspectRatio || "16:9",
            model: videoState.model || "kling-2.5",
            service: "fal",
            startImageUrl: startImageUrl || null,
          }),
        }
      );

      if (!sceneRes.ok) {
        throw new Error("Failed to add scene");
      }

      toast.success("Storyboard created!");
      router.push(`/storyboard/${storyboard.id}`);
    } catch (error) {
      console.error("Error creating storyboard:", error);
      toast.error("Failed to create storyboard");
    } finally {
      setIsCreatingStoryboard(false);
    }
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <VideoSidebar
          videoState={videoState}
          modelConfig={modelConfig}
          isGenerating={isGenerating}
          startImageUrl={startImageUrl}
          endImageUrl={endImageUrl}
          isSwapping={isSwapping}
          startImageInputRef={startImageInputRef}
          endImageInputRef={endImageInputRef}
          onUpdateVideoState={updateVideoState}
          onModelChange={handleModelChangeWithReset}
          onDurationChange={handleDurationChange}
          onAspectChange={handleAspectChange}
          onResolutionChange={handleResolutionChange}
          onImageUpload={handleImageUpload}
          onClearImage={clearImage}
          onSwapImages={swapImages}
          onGenerate={handleGenerateWithView}
          onOpenPresetSelector={() => setShowPresetSelector(true)}
        />

        {/* Main Content */}
        <main className="relative flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-4">
          {showPresetSelector ? (
            /* Preset Selector View */
            <PresetSelector
              isOpen={showPresetSelector}
              onClose={() => setShowPresetSelector(false)}
              onSelectPreset={() => {}}
            />
          ) : (
            <>
              {/* Shared Tabs with sliding indicator */}
              <div className="z-10 mb-4 flex items-center gap-4">
                <nav className="relative flex gap-1 rounded-xl border border-white/10 bg-black/40 p-1 backdrop-blur-xl">
                  {/* Sliding indicator */}
                  <div
                    className={`absolute top-1 bottom-1 left-1 w-[120px] rounded-lg border border-white/10 bg-white/10 transition-all duration-200 ease-out ${
                      showResults || pendingCount > 0
                        ? "translate-x-0"
                        : "translate-x-[124px]"
                    }`}
                  />
                  <button
                    onClick={() => setShowResults(true)}
                    className={`relative z-10 flex w-[120px] items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                      showResults || pendingCount > 0
                        ? "text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <FolderIcon />
                    History
                  </button>
                  <button
                    onClick={() => setShowResults(false)}
                    className={`relative z-10 flex w-[120px] items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                      showResults || pendingCount > 0
                        ? "text-zinc-400 hover:text-white"
                        : "text-white"
                    }`}
                  >
                    <BookIcon />
                    How it works
                  </button>
                </nav>

                {/* Create Storyboard Button */}
                <button
                  onClick={handleCreateStoryboard}
                  disabled={isCreatingStoryboard}
                  className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-medium text-purple-300 transition-all hover:border-purple-500/50 hover:bg-purple-500/20 disabled:opacity-50"
                >
                  {isCreatingStoryboard ? (
                    <>
                      <div className="size-3.5 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg
                        className="size-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                        />
                      </svg>
                      Create Storyboard
                    </>
                  )}
                </button>
              </div>

              {/* Content area */}
              {showResults || pendingCount > 0 ? (
                <VideoHistoryView
                  videos={generatedVideos}
                  isLoading={isLoadingVideos}
                  pendingCount={pendingCount}
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                  onRerun={handleRerunVideo}
                  onDelete={handleDeleteWithConfirm}
                  onDownload={downloadVideo}
                  onCopy={copyPrompt}
                  onAttachImages={handleAttachImages}
                  onLoadMore={loadMoreVideos}
                />
              ) : (
                <HowItWorksSection />
              )}
            </>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmId !== null}
        title="Delete Video"
        message="Are you sure you want to delete this video? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

function VideoPageSkeleton() {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          <span className="text-sm text-zinc-400">Loading...</span>
        </div>
      </div>
    </div>
  );
}

export default function VideoPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<VideoPageSkeleton />}>
        <VideoPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
