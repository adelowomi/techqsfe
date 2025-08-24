import { TRPCError } from "@trpc/server";
import {
  createAttemptSchema,
  getAttemptHistorySchema,
  resetDeckSchema,
} from "~/lib/validations";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { GameService, AttemptRecordingError, ContestantNotFoundError } from "~/server/services";

export const gameRouter = createTRPCRouter({
  recordAttempt: protectedProcedure
    .input(createAttemptSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await GameService.recordAttempt(input, ctx.session.user.id);
      } catch (error) {
        if (error instanceof AttemptRecordingError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record attempt",
          cause: error,
        });
      }
    }),

  getAttemptHistory: protectedProcedure
    .input(getAttemptHistorySchema)
    .query(async ({ ctx, input }) => {
      try {
        return await GameService.getAttemptHistory({
          seasonId: input.seasonId,
          cardId: input.cardId,
          contestantName: input.contestantName,
          page: input.page ?? 1,
          limit: input.limit ?? 20,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch attempt history",
          cause: error,
        });
      }
    }),

  getContestantPerformance: protectedProcedure
    .input(getAttemptHistorySchema)
    .query(async ({ ctx, input }) => {
      try {
        if (!input.contestantName) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Contestant name is required",
          });
        }
        return await GameService.getContestantPerformance(
          input.contestantName,
          input.seasonId
        );
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        if (error instanceof ContestantNotFoundError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch contestant performance",
          cause: error,
        });
      }
    }),

  resetDeck: protectedProcedure
    .input(resetDeckSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await GameService.resetDeck(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reset deck",
          cause: error,
        });
      }
    }),

  getSeasonGameStats: protectedProcedure
    .input(getAttemptHistorySchema)
    .query(async ({ ctx, input }) => {
      try {
        if (!input.seasonId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Season ID is required",
          });
        }
        return await GameService.getSeasonGameStats(input.seasonId);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch season game statistics",
          cause: error,
        });
      }
    }),
});