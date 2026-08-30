---
type: entity
title: getGeneratorClient
entity_type: function
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/generators/factory.ts
language: ts
depends_on:
  - "[[entities/iimagegenerator]]"
used_by:
  - "[[entities/post-api-generate-image]]"
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, image-generation, factory]
related: []
sources:
  - src/lib/generators/factory.ts:6-46
---

# getGeneratorClient

## Overview

`getGeneratorClient` asynchronously selects an image provider implementation from a `GeneratorService` and API key (`src/lib/generators/factory.ts:14-17`).

## Signature

```ts
getGeneratorClient(service: GeneratorService, apiKey: string): Promise<IImageGenerator>
```

It rejects an empty key (`src/lib/generators/factory.ts:18-20`), dynamically imports FAL, Midjourney, Gemini, or Freepik implementations (`src/lib/generators/factory.ts:22-37`), and rejects unknown services (`src/lib/generators/factory.ts:39-40`). Dynamic imports make synchronous initialization unsupported (`src/lib/generators/factory.ts:44-46`).

## Connections

- Returns [[entities/iimagegenerator]].
- Called by [[entities/post-api-generate-image]].

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29.
