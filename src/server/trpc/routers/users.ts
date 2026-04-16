import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.userId));
    return user ?? null;
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().max(100).optional(),
        nativeLanguage: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.nativeLanguage !== undefined && {
            nativeLanguage: input.nativeLanguage,
          }),
        })
        .where(eq(users.id, ctx.userId))
        .returning();
      return updated;
    }),
});
