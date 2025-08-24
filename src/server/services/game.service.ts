import { db } from "~/server/db";
import type { 
  CreateAttemptInput,
  GetAttemptHistoryInput,
  ResetDeckInput,
  Difficulty 
} from "~/lib/validations";
import type { 
  Attempt, 
  AttemptWithCard, 
  AttemptWithDetails,
  ContestantPerformance,
  PaginatedResponse 
} from "~/lib/types";
import { CardService, CardNotFoundError } from "./card.service";

/**
 * Custom error classes for game operations
 */
export class AttemptRecordingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttemptRecordingError';
  }
}

export class ContestantNotFoundError extends Error {
  constructor(contestantName: string) {
    super(`No attempts found for contestant: ${contestantName}`);
    this.name = 'ContestantNotFoundError';
  }
}

/**
 * Game Service
 * Handles contestant attempts, game flow, and deck reset functionality
 */
export class GameService {
  /**
   * Record a contestant attempt with answer validation
   * Requirements: 4.1 - WHEN a contestant attempts a question THEN the system SHALL record their name, question card, answer given, and result (correct/incorrect)
   * Requirements: 4.2 - WHEN recording an attempt THEN the system SHALL timestamp the attempt and link it to the specific card drawn
   * Requirements: 3.3 - WHEN a card is drawn THEN the system SHALL record the draw timestamp and associate it with a contestant attempt
   */
  static async recordAttempt(data: CreateAttemptInput, recordedById: string): Promise<AttemptWithCard> {
    // Verify the card exists
    const card = await CardService.getCardById(data.cardId);
    if (!card) {
      throw new CardNotFoundError(data.cardId);
    }

    try {
      // Record the attempt in a transaction to ensure data consistency
      const result = await db.$transaction(async (tx) => {
        // Create the attempt record
        const attempt = await tx.attempt.create({
          data: {
            cardId: data.cardId,
            seasonId: card.seasonId,
            contestantName: data.contestantName.trim(),
            givenAnswer: data.givenAnswer.trim(),
            isCorrect: data.isCorrect,
            recordedById,
          },
          include: {
            card: {
              select: {
                cardNumber: true,
                difficulty: true,
                question: true,
                correctAnswer: true,
              },
            },
          },
        });

        return attempt;
      });

      return result;
    } catch (error) {
      throw new AttemptRecordingError(
        `Failed to record attempt for contestant ${data.contestantName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate if an answer is correct by comparing with the card's correct answer
   * This is a helper function for answer validation
   */
  static calculateAnswerCorrectness(givenAnswer: string, correctAnswer: string): boolean {
    // Normalize both answers for comparison (trim whitespace, convert to lowercase)
    const normalizedGiven = givenAnswer.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();
    
    return normalizedGiven === normalizedCorrect;
  }

  /**
   * Record attempt with automatic answer validation
   * This method automatically determines if the answer is correct
   */
  static async recordAttemptWithValidation(
    data: Omit<CreateAttemptInput, 'isCorrect'>,
    recordedById: string
  ): Promise<AttemptWithCard> {
    // Get the card to validate the answer
    const card = await CardService.getCardById(data.cardId);
    if (!card) {
      throw new CardNotFoundError(data.cardId);
    }

    // Calculate if the answer is correct
    const isCorrect = this.calculateAnswerCorrectness(data.givenAnswer, card.correctAnswer);

    // Record the attempt with the calculated correctness
    return this.recordAttempt({
      ...data,
      isCorrect,
    }, recordedById);
  }

  /**
   * Get attempt history with filtering and pagination
   * Requirements: 4.3 - WHEN a user views contestant statistics THEN the system SHALL display success rates by difficulty level and overall performance
   */
  static async getAttemptHistory(input: GetAttemptHistoryInput): Promise<PaginatedResponse<AttemptWithDetails>> {
    const { seasonId, cardId, contestantName, page = 1, limit = 20 } = input;
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const whereClause: any = {};
    if (seasonId) whereClause.seasonId = seasonId;
    if (cardId) whereClause.cardId = cardId;
    if (contestantName) {
      whereClause.contestantName = {
        contains: contestantName,
      };
    }

    const [attempts, total] = await Promise.all([
      db.attempt.findMany({
        where: whereClause,
        include: {
          card: {
            select: {
              cardNumber: true,
              difficulty: true,
              question: true,
              correctAnswer: true,
            },
          },
          season: {
            select: {
              name: true,
            },
          },
          recordedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          attemptedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.attempt.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: attempts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get contestant performance statistics
   * Requirements: 4.3 - WHEN a user views contestant statistics THEN the system SHALL display success rates by difficulty level and overall performance
   */
  static async getContestantPerformance(
    contestantName: string,
    seasonId?: string
  ): Promise<ContestantPerformance> {
    const whereClause: any = {
      contestantName: {
        equals: contestantName,
      },
    };
    if (seasonId) whereClause.seasonId = seasonId;

    const attempts = await db.attempt.findMany({
      where: whereClause,
      include: {
        card: {
          select: {
            cardNumber: true,
            difficulty: true,
            question: true,
            correctAnswer: true,
          },
        },
      },
      orderBy: {
        attemptedAt: 'desc',
      },
    });

    if (attempts.length === 0) {
      throw new ContestantNotFoundError(contestantName);
    }

    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(attempt => attempt.isCorrect).length;
    const successRate = (correctAttempts / totalAttempts) * 100;

    // Calculate difficulty breakdown
    const difficultyStats: Record<Difficulty, { attempts: number; correct: number }> = {
      EASY: { attempts: 0, correct: 0 },
      MEDIUM: { attempts: 0, correct: 0 },
      HARD: { attempts: 0, correct: 0 },
    };

    attempts.forEach(attempt => {
      const difficulty = attempt.card.difficulty;
      difficultyStats[difficulty].attempts++;
      if (attempt.isCorrect) {
        difficultyStats[difficulty].correct++;
      }
    });

    const difficultyBreakdown = Object.entries(difficultyStats).map(([difficulty, stats]) => ({
      difficulty: difficulty as Difficulty,
      attempts: stats.attempts,
      correct: stats.correct,
      successRate: stats.attempts > 0 ? (stats.correct / stats.attempts) * 100 : 0,
    }));

    // Get recent attempts (last 10)
    const recentAttempts = attempts.slice(0, 10);

    return {
      contestantName,
      totalAttempts,
      correctAttempts,
      successRate,
      difficultyBreakdown,
      recentAttempts,
    };
  }

  /**
   * Reset deck usage for reshuffling used cards
   * Requirements: 3.4 - IF all cards in a deck have been used THEN the system SHALL allow reshuffling the deck
   */
  static async resetDeck(input: ResetDeckInput): Promise<{
    cardsReset: number;
    message: string;
  }> {
    const { seasonId, difficulty } = input;

    // Use the existing CardService method for consistency
    const cardsReset = await CardService.resetDeckUsage(seasonId, difficulty);

    return {
      cardsReset,
      message: `Reset ${cardsReset} cards in ${difficulty} deck for season ${seasonId}`,
    };
  }

  /**
   * Get attempt statistics for a specific card
   * Requirements: 4.4 - WHEN a user views card analytics THEN the system SHALL show how many times each card has been attempted and success rates
   */
  static async getCardAttemptStats(cardId: string): Promise<{
    cardId: string;
    totalAttempts: number;
    correctAttempts: number;
    incorrectAttempts: number;
    successRate: number;
    uniqueContestants: number;
    recentAttempts: AttemptWithCard[];
  }> {
    const attempts = await db.attempt.findMany({
      where: { cardId },
      include: {
        card: {
          select: {
            cardNumber: true,
            difficulty: true,
            question: true,
            correctAnswer: true,
          },
        },
      },
      orderBy: {
        attemptedAt: 'desc',
      },
    });

    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(attempt => attempt.isCorrect).length;
    const incorrectAttempts = totalAttempts - correctAttempts;
    const successRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
    
    // Count unique contestants
    const uniqueContestants = new Set(attempts.map(attempt => attempt.contestantName)).size;
    
    // Get recent attempts (last 5)
    const recentAttempts = attempts.slice(0, 5);

    return {
      cardId,
      totalAttempts,
      correctAttempts,
      incorrectAttempts,
      successRate,
      uniqueContestants,
      recentAttempts,
    };
  }

  /**
   * Get overall game statistics for a season
   * Requirements: 4.5 - IF a contestant has multiple attempts THEN the system SHALL maintain separate records for each attempt
   */
  static async getSeasonGameStats(seasonId: string): Promise<{
    seasonId: string;
    totalAttempts: number;
    totalContestants: number;
    overallSuccessRate: number;
    difficultyStats: {
      difficulty: Difficulty;
      attempts: number;
      successRate: number;
    }[];
    topPerformers: {
      contestantName: string;
      attempts: number;
      successRate: number;
    }[];
  }> {
    const attempts = await db.attempt.findMany({
      where: { seasonId },
      include: {
        card: {
          select: {
            difficulty: true,
          },
        },
      },
    });

    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(attempt => attempt.isCorrect).length;
    const overallSuccessRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

    // Count unique contestants
    const totalContestants = new Set(attempts.map(attempt => attempt.contestantName)).size;

    // Calculate difficulty statistics
    const difficultyStats: Record<Difficulty, { attempts: number; correct: number }> = {
      EASY: { attempts: 0, correct: 0 },
      MEDIUM: { attempts: 0, correct: 0 },
      HARD: { attempts: 0, correct: 0 },
    };

    attempts.forEach(attempt => {
      const difficulty = attempt.card.difficulty;
      difficultyStats[difficulty].attempts++;
      if (attempt.isCorrect) {
        difficultyStats[difficulty].correct++;
      }
    });

    const difficultyStatsArray = Object.entries(difficultyStats).map(([difficulty, stats]) => ({
      difficulty: difficulty as Difficulty,
      attempts: stats.attempts,
      successRate: stats.attempts > 0 ? (stats.correct / stats.attempts) * 100 : 0,
    }));

    // Calculate top performers
    const contestantStats: Record<string, { attempts: number; correct: number }> = {};
    
    attempts.forEach(attempt => {
      const name = attempt.contestantName;
      if (!contestantStats[name]) {
        contestantStats[name] = { attempts: 0, correct: 0 };
      }
      contestantStats[name].attempts++;
      if (attempt.isCorrect) {
        contestantStats[name].correct++;
      }
    });

    const topPerformers = Object.entries(contestantStats)
      .map(([name, stats]) => ({
        contestantName: name,
        attempts: stats.attempts,
        successRate: (stats.correct / stats.attempts) * 100,
      }))
      .filter(performer => performer.attempts >= 3) // Only include contestants with at least 3 attempts
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10); // Top 10 performers

    return {
      seasonId,
      totalAttempts,
      totalContestants,
      overallSuccessRate,
      difficultyStats: difficultyStatsArray,
      topPerformers,
    };
  }

  /**
   * Check if a contestant has attempted a specific card
   */
  static async hasContestantAttemptedCard(contestantName: string, cardId: string): Promise<boolean> {
    const count = await db.attempt.count({
      where: {
        contestantName: {
          equals: contestantName,
        },
        cardId,
      },
    });

    return count > 0;
  }

  /**
   * Get all contestants who have made attempts in a season
   */
  static async getSeasonContestants(seasonId: string): Promise<string[]> {
    const contestants = await db.attempt.findMany({
      where: { seasonId },
      select: {
        contestantName: true,
      },
      distinct: ['contestantName'],
      orderBy: {
        contestantName: 'asc',
      },
    });

    return contestants.map(c => c.contestantName);
  }

  /**
   * Delete an attempt (for corrections or data cleanup)
   */
  static async deleteAttempt(attemptId: string): Promise<boolean> {
    try {
      await db.attempt.delete({
        where: { id: attemptId },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update an attempt (for corrections)
   */
  static async updateAttempt(
    attemptId: string,
    updates: {
      contestantName?: string;
      givenAnswer?: string;
      isCorrect?: boolean;
    }
  ): Promise<Attempt | null> {
    try {
      const updatedAttempt = await db.attempt.update({
        where: { id: attemptId },
        data: updates,
      });
      return updatedAttempt;
    } catch (error) {
      return null;
    }
  }
}