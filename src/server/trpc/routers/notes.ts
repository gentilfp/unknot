import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { notes } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export const notesRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        rawText: z.string().min(1).max(2000),
        label: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [note] = await ctx.db
        .insert(notes)
        .values({
          userId: ctx.userId,
          rawText: input.rawText,
          label: input.label || null,
          status: "pending",
        })
        .returning();
      return note;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(notes)
      .where(eq(notes.userId, ctx.userId))
      .orderBy(desc(notes.createdAt));
  }),

  delete: protectedProcedure
    .input(z.object({ noteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(notes)
        .where(eq(notes.id, input.noteId));
    }),
});
