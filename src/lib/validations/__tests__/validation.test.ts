import { describe, it, expect } from "vitest";
import {
  createSeasonSchema,
  updateSeasonSchema,
  createCardSchema,
  updateCardSchema,
  drawCardSchema,
  createAttemptSchema,
  cardNumberSchema,
  difficultySchema,
  DifficultySchema,
  RoleSchema,
} from "../index";
import {
  validateCardNumber,
  validateDifficulty,
  isCardNumberAvailable,
  getNextAvailableCardNumber,
  isDeckFull,
  isDeckEmpty,
  validateContestantName,
  validateQuestion,
  validateAnswer,
  validateSeasonName,
  validatePagination,
  validateCuid,
} from "../helpers";

describe("Validation Schemas", () => {
  describe("cardNumberSchema", () => {
    it("should accept valid card numbers", () => {
      expect(() => cardNumberSchema.parse(1)).not.toThrow();
      expect(() => cardNumberSchema.parse(26)).not.toThrow();
      expect(() => cardNumberSchema.parse(52)).not.toThrow();
    });

    it("should reject invalid card numbers", () => {
      expect(() => cardNumberSchema.parse(0)).toThrow();
      expect(() => cardNumberSchema.parse(53)).toThrow();
      expect(() => cardNumberSchema.parse(-1)).toThrow();
      expect(() => cardNumberSchema.parse(1.5)).toThrow();
    });
  });

  describe("difficultySchema", () => {
    it("should accept valid difficulty levels", () => {
      expect(() => difficultySchema.parse("EASY")).not.toThrow();
      expect(() => difficultySchema.parse("MEDIUM")).not.toThrow();
      expect(() => difficultySchema.parse("HARD")).not.toThrow();
    });

    it("should reject invalid difficulty levels", () => {
      expect(() => difficultySchema.parse("easy")).toThrow();
      expect(() => difficultySchema.parse("INVALID")).toThrow();
      expect(() => difficultySchema.parse("")).toThrow();
    });
  });

  describe("createSeasonSchema", () => {
    it("should accept valid season data", () => {
      const validSeason = {
        name: "Season 1",
        description: "First season of techQ's",
      };
      expect(() => createSeasonSchema.parse(validSeason)).not.toThrow();
    });

    it("should accept season without description", () => {
      const validSeason = {
        name: "Season 1",
      };
      expect(() => createSeasonSchema.parse(validSeason)).not.toThrow();
    });

    it("should reject invalid season data", () => {
      expect(() => createSeasonSchema.parse({ name: "" })).toThrow();
      expect(() => createSeasonSchema.parse({ name: "a".repeat(101) })).toThrow();
      expect(() => createSeasonSchema.parse({})).toThrow();
    });
  });

  describe("createCardSchema", () => {
    it("should accept valid card data", () => {
      const validCard = {
        seasonId: "c123456789012345678901234",
        cardNumber: 1,
        question: "What is React?",
        correctAnswer: "A JavaScript library for building user interfaces",
        difficulty: "EASY" as const,
      };
      expect(() => createCardSchema.parse(validCard)).not.toThrow();
    });

    it("should reject invalid card data", () => {
      const invalidCard = {
        seasonId: "invalid-id",
        cardNumber: 0,
        question: "",
        correctAnswer: "",
        difficulty: "INVALID",
      };
      expect(() => createCardSchema.parse(invalidCard)).toThrow();
    });
  });

  describe("createAttemptSchema", () => {
    it("should accept valid attempt data", () => {
      const validAttempt = {
        cardId: "c123456789012345678901234",
        contestantName: "John Doe",
        givenAnswer: "React is a library",
        isCorrect: true,
      };
      expect(() => createAttemptSchema.parse(validAttempt)).not.toThrow();
    });

    it("should reject invalid attempt data", () => {
      const invalidAttempt = {
        cardId: "invalid-id",
        contestantName: "",
        givenAnswer: "",
        isCorrect: "yes", // should be boolean
      };
      expect(() => createAttemptSchema.parse(invalidAttempt)).toThrow();
    });
  });
});

