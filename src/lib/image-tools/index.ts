import { createFreepikProvider } from "./freepik-tools";
import { createFalProvider } from "./fal-tools";
import type {
  ImageToolProvider,
  ImageToolType,
  ImageToolOptions,
  ImageToolResult,
} from "./types";

export * from "./types";

export interface ProviderConfig {
  freepikApiKey?: string;
  falApiKey?: string;
}

/**
 * Get the appropriate image tool provider based on available API keys.
 * Priority: Freepik > FAL.ai
 */
export function getImageToolProvider(
  config: ProviderConfig
): ImageToolProvider | null {
  if (config.freepikApiKey) {
    return createFreepikProvider(config.freepikApiKey);
  }

  if (config.falApiKey) {
    return createFalProvider(config.falApiKey);
  }

  return null;
}

/**
 * Execute an image tool operation with the appropriate provider.
 */
export async function executeImageTool(
  config: ProviderConfig,
  tool: ImageToolType,
  imageUrl: string,
  options?: ImageToolOptions
): Promise<ImageToolResult> {
  const provider = getImageToolProvider(config);

  if (!provider) {
    return {
      success: false,
      error: "No API key configured. Add your Freepik or FAL.ai key in Settings.",
    };
  }

  switch (tool) {
    case "sharpen":
      return provider.sharpen(imageUrl, options);
    case "upscale":
      return provider.upscale(imageUrl, options);
    case "background-remove":
      return provider.backgroundRemove(imageUrl);
    case "color-grade":
      return provider.colorGrade(imageUrl, options);
    case "portrait-enhance":
      return provider.portraitEnhance(imageUrl, options);
    case "lighting-fix":
      return provider.lightingFix(imageUrl, options);
    case "product-photo":
      return provider.productPhoto(imageUrl, options);
    case "style-transfer":
      return provider.styleTransfer(imageUrl, options);
    default:
      return { success: false, error: `Unknown tool: ${tool}` };
  }
}

/**
 * Get the name of the active provider for display purposes.
 */
export function getActiveProviderName(config: ProviderConfig): string | null {
  if (config.freepikApiKey) return "Freepik";
  if (config.falApiKey) return "FAL.ai";
  return null;
}
