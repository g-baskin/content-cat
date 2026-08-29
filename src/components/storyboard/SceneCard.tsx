"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Play, Loader2, AlertCircle, Check } from "lucide-react";
import type { Scene } from "./types";

interface SceneCardProps {
  scene: Scene;
  isSelected: boolean;
  onClick: () => void;
}

export default function SceneCard({ scene, isSelected, onClick }: SceneCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusIcon = () => {
    switch (scene.status) {
      case "generating":
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />;
      case "complete":
        return <Check className="w-4 h-4 text-green-400" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-zinc-500" />;
    }
  };

  const getStatusBorder = () => {
    if (isSelected) return "border-white";
    switch (scene.status) {
      case "generating":
        return "border-yellow-500/50";
      case "complete":
        return "border-green-500/50";
      case "failed":
        return "border-red-500/50";
      default:
        return "border-zinc-700";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex flex-col bg-zinc-800 rounded-lg overflow-hidden border-2 transition-all cursor-pointer
        ${getStatusBorder()}
        ${isDragging ? "opacity-50 shadow-2xl" : ""}
        ${isSelected ? "ring-2 ring-white/20" : "hover:border-zinc-600"}
      `}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-zinc-900">
        {scene.thumbnailUrl || scene.videoUrl ? (
          <>
            {scene.videoUrl ? (
              <video
                src={scene.videoUrl}
                className="w-full h-full object-cover"
                muted
                loop
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                }}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={scene.thumbnailUrl || undefined}
                alt={scene.name || `Scene ${scene.order + 1}`}
                className="w-full h-full object-cover"
              />
            )}
            {scene.status === "complete" && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                <Play className="w-8 h-8 text-white" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <span className="text-2xl font-bold">{scene.order + 1}</span>
          </div>
        )}

        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 p-1 bg-black/50 rounded cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-white/70" />
        </div>

        {/* Status Badge */}
        <div className="absolute top-1 right-1 p-1 bg-black/50 rounded">
          {getStatusIcon()}
        </div>
      </div>

      {/* Info */}
      <div className="p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300 truncate">
            {scene.name || `Scene ${scene.order + 1}`}
          </span>
          <span className="text-xs text-zinc-500">{scene.duration}s</span>
        </div>
        <p className="text-xs text-zinc-500 truncate mt-1">{scene.prompt}</p>
      </div>

      {/* Transition Indicator */}
      {scene.transition && scene.transition !== "cut" && (
        <div className="px-2 pb-2">
          <div className="text-xs text-zinc-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500/50" />
            {scene.transition} ({scene.transitionDuration}s)
          </div>
        </div>
      )}
    </div>
  );
}
