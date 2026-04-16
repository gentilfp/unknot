# Unknot — Technical Specification

## Stack Overview

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| API | tRPC v11 |
| Auth | Auth.js v5 (NextAuth) |
| ORM | Drizzle ORM |
| Database | PostgreSQL (Railway) |
| Queue | BullMQ + Redis (Railway) |
| File Storage | Cloudflare R2 |
| AI | OpenAI GPT-4o (structured outputs) |
| TTS | ElevenLabs API |
| SRS Algorithm | FSRS (`ts-fsrs`) |
| Deployment | Railway |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── buffer/page.tsx          # Live capture UI
│   │   ├── review/[jobId]/page.tsx  # Unknotted results
│   │   └── study/page.tsx           # Flashcard SRS deck
│   └── api/
│       ├── trpc/[trpc]/route.ts
│       └── auth/[...nextauth]/route.ts
├── server/
│   ├── trpc/
│   │   ├── router.ts
│   │   └── routers/
│   │       ├── notes.ts
│   │       ├── unknot.ts
│   │       ├── cards.ts
│   │       └── audio.ts
│   ├── db/
│   │   ├── index.ts                 # Drizzle client
│   │   └── schema.ts
│   └── jobs/
│       ├── queue.ts                 # BullMQ setup
│       ├── unknot.job.ts            # AI processing worker
│       └── audio.job.ts             # TTS worker
├── lib/
│   ├── ai/
│   │   ├── unknot.ts                # LLM prompt + structured output schema
│   │   └── flashcards.ts            # Flashcard generation prompt
│   ├── srs/
│   │   └── fsrs.ts                  # FSRS scheduling wrapper
│   └── storage/
│       └── r2.ts                    # Cloudflare R2 client
└── components/
    ├── buffer/
    │   ├── BufferInput.tsx           # Main capture textarea
    │   └── SessionTag.tsx
    ├── review/
    │   ├── VocabularyCard.tsx
    │   └── GrammarPattern.tsx
    └── study/
        ├── FlashcardDeck.tsx
        └── RatingButtons.tsx        # Again / Hard / Good / Easy
```

---

## Database Schema

```ts
// src/server/db/schema.ts

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name"),                          // e.g. "German B2 - Unit 4"
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  sessionId: uuid("session_id").references(() => sessions.id),
  rawText: text("raw_text").notNull(),
  status: text("status", {
    enum: ["pending", "queued", "processing", "done", "error"],
  }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const unknotResults = pgTable("unknot_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("note_id").references(() => notes.id).notNull(),
  detectedLanguage: text("detected_language"),
  rawJson: jsonb("raw_json"),                  // full LLM response
  createdAt: timestamp("created_at").defaultNow(),
});

export const vocabularyItems = pgTable("vocabulary_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  unknotResultId: uuid("unknot_result_id").references(() => unknotResults.id),
  userId: uuid("user_id").references(() => users.id).notNull(),
  term: text("term").notNull(),
  translation: text("translation"),
  partOfSpeech: text("part_of_speech"),
  gender: text("gender"),                      // der / die / das / le / la / etc.
  plural: text("plural"),
  conjugations: jsonb("conjugations"),
  ipa: text("ipa"),
  category: text("category"),                  // "Business Vocab", "Dative Case", etc.
  exampleSentence: text("example_sentence"),
  audioUrl: text("audio_url"),                 // R2 URL
  kept: boolean("kept").default(true),         // user can discard items
  createdAt: timestamp("created_at").defaultNow(),
});

export const flashcards = pgTable("flashcards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  vocabularyItemId: uuid("vocabulary_item_id").references(() => vocabularyItems.id),
  // FSRS fields
  stability: real("stability").default(0),
  difficulty: real("difficulty").default(0),
  elapsedDays: integer("elapsed_days").default(0),
  scheduledDays: integer("scheduled_days").default(0),
  reps: integer("reps").default(0),
  lapses: integer("lapses").default(0),
  state: text("state", { enum: ["new", "learning", "review", "relearning"] }).default("new"),
  dueAt: timestamp("due_at").defaultNow(),
  lastReviewAt: timestamp("last_review_at"),
});
```

---

## tRPC Routers

### `notes` router
| Procedure | Type | Description |
|---|---|---|
| `notes.create` | mutation | Save raw buffer text, optionally attach to a session |
| `notes.list` | query | List all notes for the current user |
| `notes.delete` | mutation | Soft delete a note |

### `unknot` router
| Procedure | Type | Description |
|---|---|---|
| `unknot.dispatch` | mutation | Enqueue unknot job, set note status to `queued`, return `jobId` |
| `unknot.status` | query | Poll job status by `noteId` |
| `unknot.getResult` | query | Fetch parsed vocabulary + grammar once done |
| `unknot.discardItem` | mutation | Set `kept = false` on a vocabulary item |

### `cards` router
| Procedure | Type | Description |
|---|---|---|
| `cards.getDue` | query | Fetch all flashcards due today (ordered by `dueAt`) |
| `cards.submit` | mutation | Submit a rating (1–4), run FSRS, update scheduling fields |
| `cards.getStats` | query | Total cards, due today, new today |

### `audio` router
| Procedure | Type | Description |
|---|---|---|
| `audio.generate` | mutation | Enqueue TTS job for a vocabulary item |
| `audio.getUrl` | query | Return signed R2 URL for a vocabulary item's audio |

---

## The Unknotting Pipeline

The core async flow triggered by `unknot.dispatch`:

```
POST /trpc/unknot.dispatch
  │
  ├─ Set note.status = "queued"
  ├─ Enqueue BullMQ job { noteId }
  └─ Return { jobId }

