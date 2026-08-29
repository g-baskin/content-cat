"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Trash2,
  Loader2,
  RefreshCw,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  X,
  Mic,
  Save,
  Check,
} from "lucide-react";
import { apiFetch } from "@/lib/csrf";
import type { Scene, TransitionType } from "./types";

interface Voice {
  id: string;
  name: string;
}

interface SceneConfigPanelProps {
  scene: Scene;
  onUpdate: (updates: Partial<Scene>) => void;
  onDelete: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const SERVICES = [
  { id: "fal", name: "FAL.ai", models: ["kling-2.6", "kling-2.5-turbo", "wan-2.6", "veo-3.1"] },
  { id: "openai", name: "OpenAI Sora", models: ["sora-2", "sora-2-pro"] },
  { id: "runway", name: "Runway", models: ["gen-3-alpha", "gen-3-alpha-turbo"] },
  { id: "pika", name: "Pika", models: ["pika-2.0", "pika-1.5"] },
  { id: "luma", name: "Luma", models: ["dream-machine", "dream-machine-1.5"] },
];

const TRANSITIONS: { id: TransitionType; name: string }[] = [
  { id: "cut", name: "Cut" },
  { id: "fade", name: "Fade" },
  { id: "dissolve", name: "Dissolve" },
  { id: "wipe", name: "Wipe" },
];

const DURATIONS = [4, 5, 6, 8, 10, 12, 15];

const TTS_SERVICES = [
  { id: "openai", name: "OpenAI TTS" },
  { id: "elevenlabs", name: "ElevenLabs" },
  { id: "fishaudio", name: "Fish Audio" },
  { id: "f5tts", name: "F5-TTS (Voice Clone)" },
];

// Wrapper component that uses key to reset state when scene changes
export default function SceneConfigPanel(props: SceneConfigPanelProps) {
  return <SceneConfigPanelInner key={props.scene.id} {...props} />;
}

function SceneConfigPanelInner({
  scene,
  onUpdate,
  onDelete,
  onGenerate,
  isGenerating,
}: SceneConfigPanelProps) {
  const [localPrompt, setLocalPrompt] = useState(scene.prompt);
  const [localName, setLocalName] = useState(scene.name || "");
  const [localDialogue, setLocalDialogue] = useState(scene.dialogueText || "");
  const [localService, setLocalService] = useState(scene.service);
  const [localModel, setLocalModel] = useState(scene.model);
  const [localDuration, setLocalDuration] = useState(scene.duration);
  const [localAspectRatio, setLocalAspectRatio] = useState(scene.aspectRatio);
  const [localEnableAudio, setLocalEnableAudio] = useState(scene.enableAudio);
  const [localTransition, setLocalTransition] = useState(scene.transition || "cut");
  const [localTransitionDuration, setLocalTransitionDuration] = useState(scene.transitionDuration || 0.5);
  const [localVoice, setLocalVoice] = useState(scene.dialogueVoice || "");
  const [ttsService, setTtsService] = useState<string>("openai");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    localPrompt !== scene.prompt ||
    localName !== (scene.name || "") ||
    localDialogue !== (scene.dialogueText || "") ||
    localService !== scene.service ||
    localModel !== scene.model ||
    localDuration !== scene.duration ||
    localAspectRatio !== scene.aspectRatio ||
    localEnableAudio !== scene.enableAudio ||
    localTransition !== (scene.transition || "cut") ||
    localTransitionDuration !== (scene.transitionDuration || 0.5) ||
    localVoice !== (scene.dialogueVoice || "");

  // Fetch voices when TTS service changes
  useEffect(() => {
    const fetchVoices = async () => {
      setIsLoadingVoices(true);
      try {
        const response = await apiFetch(`/api/tts/voices?service=${ttsService}`);
        if (response.ok) {
          const data = await response.json();
          setVoices(data.voices || []);
        } else {
          setVoices([]);
        }
      } catch {
        setVoices([]);
      } finally {
        setIsLoadingVoices(false);
      }
    };
    fetchVoices();
  }, [ttsService]);

  // Update local model when service changes
  useEffect(() => {
    const serviceModels = SERVICES.find((s) => s.id === localService)?.models || [];
    if (!serviceModels.includes(localModel)) {
      setLocalModel(serviceModels[0] || "kling-2.6");
    }
  }, [localService, localModel]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const updates: Partial<Scene> = {};

      if (localPrompt !== scene.prompt) updates.prompt = localPrompt;
      if (localName !== (scene.name || "")) updates.name = localName || null;
      if (localDialogue !== (scene.dialogueText || "")) updates.dialogueText = localDialogue || null;
      if (localService !== scene.service) updates.service = localService;
      if (localModel !== scene.model) updates.model = localModel;
      if (localDuration !== scene.duration) updates.duration = localDuration;
      if (localAspectRatio !== scene.aspectRatio) updates.aspectRatio = localAspectRatio;
      if (localEnableAudio !== scene.enableAudio) updates.enableAudio = localEnableAudio;
      if (localTransition !== (scene.transition || "cut")) updates.transition = localTransition;
      if (localTransitionDuration !== (scene.transitionDuration || 0.5)) updates.transitionDuration = localTransitionDuration;
      if (localVoice !== (scene.dialogueVoice || "")) updates.dialogueVoice = localVoice || null;

      if (Object.keys(updates).length > 0) {
        onUpdate(updates);
      }

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  }, [
    localPrompt, localName, localDialogue, localService, localModel,
    localDuration, localAspectRatio, localEnableAudio, localTransition,
    localTransitionDuration, localVoice, scene, onUpdate
  ]);

