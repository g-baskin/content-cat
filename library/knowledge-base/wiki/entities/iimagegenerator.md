---
type: entity
title: IImageGenerator
entity_type: service
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/generators/types.ts
language: ts
depends_on:
  - "[[entities/provider-image-resolution]]"
used_by:
  - "[[entities/get-generator-client]]"
  - "[[entities/post-api-generate-image]]"
  - "[[entities/fal-generator]]"
last_commit_hash: 58af484efb4e0c9ed2d0292a067507641651b5fb
tested_by: []
tags: [entity, image-generation, provider-contract]
related:
  - "[[concepts/two-stage-8k-image-generation]]"
sources:
  - src/lib/generators/types.ts:31-136
endpoints:
  - "[[entities/post-api-generate-image]]"
env_vars: []
---

# IImageGenerator

> [!contradiction]
> Supersedes this page's prior `1b0e7e7` contract in commit `58af484` (2026-08-29).
> Prior contract: generation requests had no resolution field. Current contract: `BaseGenerationRequest.resolution` optionally accepts [[entities/provider-image-resolution]].
> Callers must resolve UI-only 8K requests before invoking a generator.

## Overview

`IImageGenerator` is the common contract for FAL, Midjourney, Google Gemini, and Freepik image providers; the supported service discriminants are declared alongside it (`src/lib/generators/types.ts:31-39`, `src/lib/generators/types.ts:99-136`).

## Definition

```ts
interface IImageGenerator {
  generateImage(request: BaseGenerationRequest): Promise<GeneratorResponse>;
  editImage(request: BaseEditRequest): Promise<GeneratorResponse>;
  getCapabilities(): GeneratorCapabilities;
  getService(): GeneratorService;
}
```

## Request contract

The shared base request includes prompt, image count, aspect ratio, optional [[entities/provider-image-resolution]], output format, seed, safety-checker control, strength, and guidance scale (`src/lib/generators/types.ts:53-68`). `BaseEditRequest` extends that contract with reference image URLs (`src/lib/generators/types.ts:70-76`). Because provider resolution excludes 8K, [[entities/post-api-generate-image]] translates requested 8K into provider-native 4K before calling this interface (`src/app/api/generate-image/route.ts:171-192`).

The contract standardizes generated image URLs and metadata (`src/lib/generators/types.ts:41-45`) and successful responses (`src/lib/generators/types.ts:78-85`). Providers report editing and async support through capabilities and may implement model selection, job polling, and key validation (`src/lib/generators/types.ts:90-136`).

## Connections

- Created by [[entities/get-generator-client]].
- Implemented by [[entities/fal-generator]] and other provider classes.
- Consumed by [[entities/post-api-generate-image]].
- Uses [[entities/provider-image-resolution]] to keep [[concepts/two-stage-8k-image-generation]] outside provider-native requests.

## History

- Added in commit `1b0e7e7` by AutomationGod on 2026-08-29.
- Resolution support was added in commit `58af484` by AutomationGod on 2026-08-29.

> [!stale]
> The pre-`58af484` request contract documented on this page did not include a resolution field.
> The current contract adds optional `BaseGenerationRequest.resolution: ProviderImageResolution`; see the `[!contradiction]` callout above.
