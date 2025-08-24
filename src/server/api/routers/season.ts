import { TRPCError } from "@trpc/server";
import {
  createSeasonSchema,
  updateSeasonSchema,
  seasonIdSchema,
} from "~/lib/validations";
import { createTRPCRouter, protectedProcedure, producerProcedure, adminProcedure } from "~/server/api/trpc";
import { SeasonService } from "~/server/services";

export const seasonRouter = createTRPCRouter({
  create: producerProcedure
    .input(createSeasonSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await SeasonService.createSeason(input, ctx.session.user.id);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create season",
          cause: error,
        });
      }
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await SeasonService.getAllSeasonsWithStats();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch seasons",
        cause: error,
      });
    }
  }),

  getById: protectedProcedure
    .input(seasonIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        const season = await SeasonService.getSeasonById(input.id);
        if (!season) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Season not found",
          });
        }
        return season;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch season",
          cause: error,
        });
      }
    }),

  update: producerProcedure
    .input(updateSeasonSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const season = await SeasonService.updateSeason(input, ctx.session.user.id);
        if (!season) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Season not found",
          });
        }
        return season;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update season",
          cause: error,
        });
      }
    }),

  delete: adminProcedure
    .input(seasonIdSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const deleted = await SeasonService.deleteSeason(input.id, ctx.session.user.id);
        if (!deleted) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Season not found",
          });
        }
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete season",
          cause: error,
        });
      }
    }),
});