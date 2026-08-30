# Generated Application Background

> Category: Frontend Architecture | Version: 1.0 | Date: August 2026 | Status: Active

The application shell uses a checked-in generated WebP image as its global background instead of mounting the former runtime WebGL shader component.

**Related:**

- [Content Cat product capabilities](../../public/overview/product-capabilities.md)
- [Runtime, data, and provider architecture](../platform/runtime-data-and-providers.md)

## Current implementation

`public/images/content-cat-background.webp` is a 1672 × 941 WebP asset. Global body styles combine the image with a dark linear-gradient overlay, center it, scale it with `cover`, prevent repetition, and keep it fixed while page content scrolls. `min-height: 100svh` ensures the background fills the small-viewport-height unit used by mobile browsers.

The root layout renders application providers and the toast host directly. It no longer imports or mounts `ShaderBackgroundWrapper`, so the background does not require a canvas or WebGL execution at runtime.

**Code references:** `public/images/content-cat-background.webp`, `src/app/globals.css`, `src/app/layout.tsx`.

## Maintenance workflow

- Treat the WebP as a source-controlled runtime asset; keep the public URL `/images/content-cat-background.webp` stable unless the CSS reference changes in the same revision.
- Preserve a dark fallback color because the image may not be decoded immediately.
- Preserve sufficient overlay contrast for foreground controls and text.
- Verify `cover` behavior at wide desktop and narrow mobile viewports after replacing the asset; the center crop intentionally changes with aspect ratio.
- Do not reintroduce the shader wrapper merely because shader-related packages or components remain in the repository. The durable application-shell behavior is determined by `src/app/layout.tsx` and `src/app/globals.css`.

## Change provenance

Commit `9f4cf03` added the generated WebP and responsive body background, and removed the shader wrapper from the root layout. The current code still reflects that application-shell behavior.

**Code references:** `src/app/layout.tsx`, `src/app/globals.css`, `public/images/content-cat-background.webp`.
