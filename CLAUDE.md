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

## Key Conventions

- **Next.js 16 breaking changes:** `middleware.ts` is now `proxy.ts` (exported function named `proxy`). `cookies()`, `headers()`, `params`, `searchParams` must be `await`ed. Turbopack is default.
- **pnpm** as package manager (not npm/yarn)
- **Biome** for linting/formatting (not ESLint)
- **Protected routes** live under `src/app/(app)/`, public under `src/app/(auth)/`
- **tRPC routers** in `src/server/trpc/routers/` — use `protectedProcedure` for authenticated endpoints
- **AI calls** go through `src/lib/ai/` — provider-agnostic via Vercel AI SDK
- **Database schema** in `src/server/db/schema.ts` — use `pnpm db:push` to sync
- **Seed data** via `pnpm db:seed` — creates dev user `dev@unknot.app` with sample German flashcards

## Development

Run the app locally with `pnpm dev`. Requires local PostgreSQL.

```bash
# Run dev server
pnpm dev
```

App runs locally at `localhost:3000`. Database at `localhost:5432`.

## Commands

```bash
pnpm dev          # Dev server (local)
pnpm build        # Production build
pnpm test         # Vitest
pnpm lint         # Biome check
pnpm db:push      # Push schema to Postgres (requires local Postgres running)
pnpm db:seed      # Seed dev data (requires local Postgres running)
```

`DATABASE_URL=postgresql://localhost:5432/unknot` is set in `.env.local`.

## Deferred Features

See `docs/future.md` for everything cut from MVP: audio/TTS, Google OAuth, email/password auth, batch unknotting, stats dashboard, Anki export, mobile app.
