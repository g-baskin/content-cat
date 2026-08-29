"use client";

import { memo, useState } from "react";
import Image from "next/image";
import type { GeneratedImage } from "./types";

interface ImageCardProps {
  image: GeneratedImage;
  isSelected: boolean;
  isPriority?: boolean;
  onSelect: () => void;
  onClick: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const ImageCard = memo(function ImageCard({
  image,
  isSelected,
  isPriority = false,
  onSelect,
  onClick,
  onDownload,
  onDelete,
  onEdit,
}: ImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className="grid-item-perf group relative size-full cursor-pointer overflow-hidden border border-white/10"
      onClick={onClick}
    >
      {/* Skeleton - fades out when loaded */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="skeleton-loader size-full" />
      </div>

      <Image
        src={image.url}
        alt=""
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        unoptimized
        className={`size-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        priority={isPriority}
        loading={isPriority ? "eager" : "lazy"}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
      />

      {/* Hover overlay gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {/* Top-left checkbox */}
      <div className="absolute top-2 left-2 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`flex size-5 items-center justify-center rounded border-2 transition-colors ${
            isSelected
              ? "border-white bg-white text-black"
              : "border-white/70 bg-black/30 hover:border-white hover:bg-black/50"
          }`}
        >
          {isSelected && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Top-right action buttons */}
      <div className="absolute top-2 right-2 z-10 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {/* Edit button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="flex size-8 items-center justify-center rounded-lg bg-black/70 text-white/80 transition-colors hover:bg-pink-500/80 hover:text-white"
          title="Edit"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* Download button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="flex size-8 items-center justify-center rounded-lg bg-black/70 text-white/80 transition-colors hover:bg-black/90 hover:text-white"
          title="Download"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 10L12 15L17 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 15V3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex size-8 items-center justify-center rounded-lg bg-black/70 text-white/80 transition-colors hover:bg-red-500/80 hover:text-white"
          title="Delete"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6H5H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Bottom prompt text */}
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <p className="line-clamp-2 text-xs text-white/80">{image.prompt}</p>
      </div>
    </div>
  );
});

export default ImageCard;
