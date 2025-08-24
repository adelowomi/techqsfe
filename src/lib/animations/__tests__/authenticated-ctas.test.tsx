import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthenticatedCTAs } from '../components/AuthenticatedCTAs';

// Mock the hooks
vi.mock('../../hooks/useOptimizedAnimation', () => ({
  useOptimizedAnimation: () => ({
    shouldEnableAnimations: true,
    getTouchAreaSize: () => 44,
    capabilities: { isMobile: false },
  }),
}));

describe('AuthenticatedCTAs', () => {
  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'HOST' as const,
  };

  const mockHandlers = {
    onDashboardClick: vi.fn(),
    onSeasonsClick: vi.fn(),
    onAnalyticsClick: vi.fn(),
    onCardsClick: vi.fn(),
    onGameClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders primary dashboard button', () => {
    render(
      <AuthenticatedCTAs
        user={mockUser}
        {...mockHandlers}
      />
    );

    const dashboardButton = screen.getByRole('button', { name: /go to dashboard/i });
    expect(dashboardButton).toBeInTheDocument();
  });

  it('calls onDashboardClick when dashboard button is clicked', () => {
    render(
      <AuthenticatedCTAs
        user={mockUser}
        {...mockHandlers}
      />
    );

    const dashboardButton = screen.getByRole('button', { name: /go to dashboard/i });
    fireEvent.click(dashboardButton);

    expect(mockHandlers.onDashboardClick).toHaveBeenCalledTimes(1);
  });

  it('displays quick actions section', () => {
    render(
      <AuthenticatedCTAs
        user={mockUser}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('shows role-appropriate quick actions for HOST', () => {
    render(
      <AuthenticatedCTAs
        user={mockUser}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Manage Seasons')).toBeInTheDocument();
    expect(screen.getByText('Card Management')).toBeInTheDocument();
    expect(screen.getByText('Start Game')).toBeInTheDocument();
    expect(screen.getByText('View Analytics')).toBeInTheDocument();
  });

  it('shows role-appropriate quick actions for ADMIN', () => {
    const adminUser = { ...mockUser, role: 'ADMIN' as const };
    render(
      <AuthenticatedCTAs
        user={adminUser}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Manage Seasons')).toBeInTheDocument();
    expect(screen.getByText('Card Management')).toBeInTheDocument();
    expect(screen.getByText('Start Game')).toBeInTheDocument();
    expect(screen.getByText('View Analytics')).toBeInTheDocument();
  });

  it('calls appropriate handlers when quick action buttons are clicked', () => {
    render(
      <AuthenticatedCTAs
        user={mockUser}
        {...mockHandlers}
      />
    );

    // Test seasons button
    const seasonsButton = screen.getByRole('button', { name: /manage seasons/i });
    fireEvent.click(seasonsButton);
    expect(mockHandlers.onSeasonsClick).toHaveBeenCalledTimes(1);

    // Test cards button
    const cardsButton = screen.getByRole('button', { name: /card management/i });
    fireEvent.click(cardsButton);
    expect(mockHandlers.onCardsClick).toHaveBeenCalledTimes(1);

    // Test game button
    const gameButton = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(gameButton);
    expect(mockHandlers.onGameClick).toHaveBeenCalledTimes(1);

    // Test analytics button
    const analyticsButton = screen.getByRole('button', { name: /view analytics/i });
    fireEvent.click(analyticsButton);
    expect(mockHandlers.onAnalyticsClick).toHaveBeenCalledTimes(1);
  });

  it('displays welcome message with user name and role', () => {
    render(
      <AuthenticatedCTAs
        user={mockUser}
        {...mockHandlers}
      />
    );

    expect(screen.getByText(/Welcome back, John Doe!/)).toBeInTheDocument();
    expect(screen.getByText(/You can host games and manage seasons/)).toBeInTheDocument();
  });

  it('shows different role descriptions', () => {
    // Test ADMIN role
    const adminUser = { ...mockUser, role: 'ADMIN' as const };
    const { rerender } = render(
      <AuthenticatedCTAs
        user={adminUser}
        {...mockHandlers}
      />
    );

    expect(screen.getByText(/You have full system access/)).toBeInTheDocument();

    // Test PRODUCER role
    const producerUser = { ...mockUser, role: 'PRODUCER' as const };
    rerender(
      <AuthenticatedCTAs
        user={producerUser}
        {...mockHandlers}
      />
    );

    expect(screen.getByText(/You can manage content and view analytics/)).toBeInTheDocument();
  });

  it('handles missing user name gracefully', () => {
    const userWithoutName = { ...mockUser, name: undefined };
    render(
      <AuthenticatedCTAs
        user={userWithoutName}
        {...mockHandlers}
      />
    );

    expect(screen.getByText(/Welcome back, there!/)).toBeInTheDocument();
  });

  it('handles missing handlers gracefully', () => {
    render(
      <AuthenticatedCTAs
        user={mockUser}
      />
    );

    // Should render without errors
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('applies correct grid layout based on number of actions', () => {
    render(
      <AuthenticatedCTAs
        user={mockUser}
        {...mockHandlers}
      />
    );

    // Should show all 4 actions for HOST role
    const quickActionsSection = screen.getByText('Quick Actions').parentElement;
    expect(quickActionsSection).toBeInTheDocument();
    
    // Check that all expected actions are present
    expect(screen.getByText('Manage Seasons')).toBeInTheDocument();
    expect(screen.getByText('Card Management')).toBeInTheDocument();
    expect(screen.getByText('Start Game')).toBeInTheDocument();
    expect(screen.getByText('View Analytics')).toBeInTheDocument();
  });
});