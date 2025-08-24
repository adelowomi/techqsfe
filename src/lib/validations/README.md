# Digital Card Deck System - Validation Schemas

This directory contains comprehensive validation schemas and TypeScript interfaces for the techQ's Digital Card Deck System.

## Overview

The validation system ensures data integrity and type safety across the application by providing:

- **Zod schemas** for runtime validation of API inputs
- **TypeScript interfaces** for compile-time type checking
- **Validation helpers** for business logic validation
- **Comprehensive test coverage** to ensure reliability

## Files Structure

```
src/lib/validations/
├── index.ts              # Main validation schemas and type exports
├── helpers.ts            # Validation helper functions and business logic
├── examples.ts           # Usage examples and middleware
├── README.md            # This documentation
└── __tests__/
    └── validation.test.ts # Comprehensive test suite
```

## Core Validation Schemas

### Season Schemas
- `createSeasonSchema` - Validates season creation input
- `updateSeasonSchema` - Validates season update input
- `seasonIdSchema` - Validates season ID parameter

### Card Schemas
- `createCardSchema` - Validates card creation with question, answer, and difficulty
- `updateCardSchema` - Validates card updates
- `drawCardSchema` - Validates card drawing requests
- `getCardsByDeckSchema` - Validates deck viewing with pagination

### Attempt Schemas
- `createAttemptSchema` - Validates contestant attempt recording
- `getAttemptHistorySchema` - Validates attempt history queries

### Analytics Schemas
- `getSeasonStatsSchema` - Validates season statistics requests
- `getCardUsageSchema` - Validates card usage analytics
- `getContestantPerformanceSchema` - Validates performance analytics

## Validation Helpers

### Card Number Validation
- `validateCardNumber(number)` - Ensures card numbers are 1-52
- `isCardNumberAvailable(existing, number)` - Checks availability
- `getNextAvailableCardNumber(existing)` - Auto-assigns next number
- `isDeckFull(count)` - Checks if deck has reached 52 cards

### Difficulty Level Validation
- `validateDifficulty(level)` - Ensures valid difficulty (EASY/MEDIUM/HARD)
- `difficultyRefinement` - Zod refinement for difficulty validation

### Business Logic Helpers
- `validateContestantName(name)` - Validates contestant name format
- `validateQuestion(text)` - Ensures question meets requirements
- `validateAnswer(text)` - Ensures answer meets requirements
- `isDeckEmpty(count)` - Checks if deck has no available cards

## TypeScript Interfaces

### Core Entity Types
- `Season`, `SeasonWithStats`, `SeasonWithCreator`
- `Card`, `CardWithUsage`, `CardWithSeason`
- `Attempt`, `AttemptWithCard`, `AttemptWithDetails`

### Analytics Types
- `SeasonStats` - Comprehensive season analytics
- `CardUsageStats` - Individual card usage metrics
- `ContestantPerformance` - Contestant performance analytics
- `DeckStatus` - Deck availability and usage status

### Component Props Types
- UI component prop interfaces for type-safe React components
- Form input types for consistent data handling
- API response types for predictable data structures

## Requirements Coverage

This validation system addresses the following requirements:

### Requirement 2.1 & 2.2 (Card Management)
- ✅ Validates question text, correct answer, and difficulty level
- ✅ Enforces card number constraints (1-52)
- ✅ Prevents duplicate card numbers in same deck
- ✅ Validates deck capacity (max 52 cards)

### Requirement 4.1 (Attempt Tracking)
- ✅ Validates contestant name, answer, and correctness
- ✅ Ensures proper card and season associations
- ✅ Validates attempt recording data integrity

## Usage Examples

### Basic Validation
```typescript
import { createCardSchema, validateCardNumber } from '@/lib/validations';

// Validate card creation input
const cardData = createCardSchema.parse(userInput);

// Check card number validity
if (!validateCardNumber(cardNumber)) {
  throw new Error('Invalid card number');
}
```

### Business Logic Validation
```typescript
import { 
  getNextAvailableCardNumber, 
  isDeckFull, 
  ValidationMessages 
} from '@/lib/validations';

// Auto-assign next available card number
const nextNumber = getNextAvailableCardNumber(existingNumbers);
if (nextNumber === null) {
  throw new Error(ValidationMessages.DECK_FULL);
}
```

### Safe Parsing with Error Handling
```typescript
import { createSeasonSchema } from '@/lib/validations';

const result = createSeasonSchema.safeParse(input);
if (!result.success) {
  // Handle validation errors
  console.error(result.error.errors);
}
```

## Testing

The validation system includes comprehensive tests covering:

- ✅ All validation schemas with valid and invalid inputs
- ✅ All helper functions with edge cases
- ✅ Business logic validation scenarios
- ✅ Error message accuracy
- ✅ Type inference correctness

Run tests with:
```bash
pnpm test:run
```

## Integration

These validation schemas are designed to integrate seamlessly with:

- **tRPC procedures** for API endpoint validation
- **React Hook Form** for client-side form validation
- **Prisma operations** for database input validation
- **Next.js API routes** for server-side validation

The schemas provide both runtime safety and excellent TypeScript developer experience with full type inference and autocompletion.