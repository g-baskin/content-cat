# Runtime, Data, and Provider Architecture

> Category: Engineering Reference | Version: 1.1 | Date: August 2026 | Status: Active

Content Cat runs as a Next.js application backed by PostgreSQL, Prisma's PostgreSQL driver adapter, Redis-assisted rate limiting, local generated-file storage, and user-selected external media providers.

**Related:**

- [Content Cat product capabilities](../../public/overview/product-capabilities.md)
- [Generation and storyboard workflows](../../public/guides/generation-and-storyboards.md)
- [Generated application background](../frontend/generated-application-background.md)

## Request and provider boundaries

Media generation routes follow the same broad sequence:

1. Require an authenticated database-backed session.
2. Parse and validate untrusted request data.
3. Apply the generation rate limit.
4. Resolve the requested service/model and load the active key owned by that user.
5. Instantiate the provider adapter through an image, video, TTS, or image-tool factory.
6. Execute with provider-specific polling and outer timeout behavior where applicable.
7. Persist durable media metadata in PostgreSQL and return the provider or local-storage URL.

Image adapters implement FAL.ai, Midjourney, Google Gemini, and Freepik. Video adapters implement FAL.ai, OpenAI, Runway, Pika, and Luma. TTS adapters implement OpenAI, ElevenLabs, Fish Audio, and F5-TTS. Capability checks happen before unsupported image-edit or video mode requests are sent.

**Code references:** `src/app/api/generate-image/route.ts`, `src/app/api/generate-video/route.ts`, `src/lib/generators/factory.ts`, `src/lib/video-generators/factory.ts`, `src/lib/tts/index.ts`.

## Image resolution and dimensions

The public image request accepts `1K`, `2K`, `4K`, or `8K`, but the provider abstraction accepts only native `1K`, `2K`, or `4K`. Both the form and route restrict 4K and 8K to FAL.ai Nano Banana Pro. The route maps a requested 8K job to a native 4K provider request, then performs a second FAL Clarity Upscaler call at 2× for every returned image. This is a two-stage, potentially two-billable-operation workflow; “8K” is not a native provider resolution.

The automatic upscale preserves provider-returned `width` and `height` on each response image. It skips an image whose longest reported edge is already at least 8192 pixels. If any image in the batch fails to upscale or the second stage times out, `Promise.all` rejects the stage: the route returns the original generated batch, reports `deliveredResolution: "4K"`, and includes the warning `Generated at 4K, but automatic 8K upscaling failed`. The image page displays this warning as a toast. Generation still reports success and persists the original 4K URLs; callers must inspect `warning` or `deliveredResolution` rather than treating HTTP success as proof of 8K delivery.

Provider dimensions are transient response metadata, not fields on `GeneratedImage` database records. The Image Details panel therefore loads the saved URL in a browser `Image`, reports its `naturalWidth` × `naturalHeight`, and derives a display quality band from the longest edge (`>=7000` 8K, `>=3500` 4K, `>=1800` 2K, otherwise 1K). Those labels describe measured pixels, not the requested setting, and show loading or unavailable states when the remote asset cannot be decoded or is blocked.

Manual Upscale is a separate image-tools flow. It currently requests 2×, chooses Freepik before FAL.ai when both keys exist, saves the result as a new image record with an “(2x upscaled)” prompt suffix, and does not expose provider-returned dimensions in the route response. Do not conflate that action with the automatic FAL-only second stage of an 8K generation request.

**Code references:** `src/components/ImagePromptForm.tsx`, `src/lib/constants/image-form.ts`, `src/app/api/generate-image/route.ts`, `src/lib/generators/types.ts`, `src/lib/generators/fal-generator.ts`, `src/lib/image-tools/fal-tools.ts`, `src/app/api/image-tools/route.ts`, `src/app/image/page.tsx`, `src/components/ImageDetailPanel.tsx`, `prisma/schema.prisma`.

## Imported preset catalog

