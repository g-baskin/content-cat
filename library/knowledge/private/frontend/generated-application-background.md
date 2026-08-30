# Generated Application Background

> Category: Frontend Architecture | Version: 1.1 | Date: August 2026 | Status: Active

The application shell uses a checked-in generated WebP image as its global background instead of mounting the former runtime WebGL shader component.

**Related:**

- [Content Cat product capabilities](../../public/overview/product-capabilities.md)
- [Runtime, data, and provider architecture](../platform/runtime-data-and-providers.md)

## Current implementation

`public/images/content-cat-background.webp` is a 1672 × 941 WebP asset served directly from the public tree. Global body styles layer a dark linear-gradient above it, center it, scale it with `cover`, prevent repetition, and keep it fixed while page content scrolls. `min-height: 100svh` follows the small viewport on mobile browser chrome changes while still allowing the body to grow with content.

Responsiveness comes from CSS cropping, not responsive image variants: every viewport requests the same WebP, and `cover` scales it until both axes are filled. Wide and tall screens therefore expose different centered crops. The dark `background-color` remains visible before decode or if the asset fails, while the overlay provides stable foreground contrast.

The root layout renders application providers and the toast host directly. It does not import or mount `ShaderBackgroundWrapper`, so the application shell creates no canvas, animation loop, or WebGL context for its background. Shader components and dependencies may remain available elsewhere in the repository without being part of this shell contract.

**Code references:** `public/images/content-cat-background.webp`, `src/app/globals.css`, `src/app/layout.tsx`.

## Maintenance workflow

- Treat the WebP as a source-controlled runtime asset; keep the public URL `/images/content-cat-background.webp` stable unless the CSS reference changes in the same revision.
- Preserve a dark fallback color because the image may not be decoded immediately.
- Preserve sufficient overlay contrast for foreground controls and text.
- Verify `cover` behavior at wide desktop and narrow mobile viewports after replacing the asset; the center crop intentionally changes with aspect ratio. Important subjects near the source image edges can disappear.
- Test scrolling on mobile Safari as well as desktop after changing `background-attachment: fixed`; browser handling of fixed body backgrounds can differ, and the current CSS has no mobile-specific override.
- Budget the single full-size WebP for every page load. It is a CSS background, so Next.js image optimization, `srcset`, intrinsic layout sizing, and component-level loading controls do not apply.
- Do not reintroduce the shader wrapper merely because shader-related packages or components remain in the repository. The durable application-shell behavior is determined by `src/app/layout.tsx` and `src/app/globals.css`.

## Change provenance

Commit `9f4cf03` added the generated WebP and responsive body background, and removed the shader wrapper from the root layout. The current code still reflects that application-shell behavior.

**Code references:** `src/app/layout.tsx`, `src/app/globals.css`, `public/images/content-cat-background.webp`.
