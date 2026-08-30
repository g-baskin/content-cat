---
type: entity
title: Prisma Runtime
entity_type: service
status: developing
created: "2026-08-29"
updated: "2026-08-29"
path: src/lib/prisma.ts
language: ts
depends_on: []
used_by:
  - "[[entities/get-api-key]]"
  - "[[entities/storyboards-api]]"
  - "[[entities/storyboard-scenes-api]]"
  - "[[entities/post-storyboard-stitch]]"
last_commit_hash: 1a4f978751236e69b32a261f7a1ba542ea31cefb
tested_by: []
tags: [entity, database, prisma, runtime]
related: []
sources:
  - src/lib/prisma.ts:1-60
  - package.json:18-65
endpoints: []
env_vars:
  - DATABASE_URL
---

# Prisma Runtime

## Overview

The database runtime builds Prisma Client on a caller-owned PostgreSQL pool through `PrismaPg` (`src/lib/prisma.ts:28-48`).

## Behavior

The pool uses `DATABASE_URL`, production-sensitive pool sizes, connection and idle timeouts, and a five-minute statement timeout (`src/lib/prisma.ts:12-34`). Pool errors are logged and the pool reference is retained for cleanup (`src/lib/prisma.ts:36-44`). Development reuses a global Prisma instance, while `disconnectPrisma` closes both Prisma and the underlying pool (`src/lib/prisma.ts:50-60`). Runtime adapter and `pg` are regular dependencies, while `@prisma/client` and the Prisma CLI are currently dev dependencies (`package.json:18-24`, `package.json:37-37`, `package.json:49-65`).

## Connections

- Supplies database access to [[entities/get-api-key]] and the storyboard endpoints.

## History

- Runtime source last committed in `1a4f978` by kenkaiii on 2025-12-23; `1b0e7e7` added scoped Prisma models and dependencies used by the storyboard feature.
