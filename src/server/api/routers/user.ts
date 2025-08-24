import { TRPCError } from "@trpc/server";
import {
  updateUserRoleSchema,
  getUsersSchema,
  userIdSchema,
} from "~/lib/validations";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "~/server/api/trpc";
import { UserService } from "~/server/services";
import { UserStatsService } from "~/server/services/user-stats.service";

export const userRouter = createTRPCRouter({
  /**
   * Get all users (admin only)
   */
  getAll: adminProcedure
    .input(getUsersSchema.optional())
    .query(async ({ input = {} }) => {
      try {
        return await UserService.getUsers(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch users",
          cause: error,
        });
      }
    }),

  /**
   * Get user by ID (admin only)
   */
  getById: adminProcedure
    .input(userIdSchema)
    .query(async ({ input }) => {
      try {
        return await UserService.getUserById(input.id);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user",
          cause: error,
        });
      }
    }),

  /**
   * Update user role (admin only)
   */
  updateRole: adminProcedure
    .input(updateUserRoleSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await UserService.updateUserRole(input, ctx.session.user.id);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user role",
          cause: error,
        });
      }
    }),

  /**
   * Get role statistics (admin only)
   */
  getRoleStats: adminProcedure.query(async () => {
    try {
      return await UserService.getRoleStats();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch role statistics",
        cause: error,
      });
    }
  }),

  /**
   * Get current user profile (authenticated users)
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await UserService.getUserById(ctx.session.user.id);
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user profile",
        cause: error,
      });
    }
  }),

  /**
   * Get current user statistics for personalized content
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await UserStatsService.getUserStats(ctx.session.user.id);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user statistics",
        cause: error,
      });
    }
  }),

  /**
   * Get user achievements and milestones
   */
  getAchievements: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await UserStatsService.getUserAchievements(ctx.session.user.id);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user achievements",
        cause: error,
      });
    }
  }),

  /**
   * Get personalized learning recommendations
   */
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await UserStatsService.getUserRecommendations(ctx.session.user.id);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user recommendations",
        cause: error,
      });
    }
  }),
});