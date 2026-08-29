"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Header from "@/components/Header";
import { Plus, Film, Clock, Layers, Trash2, MoreVertical } from "lucide-react";

interface Scene {
  id: string;
  order: number;
  name: string | null;
  status: string;
  thumbnailUrl: string | null;
  duration: number;
}

interface Storyboard {
  id: string;
  name: string;
  description: string | null;
  status: string;
  totalDuration: number;
  aspectRatio: string;
  createdAt: string;
  updatedAt: string;
  scenes: Scene[];
  _count: {
    scenes: number;
  };
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    throw new Error("Failed to fetch");
  }
  return res.json();
};

export default function StoryboardListPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<{ storyboards: Storyboard[] }>(
    "/api/storyboards",
    fetcher
  );

  const handleCreateStoryboard = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/storyboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Storyboard" }),
      });

      if (response.ok) {
        const { storyboard } = await response.json();
        router.push(`/storyboard/${storyboard.id}`);
      }
    } catch (err) {
      console.error("Failed to create storyboard:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteStoryboard = async (id: string) => {
    try {
      const response = await fetch(`/api/storyboards/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        mutate();
      }
    } catch (err) {
      console.error("Failed to delete storyboard:", err);
    }
    setMenuOpenId(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-500/20 text-green-400";
      case "generating":
        return "bg-yellow-500/20 text-yellow-400";
      case "failed":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-zinc-500/20 text-zinc-400";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Storyboards</h1>
            <p className="text-zinc-400 mt-1">
              Create multi-scene videos with transitions and dialogue
            </p>
          </div>
          <button
            onClick={handleCreateStoryboard}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {isCreating ? "Creating..." : "New Storyboard"}
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-zinc-900 rounded-xl p-4 animate-pulse"
              >
                <div className="h-32 bg-zinc-800 rounded-lg mb-4" />
                <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">Failed to load storyboards</p>
            <button
              onClick={() => window.location.href = "/login"}
              className="text-sm text-zinc-400 hover:text-white underline"
            >
              Try logging in
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data?.storyboards?.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Film className="w-8 h-8 text-zinc-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No storyboards yet</h2>
            <p className="text-zinc-400 mb-6">
              Create your first storyboard to start making multi-scene videos
            </p>
            <button
              onClick={handleCreateStoryboard}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Storyboard
            </button>
          </div>
        )}

        {/* Storyboard Grid */}
        {!isLoading && !error && data?.storyboards && data.storyboards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.storyboards.map((storyboard) => (
              <div
                key={storyboard.id}
                className="bg-zinc-900 rounded-xl overflow-hidden hover:bg-zinc-800/80 transition-colors group"
              >
                {/* Scene Preview Strip */}
                <div
                  className="h-24 bg-zinc-800 flex items-center justify-center cursor-pointer"
                  onClick={() => router.push(`/storyboard/${storyboard.id}`)}
                >
                  {storyboard.scenes.length > 0 ? (
                    <div className="flex gap-1 px-2 w-full overflow-hidden">
                      {storyboard.scenes.slice(0, 5).map((scene) => (
                        <div
                          key={scene.id}
                          className="flex-1 h-20 bg-zinc-700 rounded overflow-hidden"
                        >
                          {scene.thumbnailUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={scene.thumbnailUrl}
                              alt={scene.name || `Scene ${scene.order + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                              {scene.order + 1}
                            </div>
                          )}
                        </div>
                      ))}
                      {storyboard._count.scenes > 5 && (
                        <div className="flex-1 h-20 bg-zinc-700 rounded flex items-center justify-center text-zinc-400 text-sm">
                          +{storyboard._count.scenes - 5}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-zinc-500 text-sm">No scenes</div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => router.push(`/storyboard/${storyboard.id}`)}
                    >
                      <h3 className="font-semibold truncate">{storyboard.name}</h3>
                      {storyboard.description && (
                        <p className="text-sm text-zinc-400 truncate mt-1">
                          {storyboard.description}
                        </p>
                      )}
                    </div>

                    {/* Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === storyboard.id ? null : storyboard.id);
                        }}
                        className="p-1 hover:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuOpenId === storyboard.id && (
                        <div className="absolute right-0 top-8 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 py-1 z-10">
                          <button
                            onClick={() => handleDeleteStoryboard(storyboard.id)}
                            className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-zinc-700 w-full text-left text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Layers className="w-4 h-4" />
                      <span>{storyboard._count.scenes} scenes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(storyboard.totalDuration)}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(storyboard.status)}`}
                    >
                      {storyboard.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
