---
type: entity
title: Storyboard
entity_type: data-model
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: prisma/schema.prisma
language: prisma
depends_on:
  - "[[entities/scene]]"
used_by:
  - "[[entities/storyboards-api]]"
  - "[[entities/storyboard-scenes-api]]"
  - "[[entities/post-storyboard-stitch]]"
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, data-model, storyboard]
related: []
sources:
  - prisma/schema.prisma:119-142
---

# Storyboard

## Overview

`Storyboard` stores a user's ordered scene collection and optional final stitched video (`prisma/schema.prisma:119-135`).

## Definition

The model defaults to draft status, tracks total duration and aspect ratio, and uses Prisma-managed timestamps (`prisma/schema.prisma:120-128`). Its optional unique `finalVideoId` links one generated video (`prisma/schema.prisma:130-132`), while deleting a user cascades to their storyboards (`prisma/schema.prisma:134-135`). The table is indexed by user, creation time, user-plus-creation time, and status (`prisma/schema.prisma:137-141`).

## Connections

- Owns many [[entities/scene]] records.
- Read or mutated by [[entities/storyboards-api]], [[entities/storyboard-scenes-api]], and [[entities/post-storyboard-stitch]].

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29.
