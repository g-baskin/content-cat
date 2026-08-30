---
type: entity
title: GET /api/tts/voices
entity_type: endpoint
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/app/api/tts/voices/route.ts
language: ts
depends_on:
  - "[[entities/create-tts-provider]]"
  - "[[entities/get-api-key]]"
  - "[[entities/ittsprovider]]"
used_by: []
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, endpoint, tts, voices]
related: []
sources:
  - src/app/api/tts/voices/route.ts:6-52
---

# GET /api/tts/voices

## Overview

This authenticated endpoint returns voices from a selected TTS provider (`src/app/api/tts/voices/route.ts:22-44`).

## Behavior

The service query defaults to OpenAI (`src/app/api/tts/voices/route.ts:27-29`). Key lookup maps OpenAI, ElevenLabs, and Fish Audio directly while F5-TTS uses the FAL key (`src/app/api/tts/voices/route.ts:6-20`). After retrieving the active user key, the route creates [[entities/ittsprovider]], calls `getVoices`, and returns voices with the service (`src/app/api/tts/voices/route.ts:31-44`). Missing keys return 400 and provider failures return 500 (`src/app/api/tts/voices/route.ts:33-50`).

## Connections

- Uses [[entities/get-api-key]] and [[entities/create-tts-provider]].

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29.
