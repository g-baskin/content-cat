"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/csrf";
import Header from "@/components/Header";
import ImagePromptForm from "@/components/ImagePromptForm";
import {
  ImageCard,
  ImageGridSkeleton,
  ImageEmptyState,
  ImageDetailOverlay,
  type GeneratedImage,
} from "@/components/image";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useImages } from "@/hooks";
import { useGenerationStore } from "@/lib/stores/generationStore";

export default function ImagePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<ImagePageSkeleton />}>
        <ImagePageContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function ImagePageSkeleton() {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          <span className="text-sm text-zinc-400">Loading...</span>
        </div>
      </div>
    </div>
  );
}

function ImagePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPrompt = searchParams.get("prompt") || "";
  const initialModel = searchParams.get("model") || undefined;
  const initialCharacterId = searchParams.get("characterId") || undefined;
  const initialProductId = searchParams.get("productId") || undefined;
  const initialSubModel = initialCharacterId || initialProductId || undefined;

  // Upscale state
  const [isUpscaling, setIsUpscaling] = useState(false);

  // Use global store for pending count to persist across navigation
  const { pendingImageGenerations, addImageGeneration, removeImageGeneration } =
    useGenerationStore();
  const pendingCount = pendingImageGenerations.length;

  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null
  );
  const [recreateData, setRecreateData] = useState<{ prompt: string } | null>(
    null
  );
  const [editData, setEditData] = useState<{ imageUrl: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Use SWR-powered hook for cached data
  const {
    images: generatedImages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore: loadMoreImages,
    addImage,
    deleteImage,
    downloadImage: handleDownload,
  } = useImages();

  const toggleSelectImage = (id: string) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);

    // Remove from selection
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    // Delete via hook (handles optimistic update)
    await deleteImage(id);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleVideo = (imageUrl: string, prompt: string) => {
    // Navigate to video page with the image as reference
    router.push(
      `/video?imageUrl=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`
    );
  };

  const handleUpscale = async (
    imageUrl: string,
    prompt: string,
    aspectRatio: string
  ) => {
    if (isUpscaling) return;

    setIsUpscaling(true);
    toast.info("Starting upscale...");

    try {
      const response = await apiFetch("/api/image-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "upscale",
          imageUrl,
          options: { scale: "2" },
        }),
        timeout: 300000, // 5 minutes for upscale
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to upscale image");
        return;
      }

      if (result.url) {
        // Save the upscaled image to database
        const saveResponse = await apiFetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: result.url,
            prompt: `${prompt} (2x upscaled)`,
            aspectRatio,
          }),
        });

        if (saveResponse.ok) {
          const savedImage = await saveResponse.json();
          addImage(savedImage);
          toast.success("Image upscaled successfully!");
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upscale image"
      );
    } finally {
      setIsUpscaling(false);
    }
  };

  const handleEditImage = (imageUrl: string) => {
    setEditData({ imageUrl });
    setSelectedImage(null);
  };

  const handleGenerate = (data: {
    prompt: string;
    service: string;
    model: string;
    count: number;
    aspectRatio: string;
    resolution: string;
    outputFormat: string;
    referenceImages: string[];
  }) => {
    // Create a single generation ID for the batch
    const generationId = `img-${Date.now()}`;

    // Add pending placeholders for each expected image
    for (let i = 0; i < data.count; i++) {
      addImageGeneration(`${generationId}-${i}`, data.prompt);
    }

    // Process generation in background - single API call with numImages
    const generateImages = async () => {
      try {
        const response = await apiFetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: data.prompt,
            service: data.service,
            model: data.model,
            aspectRatio: data.aspectRatio,
            resolution: data.resolution,
            outputFormat: data.outputFormat,
            imageUrls: data.referenceImages,
            numImages: data.count, // Generate all images in one call for variation
          }),
          timeout: 180000, // 3 minutes for multiple image generation
        });

        const result = await response.json();

        // Clear all pending placeholders
        for (let i = 0; i < data.count; i++) {
          removeImageGeneration(`${generationId}-${i}`);
        }

        if (!response.ok) {
          toast.error(result.error || "Failed to generate images");
          return;
        }

        if (result.warning) {
          toast.warning(result.warning);
        }

        let successCount = 0;
        if (result.resultUrls && result.resultUrls.length > 0) {
          for (const url of result.resultUrls) {
            // Save to database
            const saveResponse = await apiFetch("/api/images", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url,
                prompt: data.prompt,
                aspectRatio: data.aspectRatio,
              }),
            });

            if (saveResponse.ok) {
              const savedImage = await saveResponse.json();
              // Add each image immediately
              addImage(savedImage);
              successCount++;
            }
          }
        }

        if (successCount > 0) {
          toast.success(
            `Generated ${successCount} image${successCount > 1 ? "s" : ""}`
          );
        }
      } catch (err) {
        // Clear all pending placeholders on error
        for (let i = 0; i < data.count; i++) {
          removeImageGeneration(`${generationId}-${i}`);
        }
        toast.error(
          err instanceof Error
            ? err.message
            : "Something went wrong. Try again."
        );
      }
    };

    // Start generation in background with proper error handling
    generateImages().catch((error) => {
      console.error("Unhandled error in image generation:", error);
      toast.error("An unexpected error occurred. Please try again.");
      for (let i = 0; i < data.count; i++) {
        removeImageGeneration(`${generationId}-${i}`);
      }
    });
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex min-h-0 flex-1 flex-col p-4">
        {/* Gallery Grid - scrollable container */}
        <div
          id="soul-feed-scroll"
          className="hide-scrollbar min-h-0 flex-1 overflow-y-auto pb-48"
        >
          {/* Loading state */}
          {isLoading && (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="size-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
                <span className="text-sm text-zinc-400">Loading images...</span>
              </div>
            </div>
          )}

          {/* Generated Images Display */}
          {!isLoading && (generatedImages.length > 0 || pendingCount > 0) ? (
            <>
              <div
                className="grid w-full grid-cols-2 gap-1.5 md:grid-cols-4"
                style={{ gridAutoRows: "320px" }}
              >
                {/* Skeleton loaders while generating */}
                {pendingCount > 0 && <ImageGridSkeleton count={pendingCount} />}

                {/* Generated images */}
                {generatedImages.map((img, index) => (
                  <ImageCard
                    key={img.id}
                    image={img}
                    isSelected={selectedImages.has(img.id)}
                    isPriority={index < 4}
                    onSelect={() => toggleSelectImage(img.id)}
                    onClick={() => setSelectedImage(img)}
                    onDownload={() => handleDownload(img.url, img.prompt)}
                    onDelete={() => handleDelete(img.id)}
                    onEdit={() => setEditData({ imageUrl: img.url })}
                  />
                ))}
              </div>
              {/* Load more trigger */}
              {hasMore && (
                <div className="flex justify-center py-8">
                  <button
                    onClick={loadMoreImages}
                    disabled={isLoadingMore}
                    className="rounded-lg bg-zinc-800 px-6 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          ) : !isLoading ? (
            <ImageEmptyState />
          ) : null}
        </div>
      </div>

      {/* Bottom Prompt Form */}
      <ImagePromptForm
        onSubmit={handleGenerate}
        initialPrompt={initialPrompt}
        initialModel={initialModel}
        initialSubModel={initialSubModel}
        recreateData={recreateData}
        editData={editData}
      />

      {/* Image Detail Overlay */}
      {selectedImage && (
        <ImageDetailOverlay
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={(id) => {
            handleDelete(id);
            setSelectedImage(null);
          }}
          onDownload={handleDownload}
          onRecreate={(prompt) => {
            setRecreateData({ prompt });
            setSelectedImage(null);
          }}
          onVideo={(imageUrl, prompt) => handleVideo(imageUrl, prompt)}
          onUpscale={(imageUrl, prompt) =>
            handleUpscale(imageUrl, prompt, selectedImage.aspectRatio)
          }
          onEdit={(imageUrl) => handleEditImage(imageUrl)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmId !== null}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
