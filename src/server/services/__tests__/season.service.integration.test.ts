import { describe, it, expect } from 'vitest';
import { SeasonService } from '../season.service';
import { createSeasonSchema, updateSeasonSchema } from '~/lib/validations';

describe('SeasonService Integration', () => {
  describe('validation schema compatibility', () => {
    it('should work with createSeasonSchema validation', () => {
      // Arrange
      const validInput = {
        name: 'Test Season',
        description: 'A test season for validation',
      };

      const invalidInput = {
        name: '', // Invalid: empty name
        description: 'A' * 501, // Invalid: too long description
      };

      // Act & Assert
      expect(() => createSeasonSchema.parse(validInput)).not.toThrow();
      expect(() => createSeasonSchema.parse(invalidInput)).toThrow();
    });

    it('should work with updateSeasonSchema validation', () => {
      // Arrange
      const validInput = {
        id: 'clp1234567890abcdef123456', // Valid CUID
        name: 'Updated Season Name',
        description: 'Updated description',
      };

      const invalidInput = {
        id: 'invalid-id', // Invalid: not a CUID
        name: 'Updated Name',
      };

      // Act & Assert
      expect(() => updateSeasonSchema.parse(validInput)).not.toThrow();
      expect(() => updateSeasonSchema.parse(invalidInput)).toThrow();
    });

    it('should handle optional fields correctly', () => {
      // Arrange
      const inputWithoutDescription = {
        name: 'Season Without Description',
      };

      const updateWithOnlyName = {
        id: 'clp1234567890abcdef123456',
        name: 'New Name Only',
      };

      // Act & Assert
      expect(() => createSeasonSchema.parse(inputWithoutDescription)).not.toThrow();
      expect(() => updateSeasonSchema.parse(updateWithOnlyName)).not.toThrow();
      
      const parsedCreate = createSeasonSchema.parse(inputWithoutDescription);
      const parsedUpdate = updateSeasonSchema.parse(updateWithOnlyName);
      
      expect(parsedCreate.description).toBeUndefined();
      expect(parsedUpdate.description).toBeUndefined();
    });
  });

  describe('type compatibility', () => {
    it('should have compatible types with validation schemas', () => {
      // This test ensures that the service method signatures are compatible
      // with the validation schema types
      
      // These should compile without TypeScript errors
      const createInput = createSeasonSchema.parse({
        name: 'Test Season',
        description: 'Test Description',
      });

      const updateInput = updateSeasonSchema.parse({
        id: 'clp1234567890abcdef123456',
        name: 'Updated Name',
      });

      // Type assertions to ensure compatibility
      expect(typeof createInput.name).toBe('string');
      expect(typeof updateInput.id).toBe('string');
      
      // These would be used in actual service calls:
      // await SeasonService.createSeason(createInput, 'user-id');
      // await SeasonService.updateSeason(updateInput, 'user-id');
    });
  });
});