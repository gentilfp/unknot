import { describe, it, expect } from "vitest";
import { UnknotSchema } from "@/lib/ai/unknot";

describe("UnknotSchema", () => {
  const validResult = {
    detectedLanguage: "German",
    vocabulary: [
      {
        term: "das Grundstück",
        translation: "property / plot of land",
        partOfSpeech: "noun" as const,
        gender: "neuter (das)",
        plural: "Grundstücke",
        ipa: "/ˈɡʁʊntʃtʏk/",
        category: "Real Estate",
        exampleSentence: "Wir haben ein Grundstück am Stadtrand gekauft.",
      },
      {
        term: "zuverlässig",
        translation: "reliable",
        partOfSpeech: "adjective" as const,
        ipa: "/tsuːfɛɐ̯ˈlɛsɪç/",
        category: "Character Traits",
        exampleSentence: "Sie ist eine sehr zuverlässige Kollegin.",
      },
    ],
    grammarPatterns: [
      {
        pattern: "Konjunktiv II",
        explanation:
          "Used for hypothetical situations and polite requests in German",
        examples: ["Ich hätte gern einen Kaffee."],
      },
    ],
  };

  it("validates a correct unknot result", () => {
    const result = UnknotSchema.safeParse(validResult);
    expect(result.success).toBe(true);
  });

  it("requires detectedLanguage", () => {
    const { detectedLanguage, ...rest } = validResult;
    const result = UnknotSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("requires vocabulary to have term and translation", () => {
    const invalid = {
      ...validResult,
      vocabulary: [{ partOfSpeech: "noun", category: "Test" }],
    };
    const result = UnknotSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts empty vocabulary and grammar arrays", () => {
    const minimal = {
      detectedLanguage: "Italian",
      vocabulary: [],
      grammarPatterns: [],
    };
    const result = UnknotSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("validates part of speech enum values", () => {
    const withInvalidPOS = {
      ...validResult,
      vocabulary: [
        {
          ...validResult.vocabulary[0],
          partOfSpeech: "invalid_type",
        },
      ],
    };
    const result = UnknotSchema.safeParse(withInvalidPOS);
    expect(result.success).toBe(false);
  });

  it("allows optional fields to be omitted", () => {
    const minimal = {
      detectedLanguage: "Spanish",
      vocabulary: [
        {
          term: "hola",
          translation: "hello",
          partOfSpeech: "expression" as const,
          category: "Greetings",
          exampleSentence: "¡Hola, ¿cómo estás?",
        },
      ],
      grammarPatterns: [],
    };
    const result = UnknotSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });
});
