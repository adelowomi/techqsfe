import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { PersonalizedHeroContent } from '../components/PersonalizedHeroContent';

// Mock the hooks
vi.mock('../../hooks/useOptimizedAnimation', () => ({
  useOptimizedAnimation: () => ({
    shouldEnableAnimations: true,
    getOptimalDuration: (duration: number) => duration,
  }),
}));

describe('PersonalizedHeroContent', () => {
  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'HOST' as const,
  };

  const mockUserStats = {
    totalAttempts: 150,
    correctAttempts: 120,
    successRate: 80.0,
    seasonsParticipated: 3,
    recentActivity: [
      { date: '2024-01-01', attempts: 10, successRate: 85.0 },
      { date: '2024-01-02', attempts: 8, successRate: 75.0 },
      { date: '2024-01-03', attempts: 12, successRate: 90.0 },
    ],
  };

  it('renders greeting with user name', () => {
    render(
      <PersonalizedHeroContent
        user={mockUser}
        userStats={mockUserStats}
      />
    );

    expect(screen.getByText(/Good (morning|afternoon|evening), John Doe!/)).toBeInTheDocument();
  });

  it('displays user role badge', () => {
    render(
      <PersonalizedHeroContent
        user={mockUser}
        userStats={mockUserStats}
      />
    );

    expect(screen.getByText('Game Host')).toBeInTheDocument();
  });

  it('shows statistics cards with correct values', () => {
    render(
      <PersonalizedHeroContent
        user={mockUser}
        userStats={mockUserStats}
      />
    );

    expect(screen.getByText('Total Attempts')).toBeInTheDocument();
    expect(screen.getByText('Correct Answers')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Seasons')).toBeInTheDocument();
  });

  it('displays recent performance chart when data is available', () => {
    render(
      <PersonalizedHeroContent
        user={mockUser}
        userStats={mockUserStats}
      />
    );

    expect(screen.getByText('Recent Performance Trend')).toBeInTheDocument();
    expect(screen.getByText(/Your success rate over the last \d+ days/)).toBeInTheDocument();
  });

  it('shows motivational message based on success rate', () => {
    render(
      <PersonalizedHeroContent
        user={mockUser}
        userStats={mockUserStats}
      />
    );

    expect(screen.getByText('Keep Learning!')).toBeInTheDocument();
    expect(screen.getByText(/Excellent work|Great progress|Every attempt/)).toBeInTheDocument();
  });

  it('renders without stats when userStats is undefined', () => {
    render(
      <PersonalizedHeroContent
        user={mockUser}
      />
    );

    expect(screen.getByText(/Good (morning|afternoon|evening), John Doe!/)).toBeInTheDocument();
    expect(screen.getByText('Welcome back to TechQS. Ready to continue your learning journey?')).toBeInTheDocument();
    expect(screen.getByText('Game Host')).toBeInTheDocument();
  });

  it('handles different user roles correctly', () => {
    const adminUser = { ...mockUser, role: 'ADMIN' as const };
    render(
      <PersonalizedHeroContent
        user={adminUser}
        userStats={mockUserStats}
      />
    );

    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('handles missing user name gracefully', () => {
    const userWithoutName = { ...mockUser, name: undefined };
    render(
      <PersonalizedHeroContent
        user={userWithoutName}
        userStats={mockUserStats}
      />
    );

    expect(screen.getByText(/Good (morning|afternoon|evening), there!/)).toBeInTheDocument();
  });

  it('shows different motivational messages based on success rate', () => {
    // Test high success rate
    const highSuccessStats = { ...mockUserStats, successRate: 85.0 };
    const { rerender } = render(
      <PersonalizedHeroContent
        user={mockUser}
        userStats={highSuccessStats}
      />
    );

    expect(screen.getByText(/Excellent work/)).toBeInTheDocument();

    // Test medium success rate
    const mediumSuccessStats = { ...mockUserStats, successRate: 65.0 };
    rerender(
      <PersonalizedHeroContent
        user={mockUser}
        userStats={mediumSuccessStats}
      />
    );

    expect(screen.getByText(/Great progress/)).toBeInTheDocument();

    // Test low success rate
    const lowSuccessStats = { ...mockUserStats, successRate: 45.0 };
    rerender(
      <PersonalizedHeroContent
        user={mockUser}
        userStats={lowSuccessStats}
      />
    );

    expect(screen.getByText(/Every attempt/)).toBeInTheDocument();
  });
});