import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { GameService, AttemptRecordingError, ContestantNotFoundError } from '../game.service';
import { CardService, CardNotFoundError } from '../card.service';
import { db } from '~/server/db';
import type { CreateAttemptInput, Difficulty } from '~/lib/validations';
import type { Card } from '~/lib/types';

// Mock the database
vi.mock('~/server/db', () => ({
  db: {
    attempt: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock CardService
vi.mock('../card.service', () => ({
  CardService: {
    getCardById: vi.fn(),
    resetDeckUsage: vi.fn(),
  },
  CardNotFoundError: class extends Error {
    constructor(cardId: string) {
      super(`Card with ID ${cardId} not found`);
      this.name = 'CardNotFoundError';
    }
  },
}));

describe('GameService', () => {
  const mockCard: Card = {
    id: 'card-1',
    cardNumber: 1,
    question: 'What is TypeScript?',
    correctAnswer: 'A typed superset of JavaScript',
    difficulty: 'EASY' as Difficulty,
    usageCount: 0,
    lastUsed: null,
    seasonId: 'season-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAttemptInput: CreateAttemptInput = {
    cardId: 'card-1',
    contestantName: 'John Doe',
    givenAnswer: 'A typed superset of JavaScript',
    isCorrect: true,
  };

  const mockAttemptWithCard = {
    id: 'attempt-1',
    cardId: 'card-1',
    seasonId: 'season-1',
    contestantName: 'John Doe',
    givenAnswer: 'A typed superset of JavaScript',
    isCorrect: true,
    attemptedAt: new Date(),
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

  describe('recordAttempt', () => {
    it('should record a contestant attempt successfully', async () => {
      // Arrange
      (CardService.getCardById as MockedFunction<typeof CardService.getCardById>)
        .mockResolvedValue(mockCard);
      (db.$transaction as MockedFunction<typeof db.$transaction>)
        .mockImplementation(async (callback) => {
          return callback({
            attempt: {
              create: vi.fn().mockResolvedValue(mockAttemptWithCard),
            },
          } as any);
        });

      // Act
      const result = await GameService.recordAttempt(mockAttemptInput, 'user-1');

      // Assert
      expect(result).toEqual(mockAttemptWithCard);
      expect(CardService.getCardById).toHaveBeenCalledWith('card-1');
    });

    it('should throw CardNotFoundError when card does not exist', async () => {
      // Arrange
      (CardService.getCardById as MockedFunction<typeof CardService.getCardById>)
        .mockResolvedValue(null);

      // Act & Assert
      await expect(GameService.recordAttempt(mockAttemptInput, 'user-1'))
        .rejects.toThrow(CardNotFoundError);
    });

    it('should throw AttemptRecordingError when database operation fails', async () => {
      // Arrange
      (CardService.getCardById as MockedFunction<typeof CardService.getCardById>)
        .mockResolvedValue(mockCard);
      (db.$transaction as MockedFunction<typeof db.$transaction>)
        .mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(GameService.recordAttempt(mockAttemptInput, 'user-1'))
        .rejects.toThrow(AttemptRecordingError);
    });

    it('should trim contestant name and answer before recording', async () => {
      // Arrange
      const inputWithSpaces = {
        ...mockAttemptInput,
        contestantName: '  John Doe  ',
        givenAnswer: '  A typed superset of JavaScript  ',
      };

      (CardService.getCardById as MockedFunction<typeof CardService.getCardById>)
        .mockResolvedValue(mockCard);
      
      const mockCreate = vi.fn().mockResolvedValue(mockAttemptWithCard);
      (db.$transaction as MockedFunction<typeof db.$transaction>)
        .mockImplementation(async (callback) => {
          return callback({
            attempt: { create: mockCreate },
          } as any);
        });

      // Act
      await GameService.recordAttempt(inputWithSpaces, 'user-1');

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          cardId: 'card-1',
          seasonId: 'season-1',
          contestantName: 'John Doe',
          givenAnswer: 'A typed superset of JavaScript',
          isCorrect: true,
          recordedById: 'user-1',
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
    });
  });

  describe('calculateAnswerCorrectness', () => {
    it('should return true for exact match', () => {
      const result = GameService.calculateAnswerCorrectness(
        'TypeScript',
        'TypeScript'
      );
      expect(result).toBe(true);
    });

    it('should return true for case-insensitive match', () => {
      const result = GameService.calculateAnswerCorrectness(
        'typescript',
        'TypeScript'
      );
      expect(result).toBe(true);
    });

    it('should return true after trimming whitespace', () => {
      const result = GameService.calculateAnswerCorrectness(
        '  TypeScript  ',
        'TypeScript'
      );
      expect(result).toBe(true);
    });

    it('should return false for different answers', () => {
      const result = GameService.calculateAnswerCorrectness(
        'JavaScript',
        'TypeScript'
      );
      expect(result).toBe(false);
    });

    it('should handle empty strings', () => {
      const result = GameService.calculateAnswerCorrectness('', '');
      expect(result).toBe(true);
    });
  });

  describe('recordAttemptWithValidation', () => {
    it('should automatically validate correct answer', async () => {
      // Arrange
      const inputWithoutCorrectness = {
        cardId: 'card-1',
        contestantName: 'John Doe',
        givenAnswer: 'A typed superset of JavaScript',
      };

      (CardService.getCardById as MockedFunction<typeof CardService.getCardById>)
        .mockResolvedValue(mockCard);
      (db.$transaction as MockedFunction<typeof db.$transaction>)
        .mockImplementation(async (callback) => {
          return callback({
            attempt: {
              create: vi.fn().mockResolvedValue({
                ...mockAttemptWithCard,
                isCorrect: true,
              }),
            },
          } as any);
        });

      // Act
      const result = await GameService.recordAttemptWithValidation(
        inputWithoutCorrectness,
        'user-1'
      );

      // Assert
      expect(result.isCorrect).toBe(true);
    });

    it('should automatically validate incorrect answer', async () => {
      // Arrange
      const inputWithWrongAnswer = {
        cardId: 'card-1',
        contestantName: 'John Doe',
        givenAnswer: 'Wrong answer',
      };

      (CardService.getCardById as MockedFunction<typeof CardService.getCardById>)
        .mockResolvedValue(mockCard);
      (db.$transaction as MockedFunction<typeof db.$transaction>)
        .mockImplementation(async (callback) => {
          return callback({
            attempt: {
              create: vi.fn().mockResolvedValue({
                ...mockAttemptWithCard,
                isCorrect: false,
                givenAnswer: 'Wrong answer',
              }),
            },
          } as any);
        });

      // Act
      const result = await GameService.recordAttemptWithValidation(
        inputWithWrongAnswer,
        'user-1'
      );

      // Assert
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('getAttemptHistory', () => {
    it('should return paginated attempt history', async () => {
      // Arrange
      const mockAttempts = [mockAttemptWithCard];
      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue(mockAttempts as any);
      (db.attempt.count as MockedFunction<typeof db.attempt.count>)
        .mockResolvedValue(1);

      // Act
      const result = await GameService.getAttemptHistory({
        seasonId: 'season-1',
        page: 1,
        limit: 20,
      });

      // Assert
      expect(result.data).toEqual(mockAttempts);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should filter by contestant name', async () => {
      // Arrange
      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue([]);
      (db.attempt.count as MockedFunction<typeof db.attempt.count>)
        .mockResolvedValue(0);

      // Act
      await GameService.getAttemptHistory({
        contestantName: 'John',
        page: 1,
        limit: 20,
      });

      // Assert
      expect(db.attempt.findMany).toHaveBeenCalledWith({
        where: {
          contestantName: {
            contains: 'John',
          },
        },
        include: expect.any(Object),
        orderBy: { attemptedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('getContestantPerformance', () => {
    it('should return contestant performance statistics', async () => {
      // Arrange
      const mockAttempts = [
        { ...mockAttemptWithCard, isCorrect: true },
        { ...mockAttemptWithCard, id: 'attempt-2', isCorrect: false },
        { 
          ...mockAttemptWithCard, 
          id: 'attempt-3', 
          isCorrect: true,
          card: { ...mockAttemptWithCard.card, difficulty: 'MEDIUM' as Difficulty }
        },
      ];

      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue(mockAttempts as any);

      // Act
      const result = await GameService.getContestantPerformance('John Doe');

      // Assert
      expect(result.contestantName).toBe('John Doe');
      expect(result.totalAttempts).toBe(3);
      expect(result.correctAttempts).toBe(2);
      expect(result.successRate).toBeCloseTo(66.67, 2);
      expect(result.difficultyBreakdown).toHaveLength(3);
      expect(result.recentAttempts).toHaveLength(3);
    });

    it('should throw ContestantNotFoundError when no attempts found', async () => {
      // Arrange
      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue([]);

      // Act & Assert
      await expect(GameService.getContestantPerformance('Unknown'))
        .rejects.toThrow(ContestantNotFoundError);
    });
  });

  describe('resetDeck', () => {
    it('should reset deck usage successfully', async () => {
      // Arrange
      (CardService.resetDeckUsage as MockedFunction<typeof CardService.resetDeckUsage>)
        .mockResolvedValue(10);

      // Act
      const result = await GameService.resetDeck({
        seasonId: 'season-1',
        difficulty: 'EASY',
      });

      // Assert
      expect(result.cardsReset).toBe(10);
      expect(result.message).toBe('Reset 10 cards in EASY deck for season season-1');
      expect(CardService.resetDeckUsage).toHaveBeenCalledWith('season-1', 'EASY');
    });
  });

  describe('getCardAttemptStats', () => {
    it('should return card attempt statistics', async () => {
      // Arrange
      const mockAttempts = [
        { ...mockAttemptWithCard, isCorrect: true, contestantName: 'John' },
        { ...mockAttemptWithCard, id: 'attempt-2', isCorrect: false, contestantName: 'Jane' },
        { ...mockAttemptWithCard, id: 'attempt-3', isCorrect: true, contestantName: 'John' },
      ];

      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue(mockAttempts as any);

      // Act
      const result = await GameService.getCardAttemptStats('card-1');

      // Assert
      expect(result.cardId).toBe('card-1');
      expect(result.totalAttempts).toBe(3);
      expect(result.correctAttempts).toBe(2);
      expect(result.incorrectAttempts).toBe(1);
      expect(result.successRate).toBeCloseTo(66.67, 2);
      expect(result.uniqueContestants).toBe(2);
      expect(result.recentAttempts).toHaveLength(3);
    });
  });

  describe('getSeasonGameStats', () => {
    it('should return comprehensive season game statistics', async () => {
      // Arrange
      const mockAttempts = [
        { 
          ...mockAttemptWithCard, 
          isCorrect: true, 
          contestantName: 'John',
          card: { difficulty: 'EASY' as Difficulty }
        },
        { 
          ...mockAttemptWithCard, 
          id: 'attempt-2', 
          isCorrect: false, 
          contestantName: 'Jane',
          card: { difficulty: 'MEDIUM' as Difficulty }
        },
        { 
          ...mockAttemptWithCard, 
          id: 'attempt-3', 
          isCorrect: true, 
          contestantName: 'John',
          card: { difficulty: 'HARD' as Difficulty }
        },
      ];

      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue(mockAttempts as any);

      // Act
      const result = await GameService.getSeasonGameStats('season-1');

      // Assert
      expect(result.seasonId).toBe('season-1');
      expect(result.totalAttempts).toBe(3);
      expect(result.totalContestants).toBe(2);
      expect(result.overallSuccessRate).toBeCloseTo(66.67, 2);
      expect(result.difficultyStats).toHaveLength(3);
      expect(result.topPerformers).toHaveLength(0); // No contestants with >= 3 attempts
    });
  });

  describe('hasContestantAttemptedCard', () => {
    it('should return true when contestant has attempted the card', async () => {
      // Arrange
      (db.attempt.count as MockedFunction<typeof db.attempt.count>)
        .mockResolvedValue(1);

      // Act
      const result = await GameService.hasContestantAttemptedCard('John Doe', 'card-1');

      // Assert
      expect(result).toBe(true);
      expect(db.attempt.count).toHaveBeenCalledWith({
        where: {
          contestantName: {
            equals: 'John Doe',
          },
          cardId: 'card-1',
        },
      });
    });

    it('should return false when contestant has not attempted the card', async () => {
      // Arrange
      (db.attempt.count as MockedFunction<typeof db.attempt.count>)
        .mockResolvedValue(0);

      // Act
      const result = await GameService.hasContestantAttemptedCard('John Doe', 'card-1');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getSeasonContestants', () => {
    it('should return list of unique contestants', async () => {
      // Arrange
      const mockContestants = [
        { contestantName: 'John Doe' },
        { contestantName: 'Jane Smith' },
      ];

      (db.attempt.findMany as MockedFunction<typeof db.attempt.findMany>)
        .mockResolvedValue(mockContestants as any);

      // Act
      const result = await GameService.getSeasonContestants('season-1');

      // Assert
      expect(result).toEqual(['John Doe', 'Jane Smith']);
      expect(db.attempt.findMany).toHaveBeenCalledWith({
        where: { seasonId: 'season-1' },
        select: { contestantName: true },
        distinct: ['contestantName'],
        orderBy: { contestantName: 'asc' },
      });
    });
  });

  describe('deleteAttempt', () => {
    it('should delete attempt successfully', async () => {
      // Arrange
      (db.attempt.delete as MockedFunction<typeof db.attempt.delete>)
        .mockResolvedValue(mockAttemptWithCard as any);

      // Act
      const result = await GameService.deleteAttempt('attempt-1');

      // Assert
      expect(result).toBe(true);
      expect(db.attempt.delete).toHaveBeenCalledWith({
        where: { id: 'attempt-1' },
      });
    });

    it('should return false when deletion fails', async () => {
      // Arrange
      (db.attempt.delete as MockedFunction<typeof db.attempt.delete>)
        .mockRejectedValue(new Error('Not found'));

      // Act
      const result = await GameService.deleteAttempt('attempt-1');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('updateAttempt', () => {
    it('should update attempt successfully', async () => {
      // Arrange
      const updates = { contestantName: 'Updated Name' };
      const updatedAttempt = { ...mockAttemptWithCard, ...updates };

      (db.attempt.update as MockedFunction<typeof db.attempt.update>)
        .mockResolvedValue(updatedAttempt as any);

      // Act
      const result = await GameService.updateAttempt('attempt-1', updates);

      // Assert
      expect(result).toEqual(updatedAttempt);
      expect(db.attempt.update).toHaveBeenCalledWith({
        where: { id: 'attempt-1' },
        data: updates,
      });
    });

    it('should return null when update fails', async () => {
      // Arrange
      (db.attempt.update as MockedFunction<typeof db.attempt.update>)
        .mockRejectedValue(new Error('Not found'));

      // Act
      const result = await GameService.updateAttempt('attempt-1', {});

      // Assert
      expect(result).toBe(null);
    });
  });
});