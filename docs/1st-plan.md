# Unknot — MVP Build Plan (1st Shot)

> Goal: functional end-to-end loop — **Buffer → Unknot → Flashcards** — running locally via Docker Compose.

---

## Decisions Summary

| Decision | Choice |
|---|---|
| Auth | Magic link via Resend (email only) |
| AI | Vercel AI SDK (provider-agnostic, start with OpenAI) |
| Processing | Inline (no queue) — direct call in tRPC mutation, 2000 char limit |
| Flashcards | Auto-generated from unknotted vocab, soft-archive via `kept` field |
| Grouping | `language` field + optional `label` on notes (no full sessions yet) |
| User profile | Native language stored on user (used for translations) |
| Audio/TTS | Deferred to v1.1 (see docs/future.md) |
| Package manager | pnpm |
| Linting | Biome (fast, replaces ESLint + Prettier) |
| Testing | Vitest |
| Local dev | Docker Compose (Postgres + Redis + App) |
| UI | Tailwind CSS, minimalist, light/dark mode, mobile-first |

---

## Phase 0 — Project Setup & Tooling

### 0.1 — Package manager migration
- [ ] Remove `package-lock.json` and `node_modules`
- [ ] Install pnpm globally if needed
- [ ] `pnpm install` to generate `pnpm-lock.yaml`

### 0.2 — Replace ESLint with Biome
- [ ] Remove `eslint.config.mjs`, `eslint`, `eslint-config-next` from devDependencies
- [ ] Install `@biomejs/biome`
- [ ] Create `biome.json` with TypeScript + React rules
- [ ] Update `package.json` scripts: `"lint": "biome check ."`, `"format": "biome format --write ."`

### 0.3 — Vitest setup
- [ ] Install `vitest`, `@vitejs/plugin-react` (for component tests later)
- [ ] Create `vitest.config.ts` with path aliases matching `tsconfig.json`
- [ ] Add `"test": "vitest"` script
- [ ] Create a trivial smoke test to verify setup

### 0.4 — Docker Compose
- [ ] Create `Dockerfile` (multi-stage: deps → build → run)
- [ ] Create `docker-compose.yml`:
  - `db`: Postgres 16, exposed on 5432, volume for persistence
  - `redis`: Redis 7, exposed on 6379
  - `app`: Next.js app, depends on db + redis, mounts source for dev hot-reload
- [ ] Create `.env.example` with all required env vars
- [ ] Create `.env` (gitignored) from example
- [ ] Verify `docker compose up` starts everything

### 0.5 — Path aliases & base config
- [ ] Verify `tsconfig.json` has `@/*` → `src/*` alias
- [ ] Update `next.config.ts` if needed for any experimental flags

---

## Phase 1 — Database & ORM

### 1.1 — Install Drizzle
- [ ] Install `drizzle-orm`, `pg`, `@types/pg`
- [ ] Install `drizzle-kit` as devDependency
- [ ] Create `drizzle.config.ts` pointing to `DATABASE_URL`

### 1.2 — Schema (src/server/db/schema.ts)
- [ ] `users` table:
  - `id` (uuid, PK)
  - `email` (text, unique, not null)
  - `name` (text, nullable)
  - `nativeLanguage` (text, nullable) — e.g., "English", "Portuguese"
  - `emailVerified` (timestamp, nullable) — for Auth.js
  - `createdAt` (timestamp, default now)
- [ ] `accounts` table — required by Auth.js adapter
- [ ] `verification_tokens` table — required by Auth.js for magic links
- [ ] `notes` table:
  - `id` (uuid, PK)
  - `userId` (uuid, FK → users)
  - `language` (text, nullable) — target language, set after unknotting
  - `label` (text, nullable) — optional free-text tag
  - `rawText` (text, not null, max 2000 chars enforced at API level)
  - `status` (enum: pending, processing, done, error)
  - `createdAt` (timestamp)
- [ ] `unknotResults` table:
  - `id` (uuid, PK)
  - `noteId` (uuid, FK → notes)
  - `detectedLanguage` (text)
  - `rawJson` (jsonb) — full LLM response
  - `createdAt` (timestamp)
