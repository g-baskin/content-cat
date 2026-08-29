"use client";

import { use } from "react";
import useSWR from "swr";
import Header from "@/components/Header";
import StoryboardEditor from "@/components/storyboard/StoryboardEditor";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Scene {
  id: string;
  storyboardId: string;
  order: number;
  name: string | null;
  prompt: string;
  duration: number;
  aspectRatio: string;
  service: string;
  model: string;
  status: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
  negativePrompt: string | null;
  seed: number | null;
  cfgScale: number | null;
  enableAudio: boolean;
  startImageUrl: string | null;
  endImageUrl: string | null;
  transition: string | null;
  transitionDuration: number | null;
  dialogueText: string | null;
  dialogueVoice: string | null;
  dialogueUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Storyboard {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: string;
  totalDuration: number;
  aspectRatio: string;
  finalVideoId: string | null;
  createdAt: string;
  updatedAt: string;
  scenes: Scene[];
  finalVideo: {
    id: string;
    url: string;
  } | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StoryboardEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, error, isLoading, mutate } = useSWR<{ storyboard: Storyboard }>(
    `/api/storyboards/${id}`,
    fetcher,
    { refreshInterval: 5000 } // Poll for updates during generation
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }

  if (error || !data?.storyboard) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
          <p className="text-red-400 mb-4">Failed to load storyboard</p>
          <Link
            href="/storyboard"
            className="text-zinc-400 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to storyboards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <StoryboardEditor storyboard={data.storyboard} onUpdate={mutate} />
    </div>
  );
}
