# Runtime, Data, and Provider Architecture

> Category: Engineering Reference | Version: 1.0 | Date: August 2026 | Status: Active

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

## Per-user API keys

`ApiKey` records are unique by `(userId, service)` and include an active flag. The API-key write route performs an upsert-like create/update and encrypts plaintext before persistence. Listing keys decrypts them only to produce a masked value; generation code requests the active record through `getApiKey()`, which decrypts legacy or encrypted storage before use.

Encryption uses AES-256-GCM with a random 16-byte IV and authentication tag. `ENCRYPTION_KEY` is mandatory in production. A 64-character value is interpreted as a raw hexadecimal 256-bit key; another non-empty value is expanded with scrypt. Development may derive a key from `SESSION_SECRET` with a different salt.

The encryption key is part of persisted-data compatibility: changing from the development fallback to `ENCRYPTION_KEY`, or rotating either secret without re-encrypting records, means existing ciphertext can no longer be decrypted. Preserve the effective key across restarts and deployments, and migrate stored keys deliberately before rotation.

The key-management endpoint currently validates service names only for FAL.ai, Midjourney, Google Gemini, and Freepik. This is narrower than the set of implemented video/TTS adapters. Also, storyboard dialogue generation currently queries the `ApiKey` row directly rather than using `getApiKey()`; unlike the standalone TTS route, it therefore does not pass stored encrypted credentials through the normal decryption helper.

**Code references:** `prisma/schema.prisma`, `src/app/api/api-keys/route.ts`, `src/lib/services/apiKeyService.ts`, `src/lib/encryption.ts`, `src/app/api/tts/generate/route.ts`, `src/app/api/storyboards/[id]/generate-dialogue/route.ts`.

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

## Deployment workflow

For local services, `docker compose up -d postgres redis` starts only the database and cache. The application service belongs to the `production` profile, so the full container deployment requires `docker compose --profile production up -d`. Within Compose, the app connects to PostgreSQL on `postgres:5432`; host-side commands use the published port, 5499 unless overridden.

The installer also installs FFmpeg, starts PostgreSQL and Redis, waits for PostgreSQL readiness, generates Prisma, and pushes the schema. The Docker image includes the standalone Next.js build and Prisma runtime artifacts, but generated and uploaded media need deployment-level persistence if container replacement must not remove them.

**Code references:** `docker-compose.yml`, `Dockerfile`, `scripts/install.sh`, `src/lib/storage.ts`.

## Persisted domain model

User ownership is explicit for generated images, generated videos, characters, products, workflows, storyboards, sessions, and API keys. Storyboards own ordered scenes and may reference one final generated video. Deleting a user cascades through owned records; deleting a storyboard cascades through its scenes.

Workflows store nodes and edges as JSON. Storyboards and scenes use string status fields, while scene configuration and transition/dialogue metadata are first-class columns.

**Code references:** `prisma/schema.prisma`.