`/presets` is a client-rendered, read-only catalog backed by checked-in TypeScript constants, not PostgreSQL or an external runtime feed. `catalog.ts` defines the category order and the shared preset contract (`id`, `name`, `prompt`, `source`, and the literal imported marker). Camera entries are intentionally split into `cameras.ts`; lens, shot, lighting, style, and enhancement entries remain in `catalog.ts`. The current catalog contains 49 entries across six categories.

Search is local and limited to the selected category's name and prompt fields. Switching categories clears the query. The star is an import-provenance marker, not a favorite control. “Use in Image” URL-encodes only the preset prompt into `/image?prompt=...`; the image page initializes its prompt from that query parameter but does not persist a preset ID, source, camera choice, provider, or model association. In particular, camera names and “8K resolution” enhancement text are prompt vocabulary and do not select hardware or change the generation resolution field.

Source labels preserve the declared import provenance: camera and lens items come from KingAI cinema presets, shots from KingAI product-shot presets, styles from KingAI ad-style presets, and lighting/enhancement modifiers from research-hub enhancement tags. Maintain stable IDs and explicit source labels when updating the catalog because no database migration or remote reconciliation layer exists.

**Code references:** `src/app/presets/page.tsx`, `src/lib/imported-presets/catalog.ts`, `src/lib/imported-presets/cameras.ts`, `src/app/image/page.tsx`, `src/components/Header.tsx`.

## Per-user API keys

`ApiKey` records are unique by `(userId, service)` and include an active flag. The API-key write route performs an upsert-like create/update and encrypts plaintext before persistence. Listing keys decrypts them only to produce a masked value; generation code requests the active record through `getApiKey()`, which decrypts legacy or encrypted storage before use.

The global header owns the current API-key UI contract. Its API Keys button opens a modal that lists masked credentials, offers FAL.ai, Midjourney, Google Gemini, and Freepik, and saves one credential per service. The same header separately checks only for a saved FAL credential. Its adjacent action links to FAL key creation when absent and FAL billing when present. Closing the modal causes that header check to run again. The Settings navigation item is not the owner of this modal even though some API errors still tell users to add a key “in Settings.”

Client-side format validation requires only non-empty text for all four services. Save does not require the user to run Validate first. The explicit Validate action performs a remote authentication probe only for FAL.ai; Midjourney, Gemini, and Freepik validation reports format validity for any non-empty value. A positive result for those three services does not prove that the credential is accepted, funded, or authorized for a model. The modal's Delete control calls `DELETE /api/api-keys?service=...`, but the collection route currently implements only GET and POST; the implemented deletion route is `DELETE /api/api-keys/[id]`. Until those contracts are aligned, deletion from this modal can fail.

Encryption uses AES-256-GCM with a random 16-byte IV and authentication tag. `ENCRYPTION_KEY` is mandatory in production. A 64-character value is interpreted as a raw hexadecimal 256-bit key; another non-empty value is expanded with scrypt. Development may derive a key from `SESSION_SECRET` with a different salt.

The encryption key is part of persisted-data compatibility: changing from the development fallback to `ENCRYPTION_KEY`, or rotating either secret without re-encrypting records, means existing ciphertext can no longer be decrypted. Preserve the effective key across restarts and deployments, and migrate stored keys deliberately before rotation.

The key-management endpoint accepts only the four image-provider service names represented in the modal. This is narrower than the set of implemented video/TTS adapters. F5-TTS reuses FAL.ai. Also, storyboard dialogue generation currently queries the `ApiKey` row directly rather than using `getApiKey()`; unlike the standalone TTS route, it therefore does not pass stored encrypted credentials through the normal decryption helper.

**Code references:** `prisma/schema.prisma`, `src/components/Header.tsx`, `src/components/ApiKeysModal.tsx`, `src/app/api/api-keys/route.ts`, `src/app/api/api-keys/[id]/route.ts`, `src/app/api/api-keys/validate/route.ts`, `src/lib/services/apiKeyService.ts`, `src/lib/encryption.ts`, `src/app/api/tts/generate/route.ts`, `src/app/api/storyboards/[id]/generate-dialogue/route.ts`.

