---
type: entity
title: ImagePromptForm
entity_type: react-component
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/components/ImagePromptForm.tsx
language: tsx
depends_on:
  - "[[entities/requested-image-resolution]]"
used_by:
  - "[[entities/image-page-content]]"
last_commit_hash: 58af484efb4e0c9ed2d0292a067507641651b5fb
tested_by: []
tags: [entity, react-component, image-generation, resolution]
related:
  - "[[entities/post-api-generate-image]]"
sources:
  - src/components/ImagePromptForm.tsx:38-90
  - src/components/ImagePromptForm.tsx:109-116
  - src/components/ImagePromptForm.tsx:632-642
props_summary: onSubmit, initialPrompt, initialService, initialModel, initialSubModel, recreateData, editData
---

# ImagePromptForm

## Overview

`ImagePromptForm` collects image-generation settings and emits prompt, provider, model, count, aspect ratio, resolution, format, and reference-image values through `onSubmit` (`src/components/ImagePromptForm.tsx:38-59`).

## Definition

```tsx
export default function ImagePromptForm(props: ImagePromptFormProps);
```

## Resolution behavior

The form starts at 1K. It exposes the full resolution option list only when the selected service is `fal` and the model is `nano-banana-pro`; all other combinations are restricted to 1K and 2K (`src/components/ImagePromptForm.tsx:70-90`). If a user has 4K or 8K selected and then moves to an unsupported service/model, an effect resets the resolution to 1K (`src/components/ImagePromptForm.tsx:109-116`). The filtered list drives the resolution selector (`src/components/ImagePromptForm.tsx:632-642`).

The emitted resolution remains a string in the component props contract; [[entities/post-api-generate-image]] performs authoritative schema validation against [[entities/requested-image-resolution]] (`src/components/ImagePromptForm.tsx:38-48`, `src/app/api/generate-image/route.ts:22-37`).

## Connections

- Rendered and submitted by [[entities/image-page-content]].
- Constrains UI choices corresponding to [[entities/requested-image-resolution]].
- Its request is validated by [[entities/post-api-generate-image]].

## History

- Created before current multi-provider history.
- High-resolution option gating and reset behavior were added in commit `58af484` by AutomationGod on 2026-08-29.

## Sources

- `src/components/ImagePromptForm.tsx` (lines 38-116, 632-642)
