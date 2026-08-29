import { writeFile, mkdir, readdir, stat, unlink, readFile, copyFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Base upload directory - relative to project root
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * Save a file from a local path to storage
 * Useful for saving generated files like stitched videos
 */
export async function saveFileFromPath(
  sourcePath: string,
  category: string = "general",
  extension?: string
): Promise<string> {
  await ensureUploadDir();

  // Create category subdirectory
  const categoryDir = path.join(UPLOAD_DIR, category);
  if (!existsSync(categoryDir)) {
    await mkdir(categoryDir, { recursive: true });
  }

  // Generate unique filename
  const ext = extension || path.extname(sourcePath);
  const uniqueId = randomUUID();
  const filename = `${uniqueId}${ext}`;
  const destPath = path.join(categoryDir, filename);

  // Copy file to destination
  await copyFile(sourcePath, destPath);

  // Return the URL path
  return `/api/files/${category}/${filename}`;
}

export interface StorageStats {
  totalFiles: number;
  totalSizeBytes: number;
  byType: {
    images: number;
    videos: number;
    audio: number;
    other: number;
  };
}

/**
 * Ensure the uploads directory exists
 */
export async function ensureUploadDir(): Promise<void> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Get the file extension from a filename or mime type
 */
function getExtension(filename: string, mimeType?: string): string {
  // Try to get from filename first
  const ext = path.extname(filename).toLowerCase();
  if (ext) return ext;

  // Fall back to mime type
  if (mimeType) {
    const mimeToExt: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "video/mp4": ".mp4",
      "video/webm": ".webm",
      "video/quicktime": ".mov",
    };
    return mimeToExt[mimeType] || "";
  }

  return "";
}

/**
 * Save a file to local storage
 * Returns the URL path to access the file
 */
export async function saveFile(
  file: File,
  category: string = "general"
): Promise<string> {
  await ensureUploadDir();

  // Create category subdirectory
  const categoryDir = path.join(UPLOAD_DIR, category);
  if (!existsSync(categoryDir)) {
    await mkdir(categoryDir, { recursive: true });
  }

  // Generate unique filename
  const ext = getExtension(file.name, file.type);
  const uniqueId = randomUUID();
  const filename = `${uniqueId}${ext}`;
  const filepath = path.join(categoryDir, filename);

  // Write file to disk
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  // Return the URL path (will be served by /api/files/[...path])
  return `/api/files/${category}/${filename}`;
}

/**
 * Save multiple files to local storage (parallel)
 */
export async function saveFiles(
  files: File[],
  category: string = "general"
): Promise<string[]> {
  return Promise.all(files.map((file) => saveFile(file, category)));
}

/**
 * Get the absolute file path from a URL path
 */
export function getFilePath(urlPath: string): string | null {
  // URL format: /api/files/{category}/{filename}
  const match = urlPath.match(/^\/api\/files\/(.+)$/);
  if (!match) return null;

  const relativePath = match[1];
  return path.join(UPLOAD_DIR, relativePath);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(urlPath: string): Promise<boolean> {
  const filepath = getFilePath(urlPath);
  if (!filepath) return false;

  try {
    await unlink(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filepath: string): string {
  const ext = path.extname(filepath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

/**
 * Convert a local file URL to a base64 data URI
 * Used for sending local files to external APIs like FAL.ai
 * Returns null if the URL is not a local file or file doesn't exist
 */
export async function localUrlToBase64(urlPath: string): Promise<string | null> {
  // Only process local /api/files/ URLs
  if (!urlPath.startsWith("/api/files/")) {
    return null;
  }

  const filepath = getFilePath(urlPath);
  if (!filepath || !existsSync(filepath)) {
    return null;
  }

  try {
    const buffer = await readFile(filepath);
    const mimeType = getMimeType(filepath);
    const base64 = buffer.toString("base64");
    return `data:${mimeType};base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Convert an image URL to base64 for FAL.ai
 * Handles both local file URLs and external URLs (passes through)
 * For local URLs, converts to base64 data URI
 * For external URLs or base64, returns as-is
 */
export async function resolveImageForFal(imageUrl: string | undefined): Promise<string | undefined> {
  if (!imageUrl) return undefined;

  // If it's already a base64 data URI or external URL, pass through
  if (imageUrl.startsWith("data:") || imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // If it's a local file URL, convert to base64
  if (imageUrl.startsWith("/api/files/")) {
    const base64 = await localUrlToBase64(imageUrl);
    return base64 || undefined;
  }

  // Unknown format, return as-is
  return imageUrl;
}

export interface UploadedFile {
  id: string;
  url: string;
  filename: string;
  category: string;
  type: "image" | "video" | "audio" | "other";
  sizeBytes: number;
  createdAt: Date;
}

/**
 * List all uploaded files with metadata
 */
export async function listUploadedFiles(): Promise<UploadedFile[]> {
  if (!existsSync(UPLOAD_DIR)) {
    return [];
  }

  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const videoExts = [".mp4", ".webm", ".mov"];
  const audioExts = [".mp3", ".wav", ".ogg"];
  const files: UploadedFile[] = [];

  async function scanCategory(category: string): Promise<void> {
    const categoryDir = path.join(UPLOAD_DIR, category);
    if (!existsSync(categoryDir)) return;

    const entries = await readdir(categoryDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const fullPath = path.join(categoryDir, entry.name);
      const fileStat = await stat(fullPath);
      const ext = path.extname(entry.name).toLowerCase();

      let type: "image" | "video" | "audio" | "other" = "other";
      if (imageExts.includes(ext)) {
        type = "image";
      } else if (videoExts.includes(ext)) {
        type = "video";
      } else if (audioExts.includes(ext)) {
        type = "audio";
      }

      files.push({
        id: entry.name.replace(ext, ""), // UUID without extension
        url: `/api/files/${category}/${entry.name}`,
        filename: entry.name,
        category,
        type,
        sizeBytes: fileStat.size,
        createdAt: fileStat.birthtime,
      });
    }
  }

  // Scan all known categories
  const categories = [
    "workflows",
    "videos",
    "images",
    "characters",
    "products",
    "general",
    "video-edit",
    "tts",
    "dialogue",
    "storyboards",
  ];
  for (const category of categories) {
    await scanCategory(category);
  }

  // Sort by creation date (newest first)
  files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return files;
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<StorageStats> {
  const stats: StorageStats = {
    totalFiles: 0,
    totalSizeBytes: 0,
    byType: {
      images: 0,
      videos: 0,
      audio: 0,
      other: 0,
    },
  };

  if (!existsSync(UPLOAD_DIR)) {
    return stats;
  }

  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const videoExts = [".mp4", ".webm", ".mov"];
  const audioExts = [".mp3", ".wav", ".ogg"];

  async function scanDir(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else if (entry.isFile()) {
        const fileStat = await stat(fullPath);
        stats.totalFiles++;
        stats.totalSizeBytes += fileStat.size;

        const ext = path.extname(entry.name).toLowerCase();
        if (imageExts.includes(ext)) {
          stats.byType.images++;
        } else if (videoExts.includes(ext)) {
          stats.byType.videos++;
        } else if (audioExts.includes(ext)) {
          stats.byType.audio++;
        } else {
          stats.byType.other++;
        }
      }
    }
  }

  await scanDir(UPLOAD_DIR);
  return stats;
}
