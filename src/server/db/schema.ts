import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ── Users ──────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  nativeLanguage: text("native_language"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ── Auth.js required tables ────────────────────────────────────────
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ── Notes ──────────────────────────────────────────────────────────
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  language: text("language"),
  label: text("label"),
  rawText: text("raw_text").notNull(),
  status: text("status", {
    enum: ["pending", "processing", "done", "error"],
  })
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ── Unknot Results ─────────────────────────────────────────────────
export const unknotResults = pgTable("unknot_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  detectedLanguage: text("detected_language"),
  rawJson: jsonb("raw_json"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ── Vocabulary Items ───────────────────────────────────────────────
export const vocabularyItems = pgTable("vocabulary_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  unknotResultId: uuid("unknot_result_id").references(() => unknotResults.id, {
    onDelete: "cascade",
  }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  term: text("term").notNull(),
  translation: text("translation"),
  partOfSpeech: text("part_of_speech"),
  gender: text("gender"),
  plural: text("plural"),
  conjugations: jsonb("conjugations"),
  ipa: text("ipa"),
  category: text("category"),
  exampleSentence: text("example_sentence"),
  kept: boolean("kept").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ── Flashcards (SRS) ──────────────────────────────────────────────
export const flashcards = pgTable("flashcards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  vocabularyItemId: uuid("vocabulary_item_id")
    .notNull()
    .references(() => vocabularyItems.id, { onDelete: "cascade" }),
  stability: real("stability").notNull().default(0),
  difficulty: real("difficulty").notNull().default(0),
  elapsedDays: integer("elapsed_days").notNull().default(0),
  scheduledDays: integer("scheduled_days").notNull().default(0),
  reps: integer("reps").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
  state: text("state", {
    enum: ["new", "learning", "review", "relearning"],
  })
    .notNull()
    .default("new"),
  dueAt: timestamp("due_at", { mode: "date" }).notNull().defaultNow(),
  lastReviewAt: timestamp("last_review_at", { mode: "date" }),
});
