import { z } from "zod";
import type { Difficulty } from "./index";

/**
 * Validates card numbers to ensure they are within the valid range (1-52)
 */
export const validateCardNumber = (cardNumber: number): boolean => {
  return Number.isInteger(cardNumber) && cardNumber >= 1 && cardNumber <= 52;
};

/**
 * Validates difficulty levels
 */
export const validateDifficulty = (difficulty: string): difficulty is Difficulty => {
  return ["EASY", "MEDIUM", "HARD"].includes(difficulty);
};

/**
 * Checks if a card number is available in a specific deck
 * @param existingCardNumbers - Array of card numbers already used in the deck
 * @param cardNumber - The card number to check
 */
export const isCardNumberAvailable = (
  existingCardNumbers: number[],
  cardNumber: number,
): boolean => {
  return validateCardNumber(cardNumber) && !existingCardNumbers.includes(cardNumber);
};

/**
 * Gets the next available card number in a deck
 * @param existingCardNumbers - Array of card numbers already used in the deck
 * @returns The next available card number, or null if deck is full
 */
export const getNextAvailableCardNumber = (existingCardNumbers: number[]): number | null => {
  for (let i = 1; i <= 52; i++) {
    if (!existingCardNumbers.includes(i)) {
      return i;
    }
  }
  return null; // Deck is full
};

/**
 * Validates that a deck is not full (has less than 52 cards)
 */
export const isDeckFull = (cardCount: number): boolean => {
  return cardCount >= 52;
};

/**
 * Validates that a deck has cards available for drawing
 */
export const isDeckEmpty = (availableCardCount: number): boolean => {
  return availableCardCount <= 0;
};

/**
 * Custom Zod refinement for card number validation
 */
export const cardNumberRefinement = z.number().refine(validateCardNumber, {
  message: "Card number must be between 1 and 52",
});

/**
 * Custom Zod refinement for difficulty validation
 */
export const difficultyRefinement = z.string().refine(validateDifficulty, {
  message: "Difficulty must be EASY, MEDIUM, or HARD",
});

/**
 * Validates contestant name format
 */
export const validateContestantName = (name: string): boolean => {
  // Allow letters, numbers, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z0-9\s\-']+$/;
  return nameRegex.test(name.trim()) && name.trim().length > 0;
};

/**
 * Custom Zod refinement for contestant name validation
 */
export const contestantNameRefinement = z.string().refine(validateContestantName, {
  message: "Contestant name can only contain letters, numbers, spaces, hyphens, and apostrophes",
});

/**
 * Validates that a question is not empty and has reasonable length
 */
export const validateQuestion = (question: string): boolean => {
  const trimmed = question.trim();
  return trimmed.length > 0 && trimmed.length <= 2000;
};

/**
 * Validates that an answer is not empty and has reasonable length
 */
export const validateAnswer = (answer: string): boolean => {
  const trimmed = answer.trim();
  return trimmed.length > 0 && trimmed.length <= 1000;
};

/**
 * Validates season name format
 */
export const validateSeasonName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 100;
};

/**
 * Validates pagination parameters
 */
export const validatePagination = (page: number, limit: number): boolean => {
  return (
    Number.isInteger(page) &&
    Number.isInteger(limit) &&
    page >= 1 &&
    limit >= 1 &&
    limit <= 100
  );
};

/**
 * Sanitizes string input by trimming whitespace
 */
export const sanitizeString = (input: string): string => {
  return input.trim();
};

/**
 * Validates CUID format
 */
export const validateCuid = (id: string): boolean => {
  // Basic CUID validation - starts with 'c' and has 25 characters total
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return cuidRegex.test(id);
};

/**
 * Custom error messages for common validation scenarios
 */
export const ValidationMessages = {
  CARD_NUMBER_INVALID: "Card number must be between 1 and 52",
  CARD_NUMBER_TAKEN: "This card number is already used in this deck",
  DECK_FULL: "This deck is full (52 cards maximum)",
  DECK_EMPTY: "No cards available to draw from this deck",
  DIFFICULTY_INVALID: "Difficulty must be EASY, MEDIUM, or HARD",
  CONTESTANT_NAME_INVALID: "Contestant name contains invalid characters",
  QUESTION_EMPTY: "Question cannot be empty",
  QUESTION_TOO_LONG: "Question must be less than 2000 characters",
  ANSWER_EMPTY: "Answer cannot be empty",
  ANSWER_TOO_LONG: "Answer must be less than 1000 characters",
  SEASON_NAME_EMPTY: "Season name cannot be empty",
  SEASON_NAME_TOO_LONG: "Season name must be less than 100 characters",
  INVALID_ID: "Invalid ID format",
  PAGINATION_INVALID: "Invalid pagination parameters",
} as const;