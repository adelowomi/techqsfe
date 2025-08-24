import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { UserService } from "../user.service";
import { db } from "~/server/db";

// Mock the database
vi.mock("~/server/db", () => ({
  db: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

const mockDb = vi.mocked(db);

describe("UserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUsers", () => {
    it("should return users with pagination", async () => {
      const mockUsers = [
        {
          id: "user1",
          name: "John Doe",
          email: "john@example.com",
          role: "HOST" as const,
          _count: { seasons: 2, attempts: 5 },
        },
      ];

      mockDb.user.findMany.mockResolvedValue(mockUsers);
      mockDb.user.count.mockResolvedValue(1);

      const result = await UserService.getUsers({ page: 1, limit: 20 });

      expect(result).toEqual({
        users: mockUsers,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      expect(mockDb.user.findMany).toHaveBeenCalledWith({
        where: {},
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
        skip: 0,
        take: 20,
        orderBy: { id: "desc" },
      });
    });

    it("should filter users by role", async () => {
      const mockUsers = [
        {
          id: "admin1",
          name: "Admin User",
          email: "admin@example.com",
          role: "ADMIN" as const,
          _count: { seasons: 0, attempts: 0 },
        },
      ];

      mockDb.user.findMany.mockResolvedValue(mockUsers);
      mockDb.user.count.mockResolvedValue(1);

      await UserService.getUsers({ role: "ADMIN" });

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: "ADMIN" },
        })
      );
    });
  });

  describe("getUserById", () => {
    it("should return user by ID", async () => {
      const mockUser = {
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
        role: "HOST" as const,
        _count: { seasons: 2, attempts: 5 },
      };

      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const result = await UserService.getUserById("user1");

      expect(result).toEqual(mockUser);
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user1" },
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
    });

    it("should throw NOT_FOUND error when user does not exist", async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(UserService.getUserById("nonexistent")).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        })
      );
    });
  });

  describe("updateUserRole", () => {
    it("should update user role successfully", async () => {
      const existingUser = {
        id: "user1",
        role: "HOST" as const,
      };

      const updatedUser = {
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
        role: "PRODUCER" as const,
        _count: { seasons: 2, attempts: 5 },
      };

      mockDb.user.findUnique.mockResolvedValue(existingUser);
      mockDb.user.update.mockResolvedValue(updatedUser);

      const result = await UserService.updateUserRole(
        { userId: "user1", role: "PRODUCER" },
        "admin1"
      );

      expect(result).toEqual(updatedUser);
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: "user1" },
        data: { role: "PRODUCER" },
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
    });

    it("should prevent self-role modification", async () => {
      await expect(
        UserService.updateUserRole(
          { userId: "admin1", role: "HOST" },
          "admin1"
        )
      ).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot modify your own role",
        })
      );
    });

    it("should throw NOT_FOUND error when user does not exist", async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(
        UserService.updateUserRole(
          { userId: "nonexistent", role: "PRODUCER" },
          "admin1"
        )
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        })
      );
    });
  });

  describe("getRoleStats", () => {
    it("should return role statistics", async () => {
      const mockStats = [
        { role: "HOST" as const, _count: { role: 5 } },
        { role: "PRODUCER" as const, _count: { role: 3 } },
        { role: "ADMIN" as const, _count: { role: 1 } },
      ];

      mockDb.user.groupBy.mockResolvedValue(mockStats);

      const result = await UserService.getRoleStats();

      expect(result).toEqual([
        { role: "HOST", count: 5 },
        { role: "PRODUCER", count: 3 },
        { role: "ADMIN", count: 1 },
      ]);

      expect(mockDb.user.groupBy).toHaveBeenCalledWith({
        by: ["role"],
        _count: {
          role: true,
        },
      });
    });
  });
});