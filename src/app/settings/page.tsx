"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/csrf";

interface ApiKeyConfig {
  id: string;
  service: string;
  maskedKey: string;
  isActive: boolean;
  createdAt: string;
}

type ServiceType =
  | "fal"
  | "midjourney"
  | "google-gemini"
  | "freepik"
  | "openai"
  | "runway"
  | "pika"
  | "luma"
  | "elevenlabs"
  | "fishaudio";

interface ServiceInfo {
  service: ServiceType;
  label: string;
  description: string;
  docsUrl: string;
  category: "image" | "video" | "audio";
}

const SERVICES: ServiceInfo[] = [
  // Image Generation
  {
    service: "fal",
    label: "FAL.ai",
    description: "Kling, Wan, Veo video + Flux image models",
    docsUrl: "https://docs.fal.ai/",
    category: "image",
  },
  {
    service: "midjourney",
    label: "Midjourney",
    description: "Midjourney v6 & Niji 6 models",
    docsUrl: "https://docs.midjourney.com/",
    category: "image",
  },
  {
    service: "google-gemini",
    label: "Google Gemini",
    description: "Gemini 2.5 Flash & Gemini 3 Pro models",
    docsUrl: "https://ai.google.dev/",
    category: "image",
  },
  {
    service: "freepik",
    label: "Freepik",
    description: "Mystic, Flux, & Seedream models",
    docsUrl: "https://docs.freepik.com/",
    category: "image",
  },
  // Video Generation
  {
    service: "openai",
    label: "OpenAI",
    description: "Sora 2 & Sora 2 Pro video generation + TTS",
    docsUrl: "https://platform.openai.com/docs",
    category: "video",
  },
  {
    service: "runway",
    label: "Runway",
    description: "Gen-3 Alpha video generation",
    docsUrl: "https://docs.runwayml.com/",
    category: "video",
  },
  {
    service: "pika",
    label: "Pika",
    description: "Pika 2.0 video generation",
    docsUrl: "https://pika.art/",
    category: "video",
  },
  {
    service: "luma",
    label: "Luma AI",
    description: "Dream Machine video generation",
    docsUrl: "https://lumalabs.ai/",
    category: "video",
  },
  // Audio
  {
    service: "elevenlabs",
    label: "ElevenLabs",
    description: "High-quality text-to-speech voices",
    docsUrl: "https://docs.elevenlabs.io/",
    category: "audio",
  },
  {
    service: "fishaudio",
    label: "Fish Audio",
    description: "SOTA open-source TTS with voice cloning (OpenAudio S1)",
    docsUrl: "https://docs.fish.audio/",
    category: "audio",
  },
];

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [formData, setFormData] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch("/api/api-keys");
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }
      const keys = await response.json();
      setApiKeys(keys);
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      toast.error("Failed to load API keys. Please log in first.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKey = async (service: string) => {
    if (!formData.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiFetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, apiKey: formData }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to save API key");
        return;
      }

      toast.success(result.message || "API key saved successfully");
      setFormData("");
      setShowForm(null);
      await fetchApiKeys();
    } catch (error) {
      console.error("Error saving API key:", error);
      toast.error("Failed to save API key");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) {
      return;
    }

    try {
      const response = await apiFetch(`/api/api-keys/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to delete API key");
        return;
      }

      toast.success("API key deleted successfully");
      await fetchApiKeys();
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Failed to delete API key");
    }
  };

  const getKeyForService = (service: string) =>
    apiKeys.find((k) => k.service === service);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-black">
      <Header />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl space-y-8 p-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-sm text-zinc-400">
              Manage your API keys for AI generation services
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-3 inline-block size-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
                <p className="text-sm text-zinc-400">Loading API keys...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Image Generation */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-zinc-300">Image Generation</h2>
                <div className="space-y-4">
                  {SERVICES.filter((s) => s.category === "image").map((serviceInfo) => renderServiceCard(serviceInfo, getKeyForService, showForm, setShowForm, formData, setFormData, handleAddKey, handleDeleteKey, isSubmitting))}
                </div>
              </div>

              {/* Video Generation */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-zinc-300">Video Generation</h2>
                <div className="space-y-4">
                  {SERVICES.filter((s) => s.category === "video").map((serviceInfo) => renderServiceCard(serviceInfo, getKeyForService, showForm, setShowForm, formData, setFormData, handleAddKey, handleDeleteKey, isSubmitting))}
                </div>
              </div>

              {/* Audio / TTS */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-zinc-300">Audio & Text-to-Speech</h2>
                <div className="space-y-4">
                  {SERVICES.filter((s) => s.category === "audio").map((serviceInfo) => renderServiceCard(serviceInfo, getKeyForService, showForm, setShowForm, formData, setFormData, handleAddKey, handleDeleteKey, isSubmitting))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderServiceCard(
  serviceInfo: ServiceInfo,
  getKeyForService: (service: string) => ApiKeyConfig | undefined,
  showForm: string | null,
  setShowForm: (v: string | null) => void,
  formData: string,
  setFormData: (v: string) => void,
  handleAddKey: (service: string) => Promise<void>,
  handleDeleteKey: (id: string) => Promise<void>,
  isSubmitting: boolean
) {
  const existingKey = getKeyForService(serviceInfo.service);
  const isFormOpen = showForm === serviceInfo.service;

  return (
    <div
      key={serviceInfo.service}
      className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">
            {serviceInfo.label}
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            {serviceInfo.description}
          </p>
          <a
            href={serviceInfo.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-blue-400 hover:text-blue-300"
          >
            View Documentation →
          </a>
        </div>

        {existingKey && (
          <div className="rounded bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
            ✓ Configured
          </div>
        )}
      </div>

      {existingKey && !isFormOpen && (
        <div className="mt-4 space-y-3">
          <div className="rounded bg-white/5 p-3">
            <p className="text-xs text-zinc-500">API Key</p>
            <p className="font-mono text-sm text-zinc-300">
              {existingKey.maskedKey}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(serviceInfo.service)}
              className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Update Key
            </button>
            <button
              onClick={() => handleDeleteKey(existingKey.id)}
              className="flex-1 rounded bg-red-600/20 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-600/30"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="mt-4 space-y-3">
          <textarea
            value={formData}
            onChange={(e) => setFormData(e.target.value)}
            placeholder="Paste your API key here"
            className="hide-scrollbar w-full resize-none rounded border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAddKey(serviceInfo.service)}
              disabled={isSubmitting || !formData.trim()}
              className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Key"}
            </button>
            <button
              onClick={() => {
                setShowForm(null);
                setFormData("");
              }}
              disabled={isSubmitting}
              className="flex-1 rounded border border-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!existingKey && !isFormOpen && (
        <button
          onClick={() => setShowForm(serviceInfo.service)}
          className="mt-4 w-full rounded border border-dashed border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/5"
        >
          + Add API Key
        </button>
      )}
    </div>
  );
}