- [ ] `vocabularyItems` table:
  - `id` (uuid, PK)
  - `unknotResultId` (uuid, FK → unknot_results)
  - `userId` (uuid, FK → users)
  - `term` (text, not null)
  - `translation` (text)
  - `partOfSpeech` (text)
  - `gender` (text, nullable)
  - `plural` (text, nullable)
  - `conjugations` (jsonb, nullable)
  - `ipa` (text, nullable)
  - `category` (text)
  - `exampleSentence` (text)
  - `kept` (boolean, default true)
  - `createdAt` (timestamp)
- [ ] `flashcards` table:
  - `id` (uuid, PK)
  - `userId` (uuid, FK → users)
  - `vocabularyItemId` (uuid, FK → vocabulary_items)
  - FSRS fields: `stability`, `difficulty`, `elapsedDays`, `scheduledDays`, `reps`, `lapses`, `state`, `dueAt`, `lastReviewAt`

### 1.3 — Drizzle client (src/server/db/index.ts)
- [ ] Create Drizzle client with `pg` Pool using `DATABASE_URL`
- [ ] Export typed `db` instance

### 1.4 — Push schema
- [ ] `pnpm drizzle-kit push` to apply schema to local Postgres
- [ ] Verify tables exist

### 1.5 — Seed script (src/server/db/seed.ts)
- [ ] Create a seed user with known email
- [ ] Create 2-3 sample notes (one pending, one done)
- [ ] Create sample unknot results + vocabulary items for the "done" note
- [ ] Create sample flashcards (some due today, some due later)
- [ ] Add `"db:seed": "npx tsx src/server/db/seed.ts"` script
- [ ] Add `"db:push": "drizzle-kit push"` script

---

## Phase 2 — Auth (Magic Link via Resend)

### 2.1 — Install auth dependencies
- [ ] Install `next-auth@5` (Auth.js v5), `@auth/drizzle-adapter`
- [ ] Install `resend` (for email delivery)

### 2.2 — Auth config (src/auth.ts)
- [ ] Configure Auth.js with:
  - `DrizzleAdapter(db)`
  - Email provider (Auth.js built-in) with Resend as transport
  - Session strategy: JWT (simpler, no session table needed)
- [ ] Set `AUTH_SECRET`, `AUTH_RESEND_KEY` env vars

### 2.3 — Auth API route
- [ ] Create `src/app/api/auth/[...nextauth]/route.ts` — export GET/POST handlers

### 2.4 — Middleware (src/middleware.ts)
- [ ] Protect all `(app)` routes — redirect unauthenticated users to `/login`
- [ ] Allow `/login`, `/api/auth/*` publicly

### 2.5 — Login page (src/app/(auth)/login/page.tsx)
- [ ] Simple form: email input + "Send magic link" button
- [ ] "Check your email" confirmation state
- [ ] Minimal branding (Unknot logo/name + tagline)

### 2.6 — Auth utility
- [ ] Helper `getServerSession()` wrapper for use in tRPC context
- [ ] Helper `requireAuth()` that throws if no session

---

## Phase 3 — tRPC Setup

### 3.1 — Install tRPC
- [ ] Install `@trpc/server@11`, `@trpc/client@11`, `@trpc/react-query@11`
- [ ] Install `@tanstack/react-query`
- [ ] Install `zod`
- [ ] Install `superjson` (for Date serialization)

### 3.2 — tRPC server (src/server/trpc/)
- [ ] `trpc.ts` — create tRPC instance with superjson transformer
- [ ] Define `createContext` that extracts user session
- [ ] `publicProcedure` and `protectedProcedure` (checks auth)
- [ ] `router.ts` — merge all sub-routers

### 3.3 — tRPC API route
- [ ] Create `src/app/api/trpc/[trpc]/route.ts` — HTTP handler

### 3.4 — tRPC client (src/lib/trpc/client.ts)
- [ ] React Query + tRPC client setup
- [ ] `TRPCProvider` wrapper component with QueryClientProvider

### 3.5 — Wire provider into layout
- [ ] Wrap `(app)` layout with `TRPCProvider`

---

## Phase 4 — AI / Unknotting Engine

### 4.1 — Install Vercel AI SDK
- [ ] Install `ai`, `@ai-sdk/openai` (default provider)
- [ ] Create `src/lib/ai/provider.ts` — export configured AI provider instance
- [ ] `OPENAI_API_KEY` env var (or whichever provider)

### 4.2 — Unknot prompt & schema (src/lib/ai/unknot.ts)
- [ ] Define Zod schema for structured output:
  ```
  detectedLanguage, vocabulary[], grammarPatterns[]
  ```
  (as specified in tech.md)
