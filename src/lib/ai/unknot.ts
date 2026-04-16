import { generateObject } from "ai";
import { z } from "zod";
import { defaultModel } from "./provider";

export const UnknotSchema = z.object({
  detectedLanguage: z.string(),
  vocabulary: z.array(
    z.object({
      term: z.string(),
      translation: z.string(),
      partOfSpeech: z.enum([
        "noun",
        "verb",
        "adjective",
        "adverb",
        "expression",
        "other",
      ]),
      gender: z.string().optional(),
      plural: z.string().optional(),
      conjugations: z.record(z.string()).optional(),
      ipa: z.string().optional(),
      category: z.string(),
      exampleSentence: z.string(),
    })
  ),
  grammarPatterns: z.array(
    z.object({
      pattern: z.string(),
      explanation: z.string(),
      examples: z.array(z.string()),
    })
  ),
});

export type UnknotResult = z.infer<typeof UnknotSchema>;

export async function unknotText(
  rawText: string,
  nativeLanguage: string
): Promise<UnknotResult> {
  const { object } = await generateObject({
    model: defaultModel,
    schema: UnknotSchema,
    system: `You are a language learning assistant. Your job is to analyze raw notes from a language learner and extract structured vocabulary and grammar patterns.

Rules:
- Detect the target language from the raw text (not the user's native language)
- The user's native language is "${nativeLanguage}" — use it for all translations
- For German: ALWAYS provide gender (der/die/das) as part of the term for nouns, and the plural form
- For Romance languages (French, Italian, Spanish, Portuguese): ALWAYS provide conjugation tables for verbs
- IPA transcription is ALWAYS required for every vocabulary item
- Categories should be descriptive and consistent (e.g., "Business Vocabulary", "Daily Expressions", "Grammar Structures")
- Example sentences MUST use the exact term as captured and be natural-sounding
- If the notes contain grammar patterns, extract and explain them clearly`,
    prompt: `Analyze and unknot these language learning notes:\n\n${rawText}`,
  });

  return object;
}
