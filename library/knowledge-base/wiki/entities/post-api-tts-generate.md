---
type: entity
title: POST /api/tts/generate
entity_type: endpoint
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/app/api/tts/generate/route.ts
language: ts
depends_on:
  - "[[entities/create-tts-provider]]"
  - "[[entities/get-api-key]]"
  - "[[entities/ittsprovider]]"
used_by: []
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, endpoint, tts]
related: []
sources:
  - src/app/api/tts/generate/route.ts:11-85
---

# POST /api/tts/generate

## Overview

This authenticated endpoint generates speech from text through a selected TTS provider and stores the MP3 locally (`src/app/api/tts/generate/route.ts:11-27`, `src/app/api/tts/generate/route.ts:60-76`).

## Behavior

Text and voice are required; service defaults to OpenAI and speed to 1.0 (`src/app/api/tts/generate/route.ts:16-34`). F5-TTS resolves to the user's FAL key, while other services use their own key name (`src/app/api/tts/generate/route.ts:36-44`). The route creates [[entities/ittsprovider]], requests speech, requires an audio buffer, writes a UUID-named MP3 under `uploads/tts`, and returns the file API URL plus duration (`src/app/api/tts/generate/route.ts:46-77`).

## Connections

- Uses [[entities/get-api-key]] and [[entities/create-tts-provider]].

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29.
