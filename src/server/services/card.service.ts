import { db } from "~/server/db";
import type { 
  CreateCardInput, 
  UpdateCardInput,
  DrawCardInput,
  GetCardsByDeckInput,
  Difficulty 
} from "~/lib/validations";
import type { Card, CardWithUsage, DeckStatus } from "~/lib/types";

/**
 * Custom error classes for card operations
 */
export class DeckFullError extends Error {
  constructor(difficulty: Difficulty) {
    super(`${difficulty} deck is full (52 cards maximum)`);
    this.name = 'DeckFullError';
  }
}

export class DeckEmptyError extends Error {
  constructor(difficulty: Difficulty, seasonId: string) {
    super(`No unused cards available in ${difficulty} deck for season ${seasonId}`);
    this.name = 'DeckEmptyError';
  }
}

export class CardNotFoundError extends Error {
  constructor(cardId: string) {
    super(`Card with ID ${cardId} not found`);
    this.name = 'CardNotFoundError';
  }
}

export class DuplicateCardNumberError extends Error {
  constructor(cardNumber: number, difficulty: Difficulty, seasonId: string) {
    super(`Card number ${cardNumber} already exists in ${difficulty} deck for season ${seasonId}`);
    this.name = 'DuplicateCardNumberError';
  }
}

/**
 * Card Service
 * Handles CRUD operations for cards, deck management, and card drawing logic
 */
export class CardService {
  /**
   * Create a new card in a specific deck position
   * Requirements: 2.1 - WHEN a user adds a question to a card THEN the system SHALL store the question text, correct answer, and difficulty level
   * Requirements: 2.2 - WHEN a user creates a question THEN the system SHALL assign it to the next available card number in the selected deck
   */
  static async createCard(data: CreateCardInput): Promise<Card> {
    // Check if deck is already full (52 cards maximum)
    const existingCardCount = await db.card.count({
      where: {
        seasonId: data.seasonId,
        difficulty: data.difficulty,
      },
    });

    if (existingCardCount >= 52) {
      throw new DeckFullError(data.difficulty);
    }

    // Check if card number already exists in this deck
    const existingCard = await db.card.findUnique({
      where: {
        seasonId_difficulty_cardNumber: {
          seasonId: data.seasonId,
          difficulty: data.difficulty,
          cardNumber: data.cardNumber,
        },
      },
    });

    if (existingCard) {
      throw new DuplicateCardNumberError(data.cardNumber, data.difficulty, data.seasonId);
    }

    const card = await db.card.create({
      data: {
        seasonId: data.seasonId,
        cardNumber: data.cardNumber,
        question: data.question,
        correctAnswer: data.correctAnswer,
        difficulty: data.difficulty,
      },
    });

    return card;
  }

  /**
   * Get the next available card number for a specific deck
   * Requirements: 2.2 - WHEN a user creates a question THEN the system SHALL assign it to the next available card number in the selected deck
   */
  static async getNextAvailableCardNumber(seasonId: string, difficulty: Difficulty): Promise<number> {
    const existingCards = await db.card.findMany({
      where: {
        seasonId,
        difficulty,
      },
      select: {
        cardNumber: true,
      },
      orderBy: {
        cardNumber: 'asc',
      },
    });

    const usedNumbers = new Set(existingCards.map(card => card.cardNumber));
    
    // Find the first available number from 1 to 52
    for (let i = 1; i <= 52; i++) {
      if (!usedNumbers.has(i)) {
        return i;
      }
    }

    throw new DeckFullError(difficulty);
  }

  /**
   * Create a card with auto-assigned card number
   */
  static async createCardWithAutoNumber(
    data: Omit<CreateCardInput, 'cardNumber'>
  ): Promise<Card> {
    const cardNumber = await this.getNextAvailableCardNumber(data.seasonId, data.difficulty);
    
    return this.createCard({
      ...data,
      cardNumber,
    });
  }

