---
type: entity
title: createFalProvider
entity_type: function
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/image-tools/fal-tools.ts
language: ts
depends_on:
  - "[[entities/image-tool-provider]]"
  - "[[entities/image-tool-result]]"
used_by:
  - "[[entities/post-api-generate-image]]"
last_commit_hash: 58af484efb4e0c9ed2d0292a067507641651b5fb
tested_by: []
tags: [entity, function, fal, image-tools, upscale]
related:
  - "[[concepts/two-stage-8k-image-generation]]"
sources:
  - src/lib/image-tools/fal-tools.ts:9-40
  - src/lib/image-tools/fal-tools.ts:76-110
---

# createFalProvider

## Overview

`createFalProvider` configures the shared FAL client with the supplied API key and returns an [[entities/image-tool-provider]] implementation (`src/lib/image-tools/fal-tools.ts:31-43`).

## Signature

```ts
export function createFalProvider(apiKey: string): ImageToolProvider;
```

## Upscale result and dimension contract

The upscale method converts the requested scale to a number and normalizes it to a FAL `upscale_factor` of 2 or 4: values at least 4 select 4, and all lower, missing, or non-comparable values select 2 (`src/lib/image-tools/fal-tools.ts:76-88`). It calls `fal-ai/clarity-upscaler` and accepts either `data.image` or the first `data.images` item (`src/lib/image-tools/fal-tools.ts:84-95`).

A missing output URL yields `{ success: false, error: "No output image returned" }`; a valid output yields the URL plus optional width and height copied from FAL (`src/lib/image-tools/fal-tools.ts:94-105`). Exceptions are logged and converted to `{ success: false, error: "Failed to upscale image" }` (`src/lib/image-tools/fal-tools.ts:106-109`). This result shape is consumed by [[entities/post-api-generate-image]] during automatic 8K upscaling (`src/app/api/generate-image/route.ts:198-219`).

## Connections

- Implements [[entities/image-tool-provider]].
- Produces [[entities/image-tool-result]].
- Called directly by [[entities/post-api-generate-image]] for [[concepts/two-stage-8k-image-generation]].

## History

- Created in commit `1b0e7e7` by AutomationGod on 2026-08-29.
- Commit `58af484` corrected FAL's nested `data` response shape, switched upscale input to `upscale_factor`, normalized scale to 2 or 4, and propagated dimensions.

## Sources

- `src/lib/image-tools/fal-tools.ts` (lines 9-110)