- [ ] System prompt:
  - "You are a language learning assistant"
  - Detect target language from the raw text
  - User's native language is `{nativeLanguage}` — use it for translations
  - German: always provide gender + plural
  - Romance languages: conjugation table for verbs
  - IPA always required
  - Generate natural example sentences using the exact captured term
- [ ] Export `unknotText(rawText: string, nativeLanguage: string)` function
  - Uses `generateObject()` from Vercel AI SDK with the Zod schema
  - Returns typed, validated result

### 4.3 — Unknot tRPC router (src/server/trpc/routers/unknot.ts)
- [ ] `unknot.process` (mutation):
  - Input: `{ noteId: string }`
  - Validate note belongs to user, status is "pending"
  - Set status → "processing"
  - Call `unknotText()` inline
  - Insert `unknotResults` row
  - Insert `vocabularyItems` rows
  - Auto-create `flashcards` for each vocabulary item (FSRS defaults)
  - Set note status → "done", set `language` from AI response
  - Return the result
  - On error: set status → "error", throw
- [ ] `unknot.getResult` (query):
  - Input: `{ noteId: string }`
  - Return unknot result + vocabulary items for a note

---

## Phase 5 — Notes (Buffer) Feature

### 5.1 — Notes tRPC router (src/server/trpc/routers/notes.ts)
- [ ] `notes.create` (mutation):
  - Input: `{ rawText: string, label?: string }`
  - Validate `rawText.length <= 2000`
  - Insert note with status "pending"
  - Return created note
- [ ] `notes.list` (query):
  - Return all notes for current user, ordered by `createdAt` desc
  - Include status and language
- [ ] `notes.delete` (mutation):
  - Hard delete for now (soft delete in future)

### 5.2 — Buffer page (src/app/(app)/buffer/page.tsx)
- [ ] Mobile-first layout
- [ ] Main textarea — large, comfortable, placeholder: "Paste or type your notes here..."
- [ ] Character counter (X / 2000)
- [ ] Optional label input (collapsed by default, "Add label" link to expand)
- [ ] "Unknot this" button (disabled when empty or > 2000 chars)
- [ ] On submit:
  1. Call `notes.create`
  2. Immediately call `unknot.process` with returned noteId
  3. Show loading state (skeleton/spinner) on the same page
  4. On success: show results inline (see 5.3)
  5. On error: show error message with retry option

### 5.3 — Inline results view (after unknotting)
- [ ] Success state on buffer page showing:
  - Detected language badge
  - Vocabulary items as cards (term, translation, part of speech, gender, IPA, example)
  - Grammar patterns section (pattern name + explanation + examples)
  - "Archive" button on each vocab item (sets `kept = false`)
- [ ] "Back to Buffer" button (resets to empty capture state)
- [ ] "Study Now" link → navigates to /study

---

## Phase 6 — Library Page

### 6.1 — Library page (src/app/(app)/library/page.tsx)
- [ ] List all past notes with:
  - Status badge (pending / done / error)
  - Language tag
  - Label (if set)
  - Preview of raw text (truncated)
  - Created date
- [ ] Click on a "done" note → expand/navigate to see unknotted results
- [ ] Filter by language (dropdown)
- [ ] Simple empty state for new users

---

## Phase 7 — Flashcards & SRS

### 7.1 — Install FSRS
- [ ] Install `ts-fsrs`

### 7.2 — FSRS wrapper (src/lib/srs/fsrs.ts)
- [ ] Configure FSRS instance with `enable_fuzz: true`
- [ ] Export `scheduleCard(card, rating)` → returns updated card fields

### 7.3 — Cards tRPC router (src/server/trpc/routers/cards.ts)
- [ ] `cards.getDue` (query):
  - Fetch flashcards where `dueAt <= now` for current user
  - Join with `vocabularyItems` to get term, translation, etc.
  - Only include cards where `vocabularyItem.kept = true`
  - Order by `dueAt` asc
- [ ] `cards.submit` (mutation):
  - Input: `{ cardId: string, rating: 1 | 2 | 3 | 4 }`
  - Run FSRS scheduling
  - Update card fields in DB
- [ ] `cards.getStats` (query):
  - Total cards, due today count, new cards count
- [ ] `cards.list` (query):
  - All cards for user with vocab data, for the management view