  const currentService = SERVICES.find((s) => s.id === localService) || SERVICES[0];

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Scene {scene.order + 1}</span>
          {hasUnsavedChanges && (
            <span className="text-xs text-orange-400">Unsaved</span>
          )}
          {justSaved && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
          {!hasUnsavedChanges && !justSaved && scene.status === "complete" && (
            <span className="text-xs text-green-400">Ready</span>
          )}
          {!hasUnsavedChanges && !justSaved && scene.status === "generating" && (
            <span className="text-xs text-yellow-400">Generating...</span>
          )}
          {!hasUnsavedChanges && !justSaved && scene.status === "failed" && (
            <span className="text-xs text-red-400">Failed</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className={`p-1.5 rounded transition-colors ${
              hasUnsavedChanges
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "hover:bg-zinc-800 text-zinc-400"
            } disabled:opacity-50`}
            title="Save changes"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Scene Name */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Scene Name</label>
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder={`Scene ${scene.order + 1}`}
            className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Prompt</label>
          <textarea
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
            placeholder="Describe what happens in this scene..."
          />
        </div>

        {/* Service & Model */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Service</label>
            <select
              value={localService}
              onChange={(e) => setLocalService(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              {SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Model</label>
            <select
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              {currentService.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Duration & Aspect Ratio */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Duration</label>
            <select
              value={localDuration}
              onChange={(e) => setLocalDuration(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}s
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Aspect Ratio</label>
            <select
              value={localAspectRatio}
              onChange={(e) => setLocalAspectRatio(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="1:1">1:1</option>
              <option value="4:3">4:3</option>
            </select>
          </div>
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-zinc-400">Enable Audio</label>
          <button
            onClick={() => setLocalEnableAudio(!localEnableAudio)}
            className={`p-2 rounded-lg transition-colors ${
              localEnableAudio
                ? "bg-white text-black"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {localEnableAudio ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Start Image */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Start Image (Optional)</label>
          {scene.startImageUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={scene.startImageUrl}
                alt="Start frame"
                className="w-full aspect-video object-cover rounded-lg"
              />
              <button
                onClick={() => onUpdate({ startImageUrl: null })}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-full aspect-video bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Transition */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Transition</label>
            <select
              value={localTransition}
              onChange={(e) => setLocalTransition(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              {TRANSITIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Duration</label>
            <select
              value={localTransitionDuration}
              onChange={(e) => setLocalTransitionDuration(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value={0.25}>0.25s</option>
              <option value={0.5}>0.5s</option>
              <option value={0.75}>0.75s</option>
              <option value={1}>1s</option>
              <option value={1.5}>1.5s</option>
            </select>
          </div>
        </div>

        {/* Dialogue */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Dialogue (TTS)</label>
          <textarea
            value={localDialogue}
            onChange={(e) => setLocalDialogue(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
            placeholder="Character dialogue for this scene..."
          />
        </div>

        {/* Voice Selection */}
        {localDialogue.trim() && (
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Mic className="w-3 h-3" />
              Voice Settings
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Service</label>
                <select
                  value={ttsService}
                  onChange={(e) => setTtsService(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  {TTS_SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Voice</label>
                <select
                  value={localVoice}
                  onChange={(e) => setLocalVoice(e.target.value)}
                  disabled={isLoadingVoices}
                  className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-50"
                >
                  {isLoadingVoices ? (
                    <option>Loading...</option>
                  ) : voices.length === 0 ? (
                    <option value="">No API key</option>
                  ) : (
                    <>
                      <option value="">Select voice...</option>
                      {voices.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>
            {scene.dialogueUrl && (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <span>Audio generated</span>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {scene.error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400">{scene.error}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={onGenerate}
          disabled={isGenerating || !scene.prompt.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : scene.status === "complete" ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Generate Scene
            </>
          )}
        </button>
      </div>
    </div>
  );
}