describe("Validation Helpers", () => {
  describe("validateCardNumber", () => {
    it("should validate correct card numbers", () => {
      expect(validateCardNumber(1)).toBe(true);
      expect(validateCardNumber(26)).toBe(true);
      expect(validateCardNumber(52)).toBe(true);
    });

    it("should reject invalid card numbers", () => {
      expect(validateCardNumber(0)).toBe(false);
      expect(validateCardNumber(53)).toBe(false);
      expect(validateCardNumber(-1)).toBe(false);
      expect(validateCardNumber(1.5)).toBe(false);
    });
  });

  describe("validateDifficulty", () => {
    it("should validate correct difficulty levels", () => {
      expect(validateDifficulty("EASY")).toBe(true);
      expect(validateDifficulty("MEDIUM")).toBe(true);
      expect(validateDifficulty("HARD")).toBe(true);
    });

    it("should reject invalid difficulty levels", () => {
      expect(validateDifficulty("easy")).toBe(false);
      expect(validateDifficulty("INVALID")).toBe(false);
      expect(validateDifficulty("")).toBe(false);
    });
  });

  describe("isCardNumberAvailable", () => {
    it("should return true for available card numbers", () => {
      const existingNumbers = [1, 3, 5];
      expect(isCardNumberAvailable(existingNumbers, 2)).toBe(true);
      expect(isCardNumberAvailable(existingNumbers, 4)).toBe(true);
    });

    it("should return false for taken card numbers", () => {
      const existingNumbers = [1, 3, 5];
      expect(isCardNumberAvailable(existingNumbers, 1)).toBe(false);
      expect(isCardNumberAvailable(existingNumbers, 3)).toBe(false);
    });

    it("should return false for invalid card numbers", () => {
      const existingNumbers = [1, 3, 5];
      expect(isCardNumberAvailable(existingNumbers, 0)).toBe(false);
      expect(isCardNumberAvailable(existingNumbers, 53)).toBe(false);
    });
  });

  describe("getNextAvailableCardNumber", () => {
    it("should return the next available card number", () => {
      const existingNumbers = [1, 3, 5];
      expect(getNextAvailableCardNumber(existingNumbers)).toBe(2);
    });

    it("should return null when deck is full", () => {
      const fullDeck = Array.from({ length: 52 }, (_, i) => i + 1);
      expect(getNextAvailableCardNumber(fullDeck)).toBe(null);
    });

    it("should return 1 for empty deck", () => {
      expect(getNextAvailableCardNumber([])).toBe(1);
    });
  });

  describe("isDeckFull", () => {
    it("should return true when deck has 52 cards", () => {
      expect(isDeckFull(52)).toBe(true);
    });

    it("should return false when deck has less than 52 cards", () => {
      expect(isDeckFull(51)).toBe(false);
      expect(isDeckFull(0)).toBe(false);
    });
  });

  describe("isDeckEmpty", () => {
    it("should return true when no cards available", () => {
      expect(isDeckEmpty(0)).toBe(true);
    });

    it("should return false when cards are available", () => {
      expect(isDeckEmpty(1)).toBe(false);
      expect(isDeckEmpty(52)).toBe(false);
    });
  });

  describe("validateContestantName", () => {
    it("should accept valid contestant names", () => {
      expect(validateContestantName("John Doe")).toBe(true);
      expect(validateContestantName("Mary-Jane")).toBe(true);
      expect(validateContestantName("O'Connor")).toBe(true);
      expect(validateContestantName("Player123")).toBe(true);
    });

    it("should reject invalid contestant names", () => {
      expect(validateContestantName("")).toBe(false);
      expect(validateContestantName("   ")).toBe(false);
      expect(validateContestantName("John@Doe")).toBe(false);
      expect(validateContestantName("John#Doe")).toBe(false);
    });
  });

  describe("validateQuestion", () => {
    it("should accept valid questions", () => {
      expect(validateQuestion("What is React?")).toBe(true);
      expect(validateQuestion("A".repeat(2000))).toBe(true);
    });

    it("should reject invalid questions", () => {
      expect(validateQuestion("")).toBe(false);
      expect(validateQuestion("   ")).toBe(false);
      expect(validateQuestion("A".repeat(2001))).toBe(false);
    });
  });

  describe("validateAnswer", () => {
    it("should accept valid answers", () => {
      expect(validateAnswer("React is a library")).toBe(true);
      expect(validateAnswer("A".repeat(1000))).toBe(true);
    });

    it("should reject invalid answers", () => {
      expect(validateAnswer("")).toBe(false);
      expect(validateAnswer("   ")).toBe(false);
      expect(validateAnswer("A".repeat(1001))).toBe(false);
    });
  });

  describe("validateSeasonName", () => {
    it("should accept valid season names", () => {
      expect(validateSeasonName("Season 1")).toBe(true);
      expect(validateSeasonName("A".repeat(100))).toBe(true);
    });

    it("should reject invalid season names", () => {
      expect(validateSeasonName("")).toBe(false);
      expect(validateSeasonName("   ")).toBe(false);
      expect(validateSeasonName("A".repeat(101))).toBe(false);
    });
  });

  describe("validatePagination", () => {
    it("should accept valid pagination parameters", () => {
      expect(validatePagination(1, 20)).toBe(true);
      expect(validatePagination(5, 100)).toBe(true);
    });

    it("should reject invalid pagination parameters", () => {
      expect(validatePagination(0, 20)).toBe(false);
      expect(validatePagination(1, 0)).toBe(false);
      expect(validatePagination(1, 101)).toBe(false);
      expect(validatePagination(1.5, 20)).toBe(false);
    });
  });

  describe("validateCuid", () => {
    it("should accept valid CUID format", () => {
      expect(validateCuid("c123456789012345678901234")).toBe(true);
      expect(validateCuid("cabcdefghijklmnopqrstuvwx")).toBe(true);
    });

    it("should reject invalid CUID format", () => {
      expect(validateCuid("123456789012345678901234")).toBe(false); // doesn't start with 'c'
      expect(validateCuid("c12345678901234567890123")).toBe(false); // too short
      expect(validateCuid("c1234567890123456789012345")).toBe(false); // too long
      expect(validateCuid("c12345678901234567890123A")).toBe(false); // contains uppercase
    });
  });
});

describe("Enum Schemas", () => {
  describe("DifficultySchema", () => {
    it("should accept valid difficulty values", () => {
      expect(() => DifficultySchema.parse("EASY")).not.toThrow();
      expect(() => DifficultySchema.parse("MEDIUM")).not.toThrow();
      expect(() => DifficultySchema.parse("HARD")).not.toThrow();
    });

    it("should reject invalid difficulty values", () => {
      expect(() => DifficultySchema.parse("easy")).toThrow();
      expect(() => DifficultySchema.parse("INVALID")).toThrow();
    });
  });

  describe("RoleSchema", () => {
    it("should accept valid role values", () => {
      expect(() => RoleSchema.parse("HOST")).not.toThrow();
      expect(() => RoleSchema.parse("PRODUCER")).not.toThrow();
      expect(() => RoleSchema.parse("ADMIN")).not.toThrow();
    });

    it("should reject invalid role values", () => {
      expect(() => RoleSchema.parse("host")).toThrow();
      expect(() => RoleSchema.parse("INVALID")).toThrow();
    });
  });
});