  /**
   * Get cards by deck with pagination and usage statistics
   * Requirements: 2.3 - WHEN a user views a card THEN the system SHALL display the question, answer, and usage statistics
   */
  static async getCardsByDeck(input: GetCardsByDeckInput): Promise<{
    cards: CardWithUsage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const { seasonId, difficulty, page = 1, limit = 20 } = input;
    const skip = (page - 1) * limit;

    const [cards, total] = await Promise.all([
      db.card.findMany({
        where: {
          seasonId,
          difficulty,
        },
        include: {
          _count: {
            select: {
              attempts: true,
            },
          },
          attempts: {
            select: {
              isCorrect: true,
            },
          },
        },
        orderBy: {
          cardNumber: 'asc',
        },
        skip,
        take: limit,
      }),
      db.card.count({
        where: {
          seasonId,
          difficulty,
        },
      }),
    ]);

    const cardsWithUsage: CardWithUsage[] = cards.map(card => {
      const totalAttempts = card._count.attempts;
      const correctAttempts = card.attempts.filter(attempt => attempt.isCorrect).length;
      const successRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

      return {
        id: card.id,
        cardNumber: card.cardNumber,
        question: card.question,
        correctAnswer: card.correctAnswer,
        difficulty: card.difficulty,
        usageCount: card.usageCount,
        lastUsed: card.lastUsed,
        seasonId: card.seasonId,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        successRate,
        totalAttempts,
        correctAttempts,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      cards: cardsWithUsage,
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
   * Draw a random unused card from a specific deck
   * Requirements: 3.1 - WHEN a user draws a card from a deck THEN the system SHALL randomly select an unused card from that difficulty level
   * Requirements: 3.2 - WHEN a card is drawn THEN the system SHALL increment the usage count for that specific card
   */
  static async drawRandomCard(input: DrawCardInput): Promise<Card> {
    const { seasonId, difficulty } = input;

    // Get all unused cards (cards with usageCount = 0) or least used cards if all have been used
    const unusedCards = await db.card.findMany({
      where: {
        seasonId,
        difficulty,
        usageCount: 0,
      },
    });

    let cardToDraw: Card;

    if (unusedCards.length === 0) {
      // If no unused cards, get the least used cards
      const leastUsedCards = await db.card.findMany({
        where: {
          seasonId,
          difficulty,
        },
        orderBy: {
          usageCount: 'asc',
        },
        take: 10, // Get top 10 least used cards for randomization
      });

      if (leastUsedCards.length === 0) {
        throw new DeckEmptyError(difficulty, seasonId);
      }

      // Randomly select from least used cards
      const randomIndex = Math.floor(Math.random() * leastUsedCards.length);
      cardToDraw = leastUsedCards[randomIndex]!;
    } else {
      // Randomly select from unused cards
      const randomIndex = Math.floor(Math.random() * unusedCards.length);
      cardToDraw = unusedCards[randomIndex]!;
    }

    // Update usage count and last used timestamp
    const updatedCard = await this.updateCardUsage(cardToDraw.id);
    
    return updatedCard;
  }

  /**
   * Update card usage count and last used timestamp
   * Requirements: 3.2 - WHEN a card is drawn THEN the system SHALL increment the usage count for that specific card
   */
  static async updateCardUsage(cardId: string): Promise<Card> {
    const updatedCard = await db.card.update({
      where: { id: cardId },
      data: {
        usageCount: {
          increment: 1,
        },
        lastUsed: new Date(),
      },
    });

    return updatedCard;
  }

  /**
   * Get a single card by ID
   */
  static async getCardById(cardId: string): Promise<Card | null> {
    const card = await db.card.findUnique({
      where: { id: cardId },
    });

    return card;
  }

  /**
   * Get a card with usage statistics
   */
  static async getCardWithUsage(cardId: string): Promise<CardWithUsage | null> {
    const card = await db.card.findUnique({
      where: { id: cardId },
      include: {
        _count: {
          select: {
            attempts: true,
          },
        },
        attempts: {
          select: {
            isCorrect: true,
          },
        },
      },
    });

    if (!card) {
      return null;
    }

    const totalAttempts = card._count.attempts;
    const correctAttempts = card.attempts.filter(attempt => attempt.isCorrect).length;
    const successRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

    return {
      id: card.id,
      cardNumber: card.cardNumber,
      question: card.question,
      correctAnswer: card.correctAnswer,
      difficulty: card.difficulty,
      usageCount: card.usageCount,
      lastUsed: card.lastUsed,
      seasonId: card.seasonId,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      successRate,
      totalAttempts,
      correctAttempts,
    };
  }

  /**
   * Update an existing card
   * Requirements: 2.5 - WHEN a user edits a question THEN the system SHALL update the card content while preserving usage history
   */
  static async updateCard(data: UpdateCardInput): Promise<Card | null> {
    const existingCard = await db.card.findUnique({
      where: { id: data.id },
    });

    if (!existingCard) {
      throw new CardNotFoundError(data.id);
    }

    const updateData: { question?: string; correctAnswer?: string } = {};
    if (data.question !== undefined) updateData.question = data.question;
    if (data.correctAnswer !== undefined) updateData.correctAnswer = data.correctAnswer;

    const updatedCard = await db.card.update({
      where: { id: data.id },
      data: updateData,
    });

    return updatedCard;
  }

  /**
   * Delete a card
   */
  static async deleteCard(cardId: string): Promise<boolean> {
    const existingCard = await db.card.findUnique({
      where: { id: cardId },
    });

    if (!existingCard) {
      return false;
    }

    await db.card.delete({
      where: { id: cardId },
    });

    return true;
  }

  /**
   * Get deck status for a specific difficulty in a season
   * Requirements: 3.3 - WHEN a user views deck status THEN the system SHALL show remaining cards and usage statistics
   */
  static async getDeckStatus(seasonId: string, difficulty: Difficulty): Promise<DeckStatus> {
    const cards = await db.card.findMany({
      where: {
        seasonId,
        difficulty,
      },
      select: {
        usageCount: true,
      },
    });

    const totalCards = cards.length;
    const usedCards = cards.filter(card => card.usageCount > 0).length;
    const availableCards = totalCards - usedCards;
    const usagePercentage = totalCards > 0 ? (usedCards / totalCards) * 100 : 0;

    return {
      difficulty,
      totalCards,
      usedCards,
      availableCards,
      usagePercentage,
    };
  }

  /**
   * Get deck statuses for all difficulties in a season
   */
  static async getAllDeckStatuses(seasonId: string): Promise<DeckStatus[]> {
    const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
    
    const deckStatuses = await Promise.all(
      difficulties.map(difficulty => this.getDeckStatus(seasonId, difficulty))
    );

    return deckStatuses;
  }

  /**
   * Reset deck usage (mark all cards as unused)
   * Requirements: 3.4 - IF all cards in a deck have been used THEN the system SHALL allow reshuffling the deck
   */
  static async resetDeckUsage(seasonId: string, difficulty: Difficulty): Promise<number> {
    const result = await db.card.updateMany({
      where: {
        seasonId,
        difficulty,
      },
      data: {
        usageCount: 0,
        lastUsed: null,
      },
    });

    return result.count;
  }

  /**
   * Get cards that haven't been used yet in a deck
   */
  static async getUnusedCards(seasonId: string, difficulty: Difficulty): Promise<Card[]> {
    const cards = await db.card.findMany({
      where: {
        seasonId,
        difficulty,
        usageCount: 0,
      },
      orderBy: {
        cardNumber: 'asc',
      },
    });

    return cards;
  }

  /**
   * Get most used cards in a deck
   */
  static async getMostUsedCards(seasonId: string, difficulty: Difficulty, limit = 10): Promise<Card[]> {
    const cards = await db.card.findMany({
      where: {
        seasonId,
        difficulty,
      },
      orderBy: {
        usageCount: 'desc',
      },
      take: limit,
    });

    return cards;
  }

  /**
   * Get least used cards in a deck
   */
  static async getLeastUsedCards(seasonId: string, difficulty: Difficulty, limit = 10): Promise<Card[]> {
    const cards = await db.card.findMany({
      where: {
        seasonId,
        difficulty,
      },
      orderBy: {
        usageCount: 'asc',
      },
      take: limit,
    });

    return cards;
  }

  /**
   * Check if a card exists
   */
  static async cardExists(cardId: string): Promise<boolean> {
    const count = await db.card.count({
      where: { id: cardId },
    });
    return count > 0;
  }

  /**
   * Get total card count for a season
   */
  static async getTotalCardCount(seasonId: string): Promise<number> {
    const count = await db.card.count({
      where: { seasonId },
    });
    return count;
  }

  /**
   * Get card count by difficulty for a season
   */
  static async getCardCountByDifficulty(seasonId: string): Promise<Record<Difficulty, number>> {
    const counts = await db.card.groupBy({
      by: ['difficulty'],
      where: { seasonId },
      _count: {
        id: true,
      },
    });

    const result: Record<Difficulty, number> = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
    };

    counts.forEach(count => {
      result[count.difficulty] = count._count.id;
    });

    return result;
  }
}