---
type: entity
title: Scene
entity_type: data-model
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: prisma/schema.prisma
language: prisma
depends_on:
  - "[[entities/storyboard]]"
used_by:
  - "[[entities/storyboard-scenes-api]]"
  - "[[entities/post-storyboard-stitch]]"
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, data-model, storyboard, video-generation, tts]
related: []
sources:
  - prisma/schema.prisma:144-188
---

# Scene

## Overview

`Scene` is an ordered unit of a [[entities/storyboard]] containing generation parameters, state, references, transition settings, and dialogue metadata (`prisma/schema.prisma:144-178`).

## Definition

Scenes default to five seconds, FAL, Kling 2.6, and pending status (`prisma/schema.prisma:145-159`). Optional generation fields cover negative prompts, seed, CFG scale, audio, and start/end images (`prisma/schema.prisma:161-169`). Transition and TTS fields support stitching and generated dialogue (`prisma/schema.prisma:171-178`). The storyboard relation cascades on deletion and is indexed with order for ordered retrieval (`prisma/schema.prisma:180-188`).

## Connections

- Belongs to [[entities/storyboard]].
- Managed by [[entities/storyboard-scenes-api]] and consumed by [[entities/post-storyboard-stitch]].

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29.
