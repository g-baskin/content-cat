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
  - "[[entities/requested-image-resolution]]"
  - "[[entities/provider-image-resolution]]"
  - "[[entities/create-fal-provider]]"
  - "[[entities/image-tool-result]]"
used_by:
  - "[[entities/image-page-content]]"
last_commit_hash: 58af484efb4e0c9ed2d0292a067507641651b5fb
tested_by: []
tags: [entity, endpoint, image-generation, resolution]
related:
  - "[[concepts/two-stage-8k-image-generation]]"
sources:
  - src/app/api/generate-image/route.ts:1-281
---

# POST /api/generate-image

> [!contradiction]
> Supersedes this page's prior `1b0e7e7` dependency and response contract in commit `58af484` (2026-08-29).
> Prior contract: native 1K/2K requests with no requested-versus-delivered response metadata. Current contract: 1K–8K requests, 4K provider resolution for requested 8K, direct FAL upscaling, and fallback metadata.

## Overview

This authenticated, rate-limited endpoint validates and dispatches image generation across FAL, Midjourney, Google Gemini, and Freepik (`src/app/api/generate-image/route.ts:22-49`, `src/app/api/generate-image/route.ts:51-74`).

## Request contract

The schema accepts [[entities/requested-image-resolution]] values 1K, 2K, 4K, and 8K, along with prompt, provider/model selection, output settings, up to ten references, and up to six images (`src/app/api/generate-image/route.ts:22-49`). Requests for 4K or 8K are rejected unless the service is FAL and the model is Nano Banana Pro (`src/app/api/generate-image/route.ts:105-113`).

The endpoint retrieves the user's provider key through [[entities/get-api-key]], resolves references, creates the generator through [[entities/get-generator-client]], and rejects editing when the selected generator lacks that capability (`src/app/api/generate-image/route.ts:115-169`).

## Requested-versus-provider resolution

Requested 8K is translated to [[entities/provider-image-resolution]] 4K before the endpoint calls [[entities/iimagegenerator]]; 1K, 2K, and 4K pass through unchanged (`src/app/api/generate-image/route.ts:171-192`). [[entities/fal-generator]] therefore sees only native resolution values.

For an 8K request, the endpoint creates [[entities/create-fal-provider]] and upscales every result whose known maximum dimension is below 8192. Each call uses scale 2 and the image-generation timeout (`src/app/api/generate-image/route.ts:198-210`). Successful [[entities/image-tool-result]] data replaces each image's URL and optional dimensions, after which `resultUrls` is rebuilt (`src/app/api/generate-image/route.ts:211-226`).

If any automatic upscale throws or returns no successful URL, the endpoint retains the original generation result, logs the error, and sets a 4K fallback warning (`src/app/api/generate-image/route.ts:227-235`). This behavior is the [[concepts/two-stage-8k-image-generation]] contract.

## Persistence and response

The route persists each URL in the final `resultUrls` array with user, prompt, aspect ratio, provider, and model metadata (`src/app/api/generate-image/route.ts:238-250`). Its response includes images and URLs plus `requestedResolution`, `deliveredResolution`, and an optional warning. An 8K request is reported as delivered at 4K only when the upscale warning is present (`src/app/api/generate-image/route.ts:252-262`). [[entities/image-page-content]] displays that warning (`src/app/image/page.tsx:223-237`).

## Connections

- Uses [[entities/iimagegenerator]], [[entities/get-generator-client]], and [[entities/get-api-key]].
- Resolves [[entities/requested-image-resolution]] to [[entities/provider-image-resolution]].
- Calls [[entities/create-fal-provider]] and consumes [[entities/image-tool-result]] for automatic 8K upscaling.
- Called by [[entities/image-page-content]].

## History

- Added in commit `1b0e7e7` by AutomationGod on 2026-08-29.
- High-resolution validation, translation, automatic upscale, and delivery metadata were added in commit `58af484` by AutomationGod on 2026-08-29.

> [!stale]
> The pre-`58af484` endpoint contract lacked 4K/8K schema values, requested-versus-provider translation, direct FAL upscale dependency, and requested/delivered response fields.
> The current contract is documented in the `[!contradiction]` callout and sections above.
