---
type: entity
title: IImageGenerator
entity_type: service
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/generators/types.ts
language: ts
depends_on: []
used_by:
  - "[[entities/get-generator-client]]"
  - "[[entities/post-api-generate-image]]"
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, image-generation, provider-contract]
related: []
sources:
  - src/lib/generators/types.ts:31-131
endpoints:
  - "[[entities/post-api-generate-image]]"
env_vars: []
---

# IImageGenerator

## Overview

`IImageGenerator` is the common contract for FAL, Midjourney, Google Gemini, and Freepik image providers; the supported service discriminants are declared alongside it (`src/lib/generators/types.ts:31-35`).

## Definition

```ts
interface IImageGenerator {
  generateImage(request: BaseGenerationRequest): Promise<GeneratorResponse>;
  editImage(request: BaseEditRequest): Promise<GeneratorResponse>;
  getCapabilities(): GeneratorCapabilities;
  getService(): GeneratorService;
}
```

The contract standardizes generated image URLs and metadata (`src/lib/generators/types.ts:40-45`), request fields (`src/lib/generators/types.ts:50-66`), and successful responses (`src/lib/generators/types.ts:71-78`). Providers report editing and async support through capabilities (`src/lib/generators/types.ts:83-91`) and may implement model selection, job polling, and key validation (`src/lib/generators/types.ts:97-131`).

## Connections

- Created by [[entities/get-generator-client]].
- Consumed by [[entities/post-api-generate-image]].

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29: “Add multi-provider generation and storyboard workflows.”