- [ ] `cards.archive` (mutation):
  - Set `kept = false` on the associated vocabulary item

### 7.4 — Study page (src/app/(app)/study/page.tsx)
- [ ] Distraction-free fullscreen-feel layout
- [ ] Card display:
  - Front: term in target language (large text, centered)
  - Tap/click to flip
  - Back: translation, part of speech, gender (if applicable), IPA, example sentence
- [ ] Rating buttons: Again / Hard / Good / Easy (mapped to 1-4)
- [ ] Progress indicator: "3 of 12 cards due"
- [ ] Empty state: "No cards due! Come back later." with link to buffer
- [ ] Session complete state: "All done! 12 cards reviewed." with stats summary

### 7.5 — Cards management page (src/app/(app)/cards/page.tsx)
- [ ] List all flashcards (paginated or virtual scroll if many)
- [ ] Show: term, translation, language, state (new/learning/review), due date
- [ ] Archive button per card
- [ ] Filter by language

---

## Phase 8 — User Profile & Onboarding

### 8.1 — Profile setup
- [ ] `users.update` tRPC mutation — update `name`, `nativeLanguage`
- [ ] `users.me` tRPC query — get current user profile

### 8.2 — Onboarding flow
- [ ] After first login, if `nativeLanguage` is null → redirect to `/onboarding`
- [ ] Simple page: "What's your native language?" dropdown + optional name
- [ ] On submit → update user → redirect to `/buffer`

### 8.3 — Settings page (src/app/(app)/settings/page.tsx)
- [ ] View/edit name and native language
- [ ] Sign out button

---

## Phase 9 — Layout & Navigation

### 9.1 — App shell (src/app/(app)/layout.tsx)
- [ ] Top navigation bar:
  - Logo/brand "Unknot" (left)
  - Nav links: Buffer, Library, Study, Cards
  - User avatar/initial + dropdown (Settings, Sign out) (right)
- [ ] Mobile: bottom tab bar (Buffer, Library, Study, Cards)
- [ ] Active state on current route
- [ ] Dark/light mode toggle (system preference default + manual override)
- [ ] Store theme preference in localStorage via a small Zustand store or `next-themes`

### 9.2 — Landing/home redirect
- [ ] `/` → if authenticated, redirect to `/buffer`; if not, redirect to `/login`

---

## Phase 10 — Dark/Light Mode

### 10.1 — Theme setup
- [ ] Install `next-themes` (works with Tailwind dark mode)
- [ ] Configure Tailwind for `class` strategy dark mode
- [ ] Wrap app in `ThemeProvider`
- [ ] Theme toggle button in nav bar
- [ ] Ensure all components use Tailwind dark: variants

---

## Phase 11 — Testing

### 11.1 — Unit tests
- [ ] `src/lib/ai/unknot.test.ts` — test Zod schema validation with mock AI response
- [ ] `src/lib/srs/fsrs.test.ts` — test FSRS wrapper produces valid scheduling outputs
- [ ] Schema validation tests — ensure Drizzle schema types match expected shapes

### 11.2 — Integration tests (tRPC routers)
- [ ] `notes.create` — validates char limit, creates note
- [ ] `cards.submit` — updates FSRS fields correctly
- [ ] `cards.getDue` — only returns due cards with `kept = true`

### 11.3 — Seed data tests
- [ ] Verify seed script runs without errors on a clean DB

---

## Phase 12 — Polish & Cleanup

### 12.1 — Error handling
- [ ] Global error boundary component
- [ ] Toast notification system for success/error feedback (e.g., `sonner`)
- [ ] Loading states on all async operations

### 12.2 — Responsive audit
- [ ] Test all pages at mobile (375px), tablet (768px), desktop (1024px+)
- [ ] Ensure study page is thumb-friendly on mobile

### 12.3 — Final checks
- [ ] All env vars documented in `.env.example`
- [ ] `docker compose up` runs the full app from scratch
- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes
- [ ] No TypeScript errors (`pnpm tsc --noEmit`)

---

## Execution Order

The phases should be executed **in order** (0 → 12). Within each phase, tasks can generally be parallelized. Key dependencies:

