import ffmpeg from "fluent-ffmpeg";
import { createWriteStream, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { finished } from "stream/promises";

export interface StitchScene {
  id: string;
  order: number;
  videoUrl: string;
  duration: number;
  transition: string | null;
  transitionDuration: number | null;
  dialogueUrl: string | null;
}

export interface StitchOptions {
  outputFormat?: "mp4" | "webm";
  resolution?: "720p" | "1080p" | "4k";
  fps?: number;
}

export interface StitchResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Download a file from URL to local path
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const body = response.body;
  if (!body) {
    throw new Error("No response body");
  }

  const fileStream = createWriteStream(destPath);
  // Convert web ReadableStream to Node.js Readable
  const nodeStream = Readable.fromWeb(body as import("stream/web").ReadableStream);
  await finished(nodeStream.pipe(fileStream));
}

/**
 * Get resolution dimensions
 */
function getResolution(resolution: string): { width: number; height: number } {
  switch (resolution) {
    case "4k":
      return { width: 3840, height: 2160 };
    case "1080p":
      return { width: 1920, height: 1080 };
    case "720p":
    default:
      return { width: 1280, height: 720 };
  }
}

/**
 * Stitch multiple video scenes together with transitions
 */
export async function stitchScenes(
  scenes: StitchScene[],
  options: StitchOptions = {}
): Promise<StitchResult> {
  const {
    outputFormat = "mp4",
    resolution = "1080p",
    fps = 30,
  } = options;

  // Sort scenes by order
  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  if (sortedScenes.length === 0) {
    return { success: false, error: "No scenes to stitch" };
  }

  // Create temp directory for this job
  const jobId = randomUUID();
  const workDir = join(tmpdir(), "video-stitch", jobId);
  mkdirSync(workDir, { recursive: true });

  try {
    // Download all scene videos
    const localVideos: string[] = [];
    for (let i = 0; i < sortedScenes.length; i++) {
      const scene = sortedScenes[i];
      const ext = scene.videoUrl.includes(".webm") ? "webm" : "mp4";
      const localPath = join(workDir, `scene_${i}.${ext}`);

      await downloadFile(scene.videoUrl, localPath);
      localVideos.push(localPath);
    }

    // Download dialogue audio files if present
    const dialogueAudios: (string | null)[] = [];
    for (let i = 0; i < sortedScenes.length; i++) {
      const scene = sortedScenes[i];
      if (scene.dialogueUrl) {
        const localPath = join(workDir, `dialogue_${i}.mp3`);
        await downloadFile(scene.dialogueUrl, localPath);
        dialogueAudios.push(localPath);
      } else {
        dialogueAudios.push(null);
      }
    }

    const outputPath = join(workDir, `output.${outputFormat}`);
    const { width, height } = getResolution(resolution);

    // For simple cases (all cuts or single scene), use concat
    const allCuts = sortedScenes.every(
      (s) => !s.transition || s.transition === "cut"
    );

    if (allCuts && sortedScenes.length === 1) {
      // Single scene - just copy/transcode
      await new Promise<void>((resolve, reject) => {
        ffmpeg(localVideos[0])
          .outputOptions([
            `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
            `-r ${fps}`,
            "-c:v libx264",
            "-preset fast",
            "-crf 23",
            "-c:a aac",
            "-b:a 128k",
          ])
          .output(outputPath)
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .run();
      });
    } else if (allCuts) {
      // All cuts - use concat demuxer
      const concatListPath = join(workDir, "concat.txt");
      const concatContent = localVideos
        .map((v) => `file '${v}'`)
        .join("\n");

      const { writeFileSync } = await import("fs");
      writeFileSync(concatListPath, concatContent);

      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(concatListPath)
          .inputOptions(["-f concat", "-safe 0"])
          .outputOptions([
            `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
            `-r ${fps}`,
            "-c:v libx264",
            "-preset fast",
            "-crf 23",
            "-c:a aac",
            "-b:a 128k",
          ])
          .output(outputPath)
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .run();
      });
    } else {
      // Complex transitions - use filter_complex
      const filterParts: string[] = [];
      const inputs: string[] = [];

      // Add all inputs
      for (let i = 0; i < localVideos.length; i++) {
        inputs.push(localVideos[i]);
      }

      // Build filter graph
      // First, normalize all videos
      for (let i = 0; i < localVideos.length; i++) {
        filterParts.push(
          `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
          `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=${fps},format=yuv420p[v${i}]`
        );
        filterParts.push(`[${i}:a]aresample=async=1[a${i}]`);
      }

      // Apply transitions between scenes
      let currentVideo = "v0";
      let currentAudio = "a0";
      let offset = sortedScenes[0].duration;

      for (let i = 1; i < sortedScenes.length; i++) {
        const prevScene = sortedScenes[i - 1];
        const transition = prevScene.transition || "cut";
        const transDur = prevScene.transitionDuration || 0.5;

        const nextVideo = `v${i}`;
        const nextAudio = `a${i}`;
        const outVideo = `vout${i}`;
        const outAudio = `aout${i}`;

        if (transition === "cut") {
          // Simple concat
          filterParts.push(
            `[${currentVideo}][${nextVideo}]concat=n=2:v=1:a=0[${outVideo}]`
          );
          filterParts.push(
            `[${currentAudio}][${nextAudio}]concat=n=2:v=0:a=1[${outAudio}]`
          );
        } else if (transition === "fade") {
          // Fade through black
          filterParts.push(
            `[${currentVideo}]fade=t=out:st=${offset - transDur}:d=${transDur}[vfade${i}a];` +
            `[${nextVideo}]fade=t=in:st=0:d=${transDur}[vfade${i}b];` +
            `[vfade${i}a][vfade${i}b]concat=n=2:v=1:a=0[${outVideo}]`
          );
          filterParts.push(
            `[${currentAudio}]afade=t=out:st=${offset - transDur}:d=${transDur}[afade${i}a];` +
            `[${nextAudio}]afade=t=in:st=0:d=${transDur}[afade${i}b];` +
            `[afade${i}a][afade${i}b]concat=n=2:v=0:a=1[${outAudio}]`
          );
        } else if (transition === "dissolve") {
          // Cross-dissolve / xfade
          filterParts.push(
            `[${currentVideo}][${nextVideo}]xfade=transition=fade:duration=${transDur}:offset=${offset - transDur}[${outVideo}]`
          );
          filterParts.push(
            `[${currentAudio}][${nextAudio}]acrossfade=d=${transDur}[${outAudio}]`
          );
        } else if (transition === "wipe") {
          // Wipe left to right
          filterParts.push(
            `[${currentVideo}][${nextVideo}]xfade=transition=wipeleft:duration=${transDur}:offset=${offset - transDur}[${outVideo}]`
          );
          filterParts.push(
            `[${currentAudio}][${nextAudio}]acrossfade=d=${transDur}[${outAudio}]`
          );
        }

        currentVideo = outVideo;
        currentAudio = outAudio;
        offset += sortedScenes[i].duration - transDur;
      }

      // Build the FFmpeg command
      const command = ffmpeg();

      for (const input of inputs) {
        command.input(input);
      }

      await new Promise<void>((resolve, reject) => {
        command
          .complexFilter(filterParts.join(";"), [currentVideo, currentAudio])
          .outputOptions([
            "-c:v libx264",
            "-preset fast",
            "-crf 23",
            "-c:a aac",
            "-b:a 128k",
            `-map [${currentVideo}]`,
            `-map [${currentAudio}]`,
          ])
          .output(outputPath)
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .run();
      });
    }

    // TODO: Mix dialogue audio if present (post-processing step)
    // For now, skip dialogue mixing - it would require complex timing calculations
    // This can be enhanced later to overlay TTS at correct timestamps

    return {
      success: true,
      outputPath,
    };
  } catch (error) {
    // Clean up on error
    if (existsSync(workDir)) {
      rmSync(workDir, { recursive: true, force: true });
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during stitching",
    };
  }
}

/**
 * Clean up temp files for a job
 */
export function cleanupJob(outputPath: string): void {
  const workDir = join(outputPath, "..");
  if (existsSync(workDir)) {
    rmSync(workDir, { recursive: true, force: true });
  }
}
