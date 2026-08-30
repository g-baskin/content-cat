---
type: concept
title: Two-stage 8K image generation
complexity: advanced
domain: image-generation
aliases:
  - automatic 8K upscale
  - 4K-to-8K pipeline
created: "2026-08-29"
updated: "2026-08-29"
status: developing
tags: [concept, image-generation, resolution, upscale]
related:
  - "[[entities/requested-image-resolution]]"
  - "[[entities/provider-image-resolution]]"
sources:
  - src/app/api/generate-image/route.ts:105-113
  - src/app/api/generate-image/route.ts:171-236
  - src/app/api/generate-image/route.ts:252-261
---

# Two-stage 8K image generation

## Definition

The 8K image path separates requested resolution from provider-native resolution: [[entities/post-api-generate-image]] accepts an 8K request, asks [[entities/fal-generator]] for 4K output, and then uses [[entities/create-fal-provider]] to upscale each sub-8K result by 2x (`src/app/api/generate-image/route.ts:171-219`).

## How it works

1. The route allows 4K or 8K only for FAL Nano Banana Pro (`src/app/api/generate-image/route.ts:105-113`).
2. It translates requested 8K into [[entities/provider-image-resolution|provider resolution]] 4K before generation or editing (`src/app/api/generate-image/route.ts:171-192`).
3. For each returned image, it skips upscaling when the known width or height is already at least 8192; otherwise it calls the FAL image-tool provider with scale 2 under the image-generation timeout (`src/app/api/generate-image/route.ts:198-210`).
4. A successful upscale replaces URL and optional dimensions and rebuilds `resultUrls` from the transformed images (`src/app/api/generate-image/route.ts:211-226`).
5. Any failure in the batch leaves the original generation result in place, logs the error, and returns a warning that generation remained at 4K (`src/app/api/generate-image/route.ts:227-235`).
6. The response reports requested and delivered resolutions; delivery is reported as 4K only when an 8K request produced a warning (`src/app/api/generate-image/route.ts:252-261`).

## Why it matters

`"8K"` is not a native generator request value. Treating it as one would violate [[entities/iimagegenerator]] and [[entities/provider-image-resolution]]; callers must instead preserve requested-versus-delivered semantics and surface the fallback warning (`src/lib/generators/types.ts:47-64`, `src/app/image/page.tsx:223-237`).

## Examples in this codebase

- [[entities/post-api-generate-image]] — owns translation, orchestration, fallback, persistence, and response metadata.
- [[entities/fal-generator]] — performs native 4K generation or editing.
- [[entities/create-fal-provider]] — performs the second-stage 2x upscale and returns dimensions.
- [[entities/image-page-content]] — displays the fallback warning.

## Sources

- `src/app/api/generate-image/route.ts` (lines 105-113, 171-261)
- `src/lib/generators/types.ts` (lines 47-64)
- `src/app/image/page.tsx` (lines 223-237)
- commit `58af484` — “Add high-resolution presets and project documentation”