- Phase 1 (DB) must complete before Phase 2 (Auth) and Phase 4 (AI)
- Phase 3 (tRPC) must complete before Phases 4, 5, 6, 7, 8
- Phase 4 (AI) must complete before Phase 5 (Buffer — since unknotting is inline)
- Phase 7 (Flashcards) depends on Phase 4 (unknotting creates the cards)
- Phase 9 (Layout) can be started alongside Phase 5 but should wrap up before Phase 12
- Phase 11 (Testing) can start writing tests as soon as each feature phase completes

```
Phase 0 (Setup)
    ↓
Phase 1 (Database)
    ↓
Phase 2 (Auth) ──────────────────┐
    ↓                             │
Phase 3 (tRPC)                    │
    ↓                             │
Phase 4 (AI Engine)               │
    ↓                             │
Phase 5 (Buffer) ← depends on 4  │
    ↓                             │
Phase 6 (Library)                 │
    ↓                             │
Phase 7 (Flashcards)              │
    ↓                             │
Phase 8 (Profile/Onboarding)      │
    ↓                             │
Phase 9 (Layout/Nav) ←───────────┘
    ↓
Phase 10 (Dark/Light Mode)
    ↓
Phase 11 (Testing)
    ↓
Phase 12 (Polish)
```

---

## File Tree (expected final state)

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # App shell with nav
│   │   ├── buffer/page.tsx         # Live capture + inline results
│   │   ├── library/page.tsx        # Past notes list
│   │   ├── study/page.tsx          # Flashcard SRS deck
│   │   ├── cards/page.tsx          # Card management
│   │   ├── settings/page.tsx       # User settings
│   │   └── onboarding/page.tsx     # First-time native language
│   ├── api/
│   │   ├── trpc/[trpc]/route.ts
│   │   └── auth/[...nextauth]/route.ts
│   ├── layout.tsx                  # Root layout (ThemeProvider, etc.)
│   ├── page.tsx                    # Redirect logic
│   └── globals.css
├── server/
│   ├── trpc/
│   │   ├── trpc.ts                 # tRPC init, context, procedures
│   │   ├── router.ts              # Merged app router
│   │   └── routers/
│   │       ├── notes.ts
│   │       ├── unknot.ts
│   │       ├── cards.ts
│   │       └── users.ts
│   └── db/
│       ├── index.ts               # Drizzle client
│       ├── schema.ts              # All tables
│       └── seed.ts                # Dev seed data
├── lib/
│   ├── ai/
│   │   ├── provider.ts            # Vercel AI SDK provider config
│   │   └── unknot.ts              # Unknot prompt + schema
│   ├── srs/
│   │   └── fsrs.ts                # FSRS wrapper
│   └── trpc/
│       └── client.ts              # tRPC React client + provider
├── components/
│   ├── ui/                        # Shared UI primitives (button, input, card, etc.)
│   ├── buffer/
│   │   ├── BufferInput.tsx
│   │   └── UnknotResults.tsx
│   ├── library/
│   │   └── NoteCard.tsx
│   ├── study/
│   │   ├── FlashcardDeck.tsx
│   │   └── RatingButtons.tsx
│   ├── cards/
│   │   └── CardList.tsx
│   ├── layout/
│   │   ├── TopNav.tsx
│   │   ├── BottomTabs.tsx
│   │   └── ThemeToggle.tsx
│   └── providers/
│       └── TRPCProvider.tsx
├── __tests__/
│   ├── ai/unknot.test.ts
│   ├── srs/fsrs.test.ts
│   └── routers/
│       ├── notes.test.ts
│       └── cards.test.ts
├── auth.ts                        # Auth.js config
└── middleware.ts                   # Route protection
```

---

## Environment Variables (.env.example)

```env
# Database
DATABASE_URL=postgresql://unknot:unknot@localhost:5432/unknot

# Redis
REDIS_URL=redis://localhost:6379

# Auth
AUTH_SECRET=           # generate with: openssl rand -base64 32
AUTH_RESEND_KEY=       # Resend API key for magic link emails
NEXTAUTH_URL=http://localhost:3000

# AI (swap provider by changing the import in src/lib/ai/provider.ts)
OPENAI_API_KEY=

# Future
# ELEVENLABS_API_KEY=
# CLOUDFLARE_R2_ACCOUNT_ID=
# CLOUDFLARE_R2_ACCESS_KEY_ID=
# CLOUDFLARE_R2_SECRET_ACCESS_KEY=
# CLOUDFLARE_R2_BUCKET_NAME=
# AUTH_GOOGLE_ID=
# AUTH_GOOGLE_SECRET=
```
