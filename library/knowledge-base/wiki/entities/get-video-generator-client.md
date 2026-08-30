---
type: entity
title: getVideoGeneratorClient
entity_type: function
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/video-generators/factory.ts
language: ts
depends_on:
  - "[[entities/ivideogenerator]]"
used_by:
  - "[[entities/post-api-generate-video]]"
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, video-generation, factory]
related: []
sources:
  - src/lib/video-generators/factory.ts:16-118
---

# getVideoGeneratorClient

## Overview

`getVideoGeneratorClient` validates a service/model pairing and creates the corresponding video provider (`src/lib/video-generators/factory.ts:65-76`).

## Behavior

The factory catalogs provider models and defaults for FAL, OpenAI, Runway, Pika, and Luma (`src/lib/video-generators/factory.ts:16-33`). It rejects a model not listed for the requested service (`src/lib/video-generators/factory.ts:50-55`) and instantiates the service-specific implementation with either the requested or default model (`src/lib/video-generators/factory.ts:78-110`). `getServiceForModel` supports model-based service inference (`src/lib/video-generators/factory.ts:38-45`).

## Connections

- Returns [[entities/ivideogenerator]].
- Called by [[entities/post-api-generate-video]].

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29.
