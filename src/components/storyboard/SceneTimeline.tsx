"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, ChevronRight } from "lucide-react";
import SceneCard from "./SceneCard";
import type { Scene } from "./types";

interface SceneTimelineProps {
  scenes: Scene[];
  selectedSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  onReorderScenes: (sceneIds: string[]) => void;
  onAddScene: () => void;
}

export default function SceneTimeline({
  scenes,
  selectedSceneId,
  onSelectScene,
  onReorderScenes,
  onAddScene,
}: SceneTimelineProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = scenes.findIndex((s) => s.id === active.id);
      const newIndex = scenes.findIndex((s) => s.id === over.id);

      const newScenes = [...scenes];
      const [removed] = newScenes.splice(oldIndex, 1);
      newScenes.splice(newIndex, 0, removed);

      onReorderScenes(newScenes.map((s) => s.id));
    }
  };

  return (
    <div className="bg-zinc-900 border-t border-zinc-800">
      {/* Timeline Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">Timeline</span>
          <span className="text-xs text-zinc-500">
            {scenes.length} scene{scenes.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={onAddScene}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Scene
        </button>
      </div>

      {/* Timeline Content */}
      <div className="p-4 overflow-x-auto">
        {scenes.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-500">
            <button
              onClick={onAddScene}
              className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors"
            >
              <Plus className="w-8 h-8" />
              <span className="text-sm">Add your first scene</span>
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={scenes.map((s) => s.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex items-center gap-2">
                {scenes.map((scene, index) => (
                  <div key={scene.id} className="flex items-center">
                    <div className="w-36 flex-shrink-0">
                      <SceneCard
                        scene={scene}
                        isSelected={scene.id === selectedSceneId}
                        onClick={() => onSelectScene(scene.id)}
                      />
                    </div>
                    {index < scenes.length - 1 && (
                      <div className="flex items-center px-1">
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Scene Button */}
                <button
                  onClick={onAddScene}
                  className="w-36 h-32 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors ml-2"
                >
                  <Plus className="w-6 h-6 text-zinc-500" />
                </button>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Duration Bar */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-1 h-2">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className={`h-full rounded-full transition-colors ${
                scene.id === selectedSceneId
                  ? "bg-white"
                  : scene.status === "complete"
                  ? "bg-green-500"
                  : scene.status === "generating"
                  ? "bg-yellow-500"
                  : scene.status === "failed"
                  ? "bg-red-500"
                  : "bg-zinc-700"
              }`}
              style={{
                flex: scene.duration,
              }}
              title={`${scene.name || `Scene ${scene.order + 1}`}: ${scene.duration}s`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-zinc-500">
          <span>0:00</span>
          <span>
            {Math.floor(scenes.reduce((sum, s) => sum + s.duration, 0) / 60)}:
            {String(scenes.reduce((sum, s) => sum + s.duration, 0) % 60).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
