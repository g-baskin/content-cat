---
type: entity
title: ImagePageContent
entity_type: react-component
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/app/image/page.tsx
language: tsx
depends_on:
  - "[[entities/image-prompt-form]]"
  - "[[entities/post-api-generate-image]]"
used_by:
  - "[[entities/presets-page]]"
last_commit_hash: 58af484efb4e0c9ed2d0292a067507641651b5fb
tested_by: []
tags: [entity, react-component, image-generation, api-client]
related:
  - "[[concepts/two-stage-8k-image-generation]]"
sources:
  - src/app/image/page.tsx:45-52
  - src/app/image/page.tsx:184-260
  - src/app/image/page.tsx:356-378
props_summary: none
---

# ImagePageContent

## Overview

`ImagePageContent` orchestrates the image-generation screen. It reads an optional `prompt` query parameter—used by [[entities/presets-page]]—and passes it into [[entities/image-prompt-form]] (`src/app/image/page.tsx:45-52`, `src/app/image/page.tsx:356-365`).

## Definition

```tsx
function ImagePageContent();
```

## Generation caller contract

The form submission handler POSTs prompt, service, model, aspect ratio, resolution, output format, reference URLs, and image count to [[entities/post-api-generate-image]] (`src/app/image/page.tsx:184-220`). It consumes `resultUrls` to save generated images and surfaces the route's optional `warning` as a warning toast (`src/app/image/page.tsx:223-260`). This warning handling is how a failed second-stage 8K upscale is exposed to the user (`src/app/image/page.tsx:235-237`).

The page also offers a separate manual 2x upscale through `/api/image-tools`; that path saves the returned image with the original aspect ratio and is distinct from the automatic 8K route flow (`src/app/image/page.tsx:123-176`).

## Connections

- Hosts [[entities/image-prompt-form]].
- Calls [[entities/post-api-generate-image]].
- Receives prompt links from [[entities/presets-page]].
- Surfaces fallback warnings from [[concepts/two-stage-8k-image-generation]].

## History

- Created before current multi-provider history.
- Commit `58af484` added generation-warning handling and moved manual upscaling to `/api/image-tools` while preserving the selected image aspect ratio.

## Sources

- `src/app/image/page.tsx` (lines 45-52, 123-176, 184-260, 356-378)
