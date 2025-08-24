import { db } from "~/server/db";
import type { 
  CreateSeasonInput, 
  UpdateSeasonInput,
  Difficulty 
} from "~/lib/validations";
import type { 
  Season,
  SeasonWithStats,
  SeasonWithCreator
} from "~/lib/types";

/**
 * Season Service
 * Handles CRUD operations for seasons and provides statistics calculations
 */
export class SeasonService {
  /**
   * Create a new season with empty deck initialization
   * Requirements: 1.1 - WHEN a user creates a new season THEN the system SHALL create three new card decks
   */
  static async createSeason(
    data: CreateSeasonInput,
    createdById: string
  ): Promise<Season> {
    const season = await db.season.create({
      data: {
        name: data.name,
        description: data.description,
        createdById,
      },
    });

    return season;
  }

  /**
   * Get all seasons with statistics
   * Requirements: 1.2 - WHEN a user views seasons THEN the system SHALL display all available seasons with their creation dates and card counts
   */
  static async getAllSeasonsWithStats(): Promise<SeasonWithStats[]> {
    const seasons = await db.season.findMany({
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

    return seasons.map((season) => {
      const easyDeckCount = season.cards.filter(card => card.difficulty === 'EASY').length;
      const mediumDeckCount = season.cards.filter(card => card.difficulty === 'MEDIUM').length;
      const hardDeckCount = season.cards.filter(card => card.difficulty === 'HARD').length;

      return {
        id: season.id,
        name: season.name,
        description: season.description,
        createdAt: season.createdAt,
        updatedAt: season.updatedAt,
        createdById: season.createdById,
        totalCards: season._count.cards,
        totalAttempts: season._count.attempts,
        easyDeckCount,
        mediumDeckCount,
        hardDeckCount,
        createdBy: season.createdBy,
      };
    });
  }

  /**
   * Get a single season by ID with statistics
   * Requirements: 1.3 - WHEN a user selects a season THEN the system SHALL show the three difficulty-level decks for that season
   */
  static async getSeasonById(id: string): Promise<SeasonWithStats | null> {
    const season = await db.season.findUnique({
      where: { id },
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

    if (!season) {
      return null;
    }

    const easyDeckCount = season.cards.filter(card => card.difficulty === 'EASY').length;
    const mediumDeckCount = season.cards.filter(card => card.difficulty === 'MEDIUM').length;
    const hardDeckCount = season.cards.filter(card => card.difficulty === 'HARD').length;

    return {
      id: season.id,
      name: season.name,
      description: season.description,
      createdAt: season.createdAt,
      updatedAt: season.updatedAt,
      createdById: season.createdById,
      totalCards: season._count.cards,
      totalAttempts: season._count.attempts,
      easyDeckCount,
      mediumDeckCount,
      hardDeckCount,
      createdBy: season.createdBy,
    };
  }

  /**
   * Get a season with creator information (without stats for lighter queries)
   */
  static async getSeasonWithCreator(id: string): Promise<SeasonWithCreator | null> {
    const season = await db.season.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return season;
  }

  /**
   * Update an existing season
   */
  static async updateSeason(
    data: UpdateSeasonInput,
    userId: string
  ): Promise<Season | null> {
    // First check if the season exists and user has permission
    const existingSeason = await db.season.findUnique({
      where: { id: data.id },
    });

    if (!existingSeason) {
      return null;
    }

    // For now, allow any authenticated user to update
    // In production, you might want to check if userId === existingSeason.createdById
    // or implement role-based permissions

    const updateData: { name?: string; description?: string } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    const updatedSeason = await db.season.update({
      where: { id: data.id },
      data: updateData,
    });

    return updatedSeason;
  }

  /**
   * Delete a season and all associated data
   */
  static async deleteSeason(id: string, userId: string): Promise<boolean> {
    // First check if the season exists
    const existingSeason = await db.season.findUnique({
      where: { id },
    });

    if (!existingSeason) {
      return false;
    }

    // For now, allow any authenticated user to delete
    // In production, you might want to check permissions

    await db.season.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Get deck statistics for a specific season
   * Returns card counts and usage statistics for each difficulty level
   */
  static async getSeasonDeckStats(seasonId: string) {
    const deckStats = await db.card.groupBy({
      by: ['difficulty'],
      where: {
        seasonId,
      },
      _count: {
        id: true,
      },
      _sum: {
        usageCount: true,
      },
    });

    const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
    
    return difficulties.map((difficulty) => {
      const stat = deckStats.find(s => s.difficulty === difficulty);
      return {
        difficulty,
        totalCards: stat?._count.id ?? 0,
        totalUsage: stat?._sum.usageCount ?? 0,
        averageUsage: stat?._count.id ? (stat._sum.usageCount ?? 0) / stat._count.id : 0,
      };
    });
  }

  /**
   * Check if a season exists
   */
  static async seasonExists(id: string): Promise<boolean> {
    const count = await db.season.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Get seasons created by a specific user
   */
  static async getSeasonsByUser(userId: string): Promise<SeasonWithStats[]> {
    const seasons = await db.season.findMany({
      where: {
        createdById: userId,
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

    return seasons.map((season) => {
      const easyDeckCount = season.cards.filter(card => card.difficulty === 'EASY').length;
      const mediumDeckCount = season.cards.filter(card => card.difficulty === 'MEDIUM').length;
      const hardDeckCount = season.cards.filter(card => card.difficulty === 'HARD').length;

      return {
        id: season.id,
        name: season.name,
        description: season.description,
        createdAt: season.createdAt,
        updatedAt: season.updatedAt,
        createdById: season.createdById,
        totalCards: season._count.cards,
        totalAttempts: season._count.attempts,
        easyDeckCount,
        mediumDeckCount,
        hardDeckCount,
        createdBy: season.createdBy,
      };
    });
  }
}