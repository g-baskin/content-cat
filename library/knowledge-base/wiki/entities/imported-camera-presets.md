---
type: entity
title: importedCameraPresets
entity_type: config-key
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/imported-presets/cameras.ts
language: ts
depends_on: []
used_by:
  - "[[entities/imported-preset-categories]]"
  - "[[entities/presets-page]]"
last_commit_hash: 58af484efb4e0c9ed2d0292a067507641651b5fb
tested_by: []
tags: [entity, config-key, presets, cameras]
related: []
sources:
  - src/lib/imported-presets/cameras.ts:1-73
  - src/lib/imported-presets/catalog.ts:211-217
---

# importedCameraPresets

## Overview

`importedCameraPresets` is a read-only list of nine imported camera prompt presets (`src/lib/imported-presets/cameras.ts:9-73`). Each item has read-only `id`, `name`, `prompt`, `source`, and literal `imported: true` fields (`src/lib/imported-presets/cameras.ts:1-7`).

## Definition

```ts
export const importedCameraPresets: readonly ImportedCameraPreset[];
```

## Data contract

The nine entries describe modular 8K digital, full-frame cine digital, 70mm film, Super 35 digital, 16mm film, premium large-format digital, IMAX 15/70 film, high-speed digital cinema, and vintage CCD digital capture styles (`src/lib/imported-presets/cameras.ts:9-73`). Every current entry identifies `"KingAI cinema presets"` as its source and sets `imported: true` (`src/lib/imported-presets/cameras.ts:10-72`).

[[entities/imported-preset-categories]] installs this list as the `cameras` category without transforming it (`src/lib/imported-presets/catalog.ts:211-217`). Consequently, [[entities/presets-page]] can consume camera records through the common category shape (`src/app/presets/page.tsx:21-32`).

## Connections

- Embedded by [[entities/imported-preset-categories]].
- Rendered indirectly by [[entities/presets-page]].

## History

- Added in commit `58af484` by AutomationGod on 2026-08-29.

## Sources

- `src/lib/imported-presets/cameras.ts` (lines 1-73)
- `src/lib/imported-presets/catalog.ts` (lines 211-217)
