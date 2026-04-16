import { router } from "./trpc";
import { notesRouter } from "./routers/notes";
import { unknotRouter } from "./routers/unknot";
import { cardsRouter } from "./routers/cards";
import { usersRouter } from "./routers/users";

export const appRouter = router({
  notes: notesRouter,
  unknot: unknotRouter,
  cards: cardsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
