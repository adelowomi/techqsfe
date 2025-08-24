import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthStateTransition } from '../components/AuthStateTransition';

// Mock the hooks
vi.mock('../../hooks/useOptimizedAnimation', () => ({
  useOptimizedAnimation: () => ({
    shouldEnableAnimations: true,
    getOptimalDuration: (duration: number) => duration,
  }),
}));

// Mock timers
vi.useFakeTimers();

describe('AuthStateTransition', () => {
  const AuthenticatedContent = () => <div>Authenticated Content</div>;
  const UnauthenticatedContent = () => <div>Unauthenticated Content</div>;

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders authenticated content when isAuthenticated is true', () => {
    render(
      <AuthStateTransition
        isAuthenticated={true}
        fallback={<UnauthenticatedContent />}
      >
        <AuthenticatedContent />
      </AuthStateTransition>
    );

    expect(screen.getByText('Authenticated Content')).toBeInTheDocument();
  });

  it('renders fallback content when isAuthenticated is false', () => {
    render(
      <AuthStateTransition
        isAuthenticated={false}
        fallback={<UnauthenticatedContent />}
      >
        <AuthenticatedContent />
      </AuthStateTransition>
    );

    expect(screen.getByText('Unauthenticated Content')).toBeInTheDocument();
  });

  it('transitions content when authentication state changes', () => {
    const { rerender } = render(
      <AuthStateTransition
        isAuthenticated={false}
        fallback={<UnauthenticatedContent />}
      >
        <AuthenticatedContent />
      </AuthStateTransition>
    );

    expect(screen.getByText('Unauthenticated Content')).toBeInTheDocument();

    // Change to authenticated
    rerender(
      <AuthStateTransition
        isAuthenticated={true}
        fallback={<UnauthenticatedContent />}
      >
        <AuthenticatedContent />
      </AuthStateTransition>
    );

    // Fast-forward through the transition
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByText('Authenticated Content')).toBeInTheDocument();
  });

  it('applies transition classes during animation', () => {
    const { rerender, container } = render(
      <AuthStateTransition
        isAuthenticated={false}
        fallback={<UnauthenticatedContent />}
      >
        <AuthenticatedContent />
      </AuthStateTransition>
    );

    const transitionElement = container.firstChild as HTMLElement;
    expect(transitionElement).toHaveClass('opacity-100', 'scale-100');

    // Change authentication state
    rerender(
      <AuthStateTransition
        isAuthenticated={true}
        fallback={<UnauthenticatedContent />}
      >
        <AuthenticatedContent />
      </AuthStateTransition>
    );

    // Should have transition classes during animation
    expect(transitionElement).toHaveClass('transition-all');
  });

  it('handles disabled animations correctly', () => {
    // Mock disabled animations
    vi.doMock('../../hooks/useOptimizedAnimation', () => ({
      useOptimizedAnimation: () => ({
        shouldEnableAnimations: false,
        getOptimalDuration: (duration: number) => duration,
      }),
    }));

    const { rerender } = render(
      <AuthStateTransition
        isAuthenticated={false}
        fallback={<UnauthenticatedContent />}
      >
        <AuthenticatedContent />
      </AuthStateTransition>
    );

    expect(screen.getByText('Unauthenticated Content')).toBeInTheDocument();

    // Change to authenticated - should be immediate without animation
    rerender(
      <AuthStateTransition
        isAuthenticated={true}
        fallback={<UnauthenticatedContent />}
      >
        <AuthenticatedContent />
      </AuthStateTransition>
    );

    expect(screen.getByText('Authenticated Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AuthStateTransition
        isAuthenticated={true}
        className="custom-class"
        fallback={<UnauthenticatedContent />}
      >
        <AuthenticatedContent />
      </AuthStateTransition>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles missing fallback gracefully', () => {
    render(
      <AuthStateTransition
        isAuthenticated={false}
      >
        <AuthenticatedContent />
      </AuthStateTransition>
    );

    // Should not crash and should show nothing for unauthenticated state
    expect(screen.queryByText('Authenticated Content')).not.toBeInTheDocument();
  });

  it('completes transition cycle correctly', () => {
    const { rerender } = render(
      <AuthStateTransition
        isAuthenticated={false}
        fallback={<UnauthenticatedContent />}
      >
        <AuthenticatedContent />
      </AuthStateTransition>
    );

    expect(screen.getByText('Unauthenticated Content')).toBeInTheDocument();

    // Start transition to authenticated
    rerender(
      <AuthStateTransition
        isAuthenticated={true}
        fallback={<UnauthenticatedContent />}
      >
        <AuthenticatedContent />
      </AuthStateTransition>
    );

    // Advance through half the transition (fade out)
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Content should change at midpoint
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Complete the transition (fade in)
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByText('Authenticated Content')).toBeInTheDocument();
  });
});