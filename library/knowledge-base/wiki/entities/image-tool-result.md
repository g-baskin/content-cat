---
type: entity
title: ImageToolResult
entity_type: data-model
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/image-tools/types.ts
language: ts
depends_on: []
used_by:
  - "[[entities/image-tool-provider]]"
  - "[[entities/create-fal-provider]]"
  - "[[entities/post-api-generate-image]]"
last_commit_hash: 58af484efb4e0c9ed2d0292a067507641651b5fb
tested_by: []
tags: [entity, data-model, image-tools]
related:
  - "[[concepts/two-stage-8k-image-generation]]"
sources:
  - src/lib/image-tools/types.ts:25-31
  - src/lib/image-tools/fal-tools.ts:94-108
---

# ImageToolResult

## Overview

`ImageToolResult` is the common result envelope for image-tool operations. It always reports `success` and may carry an output URL, dimensions, or an error (`src/lib/image-tools/types.ts:25-31`).

## Definition

```ts
interface ImageToolResult {
  success: boolean;
  url?: string;
  width?: number;
  height?: number;
  error?: string;
}
```

## Contract

Successful operations are not guaranteed to include dimensions because `url`, `width`, and `height` are all optional (`src/lib/image-tools/types.ts:25-31`). [[entities/create-fal-provider]] preserves FAL width and height specifically for upscale results when those fields are present in the provider response (`src/lib/image-tools/fal-tools.ts:94-105`). [[entities/post-api-generate-image]] treats `success` plus a URL as the minimum successful 8K-upscale result and copies optional dimensions into the generated image (`src/app/api/generate-image/route.ts:206-219`).

## Connections

- Returned by every method on [[entities/image-tool-provider]].
- Produced by [[entities/create-fal-provider]].
- Consumed by [[entities/post-api-generate-image]].

## History

- Created in commit `1b0e7e7` by AutomationGod on 2026-08-29.
- Dimension propagation from FAL upscale responses was added in commit `58af484`.

## Sources

- `src/lib/image-tools/types.ts` (lines 25-31)
- `src/lib/image-tools/fal-tools.ts` (lines 94-108)
