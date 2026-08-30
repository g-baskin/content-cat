---
type: entity
title: Static App Background
entity_type: config-key
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/app/globals.css
language: css
depends_on: []
used_by: []
last_commit_hash: 9f4cf03a180e55dbcfb57956bdf234b9bcd3ac48
tested_by: []
tags: [entity, ui, background, static-asset]
related: []
sources:
  - src/app/globals.css:15-30
  - src/app/layout.tsx:15-50
---

# Static App Background

## Overview

The global body renders a generated WebP as a fixed, cover-sized background beneath a dark linear-gradient overlay (`src/app/globals.css:20-30`).

## Definition

```css
body {
  background-image:
    linear-gradient(...), url("/images/content-cat-background.webp");
  background-position: center;
  background-size: cover;
  background-attachment: fixed;
}
```

The root layout now renders application providers and the toaster directly inside the body (`src/app/layout.tsx:35-50`); the background therefore comes from global CSS rather than a layout wrapper component. The body also uses `100svh` minimum height and disables overscroll on the document (`src/app/globals.css:15-22`).

## History

- Added in `9f4cf03` by AutomationGod on 2026-08-29: “Add responsive generated app background.”
