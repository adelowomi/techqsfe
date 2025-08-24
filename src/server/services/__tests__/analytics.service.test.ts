import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { AnalyticsService, AnalyticsError, SeasonNotFoundError } from '../analytics.service';
import { db } from '~/server/db';
import type { Difficulty } from '~/lib/validations';
import type { Season, Card } from '~/lib/types';

// Mock the database
vi.mock('~/server/db', () => ({
  db: {
    season: {
      findUnique: vi.fn(),
    },
    card: {
      findMany: vi.fn(),
    },
    attempt: {
      findMany: vi.fn(),
    },
  },
}));

describe('AnalyticsService', () => {
  const mockSeason: Season = {
    id: 'season-1',
    name: 'Season 1',
    description: 'Test season',
    createdById: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockCard: Card = {
    id: 'card-1',
    cardNumber: 1,
    question: 'What is TypeScript?',
    correctAnswer: 'A typed superset of JavaScript',
    difficulty: 'EASY' as Difficulty,
    usageCount: 5,
    lastUsed: new Date('2024-01-15'),
    seasonId: 'season-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockAttempt = {
    id: 'attempt-1',
    cardId: 'card-1',
    seasonId: 'season-1',
    contestantName: 'John Doe',
    givenAnswer: 'A typed superset of JavaScript',
    isCorrect: true,
    attemptedAt: new Date('2024-01-15'),
    recordedById: 'user-1',
    card: {
      cardNumber: 1,
      difficulty: 'EASY' as Difficulty,
      question: 'What is TypeScript?',
      correctAnswer: 'A typed superset of JavaScript',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCardUsageStatistics', () => {
    it('should return card usage statistics for a season', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockResolvedValue(mockSeason);
      
      const mockCardWithAttempts = {
        ...mockCard,
        attempts: [
          { isCorrect: true },
          { isCorrect: false },
          { isCorrect: true },
        ],
      };

      (db.card.findMany as MockedFunction<typeof db.card.findMany>)
        .mockResolvedValue([mockCardWithAttempts] as any);

      // Act
      const result = await AnalyticsService.getCardUsageStatistics('season-1');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].cardId).toBe('card-1');
      expect(result[0].cardNumber).toBe(1);
      expect(result[0].difficulty).toBe('EASY');
      expect(result[0].question).toBe('What is TypeScript?');
      expect(result[0].usageCount).toBe(5);
      expect(result[0].totalAttempts).toBe(3);
      expect(result[0].correctAttempts).toBe(2);
      expect(result[0].successRate).toBeCloseTo(66.67, 2);
      expect(result[0].lastUsed).toEqual(new Date('2024-01-15'));
    });

    it('should handle cards with no attempts', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockResolvedValue(mockSeason);
      
      const mockCardWithoutAttempts = {
        ...mockCard,
        attempts: [],
      };

      (db.card.findMany as MockedFunction<typeof db.card.findMany>)
        .mockResolvedValue([mockCardWithoutAttempts] as any);

      // Act
      const result = await AnalyticsService.getCardUsageStatistics('season-1');

      // Assert
      expect(result[0].totalAttempts).toBe(0);
      expect(result[0].correctAttempts).toBe(0);
      expect(result[0].successRate).toBe(0);
    });

    it('should throw SeasonNotFoundError when season does not exist', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockResolvedValue(null);

      // Act & Assert
      await expect(AnalyticsService.getCardUsageStatistics('nonexistent'))
        .rejects.toThrow(SeasonNotFoundError);
    });

    it('should throw AnalyticsError when database operation fails', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockResolvedValue(mockSeason);
      (db.card.findMany as MockedFunction<typeof db.card.findMany>)
        .mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(AnalyticsService.getCardUsageStatistics('season-1'))
        .rejects.toThrow(AnalyticsError);
    });
  });

  describe('getContestantPerformanceAnalytics', () => {
    it('should return contestant performance analytics for all seasons', async () => {
      // Arrange
      const mockAttempts = [
        { ...mockAttempt, contestantName: 'John Doe', isCorrect: true },
        { ...mockAttempt, id: 'attempt-2', contestantName: 'John Doe', isCorrect: false },
        { ...mockAttempt, id: 'attempt-3', contestantName: 'Jane Smith', isCorrect: true },
      ];

      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue(mockAttempts as any);

      // Act
      const result = await AnalyticsService.getContestantPerformanceAnalytics();

      // Assert
      expect(result).toHaveLength(2);
      
      // John Doe should be first (higher success rate)
      expect(result[0].contestantName).toBe('Jane Smith');
      expect(result[0].totalAttempts).toBe(1);
      expect(result[0].correctAttempts).toBe(1);
      expect(result[0].successRate).toBe(100);

      expect(result[1].contestantName).toBe('John Doe');
      expect(result[1].totalAttempts).toBe(2);
      expect(result[1].correctAttempts).toBe(1);
      expect(result[1].successRate).toBe(50);
    });

    it('should filter by season when seasonId is provided', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockResolvedValue(mockSeason);
      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue([mockAttempt] as any);

      // Act
      await AnalyticsService.getContestantPerformanceAnalytics('season-1');

      // Assert
      expect(db.season.findUnique).toHaveBeenCalledWith({
        where: { id: 'season-1' },
      });
      expect(db.attempt.findMany).toHaveBeenCalledWith({
        where: { seasonId: 'season-1' },
        include: expect.any(Object),
        orderBy: { attemptedAt: 'desc' },
      });
    });

    it('should calculate difficulty breakdown correctly', async () => {
      // Arrange
      const mockAttemptsWithDifficulties = [
        { 
          ...mockAttempt, 
          contestantName: 'John Doe', 
          isCorrect: true,
          card: { ...mockAttempt.card, difficulty: 'EASY' as Difficulty }
        },
        { 
          ...mockAttempt, 
          id: 'attempt-2',
          contestantName: 'John Doe', 
          isCorrect: false,
          card: { ...mockAttempt.card, difficulty: 'MEDIUM' as Difficulty }
        },
        { 
          ...mockAttempt, 
          id: 'attempt-3',
          contestantName: 'John Doe', 
          isCorrect: true,
          card: { ...mockAttempt.card, difficulty: 'HARD' as Difficulty }
        },
      ];

      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue(mockAttemptsWithDifficulties as any);

      // Act
      const result = await AnalyticsService.getContestantPerformanceAnalytics();

      // Assert
      expect(result[0].difficultyBreakdown).toEqual([
        { difficulty: 'EASY', attempts: 1, correct: 1, successRate: 100 },
        { difficulty: 'MEDIUM', attempts: 1, correct: 0, successRate: 0 },
        { difficulty: 'HARD', attempts: 1, correct: 1, successRate: 100 },
      ]);
    });
  });

  describe('getSeasonStatistics', () => {
    it('should return comprehensive season statistics', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockResolvedValue({ id: 'season-1', name: 'Season 1' });

      const mockCards = [
        { ...mockCard, difficulty: 'EASY' as Difficulty, usageCount: 5, attempts: [{ isCorrect: true }] },
        { ...mockCard, id: 'card-2', difficulty: 'MEDIUM' as Difficulty, usageCount: 3, attempts: [{ isCorrect: false }] },
        { ...mockCard, id: 'card-3', difficulty: 'HARD' as Difficulty, usageCount: 1, attempts: [] },
      ];

      const mockAttempts = [
        { ...mockAttempt, isCorrect: true, card: { difficulty: 'EASY' as Difficulty } },
        { ...mockAttempt, id: 'attempt-2', isCorrect: false, card: { difficulty: 'MEDIUM' as Difficulty } },
      ];

      (db.card.findMany as MockedFunction<typeof db.card.findMany>)
        .mockResolvedValue(mockCards as any);
      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue(mockAttempts as any);

      // Act
      const result = await AnalyticsService.getSeasonStatistics('season-1');

      // Assert
      expect(result.seasonId).toBe('season-1');
      expect(result.seasonName).toBe('Season 1');
      expect(result.totalCards).toBe(3);
      expect(result.totalAttempts).toBe(2);
      expect(result.overallSuccessRate).toBe(50);
      expect(result.difficultyStats).toHaveLength(3);
      expect(result.mostUsedCards).toHaveLength(3);
      expect(result.leastUsedCards).toHaveLength(3);
    });

    it('should handle empty season correctly', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockResolvedValue({ id: 'season-1', name: 'Empty Season' });
      (db.card.findMany as MockedFunction<typeof db.card.findMany>)
        .mockResolvedValue([]);
      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue([]);

      // Act
      const result = await AnalyticsService.getSeasonStatistics('season-1');

      // Assert
      expect(result.totalCards).toBe(0);
      expect(result.totalAttempts).toBe(0);
      expect(result.overallSuccessRate).toBe(0);
      expect(result.mostUsedCards).toHaveLength(0);
      expect(result.leastUsedCards).toHaveLength(0);
    });
  });

  describe('compareSeasons', () => {
    it('should compare multiple seasons successfully', async () => {
      // Arrange
      const mockSeasonStats = {
        seasonId: 'season-1',
        seasonName: 'Season 1',
        totalCards: 10,
        totalAttempts: 20,
        overallSuccessRate: 75,
        difficultyStats: [
          { difficulty: 'EASY' as Difficulty, cardCount: 5, attemptCount: 10, successRate: 80 },
          { difficulty: 'MEDIUM' as Difficulty, cardCount: 3, attemptCount: 7, successRate: 70 },
          { difficulty: 'HARD' as Difficulty, cardCount: 2, attemptCount: 3, successRate: 60 },
        ],
        mostUsedCards: [],
        leastUsedCards: [],
      };

      // Mock the getSeasonStatistics method
      vi.spyOn(AnalyticsService, 'getSeasonStatistics')
        .mockResolvedValue(mockSeasonStats);

      // Act
      const result = await AnalyticsService.compareSeasons(['season-1', 'season-2']);

      // Assert
      expect(result.seasons).toHaveLength(2);
      expect(result.comparison.totalCards).toHaveLength(2);
      expect(result.comparison.totalAttempts).toHaveLength(2);
      expect(result.comparison.overallSuccessRate).toHaveLength(2);
      expect(result.comparison.difficultyDistribution).toHaveLength(3);
    });

    it('should sort comparison data correctly', async () => {
      // Arrange
      const season1Stats = {
        seasonId: 'season-1',
        seasonName: 'Season 1',
        totalCards: 5,
        totalAttempts: 10,
        overallSuccessRate: 60,
        difficultyStats: [],
        mostUsedCards: [],
        leastUsedCards: [],
      };

      const season2Stats = {
        seasonId: 'season-2',
        seasonName: 'Season 2',
        totalCards: 10,
        totalAttempts: 20,
        overallSuccessRate: 80,
        difficultyStats: [],
        mostUsedCards: [],
        leastUsedCards: [],
      };

      vi.spyOn(AnalyticsService, 'getSeasonStatistics')
        .mockResolvedValueOnce(season1Stats)
        .mockResolvedValueOnce(season2Stats);

      // Act
      const result = await AnalyticsService.compareSeasons(['season-1', 'season-2']);

      // Assert
      // Should be sorted by value (descending)
      expect(result.comparison.totalCards[0].seasonId).toBe('season-2');
      expect(result.comparison.totalCards[1].seasonId).toBe('season-1');
      expect(result.comparison.overallSuccessRate[0].seasonId).toBe('season-2');
      expect(result.comparison.overallSuccessRate[1].seasonId).toBe('season-1');
    });
  });

  describe('generateExportData', () => {
    it('should generate complete export data for a season', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockResolvedValue(mockSeason);
      (db.card.findMany as MockedFunction<typeof db.card.findMany>)
        .mockResolvedValue([mockCard]);
      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue([mockAttempt] as any);

      const mockStats = {
        seasonId: 'season-1',
        seasonName: 'Season 1',
        totalCards: 1,
        totalAttempts: 1,
        overallSuccessRate: 100,
        difficultyStats: [],
        mostUsedCards: [],
        leastUsedCards: [],
      };

      vi.spyOn(AnalyticsService, 'getSeasonStatistics')
        .mockResolvedValue(mockStats);

      // Act
      const result = await AnalyticsService.generateExportData('season-1');

      // Assert
      expect(result.season).toEqual(mockSeason);
      expect(result.cards).toEqual([mockCard]);
      expect(result.attempts).toEqual([mockAttempt]);
      expect(result.stats).toEqual(mockStats);
      expect(result.exportedAt).toBeInstanceOf(Date);
    });

    it('should throw SeasonNotFoundError for nonexistent season', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockResolvedValue(null);

      // Act & Assert
      await expect(AnalyticsService.generateExportData('nonexistent'))
        .rejects.toThrow(SeasonNotFoundError);
    });
  });

  describe('getRealTimeAnalytics', () => {
    it('should return real-time analytics for a season', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockResolvedValue(mockSeason);

      const recentAttempts = [
        {
          ...mockAttempt,
          card: { cardNumber: 1, difficulty: 'EASY' as Difficulty },
        },
      ];

      const allAttempts = [
        { ...mockAttempt, isCorrect: true, card: { difficulty: 'EASY' as Difficulty } },
        { ...mockAttempt, id: 'attempt-2', isCorrect: false, card: { difficulty: 'MEDIUM' as Difficulty } },
      ];

      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValueOnce(recentAttempts as any) // First call for recent attempts
        .mockResolvedValueOnce(allAttempts as any); // Second call for all attempts

      // Act
      const result = await AnalyticsService.getRealTimeAnalytics('season-1');

      // Assert
      expect(result.lastUpdated).toBeInstanceOf(Date);
      expect(result.totalAttempts).toBe(2);
      expect(result.totalContestants).toBe(1);
      expect(result.currentSuccessRate).toBe(50);
      expect(result.recentActivity).toHaveLength(1);
      expect(result.difficultyBreakdown).toHaveLength(3);
    });
  });

  describe('getUnusedCardsAnalytics', () => {
    it('should return unused cards analytics', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockResolvedValue(mockSeason);

      const unusedCards = [
        { ...mockCard, usageCount: 0, difficulty: 'EASY' as Difficulty },
        { ...mockCard, id: 'card-2', usageCount: 0, difficulty: 'MEDIUM' as Difficulty },
      ];

      (db.card.findMany as MockedFunction<typeof db.card.findMany>)
        .mockResolvedValue(unusedCards);

      // Act
      const result = await AnalyticsService.getUnusedCardsAnalytics('season-1');

      // Assert
      expect(result.totalUnusedCards).toBe(2);
      expect(result.unusedCardsByDifficulty).toHaveLength(3);
      expect(result.unusedCardsByDifficulty[0].difficulty).toBe('EASY');
      expect(result.unusedCardsByDifficulty[0].count).toBe(1);
      expect(result.unusedCardsByDifficulty[1].difficulty).toBe('MEDIUM');
      expect(result.unusedCardsByDifficulty[1].count).toBe(1);
      expect(result.unusedCardsByDifficulty[2].difficulty).toBe('HARD');
      expect(result.unusedCardsByDifficulty[2].count).toBe(0);
    });
  });

  describe('getPerformanceTrends', () => {
    it('should return performance trends over time', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockResolvedValue(mockSeason);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const mockAttempts = [
        { ...mockAttempt, attemptedAt: today, isCorrect: true, contestantName: 'John' },
        { ...mockAttempt, id: 'attempt-2', attemptedAt: today, isCorrect: false, contestantName: 'Jane' },
        { ...mockAttempt, id: 'attempt-3', attemptedAt: yesterday, isCorrect: true, contestantName: 'Bob' },
      ];

      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue(mockAttempts as any);

      // Act
      const result = await AnalyticsService.getPerformanceTrends('season-1', 7);

      // Assert
      expect(result.dailyStats.length).toBeGreaterThan(0);
      expect(result.trendAnalysis).toHaveProperty('attemptsGrowth');
      expect(result.trendAnalysis).toHaveProperty('successRateChange');
      expect(result.trendAnalysis).toHaveProperty('contestantGrowth');
    });

    it('should handle empty data gracefully', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockResolvedValue(mockSeason);
      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue([]);

      // Act
      const result = await AnalyticsService.getPerformanceTrends('season-1', 7);

      // Assert
      expect(result.dailyStats).toEqual([]);
      expect(result.trendAnalysis.attemptsGrowth).toBe(0);
      expect(result.trendAnalysis.successRateChange).toBe(0);
      expect(result.trendAnalysis.contestantGrowth).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(AnalyticsService.getCardUsageStatistics('season-1'))
        .rejects.toThrow(AnalyticsError);
    });

    it('should preserve SeasonNotFoundError when thrown', async () => {
      // Arrange
      (db.season.findUnique as MockedFunction<typeof db.season.findUnique>)
        .mockResolvedValue(null);

      // Act & Assert
      await expect(AnalyticsService.getContestantPerformanceAnalytics('nonexistent'))
        .rejects.toThrow(SeasonNotFoundError);
    });
  });
});