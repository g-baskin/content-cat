# Content Cat Product Capabilities

> Category: Product Overview | Version: 1.1 | Date: August 2026 | Status: Active

Content Cat is a self-hosted workspace for generating images, videos, speech, and multi-scene storyboard videos with user-supplied provider credentials.

**Related:**

- [Generation and storyboard workflows](../guides/generation-and-storyboards.md)
- [Runtime, data, and provider architecture](../../private/platform/runtime-data-and-providers.md)
- [Generated application background](../../private/frontend/generated-application-background.md)

## Image generation

Authenticated users can generate images from prompts and, where the selected provider supports it, edit images using reference images. The server uses a common generator interface and dispatches to one of four provider adapters:

- **FAL.ai** — Nano Banana Pro and Seedream 4.5.
- **Midjourney** — Midjourney and Niji model families through the configured Midjourney API endpoint.
- **Google Gemini** — Gemini image generation and reference-image editing.
- **Freepik** — Flux, Seedream, Hyperflux, and Mystic-family text-to-image models; the adapter does not expose reference-image editing.

Generation requests are authenticated, validated, rate-limited, matched to the current user's active key for the requested service, and persisted as generated-image records after the provider returns. Supported options depend on provider capabilities and include aspect ratio, output format, multiple outputs, seeds, and reference images.

The current image route limits 4K/8K requests to FAL.ai Nano Banana Pro. Providers receive native resolutions only, so an 8K request first generates at 4K and then invokes a 2× FAL upscale. If that second stage fails, the request succeeds with the original 4K output and an explicit warning. Provider-returned dimensions travel with the immediate generation response, but image history does not persist width, height, requested resolution, or delivered resolution; Image Details measures the loaded asset later.

**Code references:** `src/app/api/generate-image/route.ts`, `src/lib/generators/factory.ts`, `src/lib/generators/types.ts`, `src/lib/constants/image-form.ts`, `src/lib/image-tools/fal-tools.ts`, `src/components/ImageDetailPanel.tsx`, `prisma/schema.prisma`.

## Video generation

The video API presents one request contract over five provider adapters:

- **FAL.ai** — Kling 2.6, Kling 2.5 Turbo, Wan 2.6, and Veo 3.1.
- **OpenAI** — Sora 2 and Sora 2 Pro.
- **Runway** — Gen-3 Alpha and Gen-3 Alpha Turbo.
- **Pika** — Pika 2.0 and Pika 1.5.
- **Luma** — Dream Machine and Dream Machine 1.5.

The route supports text-to-video and capability-dependent image-to-video generation. Veo 3.1 also has a first/last-frame mode. Requests are authenticated, validated, rate-limited, checked against provider capabilities, executed with timeout protection, and stored as generated-video records.

**Code references:** `src/app/api/generate-video/route.ts`, `src/lib/video-generators/factory.ts`, `src/lib/video-generators/types.ts`, `prisma/schema.prisma`.

## Storyboards and scenes

A storyboard is a user-owned, ordered set of scenes. Each scene stores its prompt, duration, aspect ratio, provider and model, generation state, optional start/end images, transition settings, and optional dialogue metadata. Users can create, edit, reorder, delete, and generate scenes independently or generate outstanding scenes sequentially.

Completed scenes can be stitched into a single 1080p, 30 fps MP4. Stitching uses scene order, transition settings, and generated dialogue audio where present, then creates a generated-video record and links it as the storyboard's final video.

**Code references:** `prisma/schema.prisma`, `src/components/storyboard/StoryboardEditor.tsx`, `src/app/api/storyboards/`, `src/lib/video-stitcher/index.ts`.

## Text to speech

The TTS abstraction includes OpenAI, ElevenLabs, Fish Audio, and F5-TTS providers. The authenticated TTS endpoint accepts text, a voice, service, and speed, then saves generated MP3 audio under `uploads/tts/`. F5-TTS uses the user's FAL.ai key. Storyboard scenes can also carry dialogue text, voice selection, and a generated audio URL for use during stitching.

**Code references:** `src/lib/tts/`, `src/app/api/tts/generate/route.ts`, `src/app/api/tts/voices/route.ts`, `src/app/api/storyboards/[id]/generate-dialogue/route.ts`, `prisma/schema.prisma`.

## Imported presets

The Presets page provides 49 checked-in prompt presets across Cameras, Lenses, Shots, Lighting, Styles, and Enhancements. Users can filter the selected category and send a preset's prompt to the Image page. The catalog preserves source labels from KingAI cinema, product-shot, and ad-style presets plus research-hub enhancement tags. It is read-only application data: the star indicates imported provenance, not a saved favorite, and using a preset does not bind a provider, model, resolution, or source record to the generated image.

**Code references:** `src/app/presets/page.tsx`, `src/lib/imported-presets/catalog.ts`, `src/lib/imported-presets/cameras.ts`, `src/app/image/page.tsx`.

## Other durable workspace capabilities

The current data model also supports reusable characters and products with reference images, saved node workflows, generated-media history, and per-user sessions. Image tools can dispatch compatible operations to Freepik first and FAL.ai as a fallback, based on which user keys are available. The shared header exposes per-user image-provider key management and links to the presets catalog.

**Code references:** `prisma/schema.prisma`, `src/app/api/image-tools/route.ts`, `src/lib/image-tools/`, `src/components/Header.tsx`, `src/components/ApiKeysModal.tsx`.
