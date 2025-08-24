import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { CardService, DeckFullError, DeckEmptyError, CardNotFoundError, DuplicateCardNumberError } from '../card.service';
import { db } from '~/server/db';
import type { Card, Difficulty } from '~/lib/types';

// Mock the database
vi.mock('~/server/db', () => ({
  db: {
    card: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

const mockDb = db as {
  card: {
    create: MockedFunction<any>;
    findMany: MockedFunction<any>;
    findUnique: MockedFunction<any>;
    update: MockedFunction<any>;
    updateMany: MockedFunction<any>;
    delete: MockedFunction<any>;
    count: MockedFunction<any>;
    groupBy: MockedFunction<any>;
  };
};

describe('CardService', () => {
  const mockSeasonId = 'season-123';
  const mockCardId = 'card-123';
  const mockCard: Card = {
    id: mockCardId,
    cardNumber: 1,
    question: 'What is TypeScript?',
    correctAnswer: 'A typed superset of JavaScript',
    difficulty: 'EASY' as Difficulty,
    usageCount: 0,
    lastUsed: null,
    seasonId: mockSeasonId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCard', () => {
    const createCardInput = {
      seasonId: mockSeasonId,
      cardNumber: 1,
      question: 'What is TypeScript?',
      correctAnswer: 'A typed superset of JavaScript',
      difficulty: 'EASY' as Difficulty,
    };

    it('should create a card successfully', async () => {
      mockDb.card.count.mockResolvedValue(0);
      mockDb.card.findUnique.mockResolvedValue(null);
      mockDb.card.create.mockResolvedValue(mockCard);

      const result = await CardService.createCard(createCardInput);

      expect(mockDb.card.count).toHaveBeenCalledWith({
        where: {
          seasonId: mockSeasonId,
          difficulty: 'EASY',
        },
      });
      expect(mockDb.card.findUnique).toHaveBeenCalledWith({
        where: {
          seasonId_difficulty_cardNumber: {
            seasonId: mockSeasonId,
            difficulty: 'EASY',
            cardNumber: 1,
          },
        },
      });
      expect(mockDb.card.create).toHaveBeenCalledWith({
        data: createCardInput,
      });
      expect(result).toEqual(mockCard);
    });

    it('should throw DeckFullError when deck has 52 cards', async () => {
      mockDb.card.count.mockResolvedValue(52);

      await expect(CardService.createCard(createCardInput)).rejects.toThrow(DeckFullError);
      expect(mockDb.card.create).not.toHaveBeenCalled();
    });

    it('should throw DuplicateCardNumberError when card number already exists', async () => {
      mockDb.card.count.mockResolvedValue(10);
      mockDb.card.findUnique.mockResolvedValue(mockCard);

      await expect(CardService.createCard(createCardInput)).rejects.toThrow(DuplicateCardNumberError);
      expect(mockDb.card.create).not.toHaveBeenCalled();
    });
  });

  describe('getNextAvailableCardNumber', () => {
    it('should return 1 when no cards exist', async () => {
      mockDb.card.findMany.mockResolvedValue([]);

      const result = await CardService.getNextAvailableCardNumber(mockSeasonId, 'EASY');

      expect(result).toBe(1);
      expect(mockDb.card.findMany).toHaveBeenCalledWith({
        where: {
          seasonId: mockSeasonId,
          difficulty: 'EASY',
        },
        select: {
          cardNumber: true,
        },
        orderBy: {
          cardNumber: 'asc',
        },
      });
    });

    it('should return 3 when cards 1 and 2 exist', async () => {
      mockDb.card.findMany.mockResolvedValue([
        { cardNumber: 1 },
        { cardNumber: 2 },
      ]);

      const result = await CardService.getNextAvailableCardNumber(mockSeasonId, 'EASY');

      expect(result).toBe(3);
    });

    it('should return 2 when cards 1 and 3 exist (gap in sequence)', async () => {
      mockDb.card.findMany.mockResolvedValue([
        { cardNumber: 1 },
        { cardNumber: 3 },
      ]);

      const result = await CardService.getNextAvailableCardNumber(mockSeasonId, 'EASY');

      expect(result).toBe(2);
    });

    it('should throw DeckFullError when all 52 positions are taken', async () => {
      const allCards = Array.from({ length: 52 }, (_, i) => ({ cardNumber: i + 1 }));
      mockDb.card.findMany.mockResolvedValue(allCards);

      await expect(CardService.getNextAvailableCardNumber(mockSeasonId, 'EASY')).rejects.toThrow(DeckFullError);
    });
  });

  describe('createCardWithAutoNumber', () => {
    it('should create a card with auto-assigned number', async () => {
      const input = {
        seasonId: mockSeasonId,
        question: 'What is TypeScript?',
        correctAnswer: 'A typed superset of JavaScript',
        difficulty: 'EASY' as Difficulty,
      };

      mockDb.card.findMany.mockResolvedValue([]);
      mockDb.card.count.mockResolvedValue(0);
      mockDb.card.findUnique.mockResolvedValue(null);
      mockDb.card.create.mockResolvedValue({ ...mockCard, cardNumber: 1 });

      const result = await CardService.createCardWithAutoNumber(input);

      expect(result.cardNumber).toBe(1);
      expect(mockDb.card.create).toHaveBeenCalledWith({
        data: { ...input, cardNumber: 1 },
      });
    });
  });

  describe('getCardsByDeck', () => {
    it('should return cards with usage statistics and pagination', async () => {
      const mockCardsFromDb = [
        {
          ...mockCard,
          _count: { attempts: 5 },
          attempts: [
            { isCorrect: true },
            { isCorrect: true },
            { isCorrect: false },
            { isCorrect: true },
            { isCorrect: false },
          ],
        },
      ];

      mockDb.card.findMany.mockResolvedValue(mockCardsFromDb);
      mockDb.card.count.mockResolvedValue(1);

      const result = await CardService.getCardsByDeck({
        seasonId: mockSeasonId,
        difficulty: 'EASY',
        page: 1,
        limit: 20,
      });

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0]).toMatchObject({
        id: mockCardId,
        cardNumber: 1,
        totalAttempts: 5,
        correctAttempts: 3,
        successRate: 60,
      });
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should handle cards with no attempts', async () => {
      const mockCardsFromDb = [
        {
          ...mockCard,
          _count: { attempts: 0 },
          attempts: [],
        },
      ];

      mockDb.card.findMany.mockResolvedValue(mockCardsFromDb);
      mockDb.card.count.mockResolvedValue(1);

      const result = await CardService.getCardsByDeck({
        seasonId: mockSeasonId,
        difficulty: 'EASY',
      });

      expect(result.cards[0]).toMatchObject({
        totalAttempts: 0,
        correctAttempts: 0,
        successRate: 0,
      });
    });
  });

  describe('drawRandomCard', () => {
    it('should draw a random unused card and update usage', async () => {
      const unusedCards = [mockCard, { ...mockCard, id: 'card-456', cardNumber: 2 }];
      mockDb.card.findMany.mockResolvedValue(unusedCards);
      mockDb.card.update.mockResolvedValue({ ...mockCard, usageCount: 1, lastUsed: new Date() });

      // Mock Math.random to return 0 (first card)
      const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

      const result = await CardService.drawRandomCard({
        seasonId: mockSeasonId,
        difficulty: 'EASY',
      });

      expect(mockDb.card.findMany).toHaveBeenCalledWith({
        where: {
          seasonId: mockSeasonId,
          difficulty: 'EASY',
          usageCount: 0,
        },
      });
      expect(mockDb.card.update).toHaveBeenCalledWith({
        where: { id: mockCardId },
        data: {
          usageCount: { increment: 1 },
          lastUsed: expect.any(Date),
        },
      });
      expect(result.usageCount).toBe(1);

      mathRandomSpy.mockRestore();
    });

    it('should draw from least used cards when no unused cards available', async () => {
      const leastUsedCards = [{ ...mockCard, usageCount: 2 }];
      
      // First call returns empty array (no unused cards)
      // Second call returns least used cards
      mockDb.card.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(leastUsedCards);
      
      mockDb.card.update.mockResolvedValue({ ...mockCard, usageCount: 3, lastUsed: new Date() });

      const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

      const result = await CardService.drawRandomCard({
        seasonId: mockSeasonId,
        difficulty: 'EASY',
      });

      expect(mockDb.card.findMany).toHaveBeenCalledTimes(2);
      expect(mockDb.card.findMany).toHaveBeenNthCalledWith(2, {
        where: {
          seasonId: mockSeasonId,
          difficulty: 'EASY',
        },
        orderBy: {
          usageCount: 'asc',
        },
        take: 10,
      });
      expect(result.usageCount).toBe(3);

      mathRandomSpy.mockRestore();
    });

    it('should throw DeckEmptyError when no cards exist', async () => {
      mockDb.card.findMany.mockResolvedValue([]);

      await expect(CardService.drawRandomCard({
        seasonId: mockSeasonId,
        difficulty: 'EASY',
      })).rejects.toThrow(DeckEmptyError);
    });
  });

  describe('updateCardUsage', () => {
    it('should increment usage count and update last used timestamp', async () => {
      const updatedCard = { ...mockCard, usageCount: 1, lastUsed: new Date() };
      mockDb.card.update.mockResolvedValue(updatedCard);

      const result = await CardService.updateCardUsage(mockCardId);

      expect(mockDb.card.update).toHaveBeenCalledWith({
        where: { id: mockCardId },
        data: {
          usageCount: { increment: 1 },
          lastUsed: expect.any(Date),
        },
      });
      expect(result).toEqual(updatedCard);
    });
  });

  describe('getCardById', () => {
    it('should return card when found', async () => {
      mockDb.card.findUnique.mockResolvedValue(mockCard);

      const result = await CardService.getCardById(mockCardId);

      expect(mockDb.card.findUnique).toHaveBeenCalledWith({
        where: { id: mockCardId },
      });
      expect(result).toEqual(mockCard);
    });

    it('should return null when card not found', async () => {
      mockDb.card.findUnique.mockResolvedValue(null);

      const result = await CardService.getCardById(mockCardId);

      expect(result).toBeNull();
    });
  });

  describe('updateCard', () => {
    it('should update card successfully', async () => {
      const updateInput = {
        id: mockCardId,
        question: 'Updated question',
        correctAnswer: 'Updated answer',
      };
      const updatedCard = { ...mockCard, ...updateInput };

      mockDb.card.findUnique.mockResolvedValue(mockCard);
      mockDb.card.update.mockResolvedValue(updatedCard);

      const result = await CardService.updateCard(updateInput);

      expect(mockDb.card.findUnique).toHaveBeenCalledWith({
        where: { id: mockCardId },
      });
      expect(mockDb.card.update).toHaveBeenCalledWith({
        where: { id: mockCardId },
        data: {
          question: 'Updated question',
          correctAnswer: 'Updated answer',
        },
      });
      expect(result).toEqual(updatedCard);
    });

    it('should throw CardNotFoundError when card does not exist', async () => {
      mockDb.card.findUnique.mockResolvedValue(null);

      await expect(CardService.updateCard({
        id: mockCardId,
        question: 'Updated question',
      })).rejects.toThrow(CardNotFoundError);

      expect(mockDb.card.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteCard', () => {
    it('should delete card successfully', async () => {
      mockDb.card.findUnique.mockResolvedValue(mockCard);
      mockDb.card.delete.mockResolvedValue(mockCard);

      const result = await CardService.deleteCard(mockCardId);

      expect(mockDb.card.findUnique).toHaveBeenCalledWith({
        where: { id: mockCardId },
      });
      expect(mockDb.card.delete).toHaveBeenCalledWith({
        where: { id: mockCardId },
      });
      expect(result).toBe(true);
    });

    it('should return false when card does not exist', async () => {
      mockDb.card.findUnique.mockResolvedValue(null);

      const result = await CardService.deleteCard(mockCardId);

      expect(result).toBe(false);
      expect(mockDb.card.delete).not.toHaveBeenCalled();
    });
  });

  describe('getDeckStatus', () => {
    it('should return correct deck status', async () => {
      const mockCards = [
        { usageCount: 0 },
        { usageCount: 1 },
        { usageCount: 0 },
        { usageCount: 2 },
      ];
      mockDb.card.findMany.mockResolvedValue(mockCards);

      const result = await CardService.getDeckStatus(mockSeasonId, 'EASY');

      expect(result).toEqual({
        difficulty: 'EASY',
        totalCards: 4,
        usedCards: 2,
        availableCards: 2,
        usagePercentage: 50,
      });
    });

    it('should handle empty deck', async () => {
      mockDb.card.findMany.mockResolvedValue([]);

      const result = await CardService.getDeckStatus(mockSeasonId, 'EASY');

      expect(result).toEqual({
        difficulty: 'EASY',
        totalCards: 0,
        usedCards: 0,
        availableCards: 0,
        usagePercentage: 0,
      });
    });
  });

  describe('resetDeckUsage', () => {
    it('should reset all cards in deck to unused', async () => {
      mockDb.card.updateMany.mockResolvedValue({ count: 10 });

      const result = await CardService.resetDeckUsage(mockSeasonId, 'EASY');

      expect(mockDb.card.updateMany).toHaveBeenCalledWith({
        where: {
          seasonId: mockSeasonId,
          difficulty: 'EASY',
        },
        data: {
          usageCount: 0,
          lastUsed: null,
        },
      });
      expect(result).toBe(10);
    });
  });

  describe('getUnusedCards', () => {
    it('should return only unused cards', async () => {
      const unusedCards = [mockCard];
      mockDb.card.findMany.mockResolvedValue(unusedCards);

      const result = await CardService.getUnusedCards(mockSeasonId, 'EASY');

      expect(mockDb.card.findMany).toHaveBeenCalledWith({
        where: {
          seasonId: mockSeasonId,
          difficulty: 'EASY',
          usageCount: 0,
        },
        orderBy: {
          cardNumber: 'asc',
        },
      });
      expect(result).toEqual(unusedCards);
    });
  });

  describe('getCardCountByDifficulty', () => {
    it('should return card counts for all difficulties', async () => {
      mockDb.card.groupBy.mockResolvedValue([
        { difficulty: 'EASY', _count: { id: 10 } },
        { difficulty: 'MEDIUM', _count: { id: 8 } },
        { difficulty: 'HARD', _count: { id: 5 } },
      ]);

      const result = await CardService.getCardCountByDifficulty(mockSeasonId);

      expect(result).toEqual({
        EASY: 10,
        MEDIUM: 8,
        HARD: 5,
      });
    });

    it('should return zero counts when no cards exist', async () => {
      mockDb.card.groupBy.mockResolvedValue([]);

      const result = await CardService.getCardCountByDifficulty(mockSeasonId);

      expect(result).toEqual({
        EASY: 0,
        MEDIUM: 0,
        HARD: 0,
      });
    });
  });

  describe('cardExists', () => {
    it('should return true when card exists', async () => {
      mockDb.card.count.mockResolvedValue(1);

      const result = await CardService.cardExists(mockCardId);

      expect(result).toBe(true);
    });

    it('should return false when card does not exist', async () => {
      mockDb.card.count.mockResolvedValue(0);

      const result = await CardService.cardExists(mockCardId);

      expect(result).toBe(false);
    });
  });
});