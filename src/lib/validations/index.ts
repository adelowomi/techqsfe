import { z } from "zod";

// Enums
export const DifficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
export const RoleSchema = z.enum(["HOST", "PRODUCER", "ADMIN"]);

// Validation helpers
export const cardNumberSchema = z
  .number()
  .int()
  .min(1, "Card number must be at least 1")
  .max(52, "Card number cannot exceed 52");

export const difficultySchema = DifficultySchema;

// Season validation schemas
export const createSeasonSchema = z.object({
  name: z
    .string()
    .min(1, "Season name is required")
    .max(100, "Season name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

export const updateSeasonSchema = z.object({
  id: z.string().cuid("Invalid season ID"),
  name: z
    .string()
    .min(1, "Season name is required")
    .max(100, "Season name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

export const seasonIdSchema = z.object({
  id: z.string().cuid("Invalid season ID"),
});

// Card validation schemas
export const createCardSchema = z.object({
  seasonId: z.string().cuid("Invalid season ID"),
  cardNumber: cardNumberSchema,
  question: z
    .string()
    .min(1, "Question is required")
    .max(2000, "Question must be less than 2000 characters"),
  correctAnswer: z
    .string()
    .min(1, "Correct answer is required")
    .max(1000, "Answer must be less than 1000 characters"),
  difficulty: difficultySchema,
});

export const updateCardSchema = z.object({
  id: z.string().cuid("Invalid card ID"),
  question: z
    .string()
    .min(1, "Question is required")
    .max(2000, "Question must be less than 2000 characters")
    .optional(),
  correctAnswer: z
    .string()
    .min(1, "Correct answer is required")
    .max(1000, "Answer must be less than 1000 characters")
    .optional(),
});

export const cardIdSchema = z.object({
  id: z.string().cuid("Invalid card ID"),
});

export const drawCardSchema = z.object({
  seasonId: z.string().cuid("Invalid season ID"),
  difficulty: difficultySchema,
});

export const getCardsByDeckSchema = z.object({
  seasonId: z.string().cuid("Invalid season ID"),
  difficulty: difficultySchema,
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
});

// Attempt validation schemas
export const createAttemptSchema = z.object({
  cardId: z.string().cuid("Invalid card ID"),
  contestantName: z
    .string()
    .min(1, "Contestant name is required")
    .max(100, "Contestant name must be less than 100 characters"),
  givenAnswer: z
    .string()
    .min(1, "Answer is required")
    .max(1000, "Answer must be less than 1000 characters"),
  isCorrect: z.boolean(),
});

export const getAttemptHistorySchema = z.object({
  seasonId: z.string().cuid("Invalid season ID").optional(),
  cardId: z.string().cuid("Invalid card ID").optional(),
  contestantName: z.string().optional(),
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
});

// Analytics validation schemas
export const getSeasonStatsSchema = z.object({
  seasonId: z.string().cuid("Invalid season ID"),
});

export const getCardUsageSchema = z.object({
  seasonId: z.string().cuid("Invalid season ID"),
  difficulty: difficultySchema.optional(),
});

export const getContestantPerformanceSchema = z.object({
  seasonId: z.string().cuid("Invalid season ID").optional(),
  contestantName: z.string().optional(),
  difficulty: difficultySchema.optional(),
});

export const exportDataSchema = z.object({
  seasonId: z.string().cuid("Invalid season ID"),
  format: z.enum(["json", "csv"]).default("json"),
});

// Reset deck schema
export const resetDeckSchema = z.object({
  seasonId: z.string().cuid("Invalid season ID"),
  difficulty: difficultySchema,
});

// User management validation schemas
export const updateUserRoleSchema = z.object({
  userId: z.string().cuid("Invalid user ID"),
  role: RoleSchema,
});

export const getUsersSchema = z.object({
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  role: RoleSchema.optional(),
});

export const userIdSchema = z.object({
  id: z.string().cuid("Invalid user ID"),
});

// Type exports for inference
export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type DrawCardInput = z.infer<typeof drawCardSchema>;
export type GetCardsByDeckInput = z.infer<typeof getCardsByDeckSchema>;
export type CreateAttemptInput = z.infer<typeof createAttemptSchema>;
export type GetAttemptHistoryInput = z.infer<typeof getAttemptHistorySchema>;
export type GetSeasonStatsInput = z.infer<typeof getSeasonStatsSchema>;
export type GetCardUsageInput = z.infer<typeof getCardUsageSchema>;
export type GetContestantPerformanceInput = z.infer<typeof getContestantPerformanceSchema>;
export type ExportDataInput = z.infer<typeof exportDataSchema>;
export type ResetDeckInput = z.infer<typeof resetDeckSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type GetUsersInput = z.infer<typeof getUsersSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type Role = z.infer<typeof RoleSchema>;

// Re-export helpers
export * from "./helpers";