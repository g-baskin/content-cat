// Image form constants and options

export const MAX_REFERENCE_IMAGES = 8;
export const MAX_IMAGE_SIZE_MB = 30;
export const MAX_IMAGES_PER_GENERATION = 4;

// Generator service options
export const generatorServiceOptions = [
  { value: "fal", label: "FAL.ai" },
  { value: "midjourney", label: "Midjourney" },
  { value: "google-gemini", label: "Google Gemini" },
  { value: "freepik", label: "Freepik" },
];

// FAL.ai specific models
export const falModelOptions = [
  { value: "nano-banana-pro", label: "Nano Banana Pro" },
  { value: "seedream-4.5", label: "Seedream 4.5" },
];

// Midjourney specific models
export const midjourneyModelOptions = [
  { value: "midjourney", label: "Midjourney v6" },
  { value: "niji-6", label: "Niji 6 (Anime)" },
];

// Google Gemini specific models
export const geminiModelOptions = [
  { value: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash" },
  { value: "gemini-3-pro-image-preview", label: "Gemini 3 Pro (Preview)" },
];

// Freepik specific models (standard API access)
export const freepikModelOptions = [
  { value: "flux-dev", label: "Flux Dev" },
  { value: "flux-pro", label: "Flux Pro" },
  { value: "seedream-v4", label: "Seedream 4" },
  { value: "hyperflux", label: "HyperFlux (Fast)" },
];

// Keep old model options for compatibility with special modes
export const legacyModelOptions = [
  { value: "nano_banana_2", label: "Default" },
  { value: "characters", label: "Characters" },
  { value: "products", label: "Products" },
  { value: "ugc", label: "UGC" },
];

export const modelOptions = legacyModelOptions;

export const aspectRatioOptions = [
  { value: "auto", label: "Auto" },
  { value: "1:1", label: "1:1" },
  { value: "2:3", label: "2:3" },
  { value: "3:2", label: "3:2" },
  { value: "3:4", label: "3:4" },
  { value: "4:3", label: "4:3" },
  { value: "4:5", label: "4:5" },
  { value: "5:4", label: "5:4" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
  { value: "21:9", label: "21:9" },
];

export const resolutionOptions = [
  { value: "1K", label: "1K" },
  { value: "2K", label: "2K" },
  { value: "4K", label: "4K (higher cost)" },
  { value: "8K", label: "8K (4K + 2× upscale, extra cost)" },
];

export const outputFormatOptions = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPG" },
  { value: "webp", label: "WebP" },
];
