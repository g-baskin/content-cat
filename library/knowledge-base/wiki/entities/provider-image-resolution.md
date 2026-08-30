---
type: entity
title: ProviderImageResolution
entity_type: data-model
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/generators/types.ts
language: ts
depends_on: []
used_by:
  - "[[entities/requested-image-resolution]]"
  - "[[entities/iimagegenerator]]"
  - "[[entities/post-api-generate-image]]"
  - "[[entities/fal-generator]]"
last_commit_hash: 58af484efb4e0c9ed2d0292a067507641651b5fb
tested_by: []
tags: [entity, data-model, image-generation, resolution]
related:
  - "[[concepts/two-stage-8k-image-generation]]"
sources:
  - src/lib/generators/types.ts:47-51
  - src/lib/generators/types.ts:53-64
---

# ProviderImageResolution

## Overview

`ProviderImageResolution` is the native-resolution union accepted by generator requests: `"1K" | "2K" | "4K"` (`src/lib/generators/types.ts:47-50`). It deliberately excludes the API/UI-only `"8K"` request (`src/lib/generators/types.ts:47-51`).

## Definition

```ts
export type ProviderImageResolution = "1K" | "2K" | "4K";
```

## Contract

[[entities/iimagegenerator]] exposes this type through `BaseGenerationRequest.resolution`, so provider implementations never receive `"8K"` through the shared generator contract (`src/lib/generators/types.ts:53-64`). [[entities/post-api-generate-image]] resolves an 8K request to 4K before constructing that request (`src/app/api/generate-image/route.ts:171-183`).

## Connections

- Extended by [[entities/requested-image-resolution]].
- Consumed by [[entities/post-api-generate-image]] and [[entities/fal-generator]].
- Participates in [[concepts/two-stage-8k-image-generation]].

## History

- Added in commit `58af484` by AutomationGod on 2026-08-29.

## Sources

- `src/lib/generators/types.ts` (lines 47-64)
- `src/app/api/generate-image/route.ts` (lines 171-183)