BullMQ Worker (unknot.job.ts)
  │
  ├─ Fetch note.rawText
  ├─ Call OpenAI with structured output schema (see below)
  ├─ Insert unknot_results row
  ├─ Insert vocabulary_items rows
  ├─ For each vocabulary item → enqueue audio.job
  ├─ Set note.status = "done"
  └─ (Client polling unknot.status detects done)
```

### LLM Structured Output Schema

```ts
// src/lib/ai/unknot.ts

const UnknotSchema = z.object({
  detectedLanguage: z.string(),
  vocabulary: z.array(z.object({
    term: z.string(),
    translation: z.string(),
    partOfSpeech: z.enum(["noun", "verb", "adjective", "adverb", "expression", "other"]),
    gender: z.string().optional(),           // for gendered languages
    plural: z.string().optional(),
    conjugations: z.record(z.string()).optional(),
    ipa: z.string().optional(),
    category: z.string(),
    exampleSentence: z.string(),
  })),
  grammarPatterns: z.array(z.object({
    pattern: z.string(),
    explanation: z.string(),
    examples: z.array(z.string()),
  })),
});
```

System prompt key instructions:
- Detect the target language (not the UI language)
- For German: always provide gender and plural
- For Romance languages: always provide conjugation table for verbs
- IPA is always required
- Categories must be consistent across a session (reuse existing ones when they fit)
- Example sentence must use the exact term as captured

---

## SRS Implementation

Uses `ts-fsrs`. The `cards.submit` mutation runs:

```ts
import { createEmptyCard, fsrs, generatorParameters, Rating } from "ts-fsrs";

const f = fsrs(generatorParameters({ enable_fuzz: true }));

// On submit
const card = await db.query.flashcards.findFirst({ where: eq(flashcards.id, input.cardId) });
const now = new Date();
const scheduling = f.repeat(card, now);
const updated = scheduling[input.rating].card; // Rating: Again=1, Hard=2, Good=3, Easy=4

await db.update(flashcards).set({
  stability: updated.stability,
  difficulty: updated.difficulty,
  elapsedDays: updated.elapsed_days,
  scheduledDays: updated.scheduled_days,
  reps: updated.reps,
  lapses: updated.lapses,
  state: updated.state,
  dueAt: updated.due,
  lastReviewAt: now,
}).where(eq(flashcards.id, input.cardId));
```

---

## Auth Setup

Auth.js v5 with Google OAuth. Middleware protects all `(app)` routes.

```ts
// src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/server/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [Google],
});

// src/middleware.ts
export { auth as middleware } from "@/auth";
export const config = { matcher: ["/buffer/:path*", "/review/:path*", "/study/:path*"] };
```

---

## Environment Variables

```env
# Database (Railway Postgres)
DATABASE_URL=

# Redis (Railway Redis)
REDIS_URL=

# Auth
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# AI
OPENAI_API_KEY=

# TTS
ELEVENLABS_API_KEY=

# Storage
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "@trpc/server": "^11.0.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@tanstack/react-query": "^5.0.0",
    "drizzle-orm": "^0.36.0",
    "pg": "^8.13.0",
    "next-auth": "^5.0.0",
    "@auth/drizzle-adapter": "^1.0.0",
    "bullmq": "^5.0.0",
    "ioredis": "^5.4.0",
    "openai": "^4.0.0",
    "ts-fsrs": "^4.0.0",
    "zod": "^3.23.0",
    "zustand": "^5.0.0",
    "@aws-sdk/client-s3": "^3.0.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.0",
    "typescript": "^5.0.0",
    "@biomejs/biome": "^1.9.0",
    "vitest": "^2.0.0"
  }
}
```

---

## Railway Services

Deploy three services from the same monorepo:

| Service | Start Command | Notes |
|---|---|---|
| `web` | `next start` | Main Next.js app |
| `worker` | `npx tsx src/server/jobs/worker.ts` | BullMQ consumer, needs `DATABASE_URL` + `REDIS_URL` |
| `Postgres` | managed | Railway addon |
| `Redis` | managed | Railway addon |

The worker process is a separate long-running Node process — not a serverless function — so BullMQ can maintain its Redis connection. Reference env vars via Railway's shared variable groups so both `web` and `worker` stay in sync.

---

## MVP Cutscope (v1.0)

Cut from v1, implement in v1.1+:

- Audio generation (ElevenLabs) — pipeline is wired, just disable the `audio.job` enqueue
- Image-to-note (OCR)
- Browser extension
- Anki / Quizlet export

The core v1 loop is: **Buffer → Unknot → Flashcards**.
