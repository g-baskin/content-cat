---
type: entity
title: POST /api/storyboards/[id]/stitch
entity_type: endpoint
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/app/api/storyboards/[id]/stitch/route.ts
language: ts
depends_on:
  - "[[entities/storyboard]]"
  - "[[entities/scene]]"
used_by: []
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, endpoint, storyboard, video-stitching]
related: []
sources:
  - src/app/api/storyboards/[id]/stitch/route.ts:7-140
---

# POST /api/storyboards/[id]/stitch

## Overview

This endpoint assembles completed scenes from an owned storyboard into a final MP4 (`src/app/api/storyboards/[id]/stitch/route.ts:7-25`, `src/app/api/storyboards/[id]/stitch/route.ts:34-44`).

## Behavior

The route marks the storyboard generating, maps completed scenes—including transition and dialogue audio fields—to stitcher input, and requests 1080p at 30 fps (`src/app/api/storyboards/[id]/stitch/route.ts:46-68`). Stitch failures mark the storyboard failed (`src/app/api/storyboards/[id]/stitch/route.ts:70-79`). Success stores the MP4, creates a generated-video record, links it as the storyboard final video, and marks the storyboard complete (`src/app/api/storyboards/[id]/stitch/route.ts:82-118`). Unhandled errors also attempt to mark the storyboard failed (`src/app/api/storyboards/[id]/stitch/route.ts:119-138`).

## Connections

- Consumes ordered [[entities/scene]] records and updates [[entities/storyboard]].

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29.
