---
type: entity
title: createTTSProvider
entity_type: function
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/tts/index.ts
language: ts
depends_on:
  - "[[entities/ittsprovider]]"
used_by:
  - "[[entities/post-api-tts-generate]]"
  - "[[entities/get-api-tts-voices]]"
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, tts, factory]
related: []
sources:
  - src/lib/tts/index.ts:1-32
---

# createTTSProvider

## Overview

`createTTSProvider` maps the selected TTS service and API key to an [[entities/ittsprovider]] implementation (`src/lib/tts/index.ts:16-19`).

## Behavior

The factory supports OpenAI, ElevenLabs, Fish Audio, and F5-TTS (`src/lib/tts/index.ts:20-28`) and throws for an unknown service (`src/lib/tts/index.ts:29-30`). Provider constructors are exported from the same module (`src/lib/tts/index.ts:1-5`).

## Connections

- Returns [[entities/ittsprovider]].
- Called by [[entities/post-api-tts-generate]] and [[entities/get-api-tts-voices]].

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29.
