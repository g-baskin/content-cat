---
type: entity
title: RequestedImageResolution
entity_type: data-model
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/generators/types.ts
language: ts
depends_on:
  - "[[entities/provider-image-resolution]]"
used_by:
  - "[[entities/post-api-generate-image]]"
  - "[[entities/image-prompt-form]]"
last_commit_hash: 58af484efb4e0c9ed2d0292a067507641651b5fb
tested_by: []
tags: [entity, data-model, image-generation, resolution]
related:
  - "[[concepts/two-stage-8k-image-generation]]"
sources:
  - src/lib/generators/types.ts:47-51
  - src/app/api/generate-image/route.ts:22-37
---

# RequestedImageResolution

## Overview

`RequestedImageResolution` is the API/UI resolution union. It extends [[entities/provider-image-resolution]] with `"8K"`, separating user intent from provider-native input (`src/lib/generators/types.ts:47-51`).

## Definition

```ts
export type RequestedImageResolution = ProviderImageResolution | "8K";
```

## Contract

[[entities/post-api-generate-image]] uses the type to constrain its `IMAGE_RESOLUTIONS` schema catalog to 1K, 2K, 4K, and 8K (`src/app/api/generate-image/route.ts:22-37`). The route accepts 8K only for FAL Nano Banana Pro and translates it to the provider-native 4K request before generation (`src/app/api/generate-image/route.ts:105-113`, `src/app/api/generate-image/route.ts:171-183`).

## Connections

- Extends [[entities/provider-image-resolution]].
- Selected by [[entities/image-prompt-form]].
- Resolved by [[entities/post-api-generate-image]] as part of [[concepts/two-stage-8k-image-generation]].

## History

- Added in commit `58af484` by AutomationGod on 2026-08-29.

## Sources

- `src/lib/generators/types.ts` (lines 47-51)
- `src/app/api/generate-image/route.ts` (lines 22-37, 105-113, 171-183)
