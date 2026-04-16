import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { flashcards, vocabularyItems } from "@/server/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { scheduleCard } from "@/lib/srs/fsrs";
import type { Card } from "ts-fsrs";
import { Rating, State, type Grade } from "ts-fsrs";

export const cardsRouter = router({
  getDue: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const dueCards = await ctx.db
      .select({
        card: flashcards,
        vocab: vocabularyItems,
      })
      .from(flashcards)
      .innerJoin(
        vocabularyItems,
        eq(flashcards.vocabularyItemId, vocabularyItems.id)
      )
      .where(
        and(
          eq(flashcards.userId, ctx.userId),
          lte(flashcards.dueAt, now),
          eq(vocabularyItems.kept, true)
        )
      )
      .orderBy(flashcards.dueAt);

    return dueCards;
  }),

  submit: protectedProcedure
    .input(
      z.object({
        cardId: z.string().uuid(),
        rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [card] = await ctx.db
        .select()
        .from(flashcards)
        .where(
          and(
            eq(flashcards.id, input.cardId),
            eq(flashcards.userId, ctx.userId)
          )
        );

      if (!card) throw new Error("Card not found");

      // Convert DB row to ts-fsrs Card format
      const stateMap: Record<string, State> = {
        new: State.New,
        learning: State.Learning,
        review: State.Review,
        relearning: State.Relearning,
      };

      const fsrsCard: Card = {
        due: card.dueAt,
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days: card.elapsedDays,
        scheduled_days: card.scheduledDays,
        reps: card.reps,
        lapses: card.lapses,
        state: stateMap[card.state] ?? State.New,
        last_review: card.lastReviewAt ?? undefined,
      };

      const ratingMap: Record<number, Grade> = {
        1: Rating.Again,
        2: Rating.Hard,
        3: Rating.Good,
        4: Rating.Easy,
      };

      const updated = scheduleCard(fsrsCard, ratingMap[input.rating]);

      const stateReverseMap: Record<number, string> = {
        [State.New]: "new",
        [State.Learning]: "learning",
        [State.Review]: "review",
        [State.Relearning]: "relearning",
      };

      await ctx.db
        .update(flashcards)
        .set({
          stability: updated.stability,
          difficulty: updated.difficulty,
          elapsedDays: updated.elapsed_days,
          scheduledDays: updated.scheduled_days,
          reps: updated.reps,
          lapses: updated.lapses,
          state: stateReverseMap[updated.state] as
            | "new"
            | "learning"
            | "review"
            | "relearning",
          dueAt: updated.due,
          lastReviewAt: new Date(),
        })
        .where(eq(flashcards.id, input.cardId));

      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const allCards = await ctx.db
      .select({
        total: sql<number>`count(*)`.as("total"),
        dueNow: sql<number>`count(*) filter (where ${flashcards.dueAt} <= ${now})`.as("due_now"),
        newCards: sql<number>`count(*) filter (where ${flashcards.state} = 'new')`.as("new_cards"),
      })
      .from(flashcards)
      .where(eq(flashcards.userId, ctx.userId));

    return allCards[0] ?? { total: 0, dueNow: 0, newCards: 0 };
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        card: flashcards,
        vocab: vocabularyItems,
      })
      .from(flashcards)
      .innerJoin(
        vocabularyItems,
        eq(flashcards.vocabularyItemId, vocabularyItems.id)
      )
      .where(eq(flashcards.userId, ctx.userId))
      .orderBy(flashcards.dueAt);
  }),

  archive: protectedProcedure
    .input(z.object({ cardId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [card] = await ctx.db
        .select()
        .from(flashcards)
        .where(
          and(
            eq(flashcards.id, input.cardId),
            eq(flashcards.userId, ctx.userId)
          )
        );

      if (!card) throw new Error("Card not found");

      await ctx.db
        .update(vocabularyItems)
        .set({ kept: false })
        .where(eq(vocabularyItems.id, card.vocabularyItemId));
    }),
});
