import type { Difficulty, Role } from "../validations";

export type { Difficulty, Role };

// Base entity types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// User types
export interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  role: Role;
}

// Season types
export interface Season extends BaseEntity {
  name: string;
  description: string | null;
  createdById: string;
}

export interface SeasonWithStats extends Season {
  totalCards: number;
  totalAttempts: number;
  easyDeckCount: number;
  mediumDeckCount: number;
  hardDeckCount: number;
  createdBy: {
    name: string | null;
    email: string | null;
  };
}

export interface SeasonWithCreator extends Season {
  createdBy: {
    name: string | null;
    email: string | null;
  };
}

// Card types
export interface Card extends BaseEntity {
  cardNumber: number;
  question: string;
  correctAnswer: string;
  difficulty: Difficulty;
  usageCount: number;
  lastUsed: Date | null;
  seasonId: string;
}

export interface CardWithUsage extends Card {
  successRate: number;
  totalAttempts: number;
  correctAttempts: number;
}

export interface CardWithSeason extends Card {
  season: {
    name: string;
  };
}

// Attempt types
export interface Attempt {
  id: string;
  contestantName: string;
  givenAnswer: string;
  isCorrect: boolean;
  attemptedAt: Date;
  cardId: string;
  seasonId: string;
  recordedById: string;
}

export interface AttemptWithCard extends Attempt {
  card: {
    cardNumber: number;
    difficulty: Difficulty;
    question: string;
    correctAnswer: string;
  };
}

export interface AttemptWithDetails extends Attempt {
  card: {
    cardNumber: number;
    difficulty: Difficulty;
    question: string;
    correctAnswer: string;
  };
  season: {
    name: string;
  };
  recordedBy: {
    name: string | null;
  };
}

// Analytics types
export interface SeasonStats {
  seasonId: string;
  seasonName: string;
  totalCards: number;
  totalAttempts: number;
  overallSuccessRate: number;
  difficultyStats: {
    difficulty: Difficulty;
    cardCount: number;
    attemptCount: number;
    successRate: number;
  }[];
  mostUsedCards: {
    cardId: string;
    cardNumber: number;
    difficulty: Difficulty;
    question: string;
    usageCount: number;
  }[];
  leastUsedCards: {
    cardId: string;
    cardNumber: number;
    difficulty: Difficulty;
    question: string;
    usageCount: number;
  }[];
}

export interface CardUsageStats {
  cardId: string;
  cardNumber: number;
  difficulty: Difficulty;
  question: string;
  usageCount: number;
  totalAttempts: number;
  correctAttempts: number;
  successRate: number;
  lastUsed: Date | null;
}

export interface ContestantPerformance {
  contestantName: string;
  totalAttempts: number;
  correctAttempts: number;
  successRate: number;
  difficultyBreakdown: {
    difficulty: Difficulty;
    attempts: number;
    correct: number;
    successRate: number;
  }[];
  recentAttempts: AttemptWithCard[];
}

export interface DeckStatus {
  difficulty: Difficulty;
  totalCards: number;
  usedCards: number;
  availableCards: number;
  usagePercentage: number;
}

// Component prop types
export interface SeasonListProps {
  seasons: SeasonWithStats[];
  onSeasonSelect: (seasonId: string) => void;
  onSeasonCreate: () => void;
  onSeasonEdit: (season: Season) => void;
  onSeasonDelete: (seasonId: string) => void;
}

export interface SeasonFormProps {
  season?: Season;
  onSubmit: (data: { name: string; description?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface SeasonDashboardProps {
  season: SeasonWithStats;
  deckStatuses: DeckStatus[];
  onDeckSelect: (difficulty: Difficulty) => void;
}

export interface DeckViewProps {
  seasonId: string;
  difficulty: Difficulty;
  cards: CardWithUsage[];
  deckStatus: DeckStatus;
  onCardSelect: (cardId: string) => void;
  onCardCreate: () => void;
  onCardDraw: () => void;
}

export interface CardEditorProps {
  seasonId: string;
  difficulty: Difficulty;
  card?: Card;
  onSubmit: (data: {
    question: string;
    correctAnswer: string;
    cardNumber?: number;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface CardViewProps {
  card: CardWithUsage;
  onEdit: () => void;
  onDelete: () => void;
}

export interface CardDrawerProps {
  seasonId: string;
  difficulty: Difficulty;
  onCardDrawn: (card: Card) => void;
  isLoading?: boolean;
}

export interface QuestionDisplayProps {
  card: Card;
  onStartAttempt: () => void;
}

export interface ContestantFormProps {
  onSubmit: (contestantName: string) => void;
  isLoading?: boolean;
}

export interface AnswerRecorderProps {
  card: Card;
  contestantName: string;
  onSubmit: (data: { givenAnswer: string; isCorrect: boolean }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface AnalyticsDashboardProps {
  seasonStats: SeasonStats;
  onSeasonChange: (seasonId: string) => void;
}

export interface UsageChartsProps {
  cardUsageStats: CardUsageStats[];
  difficultyFilter?: Difficulty;
  onDifficultyChange: (difficulty?: Difficulty) => void;
}

export interface PerformanceMetricsProps {
  contestantPerformance: ContestantPerformance[];
  onContestantSelect: (contestantName: string) => void;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Export data types
export interface ExportData {
  season: Season;
  cards: Card[];
  attempts: AttemptWithCard[];
  stats: SeasonStats;
  exportedAt: Date;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
}