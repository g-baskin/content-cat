---
type: entity
title: importedPresetCategories
entity_type: config-key
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/imported-presets/catalog.ts
language: ts
depends_on:
  - "[[entities/imported-camera-presets]]"
used_by:
  - "[[entities/presets-page]]"
last_commit_hash: 58af484efb4e0c9ed2d0292a067507641651b5fb
tested_by: []
tags: [entity, config-key, presets, catalog]
related: []
sources:
  - src/lib/imported-presets/catalog.ts:3-24
  - src/lib/imported-presets/catalog.ts:26-209
  - src/lib/imported-presets/catalog.ts:211-248
---

# importedPresetCategories

## Overview

`importedPresetCategories` is the read-only image-preset catalog consumed by [[entities/presets-page]]. It contains six ordered categories: cameras, lenses, shots, lighting, styles, and enhancements (`src/lib/imported-presets/catalog.ts:3-9`, `src/lib/imported-presets/catalog.ts:211-248`).

## Definition

```ts
export const importedPresetCategories: readonly ImportedPresetCategory[];
```

## Catalog contract

Every category has an ID, display name, description, and a read-only preset list; every catalog preset has an ID, name, prompt, source, and literal `imported: true` marker (`src/lib/imported-presets/catalog.ts:11-24`). Camera entries come from [[entities/imported-camera-presets]], while the other five lists are defined in the catalog module (`src/lib/imported-presets/catalog.ts:1`, `src/lib/imported-presets/catalog.ts:26-209`).

At current committed main the arrays contain 9 camera, 11 lens, 4 shot, 6 lighting, 14 style, and 5 enhancement presets, for 49 total (`src/lib/imported-presets/cameras.ts:9-73`, `src/lib/imported-presets/catalog.ts:26-209`). The enhancement list includes an `"8K resolution"` prompt modifier; that text preset is distinct from the resolution request contract (`src/lib/imported-presets/catalog.ts:197-209`).

## Connections

- Embeds [[entities/imported-camera-presets]].
- Drives category navigation, counts, search, and prompt links in [[entities/presets-page]].

## History

- Added in commit `58af484` by AutomationGod on 2026-08-29.

## Sources

- `src/lib/imported-presets/catalog.ts` (lines 1-248)
- `src/lib/imported-presets/cameras.ts` (lines 9-73)
