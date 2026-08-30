# Content Cat Product Capabilities

> Category: Product Overview | Version: 1.0 | Date: August 2026 | Status: Active

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

Generation requests are authenticated, validated, rate-limited, matched to the current user's active key for the requested service, and persisted as generated-image records after the provider returns. Supported options depend on provider capabilities and include aspect ratio, output format, multiple outputs, seeds, and reference images. The current image route also limits 4K/8K requests to FAL.ai Nano Banana Pro; an 8K request is generated at 4K and then upscaled, with a warning if the upscale step fails.

**Code references:** `src/app/api/generate-image/route.ts`, `src/lib/generators/factory.ts`, `src/lib/generators/types.ts`, `src/lib/constants/image-form.ts`, `prisma/schema.prisma`.

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

## Other durable workspace capabilities

The current data model also supports reusable characters and products with reference images, saved node workflows, generated-media history, and per-user sessions. Image tools can dispatch compatible operations to Freepik first and FAL.ai as a fallback, based on which user keys are available.

**Code references:** `prisma/schema.prisma`, `src/app/api/image-tools/route.ts`, `src/lib/image-tools/`.
