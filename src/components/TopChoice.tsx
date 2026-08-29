"use client";

import { useState, memo } from "react";
import Image from "next/image";
import { apiFetch } from "@/lib/csrf";
import ImageToolModal from "./ImageToolModal";
import type { ImageToolType } from "@/lib/image-tools/types";

interface ToolCard {
  title: string;
  description: string;
  image: string;
  imageAfter: string;
  toolType: ImageToolType;
  badge?: {
    text: string;
    variant: "unlimited" | "pro" | "new";
  };
}

const toolCards: ToolCard[] = [
  {
    title: "Sharpen Image",
    description: "Transform blurry photos into crisp images",
    image: "/images/sharpen-before.jpg",
    imageAfter: "/images/sharpen-after.jpg",
    toolType: "sharpen",
  },
  {
    title: "Upscale",
    description: "Enhance resolution up to 8x",
    image: "/images/upscale-before.jpg",
    imageAfter: "/images/upscale-after.jpg",
    toolType: "upscale",
    badge: { text: "PRO", variant: "pro" },
  },
  {
    title: "Background Remix",
    description: "Transform any background instantly",
    image: "/images/bg-remix-before.jpg",
    imageAfter: "/images/bg-remix-after.jpg",
    toolType: "background-remove",
  },
  {
    title: "Color Grade",
    description: "Professional cinematic color correction",
    image: "/images/color-before.jpg",
    imageAfter: "/images/color-after.jpg",
    toolType: "color-grade",
  },
  {
    title: "Portrait Enhance",
    description: "Turn selfies into professional portraits",
    image: "/images/portrait-before.jpg",
    imageAfter: "/images/portrait-after.jpg",
    toolType: "portrait-enhance",
    badge: { text: "NEW", variant: "new" },
  },
  {
    title: "Lighting Fix",
    description: "Fix poorly lit photos with AI",
    image: "/images/lighting-before.jpg",
    imageAfter: "/images/lighting-after.jpg",
    toolType: "lighting-fix",
  },
  {
    title: "Product Photo",
    description: "Create stunning product ad shots",
    image: "/images/product-before.jpg",
    imageAfter: "/images/product-after.jpg",
    toolType: "product-photo",
    badge: { text: "PRO", variant: "pro" },
  },
  {
    title: "Style Transfer",
    description: "Apply artistic styles to any image",
    image: "/images/style-before.jpg",
    imageAfter: "/images/style-after.jpg",
    toolType: "style-transfer",
  },
];

const badgeStyles = {
  unlimited: "bg-purple-600",
  pro: "bg-green-600",
  new: "bg-zinc-600",
};

const ToolCardComponent = memo(function ToolCardComponent({
  card,
  priority = false,
  onSelect,
}: {
  card: ToolCard;
  priority?: boolean;
  onSelect: (toolType: ImageToolType) => void;
}) {
  const [beforeLoaded, setBeforeLoaded] = useState(false);
  const [afterLoaded, setAfterLoaded] = useState(false);
  const isLoaded = beforeLoaded && afterLoaded;

  return (
    <button
      onClick={() => onSelect(card.toolType)}
      className="group h-56 w-[17%] min-w-[160px] flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40 text-left backdrop-blur-xl transition-colors duration-150 hover:border-white/20 hover:bg-black/50"
    >
      <div className="relative h-40 w-full overflow-hidden bg-black/20">
        {/* Skeleton */}
        <div
          className={`absolute inset-0 z-10 transition-opacity duration-300 ${
            isLoaded ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <div className="skeleton-loader size-full" />
        </div>

        {/* Before image */}
        <Image
          src={card.image}
          alt={`${card.title} before`}
          fill
          sizes="(max-width: 768px) 160px, 17vw"
          className={`object-cover transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setBeforeLoaded(true)}
          onError={() => setBeforeLoaded(true)}
        />
        {/* After image with right-to-left gradient fade reveal on hover */}
        <Image
          src={card.imageAfter}
          alt={`${card.title} after`}
          fill
          sizes="(max-width: 768px) 160px, 17vw"
          className={`object-cover transition-[opacity,mask-position] duration-400 ease-out [mask-image:linear-gradient(to_left,black_0%,black_60%,transparent_100%)] [mask-position:100%_0] [mask-repeat:no-repeat] [mask-size:200%_100%] group-hover:[mask-position:-50%_0] ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ willChange: "mask-position" }}
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setAfterLoaded(true)}
          onError={() => setAfterLoaded(true)}
        />
        {card.badge && (
          <span
            className={`${badgeStyles[card.badge.variant]} absolute left-3 top-3 z-10 rounded px-2 py-0.5 text-[10px] font-medium text-white`}
          >
            {card.badge.text}
          </span>
        )}
      </div>
      <div className="flex h-16 items-start justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-medium text-white transition-colors duration-150 group-hover:text-pink-400">
            {card.title}
          </h4>
          <p className="truncate text-xs text-zinc-300">{card.description}</p>
        </div>
        <span className="flex-shrink-0 text-lg text-zinc-300">→</span>
      </div>
    </button>
  );
});

export default function TopChoice() {
  const [selectedTool, setSelectedTool] = useState<ImageToolType | null>(null);

  const handleSaveToGallery = async (url: string, prompt: string) => {
    const response = await apiFetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        prompt,
        aspectRatio: "1:1",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save image");
    }
  };

  return (
    <>
      <section className="mt-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl text-white">QUICK TOOLS</h2>
            <p className="text-sm text-zinc-300">
              Powerful AI enhancements at your fingertips
            </p>
          </div>
        </div>
        <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-2">
          {toolCards.map((card, index) => (
            <ToolCardComponent
              key={card.title}
              card={card}
              priority={index < 4}
              onSelect={setSelectedTool}
            />
          ))}
        </div>
      </section>

      {/* Tool Modal */}
      {selectedTool && (
        <ImageToolModal
          tool={selectedTool}
          onClose={() => setSelectedTool(null)}
          onSaveToGallery={handleSaveToGallery}
        />
      )}
    </>
  );
}
