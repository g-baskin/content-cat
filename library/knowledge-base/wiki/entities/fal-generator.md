---
type: entity
title: FalGenerator
entity_type: class
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/generators/fal-generator.ts
language: ts
depends_on:
  - "[[entities/iimagegenerator]]"
  - "[[entities/provider-image-resolution]]"
used_by:
  - "[[entities/get-generator-client]]"
  - "[[entities/post-api-generate-image]]"
last_commit_hash: 58af484efb4e0c9ed2d0292a067507641651b5fb
tested_by: []
tags: [entity, class, fal, image-generation]
related:
  - "[[concepts/two-stage-8k-image-generation]]"
sources:
  - src/lib/generators/fal-generator.ts:26-45
  - src/lib/generators/fal-generator.ts:47-113
  - src/lib/generators/fal-generator.ts:125-178
---

# FalGenerator

## Overview

`FalGenerator` implements [[entities/iimagegenerator]] for Nano Banana Pro and Seedream 4.5, with Nano Banana Pro as the default model (`src/lib/generators/fal-generator.ts:47-62`).

## Definition

```ts
export class FalGenerator implements IImageGenerator
```

## Native-resolution behavior

For Nano Banana Pro text generation, the class forwards `request.resolution` directly and defaults it to `"1K"`; it does the same for image editing (`src/lib/generators/fal-generator.ts:134-147`, `src/lib/generators/fal-generator.ts:157-172`). Because the shared request field is typed as [[entities/provider-image-resolution]], this native provider path accepts 1K, 2K, or 4K—not requested 8K (`src/lib/generators/types.ts:47-64`).

Seedream generation does not read the shared resolution field; it sends an `image_size` derived from the requested aspect ratio (`src/lib/generators/fal-generator.ts:181-211`). Model selection dispatches generation and editing to model-specific methods (`src/lib/generators/fal-generator.ts:64-100`).

## Connections

- Implements [[entities/iimagegenerator]].
- Receives provider-native resolution values from [[entities/post-api-generate-image]].
- Supplies the first stage of [[concepts/two-stage-8k-image-generation]].

## History

- Created in commit `1b0e7e7` by AutomationGod on 2026-08-29.
- Native resolution forwarding added in commit `58af484` by AutomationGod on 2026-08-29.

## Sources

- `src/lib/generators/fal-generator.ts` (lines 26-211)
- `src/lib/generators/types.ts` (lines 47-64)
