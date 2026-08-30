---
title: Contradiction Report — 2026-08-29
type: meta
status: developing
report_type: contradiction
date: "2026-08-29"
created: "2026-08-29"
updated: "2026-08-29"
contradiction_count: 2
tags: [meta, contradiction-report]
---

# Contradiction Report — 2026-08-29

---

## 23:00 — 58af484 — IImageGenerator

- **Old page:** [[entities/iimagegenerator]] (prior contract, commit `1b0e7e7`)
- **New page:** [[entities/iimagegenerator]] (current contract, commit `58af484`)
- **Reason:** `BaseGenerationRequest` gained optional `resolution: ProviderImageResolution`; UI-only 8K must be resolved before provider invocation (`src/lib/generators/types.ts:47-64`).
- **Commit:** `58af484` — “Add high-resolution presets and project documentation” — AutomationGod
- **Severity:** warning
- **Resolution:** Current callers use [[entities/provider-image-resolution]]; [[entities/post-api-generate-image]] translates requested 8K to provider-native 4K (`src/app/api/generate-image/route.ts:171-192`).

## 23:00 — 58af484 — POST /api/generate-image

- **Old page:** [[entities/post-api-generate-image]] (prior dependency/response contract, commit `1b0e7e7`)
- **New page:** [[entities/post-api-generate-image]] (current contract, commit `58af484`)
- **Reason:** The endpoint added 4K/8K validation, requested-to-provider resolution translation, a direct [[entities/create-fal-provider]] upscale dependency, and requested/delivered/warning response fields (`src/app/api/generate-image/route.ts:105-113`, `src/app/api/generate-image/route.ts:171-236`, `src/app/api/generate-image/route.ts:252-261`).
- **Commit:** `58af484` — “Add high-resolution presets and project documentation” — AutomationGod
- **Severity:** warning
- **Resolution:** [[entities/image-page-content]] sends the selected resolution and surfaces the optional warning (`src/app/image/page.tsx:205-237`).
