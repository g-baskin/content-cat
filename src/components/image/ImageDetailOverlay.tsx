"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import ImageDetailPanel from "../ImageDetailPanel";
import type { GeneratedImage } from "./types";

const BrokenImageIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
    <line x1="3" y1="3" x2="21" y2="21" />
  </svg>
);

interface ImageDetailOverlayProps {
  image: GeneratedImage;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDownload: (url: string, prompt: string) => void;
  onRecreate: (prompt: string) => void;
  onVideo?: (imageUrl: string, prompt: string) => void;
  onUpscale?: (imageUrl: string, prompt: string) => void;
  onEdit?: (imageUrl: string, prompt: string) => void;
}

export default function ImageDetailOverlay({
  image,
  onClose,
  onDelete,
  onDownload,
  onRecreate,
  onVideo,
  onUpscale,
  onEdit,
}: ImageDetailOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  const handleBackgroundClick = useCallback(() => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      handleClose();
    }
  }, [isExpanded, handleClose]);

  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        setIsExpanded(true);
      }
    },
    [isExpanded]
  );

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Handle ESC key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isExpanded) {
          setIsExpanded(false);
        } else {
          handleClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, isExpanded]);

  return (
    <div
      className={`fixed inset-0 z-50 grid bg-black/80 transition-all duration-200 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        gridTemplateColumns: isExpanded ? "1fr 0px" : "1fr 380px",
        willChange: "opacity",
      }}
    >
      {/* Image Preview */}
      <div
        className="flex h-full items-center justify-center p-8 select-none"
        onClick={handleBackgroundClick}
      >
        <div
          className={`relative h-full w-full transition-all duration-200 ease-out ${
            isExpanded ? "max-w-6xl" : "max-w-3xl"
          } ${isVisible ? "opacity-100" : "opacity-0"}`}
          onClick={handleImageClick}
          style={{
            pointerEvents: "auto",
            cursor: isExpanded ? "zoom-out" : "zoom-in",
          }}
        >
          {imageError ? (
            <div className="flex size-full flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-zinc-900/50 text-zinc-400">
              <BrokenImageIcon />
              <p className="text-sm">Failed to load image</p>
              <p className="max-w-md truncate px-4 text-xs text-zinc-500">
                {image.url}
              </p>
            </div>
          ) : (
            <Image
              src={image.url}
              alt=""
              fill
              priority
              loading="eager"
              unoptimized
              sizes="(max-width: 768px) 100vw, 80vw"
              className="pointer-events-none [border-radius:12px] object-contain"
              onError={() => setImageError(true)}
            />
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <div
        className={`h-full overflow-hidden transition-opacity duration-200 ease-out ${
          isVisible && !isExpanded ? "opacity-100" : "opacity-0"
        }`}
        style={{ pointerEvents: isExpanded ? "none" : "auto" }}
      >
        <ImageDetailPanel
          image={image}
          onClose={handleClose}
          onDelete={onDelete}
          onDownload={onDownload}
          onRecreate={onRecreate}
          onVideo={onVideo}
          onUpscale={onUpscale}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}