## Prisma and PostgreSQL runtime

The Prisma schema uses PostgreSQL and enables the `driverAdapters` preview feature. Runtime construction is explicit:

- `pg.Pool` owns database connections.
- `PrismaPg` wraps that pool.
- `PrismaClient` receives the adapter rather than owning its usual engine-managed pool.
- Development reuses the Prisma client and pool through `globalThis` across reloads.
- The pool maximum is 5 connections in development and 20 in production; connection timeout is 10 seconds, idle timeout is 30 seconds, and statement timeout is 5 minutes.
- `disconnectPrisma()` disconnects Prisma and then ends the retained pool.

`DATABASE_URL` is read through the environment module. The Compose PostgreSQL service runs PostgreSQL 16, publishes container port 5432 on host port 5499 by default, and persists data in the `postgres_data` volume. Redis 7 persists to `redis_data`.

The repository does not contain versioned Prisma migration directories. Installation generates the Prisma client and applies the current schema with `pnpm prisma db push`. The production Docker image generates Prisma during its builder stage but its runtime command only starts `server.js`; schema push is therefore an installation/deployment responsibility, not an application-startup action.

**Code references:** `prisma/schema.prisma`, `src/lib/prisma.ts`, `src/lib/env.ts`, `docker-compose.yml`, `Dockerfile`, `scripts/install.sh`.

## Flow-specific operational caveats

- Automatic 8K has two independently timed external stages. The route uses the image-generation timeout for generation and again for each upscale, while the image-page request has its own three-minute client timeout. Provider work may continue after a caller times out.
- A multi-image 8K upscale is all-or-fallback at the application response boundary. One failed item discards successful upscale URLs from the returned batch and falls back to all original generation URLs; already-created provider assets are not cleaned up.
- The generation route persists each returned URL, and the image page subsequently POSTs each URL to `/api/images` before inserting it into the visible list. This can create duplicate history records unless the persistence ownership is consolidated or the create endpoint deduplicates.
- Resolution request and delivery status are returned by the generation API but are not persisted on generated-image records. Historical records cannot prove whether a user requested 8K or received the warning fallback.
- Presets are bundled application data. Catalog changes require a rebuild/redeploy, and source labels are descriptive provenance rather than runtime integrity verification.
- API-key list rendering depends on successful decryption of every selected row. A secret mismatch can make the collection request fail rather than merely marking one key unavailable.

**Code references:** `src/app/api/generate-image/route.ts`, `src/app/image/page.tsx`, `src/app/api/images/route.ts`, `src/app/presets/page.tsx`, `src/lib/imported-presets/catalog.ts`, `src/app/api/api-keys/route.ts`, `src/lib/encryption.ts`.

## Deployment workflow

For local services, `docker compose up -d postgres redis` starts only the database and cache. The application service belongs to the `production` profile, so the full container deployment requires `docker compose --profile production up -d`. Within Compose, the app connects to PostgreSQL on `postgres:5432`; host-side commands use the published port, 5499 unless overridden.

The installer also installs FFmpeg, starts PostgreSQL and Redis, waits for PostgreSQL readiness, generates Prisma, and pushes the schema. The Docker image includes the standalone Next.js build and Prisma runtime artifacts, but generated and uploaded media need deployment-level persistence if container replacement must not remove them.

**Code references:** `docker-compose.yml`, `Dockerfile`, `scripts/install.sh`, `src/lib/storage.ts`.

## Persisted domain model

User ownership is explicit for generated images, generated videos, characters, products, workflows, storyboards, sessions, and API keys. Storyboards own ordered scenes and may reference one final generated video. Deleting a user cascades through owned records; deleting a storyboard cascades through its scenes.

Workflows store nodes and edges as JSON. Storyboards and scenes use string status fields, while scene configuration and transition/dialogue metadata are first-class columns.

**Code references:** `prisma/schema.prisma`.
