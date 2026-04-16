@AGENTS.md

# Project: Unknot

Language learning capture tool. See `product.md` for product spec, `tech.md` for technical spec, `docs/1st-plan.md` for implementation plan.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- tRPC v11 (API layer) + Drizzle ORM (Postgres)
- Auth.js v5 beta (magic link via Resend)
- Vercel AI SDK (provider-agnostic, default: OpenAI)
- ts-fsrs (spaced repetition)
- Vitest (testing) + Biome (linting/formatting)
- Docker Compose (Postgres on 5434, Redis on 6379, app on 3000)

## Key Conventions

- **Next.js 16 breaking changes:** `middleware.ts` is now `proxy.ts` (exported function named `proxy`). `cookies()`, `headers()`, `params`, `searchParams` must be `await`ed. Turbopack is default.
- **pnpm** as package manager (not npm/yarn)
- **Biome** for linting/formatting (not ESLint)
- **Protected routes** live under `src/app/(app)/`, public under `src/app/(auth)/`
- **tRPC routers** in `src/server/trpc/routers/` — use `protectedProcedure` for authenticated endpoints
- **AI calls** go through `src/lib/ai/` — provider-agnostic via Vercel AI SDK
- **Database schema** in `src/server/db/schema.ts` — use `pnpm db:push` to sync
- **Seed data** via `pnpm db:seed` — creates dev user `dev@unknot.app` with sample German flashcards

## Docker-First Development

All development runs through Docker Compose. Always ensure containers are running before executing commands.

```bash
# Start everything (app + Postgres + Redis)
docker compose up -d

# Stop everything
docker compose down

# Rebuild after dependency changes
docker compose build app && docker compose up -d
```

App runs inside Docker at `localhost:3000`. Database at `localhost:5434`. Redis at `localhost:6379`.

## Commands

All commands should be run from the host (they connect to Docker services via `DATABASE_URL` in `.env.local`):

```bash
pnpm dev          # Dev server (or use docker compose up for full stack)
pnpm build        # Production build
pnpm test         # Vitest
pnpm lint         # Biome check
pnpm db:push      # Push schema to Postgres (requires Docker db running)
pnpm db:seed      # Seed dev data (requires Docker db running)
```

When running `db:push` or `db:seed` from host, ensure `DATABASE_URL=postgresql://unknot:unknot@localhost:5434/unknot` is set (already in `.env.local`).

## Deferred Features

See `docs/future.md` for everything cut from MVP: audio/TTS, Google OAuth, email/password auth, batch unknotting, stats dashboard, Anki export, mobile app.
