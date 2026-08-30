---
type: entity
title: POST /api/generate-video
entity_type: endpoint
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/app/api/generate-video/route.ts
language: ts
depends_on:
  - "[[entities/get-video-generator-client]]"
  - "[[entities/get-api-key]]"
  - "[[entities/ivideogenerator]]"
used_by: []
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, endpoint, video-generation]
related: []
sources:
  - src/app/api/generate-video/route.ts:22-308
---

# POST /api/generate-video

## Overview

This authenticated, rate-limited endpoint generates video through FAL, OpenAI Sora, Runway, Pika, or Luma (`src/app/api/generate-video/route.ts:22-94`).

## Behavior

The schema supports text-to-video, image-to-video, and first/last-frame modes plus provider-specific model, duration, ratio, resolution, audio, seed, and speed settings (`src/app/api/generate-video/route.ts:43-70`). Service selection prioritizes an explicit service, then model inference, then FAL (`src/app/api/generate-video/route.ts:129-138`). The route loads the user's active provider key (`src/app/api/generate-video/route.ts:140-157`), creates [[entities/ivideogenerator]], and checks mode capabilities (`src/app/api/generate-video/route.ts:183-195`).

It dispatches to the contract method matching the mode (`src/app/api/generate-video/route.ts:197-255`), applies the video-generation timeout (`src/app/api/generate-video/route.ts:258-262`), and stores the returned video metadata (`src/app/api/generate-video/route.ts:264-288`).

## Connections

- Uses [[entities/get-video-generator-client]], [[entities/ivideogenerator]], and [[entities/get-api-key]].

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29.
