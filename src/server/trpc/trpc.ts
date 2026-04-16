import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/auth";
import type { Database } from "@/server/db";
import { db } from "@/server/db";
import type { Session } from "next-auth";

export type TRPCContext = {
  db: Database;
  session: Session | null;
};

export async function createContext(): Promise<TRPCContext> {
  const session = await auth();
  return { db, session: session as Session | null };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userId: ctx.session.user.id,
    },
  });
});
