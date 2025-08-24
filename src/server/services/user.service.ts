import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import type { UpdateUserRoleInput, GetUsersInput } from "~/lib/validations";

export class UserService {
  /**
   * Get all users with pagination and optional role filtering
   */
  static async getUsers(input: GetUsersInput = {}) {
    const { page = 1, limit = 20, role } = input;
    const skip = (page - 1) * limit;

    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          _count: {
            select: {
              seasons: true,
              attempts: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      db.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a user by ID
   */
  static async getUserById(id: string) {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            seasons: true,
            attempts: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(input: UpdateUserRoleInput, adminId: string) {
    const { userId, role } = input;

    // Prevent self-role modification
    if (userId === adminId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot modify your own role",
      });
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!existingUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Update user role
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            seasons: true,
            attempts: true,
          },
        },
      },
    });

    return updatedUser;
  }

  /**
   * Get role statistics
   */
  static async getRoleStats() {
    const stats = await db.user.groupBy({
      by: ["role"],
      _count: {
        role: true,
      },
    });

    return stats.map((stat) => ({
      role: stat.role,
      count: stat._count.role,
    }));
  }
}