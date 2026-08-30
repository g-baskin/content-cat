# Generation and Storyboard Workflows

> Category: User Guide | Version: 1.0 | Date: August 2026 | Status: Active

Use Content Cat's Settings, Image, Video, and Storyboard areas together to create individual media or a stitched multi-scene video.

**Related:**

- [Content Cat product capabilities](../overview/product-capabilities.md)
- [Runtime, data, and provider architecture](../../private/platform/runtime-data-and-providers.md)

## 1. Configure provider keys

Provider credentials belong to the signed-in user rather than the deployment as a whole. Add or replace a key in Settings before choosing that service for generation. Saved keys are encrypted before database storage and shown only in masked form when listed.

The current Settings API accepts FAL.ai, Midjourney, Google Gemini, and Freepik keys. Although video and TTS adapters also exist, the Settings API does not currently accept standalone Runway, Pika, Luma, OpenAI, ElevenLabs, or Fish Audio service entries. F5-TTS deliberately reuses the FAL.ai key.

**Code references:** `src/app/settings/page.tsx`, `src/components/ApiKeysModal.tsx`, `src/app/api/api-keys/route.ts`, `src/lib/services/apiKeyService.ts`, `src/app/api/tts/generate/route.ts`.

## 2. Generate an image or video

1. Choose the media type, provider/model, and supported options.
2. Submit a prompt. Add reference frames only for a mode the selected adapter reports as supported.
3. The server authenticates the request, validates it, applies generation rate limits, obtains the signed-in user's active provider key, and invokes the provider adapter.
4. Successful output is written to the generated-image or generated-video history in PostgreSQL.

Local image references are resolved before provider submission. Video model selection can infer the service when the caller does not supply one. Provider jobs that do not return immediately are polled inside their adapters and the outer API call also has a timeout.

**Code references:** `src/app/api/generate-image/route.ts`, `src/app/api/generate-video/route.ts`, `src/lib/storage.ts`, `src/lib/generators/`, `src/lib/video-generators/`.

## 3. Build a storyboard

1. Create a storyboard and add scenes.
2. For each scene, set its prompt, duration, aspect ratio, service/model, optional reference images, transition, and optional dialogue fields.
3. Drag scenes to reorder them. The reorder endpoint rewrites their zero-based order.
4. Generate one selected scene or generate all outstanding scenes. “Generate all” runs scenes sequentially rather than in parallel.
5. Review scene states (`pending`, `generating`, `complete`, or `failed`) and regenerate failed or incomplete scenes as needed.
6. Stitch when at least one scene is complete and has a video URL.

Scene generation is coordinated by the editor: it marks a scene as generating, calls the shared video-generation API, then stores the returned URL and final state back on the scene. Generated scene clips are also recorded in the general video history because they pass through the same video route.

**Code references:** `src/components/storyboard/StoryboardEditor.tsx`, `src/app/api/storyboards/[id]/scenes/`, `src/app/api/generate-video/route.ts`.

## 4. Generate dialogue and stitch

A scene may store dialogue text and a preferred voice. Dialogue generation writes MP3 files under `uploads/dialogue/` and records their URLs on the scenes. During stitching, the server:

1. selects only complete scenes that have video URLs;
2. orders them by scene order;
3. downloads/processes the clips with FFmpeg;
4. applies supported transition settings and includes scene dialogue audio when available;
5. emits a 1080p, 30 fps MP4 under storyboard storage;
6. creates a generated-video record and links it as the storyboard's final video.

The storyboard status moves to `generating` during stitching, `complete` on success, and `failed` on an error. The final duration stored by the stitch route is the sum of completed scene durations.

**Code references:** `src/app/api/storyboards/[id]/generate-dialogue/route.ts`, `src/app/api/storyboards/[id]/stitch/route.ts`, `src/lib/video-stitcher/index.ts`, `prisma/schema.prisma`.

## Operational requirements

- FFmpeg and ffprobe must be installed for stitching.
- PostgreSQL must be available for users, provider keys, media history, storyboards, and scenes.
- Redis backs rate limiting when available.
- Uploaded/generated local files must remain available under the deployment's `uploads/` path.

**Code references:** `scripts/install.sh`, `docker-compose.yml`, `src/lib/video-stitcher/index.ts`, `src/lib/rate-limit.ts`, `src/lib/storage.ts`.
