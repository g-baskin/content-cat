---
type: entity
title: POST /api/generate-image
entity_type: endpoint
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/app/api/generate-image/route.ts
language: ts
depends_on:
  - "[[entities/get-generator-client]]"
  - "[[entities/get-api-key]]"
  - "[[entities/iimagegenerator]]"
used_by: []
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, endpoint, image-generation]
related: []
sources:
  - src/app/api/generate-image/route.ts:18-273
---

# POST /api/generate-image

## Overview

This authenticated, rate-limited endpoint validates and dispatches image generation across FAL, Midjourney, Google Gemini, and Freepik (`src/app/api/generate-image/route.ts:18-49`).

## Behavior

The request supports prompts, provider/model selection, output settings, up to ten references, and up to six images (`src/app/api/generate-image/route.ts:18-38`). It retrieves the active per-user provider key through [[entities/get-api-key]] (`src/app/api/generate-image/route.ts:104-114`) and creates the provider through [[entities/get-generator-client]] (`src/app/api/generate-image/route.ts:141-147`).

Reference-image requests are rejected when the provider reports no editing capability (`src/app/api/generate-image/route.ts:149-157`). Generation or editing runs under the image timeout (`src/app/api/generate-image/route.ts:172-182`); requested 8K output is generated at 4K and then upscaled, with a warning if upscaling fails (`src/app/api/generate-image/route.ts:185-227`). Each result is persisted with provider and model metadata (`src/app/api/generate-image/route.ts:230-242`).

## Connections

- Uses [[entities/iimagegenerator]], [[entities/get-generator-client]], and [[entities/get-api-key]].

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29.
