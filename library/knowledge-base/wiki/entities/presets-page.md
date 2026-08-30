---
type: entity
title: PresetsPage
entity_type: react-component
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/app/presets/page.tsx
language: tsx
depends_on:
  - "[[entities/imported-preset-categories]]"
used_by: []
last_commit_hash: 58af484efb4e0c9ed2d0292a067507641651b5fb
tested_by: []
tags: [entity, react-component, presets, image-generation]
related:
  - "[[entities/image-page-content]]"
sources:
  - src/app/presets/page.tsx:1-32
  - src/app/presets/page.tsx:34-176
props_summary: none
---

# PresetsPage

## Overview

`PresetsPage` is the client-rendered `/presets` catalog browser backed by [[entities/imported-preset-categories]] (`src/app/presets/page.tsx:1-17`).

## Definition

```tsx
export default function PresetsPage();
```

## Behavior

The component defaults to the camera category, computes the selected category from its ID, and filters only that category by a trimmed, locale-lowercased query against preset names and prompts (`src/app/presets/page.tsx:17-32`). Changing category also clears the search query (`src/app/presets/page.tsx:67-90`).

It derives the displayed total from all category array lengths and renders category-local counts (`src/app/presets/page.tsx:12-15`, `src/app/presets/page.tsx:45-47`, `src/app/presets/page.tsx:69-87`). Each preset card displays provenance and links to `/image?prompt=<encoded prompt>`, which [[entities/image-page-content]] reads as its initial prompt (`src/app/presets/page.tsx:124-159`, `src/app/image/page.tsx:45-52`).

## Connections

- Reads [[entities/imported-preset-categories]].
- Sends selected preset prompts to [[entities/image-page-content]] through the image-page query string.

## History

- Added in commit `58af484` by AutomationGod on 2026-08-29.

## Sources

- `src/app/presets/page.tsx` (lines 1-176)
- `src/app/image/page.tsx` (lines 45-52)
