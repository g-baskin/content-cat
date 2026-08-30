# Generation and Storyboard Workflows

> Category: User Guide | Version: 1.1 | Date: August 2026 | Status: Active

Use Content Cat's global API-key controls, Image, Video, Presets, and Storyboard areas together to create individual media or a stitched multi-scene video.

**Related:**

- [Content Cat product capabilities](../overview/product-capabilities.md)
- [Runtime, data, and provider architecture](../../private/platform/runtime-data-and-providers.md)

## 1. Configure provider keys

Provider credentials belong to the signed-in user rather than the deployment as a whole. Use **API Keys** in the global header to open the credential modal, then select FAL.ai, Midjourney, Google Gemini, or Freepik and add or replace that service's key. Saved keys are encrypted before database storage and shown only in masked form when listed.

**Validate** performs a real provider authentication check only for FAL.ai, and Save does not require validation first. For Midjourney, Gemini, and Freepik, Validate confirms only that the field is non-empty; generation can still fail later because a key is invalid, lacks credit, or lacks model access. The header's **Get Key**/**Top Up** link is FAL-specific. The current modal's Delete action does not match the implemented deletion endpoint and may fail; replacing a key with Save remains supported.

Although video and TTS adapters also exist, this modal and its write API do not accept standalone Runway, Pika, Luma, OpenAI, ElevenLabs, or Fish Audio service entries. F5-TTS deliberately reuses the FAL.ai key.

**Code references:** `src/components/Header.tsx`, `src/components/ApiKeysModal.tsx`, `src/app/api/api-keys/route.ts`, `src/app/api/api-keys/[id]/route.ts`, `src/app/api/api-keys/validate/route.ts`, `src/lib/services/apiKeyService.ts`, `src/app/api/tts/generate/route.ts`.

## 2. Generate an image or video

1. Choose the media type, provider/model, and supported options.
2. Submit a prompt. Add reference frames only for a mode the selected adapter reports as supported.
3. The server authenticates the request, validates it, applies generation rate limits, obtains the signed-in user's active provider key, and invokes the provider adapter.
4. Successful output is written to the generated-image or generated-video history in PostgreSQL.

Local image references are resolved before provider submission. Video model selection can infer the service when the caller does not supply one. Provider jobs that do not return immediately are polled inside their adapters and the outer API call also has a timeout.

### Resolution behavior

- 1K and 2K are available in the image form for every model; 4K and 8K require **FAL.ai + Nano Banana Pro**. Changing to another model resets a selected 4K/8K value to 1K, and the server independently rejects unsupported combinations.
- 8K is a two-stage request, not native generation: Nano Banana Pro first generates at 4K, then FAL Clarity Upscaler performs a 2× upscale. Expect additional latency and provider cost.
- If automatic upscaling fails, the generation remains successful at 4K and the page shows **Generated at 4K, but automatic 8K upscaling failed**. Treat that warning as a delivery downgrade and inspect/download the resulting asset rather than assuming the requested label was achieved.
- Image Details measures the loaded asset's actual browser dimensions and derives its quality label from the longest edge. It does not recover the historical resolution request. A camera preset or the text “8K resolution” in a prompt changes prompt wording only, not this resolution control.
- The separate **Upscale** action in Image Details creates a new 2× image. It is independent of automatic 8K delivery and may use Freepik when both Freepik and FAL keys are configured.

**Code references:** `src/components/ImagePromptForm.tsx`, `src/lib/constants/image-form.ts`, `src/app/api/generate-image/route.ts`, `src/lib/image-tools/fal-tools.ts`, `src/app/api/image-tools/route.ts`, `src/app/image/page.tsx`, `src/components/ImageDetailPanel.tsx`.

## 3. Use an imported preset

1. Open **Presets** from the global navigation.
2. Choose Cameras, Lenses, Shots, Lighting, Styles, or Enhancements.
3. Search within that selected category by preset name or prompt text.
4. Select **Use in Image** to open the Image page with the preset prompt prefilled.
5. Review and combine the text as needed, then choose the actual provider, model, aspect ratio, and resolution in the image form.

The catalog is a read-only set of 49 checked-in entries. Stars mean “imported from archive”; they are not favorite toggles. Preset source labels identify the declared KingAI or research-hub source. No preset ID or source is saved with the generated image, and category changes clear the current search.

**Code references:** `src/app/presets/page.tsx`, `src/lib/imported-presets/catalog.ts`, `src/lib/imported-presets/cameras.ts`, `src/app/image/page.tsx`, `src/components/Header.tsx`.

## 4. Build a storyboard

1. Create a storyboard and add scenes.
2. For each scene, set its prompt, duration, aspect ratio, service/model, optional reference images, transition, and optional dialogue fields.
3. Drag scenes to reorder them. The reorder endpoint rewrites their zero-based order.
4. Generate one selected scene or generate all outstanding scenes. “Generate all” runs scenes sequentially rather than in parallel.
5. Review scene states (`pending`, `generating`, `complete`, or `failed`) and regenerate failed or incomplete scenes as needed.
6. Stitch when at least one scene is complete and has a video URL.

Scene generation is coordinated by the editor: it marks a scene as generating, calls the shared video-generation API, then stores the returned URL and final state back on the scene. Generated scene clips are also recorded in the general video history because they pass through the same video route.

**Code references:** `src/components/storyboard/StoryboardEditor.tsx`, `src/app/api/storyboards/[id]/scenes/`, `src/app/api/generate-video/route.ts`.

## 5. Generate dialogue and stitch

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
