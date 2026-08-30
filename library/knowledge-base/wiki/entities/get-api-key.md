---
type: entity
title: getApiKey
entity_type: function
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/services/apiKeyService.ts
language: ts
depends_on:
  - "[[entities/prisma-runtime]]"
used_by:
  - "[[entities/post-api-generate-image]]"
  - "[[entities/post-api-generate-video]]"
  - "[[entities/post-api-tts-generate]]"
  - "[[entities/get-api-tts-voices]]"
last_commit_hash: 1a4f978751236e69b32a261f7a1ba542ea31cefb
tested_by: []
tags: [entity, api-key, credentials]
related: []
sources:
  - src/lib/services/apiKeyService.ts:12-65
---

# getApiKey

## Overview

`getApiKey` retrieves the unique user/service API-key record and returns its decrypted key only when the record is active (`src/lib/services/apiKeyService.ts:47-57`).

## Signature

```ts
getApiKey(userId: string, service = "fal"): Promise<string | null>
```

The underlying decryption helper supports encrypted and legacy plaintext values (`src/lib/services/apiKeyService.ts:12-29`). Database or decryption-path lookup errors are logged and key retrieval returns `null` (`src/lib/services/apiKeyService.ts:58-65`). Current generator and TTS endpoints pass the authenticated user ID and selected provider, so key retrieval is provider-specific (`src/app/api/generate-image/route.ts:104-114`, `src/app/api/generate-video/route.ts:140-157`, `src/app/api/tts/generate/route.ts:36-44`).

## Connections

- Queries through [[entities/prisma-runtime]].
- Used by image, video, and TTS endpoints linked in frontmatter.

## History

- Last committed in `1a4f978` by kenkaiii on 2025-12-23; scoped endpoints adopted provider-specific lookup in `1b0e7e7`.
