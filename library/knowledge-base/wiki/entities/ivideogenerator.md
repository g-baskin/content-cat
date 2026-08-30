---
type: entity
title: IVideoGenerator
entity_type: service
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/video-generators/types.ts
language: ts
depends_on: []
used_by:
  - "[[entities/get-video-generator-client]]"
  - "[[entities/post-api-generate-video]]"
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, video-generation, provider-contract]
related: []
sources:
  - src/lib/video-generators/types.ts:32-171
endpoints:
  - "[[entities/post-api-generate-video]]"
env_vars: []
---

# IVideoGenerator

## Overview

`IVideoGenerator` is the provider contract for FAL, OpenAI, Runway, Pika, and Luma (`src/lib/video-generators/types.ts:32-37`).

## Definition

```ts
interface IVideoGenerator {
  generateTextToVideo(
    request: TextToVideoRequest
  ): Promise<VideoGeneratorResponse>;
  generateImageToVideo(
    request: ImageToVideoRequest
  ): Promise<VideoGeneratorResponse>;
  generateFirstLastFrame?(
    request: FirstLastFrameRequest
  ): Promise<VideoGeneratorResponse>;
  getCapabilities(): VideoGeneratorCapabilities;
  getService(): VideoGeneratorService;
  getModel(): string;
}
```

The request types cover text, image, and first/last-frame modes (`src/lib/video-generators/types.ts:42-89`). Providers expose supported modes, durations, ratios, resolutions, audio, negative-prompt support, and models (`src/lib/video-generators/types.ts:105-115`); first/last-frame generation is optional (`src/lib/video-generators/types.ts:145-151`).

## Connections

- Created by [[entities/get-video-generator-client]].
- Consumed by [[entities/post-api-generate-video]].

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29.
