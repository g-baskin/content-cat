---
type: entity
title: /api/storyboards/[id]/scenes
entity_type: endpoint
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/app/api/storyboards/[id]/scenes/route.ts
language: ts
depends_on:
  - "[[entities/storyboard]]"
  - "[[entities/scene]]"
used_by: []
last_commit_hash: 1b0e7e7cbd85a3b7a55fa23694a03523d179ae6e
tested_by: []
tags: [entity, endpoint, storyboard, scene]
related: []
sources:
  - src/app/api/storyboards/[id]/scenes/route.ts:6-168
---

# /api/storyboards/[id]/scenes

## Overview

This authenticated collection route lists or inserts scenes after verifying that the current user owns the storyboard (`src/app/api/storyboards/[id]/scenes/route.ts:28-54`, `src/app/api/storyboards/[id]/scenes/route.ts:66-93`).

## Behavior

`POST` validates provider, model, duration, generation options, transitions, dialogue, and an optional insertion position (`src/app/api/storyboards/[id]/scenes/route.ts:6-26`). Inserting shifts later scene orders; appending uses the current last order (`src/app/api/storyboards/[id]/scenes/route.ts:108-126`). The route inherits the storyboard aspect ratio when absent, creates the [[entities/scene]], and recalculates total storyboard duration including transition durations (`src/app/api/storyboards/[id]/scenes/route.ts:128-167`).

## Connections

- Manages [[entities/scene]] records owned by [[entities/storyboard]].

## History

- Added in `1b0e7e7` by AutomationGod on 2026-08-29.
