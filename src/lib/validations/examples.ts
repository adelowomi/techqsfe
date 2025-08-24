/**
 * Example usage of validation schemas and helpers
 * This file demonstrates how to use the validation schemas in your application
 */

import {
  createSeasonSchema,
  createCardSchema,
  createAttemptSchema,
  drawCardSchema,
  validateCardNumber,
  validateDifficulty,
  getNextAvailableCardNumber,
  isDeckFull,
  ValidationMessages,
  type CreateSeasonInput,
  type CreateCardInput,
  type CreateAttemptInput,
} from "./index";

// Example: Validating season creation input
export function validateSeasonCreation(input: unknown): CreateSeasonInput {
  try {
    return createSeasonSchema.parse(input);
  } catch (error) {
    console.error("Season validation failed:", error);
    throw new Error("Invalid season data");
  }
}

// Example: Validating card creation with business logic
export function validateCardCreation(
  input: unknown,
  existingCardNumbers: number[],
): CreateCardInput {
  // First validate the basic schema
  const cardData = createCardSchema.parse(input);

  // Then apply business logic validation
  if (!validateCardNumber(cardData.cardNumber)) {
    throw new Error(ValidationMessages.CARD_NUMBER_INVALID);
  }

  if (existingCardNumbers.includes(cardData.cardNumber)) {
    throw new Error(ValidationMessages.CARD_NUMBER_TAKEN);
  }

  if (isDeckFull(existingCardNumbers.length)) {
    throw new Error(ValidationMessages.DECK_FULL);
  }

  return cardData;
}

// Example: Auto-assigning card numbers
export function createCardWithAutoNumber(
  input: Omit<CreateCardInput, "cardNumber">,
  existingCardNumbers: number[],
): CreateCardInput {
  const nextCardNumber = getNextAvailableCardNumber(existingCardNumbers);

  if (nextCardNumber === null) {
    throw new Error(ValidationMessages.DECK_FULL);
  }

  return {
    ...input,
    cardNumber: nextCardNumber,
  };
}

// Example: Validating attempt recording
export function validateAttemptRecording(input: unknown): CreateAttemptInput {
  return createAttemptSchema.parse(input);
}

// Example: Validating card drawing request
export function validateCardDrawing(input: unknown) {
  const drawRequest = drawCardSchema.parse(input);

  if (!validateDifficulty(drawRequest.difficulty)) {
    throw new Error(ValidationMessages.DIFFICULTY_INVALID);
  }

  return drawRequest;
}

// Example: Batch validation for multiple cards
export function validateMultipleCards(
  cards: unknown[],
  existingCardNumbers: number[],
): CreateCardInput[] {
  const validatedCards: CreateCardInput[] = [];
  const usedNumbers = [...existingCardNumbers];

  for (const card of cards) {
    try {
      const validatedCard = validateCardCreation(card, usedNumbers);
      validatedCards.push(validatedCard);
      usedNumbers.push(validatedCard.cardNumber);
    } catch (error) {
      console.error(`Card validation failed:`, error);
      throw error;
    }
  }

  return validatedCards;
}

// Example: Safe parsing with error handling
export function safeParseSeasonInput(input: unknown) {
  const result = createSeasonSchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      errors: result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    };
  }
}

// Example: Validation middleware for API routes
export function createValidationMiddleware<T>(schema: any) {
  return (input: unknown): T => {
    try {
      return schema.parse(input);
    } catch (error) {
      throw new Error(`Validation failed: ${error}`);
    }
  };
}

// Pre-configured validation middleware instances
export const validateSeasonInput = createValidationMiddleware<CreateSeasonInput>(createSeasonSchema);
export const validateCardInput = createValidationMiddleware<CreateCardInput>(createCardSchema);
export const validateAttemptInput = createValidationMiddleware<CreateAttemptInput>(createAttemptSchema);