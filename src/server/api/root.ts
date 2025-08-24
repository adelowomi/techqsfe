import { postRouter } from "~/server/api/routers/post";
import { seasonRouter } from "~/server/api/routers/season";
import { cardRouter } from "~/server/api/routers/card";
import { gameRouter } from "~/server/api/routers/game";
import { analyticsRouter } from "~/server/api/routers/analytics";
import { userRouter } from "~/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	post: postRouter,
	season: seasonRouter,
	card: cardRouter,
	game: gameRouter,
	analytics: analyticsRouter,
	user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
