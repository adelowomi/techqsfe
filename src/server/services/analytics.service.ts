import { db } from "~/server/db";
import type { 
  Difficulty 
} from "~/lib/validations";
import type { 
  SeasonStats,
  CardUsageStats,
  ContestantPerformance,
  ExportData,
  Season,
  Card,
  AttemptWithCard
} from "~/lib/types";

/**
 * Custom error classes for analytics operations
 */
export class AnalyticsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

export class SeasonNotFoundError extends Error {
  constructor(seasonId: string) {
    super(`Season not found: ${seasonId}`);
    this.name = 'SeasonNotFoundError';
  }
}

/**
 * Analytics Service
 * Handles card usage statistics, contestant performance analytics, season comparisons, and data export
 */
export class AnalyticsService {
  /**
   * Calculate comprehensive card usage statistics and success rates
   * Requirements: 5.1 - WHEN a user accesses analytics THEN the system SHALL display total attempts, success rates by difficulty, and most/least used cards
   */
  static async getCardUsageStatistics(seasonId: string): Promise<CardUsageStats[]> {
    try {
      // Verify season exists
      const season = await db.season.findUnique({
        where: { id: seasonId },
      });

      if (!season) {
        throw new SeasonNotFoundError(seasonId);
      }

      // Get all cards for the season with their attempt statistics
      const cards = await db.card.findMany({
        where: { seasonId },
        include: {
          attempts: {
            select: {
              isCorrect: true,
            },
          },
        },
        orderBy: [
          { difficulty: 'asc' },
          { cardNumber: 'asc' },
        ],
      });

      // Calculate statistics for each card
      const cardStats: CardUsageStats[] = cards.map(card => {
        const totalAttempts = card.attempts.length;
        const correctAttempts = card.attempts.filter(attempt => attempt.isCorrect).length;
        const successRate = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100 * 100) / 100 : 0;

        return {
          cardId: card.id,
          cardNumber: card.cardNumber,
          difficulty: card.difficulty,
          question: card.question,
          usageCount: card.usageCount,
          totalAttempts,
          correctAttempts,
          successRate,
          lastUsed: card.lastUsed,
        };
      });

      return cardStats;
    } catch (error) {
      if (error instanceof SeasonNotFoundError) {
        throw error;
      }
      throw new AnalyticsError(
        `Failed to calculate card usage statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get contestant performance analytics by difficulty level
   * Requirements: 5.1 - WHEN a user accesses analytics THEN the system SHALL display total attempts, success rates by difficulty
   */
  static async getContestantPerformanceAnalytics(seasonId?: string): Promise<ContestantPerformance[]> {
    try {
      const whereClause: any = {};
      if (seasonId) {
        // Verify season exists
        const season = await db.season.findUnique({
          where: { id: seasonId },
        });

        if (!season) {
          throw new SeasonNotFoundError(seasonId);
        }

        whereClause.seasonId = seasonId;
      }

      // Get all attempts with card information
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

      // Group attempts by contestant
      const contestantMap: Record<string, typeof attempts> = {};
      attempts.forEach(attempt => {
        const name = attempt.contestantName;
        if (!contestantMap[name]) {
          contestantMap[name] = [];
        }
        contestantMap[name].push(attempt);
      });

      // Calculate performance for each contestant
      const performanceData: ContestantPerformance[] = Object.entries(contestantMap).map(([name, contestantAttempts]) => {
        const totalAttempts = contestantAttempts.length;
        const correctAttempts = contestantAttempts.filter(attempt => attempt.isCorrect).length;
        const successRate = Math.round((correctAttempts / totalAttempts) * 100 * 100) / 100;

        // Calculate difficulty breakdown
        const difficultyStats: Record<Difficulty, { attempts: number; correct: number }> = {
          EASY: { attempts: 0, correct: 0 },
          MEDIUM: { attempts: 0, correct: 0 },
          HARD: { attempts: 0, correct: 0 },
        };

        contestantAttempts.forEach(attempt => {
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
          successRate: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100 * 100) / 100 : 0,
        }));

        // Get recent attempts (last 10)
        const recentAttempts = contestantAttempts.slice(0, 10);

        return {
          contestantName: name,
          totalAttempts,
          correctAttempts,
          successRate,
          difficultyBreakdown,
          recentAttempts,
        };
      });

      // Sort by success rate (descending) and then by total attempts (descending)
      return performanceData.sort((a, b) => {
        if (b.successRate !== a.successRate) {
          return b.successRate - a.successRate;
        }
        return b.totalAttempts - a.totalAttempts;
      });
    } catch (error) {
      if (error instanceof SeasonNotFoundError) {
        throw error;
      }
      throw new AnalyticsError(
        `Failed to calculate contestant performance analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate comprehensive season statistics
   * Requirements: 5.1 - WHEN a user accesses analytics THEN the system SHALL display total attempts, success rates by difficulty, and most/least used cards
   */
  static async getSeasonStatistics(seasonId: string): Promise<SeasonStats> {
    try {
      // Verify season exists and get basic info
      const season = await db.season.findUnique({
        where: { id: seasonId },
        select: {
          id: true,
          name: true,
        },
      });

      if (!season) {
        throw new SeasonNotFoundError(seasonId);
      }

      // Get all cards and attempts for the season
      const [cards, attempts] = await Promise.all([
        db.card.findMany({
          where: { seasonId },
          include: {
            attempts: {
              select: {
                isCorrect: true,
              },
            },
          },
        }),
        db.attempt.findMany({
          where: { seasonId },
          include: {
            card: {
              select: {
                difficulty: true,
              },
            },
          },
        }),
      ]);

      const totalCards = cards.length;
      const totalAttempts = attempts.length;
      const correctAttempts = attempts.filter(attempt => attempt.isCorrect).length;
      const overallSuccessRate = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100 * 100) / 100 : 0;

      // Calculate difficulty statistics
      const difficultyStats: Record<Difficulty, { cardCount: number; attemptCount: number; correctCount: number }> = {
        EASY: { cardCount: 0, attemptCount: 0, correctCount: 0 },
        MEDIUM: { cardCount: 0, attemptCount: 0, correctCount: 0 },
        HARD: { cardCount: 0, attemptCount: 0, correctCount: 0 },
      };

      // Count cards by difficulty
      cards.forEach(card => {
        difficultyStats[card.difficulty].cardCount++;
      });

      // Count attempts by difficulty
      attempts.forEach(attempt => {
        const difficulty = attempt.card.difficulty;
        difficultyStats[difficulty].attemptCount++;
        if (attempt.isCorrect) {
          difficultyStats[difficulty].correctCount++;
        }
      });

      const difficultyStatsArray = Object.entries(difficultyStats).map(([difficulty, stats]) => ({
        difficulty: difficulty as Difficulty,
        cardCount: stats.cardCount,
        attemptCount: stats.attemptCount,
        successRate: stats.attemptCount > 0 ? Math.round((stats.correctCount / stats.attemptCount) * 100 * 100) / 100 : 0,
      }));

      // Find most and least used cards
      const sortedByUsage = cards.sort((a, b) => b.usageCount - a.usageCount);
      const mostUsedCards = sortedByUsage.slice(0, 10).map(card => ({
        cardId: card.id,
        cardNumber: card.cardNumber,
        difficulty: card.difficulty,
        question: card.question,
        usageCount: card.usageCount,
      }));

      const leastUsedCards = sortedByUsage.slice(-10).reverse().map(card => ({
        cardId: card.id,
        cardNumber: card.cardNumber,
        difficulty: card.difficulty,
        question: card.question,
        usageCount: card.usageCount,
      }));

      return {
        seasonId: season.id,
        seasonName: season.name,
        totalCards,
        totalAttempts,
        overallSuccessRate,
        difficultyStats: difficultyStatsArray,
        mostUsedCards,
        leastUsedCards,
      };
    } catch (error) {
      if (error instanceof SeasonNotFoundError) {
        throw error;
      }
      throw new AnalyticsError(
        `Failed to generate season statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Compare statistics across multiple seasons
   * Requirements: 5.2 - WHEN viewing season analytics THEN the system SHALL show comparative data across different seasons
   */
  static async compareSeasons(seasonIds: string[]): Promise<{
    seasons: SeasonStats[];
    comparison: {
      totalCards: { seasonId: string; seasonName: string; value: number }[];
      totalAttempts: { seasonId: string; seasonName: string; value: number }[];
      overallSuccessRate: { seasonId: string; seasonName: string; value: number }[];
      difficultyDistribution: {
        difficulty: Difficulty;
        seasons: { seasonId: string; seasonName: string; cardCount: number; successRate: number }[];
      }[];
    };
  }> {
    try {
      // Get statistics for all requested seasons
      const seasonStats = await Promise.all(
        seasonIds.map(seasonId => this.getSeasonStatistics(seasonId))
      );

      // Create comparison data
      const comparison = {
        totalCards: seasonStats.map(stats => ({
          seasonId: stats.seasonId,
          seasonName: stats.seasonName,
          value: stats.totalCards,
        })).sort((a, b) => b.value - a.value),

        totalAttempts: seasonStats.map(stats => ({
          seasonId: stats.seasonId,
          seasonName: stats.seasonName,
          value: stats.totalAttempts,
        })).sort((a, b) => b.value - a.value),

        overallSuccessRate: seasonStats.map(stats => ({
          seasonId: stats.seasonId,
          seasonName: stats.seasonName,
          value: stats.overallSuccessRate,
        })).sort((a, b) => b.value - a.value),

        difficultyDistribution: (['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(difficulty => ({
          difficulty,
          seasons: seasonStats.map(stats => {
            const diffStats = stats.difficultyStats.find(d => d.difficulty === difficulty);
            return {
              seasonId: stats.seasonId,
              seasonName: stats.seasonName,
              cardCount: diffStats?.cardCount || 0,
              successRate: diffStats?.successRate || 0,
            };
          }).sort((a, b) => b.successRate - a.successRate),
        })),
      };

      return {
        seasons: seasonStats,
        comparison,
      };
    } catch (error) {
      throw new AnalyticsError(
        `Failed to compare seasons: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate exportable data for a season
   * Requirements: 5.3 - WHEN generating reports THEN the system SHALL provide exportable data about card usage and contestant performance
   */
  static async generateExportData(seasonId: string): Promise<ExportData> {
    try {
      // Verify season exists and get full season data
      const season = await db.season.findUnique({
        where: { id: seasonId },
      });

      if (!season) {
        throw new SeasonNotFoundError(seasonId);
      }

      // Get all related data
      const [cards, attempts, stats] = await Promise.all([
        db.card.findMany({
          where: { seasonId },
          orderBy: [
            { difficulty: 'asc' },
            { cardNumber: 'asc' },
          ],
        }),
        db.attempt.findMany({
          where: { seasonId },
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
        }),
        this.getSeasonStatistics(seasonId),
      ]);

      return {
        season,
        cards,
        attempts,
        stats,
        exportedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof SeasonNotFoundError) {
        throw error;
      }
      throw new AnalyticsError(
        `Failed to generate export data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get real-time analytics that update as new attempts are recorded
   * Requirements: 5.4 - WHEN viewing real-time statistics THEN the system SHALL update counts and percentages as new attempts are recorded
   */
  static async getRealTimeAnalytics(seasonId: string): Promise<{
    lastUpdated: Date;
    totalAttempts: number;
    totalContestants: number;
    recentActivity: {
      contestantName: string;
      cardNumber: number;
      difficulty: Difficulty;
      isCorrect: boolean;
      attemptedAt: Date;
    }[];
    currentSuccessRate: number;
    difficultyBreakdown: {
      difficulty: Difficulty;
      attempts: number;
      successRate: number;
    }[];
  }> {
    try {
      // Verify season exists
      const season = await db.season.findUnique({
        where: { id: seasonId },
      });

      if (!season) {
        throw new SeasonNotFoundError(seasonId);
      }

      // Get recent attempts (last 20) with card information
      const recentAttempts = await db.attempt.findMany({
        where: { seasonId },
        include: {
          card: {
            select: {
              cardNumber: true,
              difficulty: true,
            },
          },
        },
        orderBy: {
          attemptedAt: 'desc',
        },
        take: 20,
      });

      // Get overall statistics
      const allAttempts = await db.attempt.findMany({
        where: { seasonId },
        include: {
          card: {
            select: {
              difficulty: true,
            },
          },
        },
      });

      const totalAttempts = allAttempts.length;
      const correctAttempts = allAttempts.filter(attempt => attempt.isCorrect).length;
      const currentSuccessRate = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100 * 100) / 100 : 0;

      // Count unique contestants
      const totalContestants = new Set(allAttempts.map(attempt => attempt.contestantName)).size;

      // Calculate difficulty breakdown
      const difficultyStats: Record<Difficulty, { attempts: number; correct: number }> = {
        EASY: { attempts: 0, correct: 0 },
        MEDIUM: { attempts: 0, correct: 0 },
        HARD: { attempts: 0, correct: 0 },
      };

      allAttempts.forEach(attempt => {
        const difficulty = attempt.card.difficulty;
        difficultyStats[difficulty].attempts++;
        if (attempt.isCorrect) {
          difficultyStats[difficulty].correct++;
        }
      });

      const difficultyBreakdown = Object.entries(difficultyStats).map(([difficulty, stats]) => ({
        difficulty: difficulty as Difficulty,
        attempts: stats.attempts,
        successRate: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100 * 100) / 100 : 0,
      }));

      // Format recent activity
      const recentActivity = recentAttempts.map(attempt => ({
        contestantName: attempt.contestantName,
        cardNumber: attempt.card.cardNumber,
        difficulty: attempt.card.difficulty,
        isCorrect: attempt.isCorrect,
        attemptedAt: attempt.attemptedAt,
      }));

      return {
        lastUpdated: new Date(),
        totalAttempts,
        totalContestants,
        recentActivity,
        currentSuccessRate,
        difficultyBreakdown,
      };
    } catch (error) {
      if (error instanceof SeasonNotFoundError) {
        throw error;
      }
      throw new AnalyticsError(
        `Failed to get real-time analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get analytics for cards that have never been used
   * Requirements: 5.1 - most/least used cards analysis
   */
  static async getUnusedCardsAnalytics(seasonId: string): Promise<{
    totalUnusedCards: number;
    unusedCardsByDifficulty: {
      difficulty: Difficulty;
      count: number;
      cards: {
        cardId: string;
        cardNumber: number;
        question: string;
      }[];
    }[];
  }> {
    try {
      // Verify season exists
      const season = await db.season.findUnique({
        where: { id: seasonId },
      });

      if (!season) {
        throw new SeasonNotFoundError(seasonId);
      }

      // Get all unused cards (usageCount = 0)
      const unusedCards = await db.card.findMany({
        where: {
          seasonId,
          usageCount: 0,
        },
        orderBy: [
          { difficulty: 'asc' },
          { cardNumber: 'asc' },
        ],
      });

      const totalUnusedCards = unusedCards.length;

      // Group by difficulty
      const difficultyGroups: Record<Difficulty, typeof unusedCards> = {
        EASY: [],
        MEDIUM: [],
        HARD: [],
      };

      unusedCards.forEach(card => {
        difficultyGroups[card.difficulty].push(card);
      });

      const unusedCardsByDifficulty = Object.entries(difficultyGroups).map(([difficulty, cards]) => ({
        difficulty: difficulty as Difficulty,
        count: cards.length,
        cards: cards.map(card => ({
          cardId: card.id,
          cardNumber: card.cardNumber,
          question: card.question,
        })),
      }));

      return {
        totalUnusedCards,
        unusedCardsByDifficulty,
      };
    } catch (error) {
      if (error instanceof SeasonNotFoundError) {
        throw error;
      }
      throw new AnalyticsError(
        `Failed to get unused cards analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get performance trends over time
   * Requirements: 5.4 - real-time statistics and trends
   */
  static async getPerformanceTrends(seasonId: string, days: number = 30): Promise<{
    dailyStats: {
      date: string;
      attempts: number;
      successRate: number;
      uniqueContestants: number;
    }[];
    trendAnalysis: {
      attemptsGrowth: number; // percentage change
      successRateChange: number; // percentage points change
      contestantGrowth: number; // percentage change
    };
  }> {
    try {
      // Verify season exists
      const season = await db.season.findUnique({
        where: { id: seasonId },
      });

      if (!season) {
        throw new SeasonNotFoundError(seasonId);
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get attempts within the date range
      const attempts = await db.attempt.findMany({
        where: {
          seasonId,
          attemptedAt: {
            gte: startDate,
          },
        },
        orderBy: {
          attemptedAt: 'asc',
        },
      });

      // Group attempts by date
      const dailyGroups: Record<string, typeof attempts> = {};
      attempts.forEach(attempt => {
        const dateKey = attempt.attemptedAt.toISOString().split('T')[0]!;
        if (!dailyGroups[dateKey]) {
          dailyGroups[dateKey] = [];
        }
        dailyGroups[dateKey]!.push(attempt);
      });

      // Calculate daily statistics
      const dailyStats = Object.entries(dailyGroups).map(([date, dayAttempts]) => {
        const attempts = dayAttempts.length;
        const correctAttempts = dayAttempts.filter(attempt => attempt.isCorrect).length;
        const successRate = attempts > 0 ? Math.round((correctAttempts / attempts) * 100 * 100) / 100 : 0;
        const uniqueContestants = new Set(dayAttempts.map(attempt => attempt.contestantName)).size;

        return {
          date,
          attempts,
          successRate,
          uniqueContestants,
        };
      }).sort((a, b) => a.date.localeCompare(b.date));

      // Calculate trend analysis (compare first half vs second half of period)
      const midPoint = Math.floor(dailyStats.length / 2);
      const firstHalf = dailyStats.slice(0, midPoint);
      const secondHalf = dailyStats.slice(midPoint);

      const firstHalfAvg = {
        attempts: firstHalf.reduce((sum, day) => sum + day.attempts, 0) / firstHalf.length || 0,
        successRate: firstHalf.reduce((sum, day) => sum + day.successRate, 0) / firstHalf.length || 0,
        contestants: firstHalf.reduce((sum, day) => sum + day.uniqueContestants, 0) / firstHalf.length || 0,
      };

      const secondHalfAvg = {
        attempts: secondHalf.reduce((sum, day) => sum + day.attempts, 0) / secondHalf.length || 0,
        successRate: secondHalf.reduce((sum, day) => sum + day.successRate, 0) / secondHalf.length || 0,
        contestants: secondHalf.reduce((sum, day) => sum + day.uniqueContestants, 0) / secondHalf.length || 0,
      };

      const trendAnalysis = {
        attemptsGrowth: firstHalfAvg.attempts > 0 
          ? ((secondHalfAvg.attempts - firstHalfAvg.attempts) / firstHalfAvg.attempts) * 100 
          : 0,
        successRateChange: secondHalfAvg.successRate - firstHalfAvg.successRate,
        contestantGrowth: firstHalfAvg.contestants > 0 
          ? ((secondHalfAvg.contestants - firstHalfAvg.contestants) / firstHalfAvg.contestants) * 100 
          : 0,
      };

      return {
        dailyStats,
        trendAnalysis,
      };
    } catch (error) {
      if (error instanceof SeasonNotFoundError) {
        throw error;
      }
      throw new AnalyticsError(
        `Failed to get performance trends: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}