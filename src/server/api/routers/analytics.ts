import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getSeasonStatsSchema,
  getCardUsageSchema,
  getContestantPerformanceSchema,
  exportDataSchema,
} from "~/lib/validations";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { AnalyticsService, AnalyticsError, SeasonNotFoundError } from "~/server/services";

export const analyticsRouter = createTRPCRouter({
  getSeasonStats: protectedProcedure
    .input(getSeasonStatsSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await AnalyticsService.getSeasonStatistics(input.seasonId);
      } catch (error) {
        if (error instanceof SeasonNotFoundError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error instanceof AnalyticsError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch season statistics",
          cause: error,
        });
      }
    }),

  getCardUsage: protectedProcedure
    .input(getCardUsageSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await AnalyticsService.getCardUsageStatistics(input.seasonId);
      } catch (error) {
        if (error instanceof SeasonNotFoundError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error instanceof AnalyticsError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch card usage statistics",
          cause: error,
        });
      }
    }),

  getContestantPerformance: protectedProcedure
    .input(getContestantPerformanceSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await AnalyticsService.getContestantPerformanceAnalytics(input.seasonId);
      } catch (error) {
        if (error instanceof SeasonNotFoundError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error instanceof AnalyticsError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
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

  getSeasonComparison: protectedProcedure
    .input(z.object({ seasonIds: z.array(z.string().cuid()) }))
    .query(async ({ ctx, input }) => {
      try {
        return await AnalyticsService.compareSeasons(input.seasonIds);
      } catch (error) {
        if (error instanceof AnalyticsError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch season comparison",
          cause: error,
        });
      }
    }),

  exportData: protectedProcedure
    .input(exportDataSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await AnalyticsService.generateExportData(input.seasonId);
      } catch (error) {
        if (error instanceof SeasonNotFoundError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error instanceof AnalyticsError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export data",
          cause: error,
        });
      }
    }),

  getRealTimeAnalytics: protectedProcedure
    .input(getSeasonStatsSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await AnalyticsService.getRealTimeAnalytics(input.seasonId);
      } catch (error) {
        if (error instanceof SeasonNotFoundError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error instanceof AnalyticsError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch real-time analytics",
          cause: error,
        });
      }
    }),
});