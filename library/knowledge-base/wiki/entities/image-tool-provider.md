---
type: entity
title: ImageToolProvider
entity_type: service
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/image-tools/types.ts
language: ts
depends_on:
  - "[[entities/image-tool-result]]"
used_by:
  - "[[entities/create-fal-provider]]"
last_commit_hash: 58af484efb4e0c9ed2d0292a067507641651b5fb
tested_by: []
tags: [entity, service, image-tools, provider-contract]
related:
  - "[[concepts/two-stage-8k-image-generation]]"
sources:
  - src/lib/image-tools/types.ts:11-17
  - src/lib/image-tools/types.ts:33-64
  - src/lib/image-tools/index.ts:21-73
endpoints: []
env_vars: []
---

# ImageToolProvider

## Overview

`ImageToolProvider` is the provider-neutral interface for eight image operations: sharpen, upscale, background removal, color grading, portrait enhancement, lighting correction, product photography, and style transfer (`src/lib/image-tools/types.ts:33-64`).

## Definition

```ts
interface ImageToolProvider {
  name: string;
  upscale(
    imageUrl: string,
    options?: ImageToolOptions
  ): Promise<ImageToolResult>;
  // seven additional image-tool methods
}
```

## Contract

Every operation returns [[entities/image-tool-result]]; all methods accept an image URL, and all except background removal may accept shared options (`src/lib/image-tools/types.ts:33-64`). Upscale options allow a numeric scale or string `"2"`/`"4"`, while the result contract can report optional output dimensions (`src/lib/image-tools/types.ts:11-17`, `src/lib/image-tools/types.ts:25-31`).

The image-tool dispatcher selects Freepik before FAL when both keys exist and delegates each tool discriminator to the corresponding provider method (`src/lib/image-tools/index.ts:17-32`, `src/lib/image-tools/index.ts:38-73`). The 8K generation route bypasses that priority selector and creates the FAL implementation directly (`src/app/api/generate-image/route.ts:198-207`).

## Connections

- Implemented by [[entities/create-fal-provider]].
- Returns [[entities/image-tool-result]].
- Its FAL upscale method participates in [[concepts/two-stage-8k-image-generation]].

## History

- Added in commit `1b0e7e7` by AutomationGod on 2026-08-29.
- The interface remained stable in `58af484`; its FAL implementation began populating result dimensions.

## Sources

- `src/lib/image-tools/types.ts` (lines 11-64)
- `src/lib/image-tools/index.ts` (lines 17-73)
