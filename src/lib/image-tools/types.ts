export type ImageToolType =
  | "sharpen"
  | "upscale"
  | "background-remove"
  | "color-grade"
  | "portrait-enhance"
  | "lighting-fix"
  | "product-photo"
  | "style-transfer";

export interface ImageToolOptions {
  strength?: number; // 0-100
  scale?: "2" | "4" | number; // For upscale
  prompt?: string; // For style transfer, product photo
  referenceImageUrl?: string; // For style transfer
  preset?: string; // For color grade presets
}

export interface ImageToolRequest {
  tool: ImageToolType;
  imageUrl: string;
  options?: ImageToolOptions;
}

export interface ImageToolResult {
  success: boolean;
  url?: string;
  width?: number;
  height?: number;
  error?: string;
}

export interface ImageToolProvider {
  name: string;
  sharpen(
    imageUrl: string,
    options?: ImageToolOptions
  ): Promise<ImageToolResult>;
  upscale(
    imageUrl: string,
    options?: ImageToolOptions
  ): Promise<ImageToolResult>;
  backgroundRemove(imageUrl: string): Promise<ImageToolResult>;
  colorGrade(
    imageUrl: string,
    options?: ImageToolOptions
  ): Promise<ImageToolResult>;
  portraitEnhance(
    imageUrl: string,
    options?: ImageToolOptions
  ): Promise<ImageToolResult>;
  lightingFix(
    imageUrl: string,
    options?: ImageToolOptions
  ): Promise<ImageToolResult>;
  productPhoto(
    imageUrl: string,
    options?: ImageToolOptions
  ): Promise<ImageToolResult>;
  styleTransfer(
    imageUrl: string,
    options?: ImageToolOptions
  ): Promise<ImageToolResult>;
}

export const TOOL_DISPLAY_NAMES: Record<ImageToolType, string> = {
  sharpen: "Sharpen Image",
  upscale: "Upscale",
  "background-remove": "Background Remove",
  "color-grade": "Color Grade",
  "portrait-enhance": "Portrait Enhance",
  "lighting-fix": "Lighting Fix",
  "product-photo": "Product Photo",
  "style-transfer": "Style Transfer",
};

export const COLOR_GRADE_PRESETS = [
  { value: "cinematic", label: "Cinematic" },
  { value: "vintage", label: "Vintage" },
  { value: "vibrant", label: "Vibrant" },
  { value: "moody", label: "Moody" },
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Cool" },
] as const;
