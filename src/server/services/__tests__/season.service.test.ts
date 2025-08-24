import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SeasonService } from '../season.service';
import { db } from '~/server/db';

// Mock the database
vi.mock('~/server/db', () => ({
  db: {
    season: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    card: {
      groupBy: vi.fn(),
    },
  },
}));

describe('SeasonService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createSeason', () => {
    it('should create a new season with provided data', async () => {
      // Arrange
      const mockSeason = {
        id: 'season-1',
        name: 'Test Season',
        description: 'Test Description',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'user-1',
      };

      const createData = {
        name: 'Test Season',
        description: 'Test Description',
      };

      vi.mocked(db.season.create).mockResolvedValue(mockSeason);

      // Act
      const result = await SeasonService.createSeason(createData, 'user-1');

      // Assert
      expect(db.season.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Season',
          description: 'Test Description',
          createdById: 'user-1',
        },
      });
      expect(result).toEqual(mockSeason);
    });

    it('should create a season without description', async () => {
      // Arrange
      const mockSeason = {
        id: 'season-1',
        name: 'Test Season',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'user-1',
      };

      const createData = {
        name: 'Test Season',
      };

      vi.mocked(db.season.create).mockResolvedValue(mockSeason);

      // Act
      const result = await SeasonService.createSeason(createData, 'user-1');

      // Assert
      expect(db.season.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Season',
          description: undefined,
          createdById: 'user-1',
        },
      });
      expect(result).toEqual(mockSeason);
    });
  });

  describe('getAllSeasonsWithStats', () => {
    it('should return all seasons with calculated statistics', async () => {
      // Arrange
      const mockSeasonsData = [
        {
          id: 'season-1',
          name: 'Season 1',
          description: 'First season',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          createdById: 'user-1',
          createdBy: {
            name: 'John Doe',
            email: 'john@example.com',
          },
          _count: {
            cards: 10,
            attempts: 25,
          },
          cards: [
            { difficulty: 'EASY' },
            { difficulty: 'EASY' },
            { difficulty: 'MEDIUM' },
            { difficulty: 'MEDIUM' },
            { difficulty: 'MEDIUM' },
            { difficulty: 'HARD' },
          ],
        },
      ];

      vi.mocked(db.season.findMany).mockResolvedValue(mockSeasonsData as any);

      // Act
      const result = await SeasonService.getAllSeasonsWithStats();

      // Assert
      expect(db.season.findMany).toHaveBeenCalledWith({
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              cards: true,
              attempts: true,
            },
          },
          cards: {
            select: {
              difficulty: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'season-1',
        name: 'Season 1',
        description: 'First season',
        createdAt: mockSeasonsData[0].createdAt,
        updatedAt: mockSeasonsData[0].updatedAt,
        createdById: 'user-1',
        totalCards: 10,
        totalAttempts: 25,
        easyDeckCount: 2,
        mediumDeckCount: 3,
        hardDeckCount: 1,
        createdBy: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      });
    });

    it('should handle empty seasons list', async () => {
      // Arrange
      vi.mocked(db.season.findMany).mockResolvedValue([]);

      // Act
      const result = await SeasonService.getAllSeasonsWithStats();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getSeasonById', () => {
    it('should return season with statistics when found', async () => {
      // Arrange
      const mockSeasonData = {
        id: 'season-1',
        name: 'Season 1',
        description: 'First season',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdById: 'user-1',
        createdBy: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        _count: {
          cards: 6,
          attempts: 15,
        },
        cards: [
          { difficulty: 'EASY' },
          { difficulty: 'EASY' },
          { difficulty: 'MEDIUM' },
          { difficulty: 'HARD' },
          { difficulty: 'HARD' },
          { difficulty: 'HARD' },
        ],
      };

      vi.mocked(db.season.findUnique).mockResolvedValue(mockSeasonData as any);

      // Act
      const result = await SeasonService.getSeasonById('season-1');

      // Assert
      expect(db.season.findUnique).toHaveBeenCalledWith({
        where: { id: 'season-1' },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              cards: true,
              attempts: true,
            },
          },
          cards: {
            select: {
              difficulty: true,
            },
          },
        },
      });

      expect(result).toEqual({
        id: 'season-1',
        name: 'Season 1',
        description: 'First season',
        createdAt: mockSeasonData.createdAt,
        updatedAt: mockSeasonData.updatedAt,
        createdById: 'user-1',
        totalCards: 6,
        totalAttempts: 15,
        easyDeckCount: 2,
        mediumDeckCount: 1,
        hardDeckCount: 3,
        createdBy: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      });
    });

    it('should return null when season not found', async () => {
      // Arrange
      vi.mocked(db.season.findUnique).mockResolvedValue(null);

      // Act
      const result = await SeasonService.getSeasonById('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateSeason', () => {
    it('should update season when it exists', async () => {
      // Arrange
      const existingSeason = {
        id: 'season-1',
        name: 'Old Name',
        description: 'Old Description',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'user-1',
      };

      const updatedSeason = {
        ...existingSeason,
        name: 'New Name',
        description: 'New Description',
        updatedAt: new Date(),
      };

      const updateData = {
        id: 'season-1',
        name: 'New Name',
        description: 'New Description',
      };

      vi.mocked(db.season.findUnique).mockResolvedValue(existingSeason);
      vi.mocked(db.season.update).mockResolvedValue(updatedSeason);

      // Act
      const result = await SeasonService.updateSeason(updateData, 'user-1');

      // Assert
      expect(db.season.findUnique).toHaveBeenCalledWith({
        where: { id: 'season-1' },
      });
      expect(db.season.update).toHaveBeenCalledWith({
        where: { id: 'season-1' },
        data: {
          name: 'New Name',
          description: 'New Description',
        },
      });
      expect(result).toEqual(updatedSeason);
    });

    it('should return null when season does not exist', async () => {
      // Arrange
      vi.mocked(db.season.findUnique).mockResolvedValue(null);

      const updateData = {
        id: 'non-existent',
        name: 'New Name',
      };

      // Act
      const result = await SeasonService.updateSeason(updateData, 'user-1');

      // Assert
      expect(result).toBeNull();
      expect(db.season.update).not.toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      // Arrange
      const existingSeason = {
        id: 'season-1',
        name: 'Old Name',
        description: 'Old Description',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'user-1',
      };

      const updatedSeason = {
        ...existingSeason,
        name: 'New Name',
        updatedAt: new Date(),
      };

      const updateData = {
        id: 'season-1',
        name: 'New Name',
      };

      vi.mocked(db.season.findUnique).mockResolvedValue(existingSeason);
      vi.mocked(db.season.update).mockResolvedValue(updatedSeason);

      // Act
      const result = await SeasonService.updateSeason(updateData, 'user-1');

      // Assert
      expect(db.season.update).toHaveBeenCalledWith({
        where: { id: 'season-1' },
        data: {
          name: 'New Name',
        },
      });
      expect(result).toEqual(updatedSeason);
    });
  });

  describe('deleteSeason', () => {
    it('should delete season when it exists', async () => {
      // Arrange
      const existingSeason = {
        id: 'season-1',
        name: 'Season to Delete',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'user-1',
      };

      vi.mocked(db.season.findUnique).mockResolvedValue(existingSeason);
      vi.mocked(db.season.delete).mockResolvedValue(existingSeason);

      // Act
      const result = await SeasonService.deleteSeason('season-1', 'user-1');

      // Assert
      expect(db.season.findUnique).toHaveBeenCalledWith({
        where: { id: 'season-1' },
      });
      expect(db.season.delete).toHaveBeenCalledWith({
        where: { id: 'season-1' },
      });
      expect(result).toBe(true);
    });

    it('should return false when season does not exist', async () => {
      // Arrange
      vi.mocked(db.season.findUnique).mockResolvedValue(null);

      // Act
      const result = await SeasonService.deleteSeason('non-existent', 'user-1');

      // Assert
      expect(result).toBe(false);
      expect(db.season.delete).not.toHaveBeenCalled();
    });
  });

  describe('getSeasonDeckStats', () => {
    it('should return deck statistics for all difficulty levels', async () => {
      // Arrange
      const mockGroupByResult = [
        {
          difficulty: 'EASY',
          _count: { id: 5 },
          _sum: { usageCount: 15 },
        },
        {
          difficulty: 'MEDIUM',
          _count: { id: 3 },
          _sum: { usageCount: 9 },
        },
        // HARD difficulty has no cards
      ];

      vi.mocked(db.card.groupBy).mockResolvedValue(mockGroupByResult as any);

      // Act
      const result = await SeasonService.getSeasonDeckStats('season-1');

      // Assert
      expect(db.card.groupBy).toHaveBeenCalledWith({
        by: ['difficulty'],
        where: {
          seasonId: 'season-1',
        },
        _count: {
          id: true,
        },
        _sum: {
          usageCount: true,
        },
      });

      expect(result).toEqual([
        {
          difficulty: 'EASY',
          totalCards: 5,
          totalUsage: 15,
          averageUsage: 3,
        },
        {
          difficulty: 'MEDIUM',
          totalCards: 3,
          totalUsage: 9,
          averageUsage: 3,
        },
        {
          difficulty: 'HARD',
          totalCards: 0,
          totalUsage: 0,
          averageUsage: 0,
        },
      ]);
    });
  });

  describe('seasonExists', () => {
    it('should return true when season exists', async () => {
      // Arrange
      vi.mocked(db.season.count).mockResolvedValue(1);

      // Act
      const result = await SeasonService.seasonExists('season-1');

      // Assert
      expect(db.season.count).toHaveBeenCalledWith({
        where: { id: 'season-1' },
      });
      expect(result).toBe(true);
    });

    it('should return false when season does not exist', async () => {
      // Arrange
      vi.mocked(db.season.count).mockResolvedValue(0);

      // Act
      const result = await SeasonService.seasonExists('non-existent');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getSeasonsByUser', () => {
    it('should return seasons created by specific user', async () => {
      // Arrange
      const mockSeasonsData = [
        {
          id: 'season-1',
          name: 'User Season 1',
          description: 'First user season',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          createdById: 'user-1',
          createdBy: {
            name: 'John Doe',
            email: 'john@example.com',
          },
          _count: {
            cards: 4,
            attempts: 8,
          },
          cards: [
            { difficulty: 'EASY' },
            { difficulty: 'MEDIUM' },
            { difficulty: 'MEDIUM' },
            { difficulty: 'HARD' },
          ],
        },
      ];

      vi.mocked(db.season.findMany).mockResolvedValue(mockSeasonsData as any);

      // Act
      const result = await SeasonService.getSeasonsByUser('user-1');

      // Assert
      expect(db.season.findMany).toHaveBeenCalledWith({
        where: {
          createdById: 'user-1',
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              cards: true,
              attempts: true,
            },
          },
          cards: {
            select: {
              difficulty: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'season-1',
        name: 'User Season 1',
        description: 'First user season',
        createdAt: mockSeasonsData[0].createdAt,
        updatedAt: mockSeasonsData[0].updatedAt,
        createdById: 'user-1',
        totalCards: 4,
        totalAttempts: 8,
        easyDeckCount: 1,
        mediumDeckCount: 2,
        hardDeckCount: 1,
        createdBy: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      });
    });
  });
});