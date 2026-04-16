import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  notes,
  unknotResults,
  vocabularyItems,
  flashcards,
  users,
} from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { unknotText } from "@/lib/ai/unknot";

export const unknotRouter = router({
  process: protectedProcedure
    .input(z.object({ noteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Fetch the note
      const [note] = await ctx.db
        .select()
        .from(notes)
        .where(and(eq(notes.id, input.noteId), eq(notes.userId, ctx.userId)));

      if (!note) {
        throw new Error("Note not found");
      }

      if (note.status !== "pending") {
        throw new Error("Note already processed");
      }

      // Set status to processing
      await ctx.db
        .update(notes)
        .set({ status: "processing" })
        .where(eq(notes.id, input.noteId));

      try {
        // Get user's native language
        const [user] = await ctx.db
          .select()
          .from(users)
          .where(eq(users.id, ctx.userId));

        const nativeLanguage = user?.nativeLanguage || "English";

        // Call AI
        const result = await unknotText(note.rawText, nativeLanguage);

        // Insert unknot result
        const [unknotResult] = await ctx.db
          .insert(unknotResults)
          .values({
            noteId: input.noteId,
            detectedLanguage: result.detectedLanguage,
            rawJson: result,
          })
          .returning();

        // Insert vocabulary items and create flashcards
        for (const vocab of result.vocabulary) {
          const [item] = await ctx.db
            .insert(vocabularyItems)
            .values({
              unknotResultId: unknotResult.id,
              userId: ctx.userId,
              term: vocab.term,
              translation: vocab.translation,
              partOfSpeech: vocab.partOfSpeech,
              gender: vocab.gender || null,
              plural: vocab.plural || null,
              conjugations: vocab.conjugations || null,
              ipa: vocab.ipa || null,
              category: vocab.category,
              exampleSentence: vocab.exampleSentence,
            })
            .returning();

          // Auto-create flashcard
          await ctx.db.insert(flashcards).values({
            userId: ctx.userId,
            vocabularyItemId: item.id,
            dueAt: new Date(),
          });
        }

        // Update note status and language
        await ctx.db
          .update(notes)
          .set({
            status: "done",
            language: result.detectedLanguage,
          })
          .where(eq(notes.id, input.noteId));

        return {
          unknotResultId: unknotResult.id,
          detectedLanguage: result.detectedLanguage,
          vocabularyCount: result.vocabulary.length,
          grammarPatternCount: result.grammarPatterns.length,
        };
      } catch (error) {
        await ctx.db
          .update(notes)
          .set({ status: "error" })
          .where(eq(notes.id, input.noteId));
        throw error;
      }
    }),

  getResult: protectedProcedure
    .input(z.object({ noteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select()
        .from(unknotResults)
        .where(eq(unknotResults.noteId, input.noteId));

      if (!result) return null;

      const vocabItems = await ctx.db
        .select()
        .from(vocabularyItems)
        .where(eq(vocabularyItems.unknotResultId, result.id));

      return {
        ...result,
        vocabularyItems: vocabItems,
      };
    }),

  archiveItem: protectedProcedure
    .input(z.object({ vocabularyItemId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(vocabularyItems)
        .set({ kept: false })
        .where(
          and(
            eq(vocabularyItems.id, input.vocabularyItemId),
            eq(vocabularyItems.userId, ctx.userId)
          )
        );
    }),
});
