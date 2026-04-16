# Unknot

A zero-friction capture and organization tool for language learners. Dump raw notes during class, and let AI unknot them into structured vocabulary and flashcards.

**Core loop:** Buffer → Unknot → Flashcards

## Quick Start

```bash
# Start all services (Postgres, Redis, Next.js app)
docker compose up -d

# Push database schema
DATABASE_URL=postgresql://unknot:unknot@localhost:5434/unknot pnpm db:push

# Seed sample data (optional)
DATABASE_URL=postgresql://unknot:unknot@localhost:5434/unknot pnpm db:seed
```

Open [http://localhost:3000](http://localhost:3000).

## Prerequisites

- Docker Desktop
- Node.js 20+
- pnpm (`npm install -g pnpm`)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `AUTH_SECRET` | Yes | Random secret for Auth.js sessions |
| `AUTH_RESEND_KEY` | Yes | Resend API key for magic link emails |
| `OPENAI_API_KEY` | For AI | OpenAI key (or swap provider in `src/lib/ai/provider.ts`) |

## Development (without Docker)

```bash
# Start Postgres + Redis only
docker compose up db redis -d

# Install dependencies
pnpm install

# Run dev server
pnpm dev
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run tests (Vitest) |
| `pnpm lint` | Lint with Biome |
| `pnpm format` | Format with Biome |
| `pnpm db:push` | Push Drizzle schema to database |
| `pnpm db:seed` | Seed sample data |
| `pnpm db:studio` | Open Drizzle Studio |

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **API:** tRPC v11
- **Auth:** Auth.js v5 (magic link via Resend)
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL
- **AI:** Vercel AI SDK (provider-agnostic)
- **SRS:** ts-fsrs (spaced repetition)
- **Testing:** Vitest
- **Linting:** Biome

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Magic link login
│   ├── (app)/                 # Protected routes
│   │   ├── buffer/            # Note capture
│   │   ├── library/           # Past notes
│   │   ├── study/             # Flashcard SRS deck
│   │   ├── cards/             # Card management
│   │   ├── settings/          # User settings
│   │   └── onboarding/        # First-time setup
│   └── api/
│       ├── trpc/[trpc]/       # tRPC handler
│       └── auth/[...nextauth]/ # Auth.js handler
├── server/
│   ├── trpc/routers/          # notes, unknot, cards, users
│   └── db/                    # Drizzle schema, client, seed
├── lib/
│   ├── ai/                    # AI provider + unknot prompt
│   ├── srs/                   # FSRS wrapper
│   └── trpc/                  # tRPC client
└── components/
    ├── layout/                # TopNav, BottomTabs, ThemeToggle
    └── providers/             # TRPCProvider
```
