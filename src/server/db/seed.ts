import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("Seeding database...");

  // Create seed user
  const [user] = await db
    .insert(schema.users)
    .values({
      email: "dev@unknot.app",
      name: "Dev User",
      nativeLanguage: "English",
      emailVerified: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (!user) {
    console.log("Seed user already exists, skipping...");
    await pool.end();
    return;
  }

  console.log("Created user:", user.email);

  // Create a "done" note with unknot results
  const [doneNote] = await db
    .insert(schema.notes)
    .values({
      userId: user.id,
      language: "German",
      label: "B2 Unit 4",
      rawText:
        "Grundstück - property/plot of land\ndie Entscheidung treffen - to make a decision\nzuverlässig - reliable\nich hätte gern - I would like\nder Zusammenhang - context/connection",
      status: "done",
    })
    .returning();

  // Create unknot result
  const [unknotResult] = await db
    .insert(schema.unknotResults)
    .values({
      noteId: doneNote.id,
      detectedLanguage: "German",
      rawJson: { seeded: true },
    })
    .returning();

  // Create vocabulary items + flashcards
  const vocabData = [
    {
      term: "das Grundstück",
      translation: "property / plot of land",
      partOfSpeech: "noun",
      gender: "neuter (das)",
      plural: "Grundstücke",
      ipa: "/ˈɡʁʊntʃtʏk/",
      category: "Real Estate",
      exampleSentence:
        "Wir haben ein Grundstück am Stadtrand gekauft.",
    },
    {
      term: "die Entscheidung treffen",
      translation: "to make a decision",
      partOfSpeech: "expression",
      ipa: "/ɛntˈʃaɪdʊŋ ˈtʁɛfn̩/",
      category: "Common Expressions",
      exampleSentence:
        "Du musst endlich eine Entscheidung treffen.",
    },
    {
      term: "zuverlässig",
      translation: "reliable",
      partOfSpeech: "adjective",
      ipa: "/tsuːfɛɐ̯ˈlɛsɪç/",
      category: "Character Traits",
      exampleSentence: "Sie ist eine sehr zuverlässige Kollegin.",
    },
    {
      term: "ich hätte gern",
      translation: "I would like",
      partOfSpeech: "expression",
      ipa: "/ɪç ˈhɛtə ɡɛʁn/",
      category: "Polite Requests",
      exampleSentence: "Ich hätte gern einen Kaffee, bitte.",
    },
    {
      term: "der Zusammenhang",
      translation: "context / connection",
      partOfSpeech: "noun",
      gender: "masculine (der)",
      plural: "Zusammenhänge",
      ipa: "/tsuˈzamənhaŋ/",
      category: "Abstract Concepts",
      exampleSentence:
        "In diesem Zusammenhang ist das besonders wichtig.",
    },
  ];

  for (const vocab of vocabData) {
    const [item] = await db
      .insert(schema.vocabularyItems)
      .values({
        unknotResultId: unknotResult.id,
        userId: user.id,
        ...vocab,
      })
      .returning();

    await db.insert(schema.flashcards).values({
      userId: user.id,
      vocabularyItemId: item.id,
      dueAt: new Date(), // all due now for testing
    });
  }

  // Create a "pending" note
  await db.insert(schema.notes).values({
    userId: user.id,
    rawText: "buongiorno - good morning\ncome stai - how are you\ngrazie mille - thank you very much",
    status: "pending",
  });

  console.log("Seed complete! Created:");
  console.log("  - 1 user (dev@unknot.app)");
  console.log("  - 2 notes (1 done, 1 pending)");
  console.log("  - 5 vocabulary items");
  console.log("  - 5 flashcards (all due now)");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
