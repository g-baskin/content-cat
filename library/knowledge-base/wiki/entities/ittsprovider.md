---
type: entity
title: ITTSProvider
entity_type: service
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/tts/types.ts
language: ts
depends_on: []
used_by:
  - "[[entities/create-tts-provider]]"
  - "[[entities/post-api-tts-generate]]"
  - "[[entities/get-api-tts-voices]]"
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, tts, provider-contract]
related: []
sources:
  - src/lib/tts/types.ts:1-41
endpoints:
  - "[[entities/post-api-tts-generate]]"
  - "[[entities/get-api-tts-voices]]"
env_vars: []
---

# ITTSProvider

## Overview

`ITTSProvider` standardizes speech generation and voice discovery for OpenAI, ElevenLabs, Fish Audio, and F5-TTS (`src/lib/tts/types.ts:1-1`, `src/lib/tts/types.ts:26-40`).

## Definition

```ts
interface ITTSProvider {
  generateSpeech(request: TTSRequest): Promise<TTSResponse>;
  getVoices(): Promise<Voice[]>;
  getService(): TTSService;
}
```

Requests require text and a voice, with optional speed and pitch (`src/lib/tts/types.ts:11-16`). Responses can carry an audio URL or buffer, estimated duration, or error (`src/lib/tts/types.ts:18-24`).

## Connections

- Created by [[entities/create-tts-provider]].
- Used by [[entities/post-api-tts-generate]] and [[entities/get-api-tts-voices]].

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29.
