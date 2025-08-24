import { db } from "~/server/db";
import type { Difficulty } from "~/lib/validations";

/**
 * User Statistics Service
 * Handles personalized user statistics and progress tracking
 */
export class UserStatsService {
  /**
   * Get comprehensive user statistics for personalized landing page
   */
  static async getUserStats(userId: string): Promise<{
    totalAttempts: number;
    correctAttempts: number;
    successRate: number;
    seasonsParticipated: number;
    recentActivity: {
      date: string;
      attempts: number;
      successRate: number;
    }[];
    difficultyBreakdown: {
      difficulty: Difficulty;
      attempts: number;
      correct: number;
      successRate: number;
    }[];
    difficultyPerformance: {
      difficulty: string;
      attempts: number;
      successRate: number;
    }[];
    streakInfo: {
      currentStreak: number;
      longestStreak: number;
      lastAttemptDate: Date | null;
    };
  } | null> {
    try {
      // Get all user attempts with card information
      const attempts = await db.attempt.findMany({
        where: { 
          // Note: We need to add userId to attempts table or find another way to link
          // For now, we'll use contestantName as a proxy (this should be improved)
          contestantName: userId // This is a temporary solution
        },
        include: {
          card: {
            select: {
              difficulty: true,
            },
          },
        },
        orderBy: {
          attemptedAt: 'desc',
        },
      });

      if (attempts.length === 0) {
        return null;
      }

      // Basic statistics
      const totalAttempts = attempts.length;
      const correctAttempts = attempts.filter(attempt => attempt.isCorrect).length;
      const successRate = Math.round((correctAttempts / totalAttempts) * 100 * 100) / 100;

      // Count unique seasons
      const seasonsParticipated = new Set(attempts.map(attempt => attempt.seasonId)).size;

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentAttempts = attempts.filter(attempt => attempt.attemptedAt >= sevenDaysAgo);
      
      // Group recent attempts by date
      const dailyGroups: Record<string, typeof recentAttempts> = {};
      recentAttempts.forEach(attempt => {
        const dateKey = attempt.attemptedAt.toISOString().split('T')[0]!;
        if (!dailyGroups[dateKey]) {
          dailyGroups[dateKey] = [];
        }
        dailyGroups[dateKey]!.push(attempt);
      });

      const recentActivity = Object.entries(dailyGroups)
        .map(([date, dayAttempts]) => ({
          date,
          attempts: dayAttempts.length,
          successRate: Math.round((dayAttempts.filter(a => a.isCorrect).length / dayAttempts.length) * 100 * 100) / 100,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7); // Last 7 days

      // Difficulty breakdown
      const difficultyStats: Record<Difficulty, { attempts: number; correct: number }> = {
        EASY: { attempts: 0, correct: 0 },
        MEDIUM: { attempts: 0, correct: 0 },
        HARD: { attempts: 0, correct: 0 },
      };

      attempts.forEach(attempt => {
        const difficulty = attempt.card.difficulty;
        difficultyStats[difficulty].attempts++;
        if (attempt.isCorrect) {
          difficultyStats[difficulty].correct++;
        }
      });

      const difficultyBreakdown = Object.entries(difficultyStats).map(([difficulty, stats]) => ({
        difficulty: difficulty as Difficulty,
        attempts: stats.attempts,
        correct: stats.correct,
        successRate: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100 * 100) / 100 : 0,
      }));

      // Difficulty performance (grouped by difficulty level)
      const performanceStats: Record<string, { attempts: number; correct: number }> = {};
      attempts.forEach(attempt => {
        const difficulty = attempt.card.difficulty;
        if (!performanceStats[difficulty]) {
          performanceStats[difficulty] = { attempts: 0, correct: 0 };
        }
        performanceStats[difficulty].attempts++;
        if (attempt.isCorrect) {
          performanceStats[difficulty].correct++;
        }
      });

      const difficultyPerformance = Object.entries(performanceStats)
        .map(([difficulty, stats]) => ({
          difficulty,
          attempts: stats.attempts,
          successRate: Math.round((stats.correct / stats.attempts) * 100 * 100) / 100,
        }))
        .sort((a, b) => b.attempts - a.attempts)
        .slice(0, 5);

      // Streak calculation (consecutive correct answers)
      const sortedAttempts = [...attempts].sort((a, b) => 
        a.attemptedAt.getTime() - b.attemptedAt.getTime()
      );

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      // Calculate streaks from most recent backwards
      const reversedAttempts = [...sortedAttempts].reverse();
      let streakBroken = false;

      for (const attempt of reversedAttempts) {
        if (attempt.isCorrect) {
          if (!streakBroken) {
            currentStreak++;
          }
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          if (!streakBroken) {
            streakBroken = true;
          }
          tempStreak = 0;
        }
      }

      const streakInfo = {
        currentStreak,
        longestStreak,
        lastAttemptDate: attempts[0]?.attemptedAt || null,
      };

      return {
        totalAttempts,
        correctAttempts,
        successRate,
        seasonsParticipated,
        recentActivity,
        difficultyBreakdown,
        difficultyPerformance,
        streakInfo,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  /**
   * Get user's recent achievements and milestones
   */
  static async getUserAchievements(userId: string): Promise<{
    recentMilestones: {
      type: 'attempts' | 'streak' | 'success_rate' | 'season_complete';
      title: string;
      description: string;
      achievedAt: Date;
      value: number;
    }[];
    nextGoals: {
      type: 'attempts' | 'streak' | 'success_rate';
      title: string;
      description: string;
      current: number;
      target: number;
      progress: number; // percentage
    }[];
  }> {
    try {
      const stats = await this.getUserStats(userId);
      
      if (!stats) {
        return { recentMilestones: [], nextGoals: [] };
      }

      // Calculate recent milestones (this is a simplified version)
      const recentMilestones = [];
      
      // Attempt milestones
      if (stats.totalAttempts >= 100 && stats.totalAttempts < 150) {
        recentMilestones.push({
          type: 'attempts' as const,
          title: 'Century Club',
          description: 'Completed 100 attempts',
          achievedAt: new Date(), // This should be calculated based on actual data
          value: 100,
        });
      }

      // Streak milestones
      if (stats.streakInfo.currentStreak >= 10) {
        recentMilestones.push({
          type: 'streak' as const,
          title: 'On Fire!',
          description: `${stats.streakInfo.currentStreak} correct answers in a row`,
          achievedAt: new Date(),
          value: stats.streakInfo.currentStreak,
        });
      }

      // Success rate milestones
      if (stats.successRate >= 80) {
        recentMilestones.push({
          type: 'success_rate' as const,
          title: 'Expert Level',
          description: `Achieved ${stats.successRate}% success rate`,
          achievedAt: new Date(),
          value: stats.successRate,
        });
      }

      // Calculate next goals
      const nextGoals = [];

      // Next attempt milestone
      const nextAttemptTarget = Math.ceil(stats.totalAttempts / 50) * 50 + 50;
      nextGoals.push({
        type: 'attempts' as const,
        title: `${nextAttemptTarget} Attempts`,
        description: `Complete ${nextAttemptTarget} total attempts`,
        current: stats.totalAttempts,
        target: nextAttemptTarget,
        progress: Math.round((stats.totalAttempts / nextAttemptTarget) * 100),
      });

      // Streak goal
      const nextStreakTarget = Math.max(10, stats.streakInfo.longestStreak + 5);
      nextGoals.push({
        type: 'streak' as const,
        title: `${nextStreakTarget} Streak`,
        description: `Get ${nextStreakTarget} correct answers in a row`,
        current: stats.streakInfo.currentStreak,
        target: nextStreakTarget,
        progress: Math.round((stats.streakInfo.currentStreak / nextStreakTarget) * 100),
      });

      // Success rate goal (if below 90%)
      if (stats.successRate < 90) {
        const nextSuccessTarget = Math.min(90, Math.ceil(stats.successRate / 10) * 10 + 10);
        nextGoals.push({
          type: 'success_rate' as const,
          title: `${nextSuccessTarget}% Success Rate`,
          description: `Achieve ${nextSuccessTarget}% overall success rate`,
          current: stats.successRate,
          target: nextSuccessTarget,
          progress: Math.round((stats.successRate / nextSuccessTarget) * 100),
        });
      }

      return {
        recentMilestones: recentMilestones.slice(0, 3), // Show top 3
        nextGoals: nextGoals.slice(0, 3), // Show top 3
      };
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return { recentMilestones: [], nextGoals: [] };
    }
  }

  /**
   * Get user's learning recommendations based on performance
   */
  static async getUserRecommendations(userId: string): Promise<{
    focusAreas: {
      difficulty: Difficulty;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }[];
    suggestedCategories: {
      category: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }[];
    studyTips: string[];
  }> {
    try {
      const stats = await this.getUserStats(userId);
      
      if (!stats) {
        return { focusAreas: [], suggestedCategories: [], studyTips: [] };
      }

      const focusAreas: Array<{
        difficulty: Difficulty;
        reason: string;
        priority: 'high' | 'medium' | 'low';
      }> = [];
      const suggestedCategories: Array<{
        category: string;
        reason: string;
        priority: 'high' | 'medium' | 'low';
      }> = [];
      const studyTips: string[] = [];

      // Analyze difficulty performance
      stats.difficultyBreakdown.forEach(diff => {
        if (diff.attempts > 0 && diff.successRate < 60) {
          focusAreas.push({
            difficulty: diff.difficulty,
            reason: `Success rate of ${diff.successRate}% needs improvement`,
            priority: diff.successRate < 40 ? 'high' as const : 'medium' as const,
          });
        }
      });

      // Analyze difficulty performance
      stats.difficultyPerformance.forEach(diff => {
        if (diff.attempts > 5 && diff.successRate < 70) {
          suggestedCategories.push({
            category: diff.difficulty,
            reason: `${diff.successRate}% success rate in ${diff.difficulty} difficulty`,
            priority: diff.successRate < 50 ? 'high' as const : 'medium' as const,
          });
        }
      });

      // Generate study tips based on performance
      if (stats.successRate < 70) {
        studyTips.push("Focus on understanding concepts rather than memorizing answers");
        studyTips.push("Review incorrect answers to identify knowledge gaps");
      }

      if (stats.streakInfo.currentStreak < 5) {
        studyTips.push("Take your time with each question to build consistency");
      }

      if (stats.recentActivity.length < 3) {
        studyTips.push("Try to practice regularly to maintain momentum");
      }

      // Default tips if performance is good
      if (studyTips.length === 0) {
        studyTips.push("Great job! Keep challenging yourself with harder questions");
        studyTips.push("Consider exploring new categories to broaden your knowledge");
      }

      return {
        focusAreas: focusAreas.slice(0, 3),
        suggestedCategories: suggestedCategories.slice(0, 3),
        studyTips: studyTips.slice(0, 3),
      };
    } catch (error) {
      console.error('Error generating user recommendations:', error);
      return { focusAreas: [], suggestedCategories: [], studyTips: [] };
    }
  }
}