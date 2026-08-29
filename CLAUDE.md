# Content Cat

Self-hosted AI media generation platform — images (fal.ai, Midjourney, Gemini, Freepik), videos (fal.ai, Sora, Runway, Pika, Luma), TTS (ElevenLabs, OpenAI, F5-TTS, Fish Audio), and a visual node-workflow editor for chaining them.

## Releases

Tag-push triggers `.github/workflows/release.yml` — creates GitHub release, attaches `scripts/install.sh` with SHA256 checksum, auto-generates notes. No CI tests run during release.

```bash
git tag v1.0.0 && git push origin v1.0.0
```

Users install via `curl -fsSL https://raw.githubusercontent.com/KenKaiii/content-cat/main/scripts/install.sh | bash`. The `content-cat` CLI command starts Docker, Postgres, Redis, and the dev server.

Docker prod: `docker compose --profile production up -d` (app won't start without `--profile`). Postgres on host port 5499, not 5432.

<!-- gg:init:start -->

## Architecture

- **Auth**: Custom email+password, no third-party provider. PBKDF2 (310k iterations), server-side sessions in DB, `httpOnly` cookie. `requireAuth()`/`requireAdmin()` called inline per route — no Next.js middleware.
- **API key storage**: Per-user encrypted keys per service. Encryption uses `ENCRYPTION_KEY` env var; dev fallback derives from `SESSION_SECRET` with a different salt — **switching from fallback to real key makes all stored keys permanently undecryptable**.
- **Generation flow**: UI → API route → Zod validate → `getApiKey(userId, service)` → generator factory (fal/midjourney/gemini/etc.) → external API → save to DB → return URL.
- **Workflow engine**: @xyflow/react canvas with typed nodes per model. Nodes stored as JSON blobs. Storyboard = ordered Scenes that generate independently, then stitch into one video.
- **Prisma + pg Pool**: Uses `driverAdapters` preview feature — `pg.Pool` → `PrismaPg` → `PrismaClient({ adapter })`. Prisma doesn't own connections. `statement_timeout: 300000` (5 min) applies to all queries. `@updatedAt` is Prisma-managed only; raw SQL won't touch it.
- **No migration files** — uses `prisma db push` (schema push, not migrations). `migration_lock.toml` locks provider to PostgreSQL.

## Gotchas

1. **Freepik upscale polling has no timeout** — non-200 responses loop forever with no counter/deadline. `upscale-image/route.ts`.
2. **`ffprobe` failure silently returns 5s as duration** — corrupts storyboard timing and transitions invisibly. `video-edit/route.ts`.
3. **Workflow Subtitles node is a pass-through stub** — silently succeeds without doing anything. `useWorkflowExecution.ts`.
4. **`resolveImageForFal` loads images into memory as base64** — no size gate; multiple 4K reference images can spike memory.
5. **API key validation is real only for FAL** — other services just check `key.length > 0`.
6. **Redis failure is permanent per-process** — `redisAvailable` flag never re-checks; requires restart to recover.
7. **Legacy password hashes (100k iterations) never upgrade** — no re-hash-on-login; old users stay on weak iterations.
8. **`@prisma/client` is a devDependency** — `pnpm install --prod` breaks `prisma generate`. Deploy pipelines must run generate before prod-only install.
9. **Rate limiter uses `X-Forwarded-For`** — spoofable; without a proxy all requests share one bucket (`"unknown"`).
10. **`CRON_SECRET` not validated at startup** — cron endpoint returns 500 on first call if unset.

## Required Env Vars

`DATABASE_URL`, `SESSION_SECRET` (64-char hex), `ENCRYPTION_KEY` (64-char hex), `REDIS_URL`, `CRON_SECRET` (32-char hex). `FAL_KEY` optional for image gen. Only `DATABASE_URL` is validated at startup.

<!-- gg:init:end -->
