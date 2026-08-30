---
type: entity
title: /api/storyboards
entity_type: endpoint
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/app/api/storyboards/route.ts
language: ts
depends_on:
  - "[[entities/storyboard]]"
  - "[[entities/scene]]"
used_by: []
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, endpoint, storyboard]
related: []
sources:
  - src/app/api/storyboards/route.ts:6-89
---

# /api/storyboards

## Overview

The authenticated storyboard collection route lists a user's storyboards and creates new ones (`src/app/api/storyboards/route.ts:13-16`, `src/app/api/storyboards/route.ts:50-53`).

## Behavior

`GET` filters by the authenticated user, includes ordered scene summaries and counts, and sorts by most recently updated (`src/app/api/storyboards/route.ts:18-40`). `POST` validates name, description, and aspect ratio (`src/app/api/storyboards/route.ts:6-11`), then creates a user-owned [[entities/storyboard]] and returns it with an empty scene collection (`src/app/api/storyboards/route.ts:55-81`). Invalid input returns 400 and storage failures return 500 (`src/app/api/storyboards/route.ts:59-64`, `src/app/api/storyboards/route.ts:82-87`).

## Connections

- Reads and creates [[entities/storyboard]] records with [[entities/scene]] summaries.

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29.
