"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Play, Download, Loader2, Film, Settings } from "lucide-react";
import Link from "next/link";
import SceneTimeline from "./SceneTimeline";
import SceneConfigPanel from "./SceneConfigPanel";
import type { Scene, Storyboard } from "./types";

interface StoryboardEditorProps {
  storyboard: Storyboard;
  onUpdate: () => void;
}

export default function StoryboardEditor({
  storyboard,
  onUpdate,
}: StoryboardEditorProps) {
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    storyboard.scenes[0]?.id || null
  );
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [isStitching, setIsStitching] = useState(false);
  const [stitchProgress, setStitchProgress] = useState<{
    step: string;
    detail: string;
  } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [localName, setLocalName] = useState(storyboard.name);

  const selectedScene = storyboard.scenes.find((s) => s.id === selectedSceneId);

  const handleAddScene = useCallback(async () => {
    try {
      const response = await fetch(`/api/storyboards/${storyboard.id}/scenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "",
          duration: 5,
          aspectRatio: storyboard.aspectRatio,
          service: "fal",
          model: "kling-2.6",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate();
        setSelectedSceneId(data.scene.id);
      }
    } catch (error) {
      console.error("Failed to add scene:", error);
    }
  }, [storyboard.id, storyboard.aspectRatio, onUpdate]);

  const handleDeleteScene = useCallback(async () => {
    if (!selectedSceneId) return;

    try {
      const response = await fetch(
        `/api/storyboards/${storyboard.id}/scenes/${selectedSceneId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        const remainingScenes = storyboard.scenes.filter(
          (s) => s.id !== selectedSceneId
        );
        setSelectedSceneId(remainingScenes[0]?.id || null);
        onUpdate();
      }
    } catch (error) {
      console.error("Failed to delete scene:", error);
    }
  }, [storyboard.id, storyboard.scenes, selectedSceneId, onUpdate]);

  const handleUpdateScene = useCallback(
    async (updates: Partial<Scene>) => {
      if (!selectedSceneId) return;

      try {
        await fetch(
          `/api/storyboards/${storyboard.id}/scenes/${selectedSceneId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );
        onUpdate();
      } catch (error) {
        console.error("Failed to update scene:", error);
      }
    },
    [storyboard.id, selectedSceneId, onUpdate]
  );

  const handleReorderScenes = useCallback(
    async (sceneIds: string[]) => {
      try {
        await fetch(`/api/storyboards/${storyboard.id}/scenes/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sceneIds }),
        });
        onUpdate();
      } catch (error) {
        console.error("Failed to reorder scenes:", error);
      }
    },
    [storyboard.id, onUpdate]
  );

  const handleGenerateScene = useCallback(async () => {
    if (!selectedScene || !selectedScene.prompt.trim()) return;

    setGeneratingSceneId(selectedSceneId);

    try {
      // Update scene status to generating
      await fetch(
        `/api/storyboards/${storyboard.id}/scenes/${selectedSceneId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "generating" }),
        }
      );
      onUpdate();

      // Generate video
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: selectedScene.prompt,
          duration: selectedScene.duration,
          aspectRatio: selectedScene.aspectRatio,
          service: selectedScene.service,
          model: selectedScene.model,
          negativePrompt: selectedScene.negativePrompt,
          seed: selectedScene.seed,
          cfgScale: selectedScene.cfgScale,
          enableAudio: selectedScene.enableAudio,
          imageUrl: selectedScene.startImageUrl,
        }),
      });

      const data = await response.json();

      if (response.ok && data.videoUrl) {
        await fetch(
          `/api/storyboards/${storyboard.id}/scenes/${selectedSceneId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "complete",
              videoUrl: data.videoUrl,
              thumbnailUrl: data.thumbnailUrl || null,
              error: null,
            }),
          }
        );
      } else {
        await fetch(
          `/api/storyboards/${storyboard.id}/scenes/${selectedSceneId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "failed",
              error: data.error || "Generation failed",
            }),
          }
        );
      }

      onUpdate();
    } catch (error) {
      console.error("Failed to generate scene:", error);
      await fetch(
        `/api/storyboards/${storyboard.id}/scenes/${selectedSceneId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "failed",
            error: error instanceof Error ? error.message : "Generation failed",
          }),
        }
      );
      onUpdate();
    } finally {
      setGeneratingSceneId(null);
    }
  }, [storyboard.id, selectedScene, selectedSceneId, onUpdate]);

  const handleGenerateAll = useCallback(async () => {
    const pendingScenes = storyboard.scenes.filter(
      (s) => s.status !== "complete" && s.prompt.trim()
    );

    for (const scene of pendingScenes) {
      setSelectedSceneId(scene.id);
      setGeneratingSceneId(scene.id);

      try {
        await fetch(`/api/storyboards/${storyboard.id}/scenes/${scene.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "generating" }),
        });
        onUpdate();

        const response = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: scene.prompt,
            duration: scene.duration,
            aspectRatio: scene.aspectRatio,
            service: scene.service,
            model: scene.model,
            enableAudio: scene.enableAudio,
            imageUrl: scene.startImageUrl,
          }),
        });

        const data = await response.json();

        await fetch(`/api/storyboards/${storyboard.id}/scenes/${scene.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: response.ok && data.videoUrl ? "complete" : "failed",
            videoUrl: data.videoUrl || null,
            thumbnailUrl: data.thumbnailUrl || null,
            error: response.ok ? null : data.error || "Generation failed",
          }),
        });

        onUpdate();
      } catch (error) {
        console.error(`Failed to generate scene ${scene.id}:`, error);
        await fetch(`/api/storyboards/${storyboard.id}/scenes/${scene.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "failed",
            error: error instanceof Error ? error.message : "Generation failed",
          }),
        });
        onUpdate();
      }
    }

    setGeneratingSceneId(null);
  }, [storyboard.id, storyboard.scenes, onUpdate]);

  const handleStitchVideo = useCallback(async () => {
    const completeScenes = storyboard.scenes.filter(
      (s) => s.status === "complete" && s.videoUrl
    );

    if (completeScenes.length === 0) {
      alert("No completed scenes to stitch");
      return;
    }

    setIsStitching(true);
    setStitchProgress({
      step: "Preparing",
      detail: `Preparing ${completeScenes.length} scenes for stitching...`,
    });

    // Simulate progress steps for better UX
    const progressSteps = [
      { step: "Downloading", detail: "Downloading scene videos...", delay: 1000 },
      { step: "Processing", detail: "Applying transitions and effects...", delay: 2000 },
      { step: "Encoding", detail: "Encoding final video...", delay: 3000 },
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setStitchProgress(progressSteps[stepIndex]);
        stepIndex++;
      }
    }, 2000);

    try {
      const response = await fetch(`/api/storyboards/${storyboard.id}/stitch`, {
        method: "POST",
      });

      clearInterval(progressInterval);

      if (response.ok) {
        setStitchProgress({ step: "Complete", detail: "Video created successfully!" });
        setTimeout(() => {
          setStitchProgress(null);
          onUpdate();
        }, 1500);
      } else {
        const data = await response.json();
        setStitchProgress(null);
        alert(data.error || "Failed to stitch video");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Failed to stitch video:", error);
      setStitchProgress(null);
      alert("Failed to stitch video");
    } finally {
      setIsStitching(false);
    }
  }, [storyboard.id, storyboard.scenes, onUpdate]);

  const handleUpdateName = useCallback(async () => {
    if (localName !== storyboard.name) {
      try {
        await fetch(`/api/storyboards/${storyboard.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: localName }),
        });
        onUpdate();
      } catch (error) {
        console.error("Failed to update name:", error);
      }
    }
    setEditingName(false);
  }, [storyboard.id, storyboard.name, localName, onUpdate]);

  const completedCount = storyboard.scenes.filter(
    (s) => s.status === "complete"
  ).length;
  const totalDuration = storyboard.scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <Link
            href="/storyboard"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {editingName ? (
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleUpdateName}
              onKeyDown={(e) => e.key === "Enter" && handleUpdateName()}
              autoFocus
              className="text-lg font-semibold bg-zinc-800 px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          ) : (
            <h1
              className="text-lg font-semibold cursor-pointer hover:text-zinc-300"
              onClick={() => setEditingName(true)}
            >
              {storyboard.name}
            </h1>
          )}

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>
              {completedCount}/{storyboard.scenes.length} scenes
            </span>
            <span>•</span>
            <span>
              {Math.floor(totalDuration / 60)}:
              {String(totalDuration % 60).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateAll}
            disabled={generatingSceneId !== null || storyboard.scenes.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingSceneId ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Generate All
              </>
            )}
          </button>

          <button
            onClick={handleStitchVideo}
            disabled={isStitching || completedCount === 0}
            className="flex items-center gap-2 px-3 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStitching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Stitching...
              </>
            ) : (
              <>
                <Film className="w-4 h-4" />
                Create Video
              </>
            )}
          </button>

          {storyboard.finalVideo && (
            <a
              href={storyboard.finalVideo.url}
              download
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 flex items-center justify-center bg-black p-4 overflow-hidden">
            {selectedScene?.videoUrl ? (
              <video
                key={selectedScene.videoUrl}
                src={selectedScene.videoUrl}
                controls
                className="rounded-lg shadow-2xl"
                style={{
                  aspectRatio: selectedScene.aspectRatio.replace(":", "/"),
                  maxHeight: "50vh",
                  maxWidth: "100%",
                  width: "auto",
                }}
              />
            ) : selectedScene?.status === "generating" ? (
              <div className="flex flex-col items-center gap-4 text-zinc-500">
                <Loader2 className="w-12 h-12 animate-spin" />
                <p className="text-sm">Generating scene...</p>
              </div>
            ) : selectedScene ? (
              <div
                className="flex flex-col items-center justify-center gap-4 bg-zinc-900 rounded-lg p-6"
                style={{
                  aspectRatio: selectedScene.aspectRatio.replace(":", "/"),
                  maxHeight: "40vh",
                  width: "auto",
                }}
              >
                <Film className="w-12 h-12 text-zinc-700" />
                <p className="text-zinc-500 text-center text-sm max-w-xs">
                  {selectedScene.prompt
                    ? "Ready to generate"
                    : "Add a prompt to generate this scene"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-zinc-500">
                <Settings className="w-12 h-12" />
                <p className="text-sm">Add a scene to get started</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <SceneTimeline
            scenes={storyboard.scenes}
            selectedSceneId={selectedSceneId}
            onSelectScene={setSelectedSceneId}
            onReorderScenes={handleReorderScenes}
            onAddScene={handleAddScene}
          />
        </div>

        {/* Config Panel */}
        {selectedScene && (
          <SceneConfigPanel
            scene={selectedScene}
            onUpdate={handleUpdateScene}
            onDelete={handleDeleteScene}
            onGenerate={handleGenerateScene}
            isGenerating={generatingSceneId === selectedSceneId}
          />
        )}
      </div>

      {/* Stitch Progress Overlay */}
      {stitchProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 p-8 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-zinc-700">
                <div className="absolute inset-0 rounded-full border-4 border-t-white animate-spin" />
              </div>
              <Film className="absolute inset-0 m-auto w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-1">
                {stitchProgress.step === "Complete" ? "Done!" : "Creating Video"}
              </h3>
              <p className="text-sm text-zinc-400 max-w-xs">
                {stitchProgress.detail}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className={`w-2 h-2 rounded-full ${stitchProgress.step === "Preparing" ? "bg-white" : "bg-zinc-600"}`} />
              <span className={`w-2 h-2 rounded-full ${stitchProgress.step === "Downloading" ? "bg-white" : "bg-zinc-600"}`} />
              <span className={`w-2 h-2 rounded-full ${stitchProgress.step === "Processing" ? "bg-white" : "bg-zinc-600"}`} />
              <span className={`w-2 h-2 rounded-full ${stitchProgress.step === "Encoding" ? "bg-white" : "bg-zinc-600"}`} />
              <span className={`w-2 h-2 rounded-full ${stitchProgress.step === "Complete" ? "bg-green-500" : "bg-zinc-600"}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
