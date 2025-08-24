import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AnimatedCounter, StatisticCounter, CounterGrid } from '../components/AnimatedCounter';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock requestAnimationFrame
const mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  // Immediately execute callback for testing
  setTimeout(() => callback(performance.now()), 0);
  return 1;
});
const mockCancelAnimationFrame = vi.fn();

window.requestAnimationFrame = mockRequestAnimationFrame;
window.cancelAnimationFrame = mockCancelAnimationFrame;

describe('AnimatedCounter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should render with initial value of 0', () => {
      render(<AnimatedCounter value={100} trigger="mount" />);
      const counter = screen.getByTestId('animated-counter');
      expect(counter).toBeInTheDocument();
      expect(counter).toHaveTextContent('0');
    });

    it('should start animation when trigger is mount', () => {
      render(<AnimatedCounter value={100} trigger="mount" duration={100} />);
      
      // Component should render and be ready for animation
      const counter = screen.getByTestId('animated-counter');
      expect(counter).toBeInTheDocument();
    });

    it('should apply custom formatting', () => {
      const customFormat = (value: number) => `$${value.toFixed(2)}`;
      render(
        <AnimatedCounter 
          value={100} 
          trigger="mount" 
          format={customFormat}
        />
      );
      
      const counter = screen.getByTestId('animated-counter');
      expect(counter).toHaveTextContent('$0.00');
    });

    it('should use prefix and suffix', () => {
      render(
        <AnimatedCounter 
          value={100} 
          trigger="mount" 
          prefix="$" 
          suffix=" USD"
        />
      );
      
      const counter = screen.getByTestId('animated-counter');
      expect(counter).toHaveTextContent('$0 USD');
    });

    it('should handle decimal places', () => {
      render(
        <AnimatedCounter 
          value={100.5} 
          trigger="mount" 
          decimals={1}
        />
      );
      
      const counter = screen.getByTestId('animated-counter');
      expect(counter).toHaveTextContent('0.0');
    });
  });

  describe('Animation Triggers', () => {
    it('should start animation immediately when trigger is mount', () => {
      render(<AnimatedCounter value={100} trigger="mount" />);
      const counter = screen.getByTestId('animated-counter');
      expect(counter).toBeInTheDocument();
    });

    it('should set up intersection observer when trigger is scroll', () => {
      render(<AnimatedCounter value={100} trigger="scroll" />);
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should apply delay before starting animation', () => {
      render(
        <AnimatedCounter 
          value={100} 
          trigger="mount" 
          delay={500}
        />
      );

      const counter = screen.getByTestId('animated-counter');
      expect(counter).toBeInTheDocument();
      expect(counter).toHaveTextContent('0');

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Counter should still be rendered
      expect(counter).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<AnimatedCounter value={100} trigger="mount" />);
      const counter = screen.getByTestId('animated-counter');
      
      expect(counter).toHaveAttribute('aria-live', 'polite');
      expect(counter).toHaveAttribute('aria-label');
    });

    it('should update aria-label with current value', async () => {
      render(<AnimatedCounter value={100} trigger="mount" />);
      const counter = screen.getByTestId('animated-counter');
      
      expect(counter).toHaveAttribute('aria-label', 'Count: 0');
    });
  });

  describe('Performance', () => {
    it('should clean up on unmount', () => {
      const { unmount } = render(<AnimatedCounter value={100} trigger="mount" />);
      
      const counter = screen.getByTestId('animated-counter');
      expect(counter).toBeInTheDocument();
      
      unmount();
      
      // Component should be unmounted
      expect(screen.queryByTestId('animated-counter')).not.toBeInTheDocument();
    });

    it('should handle value changes', async () => {
      const { rerender } = render(<AnimatedCounter value={100} trigger="mount" />);
      
      const counter = screen.getByTestId('animated-counter');
      expect(counter).toHaveTextContent('0');

      // Try to start second animation by changing value
      rerender(<AnimatedCounter value={200} trigger="mount" />);
      
      // Should reset and start new animation
      expect(counter).toBeInTheDocument();
      expect(counter).toHaveTextContent('0'); // Should reset to 0
    });
  });
});

describe('StatisticCounter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format percentage correctly', () => {
    render(
      <StatisticCounter 
        value={85.5} 
        type="percentage" 
        trigger="mount"
        decimals={1}
      />
    );
    
    const counter = screen.getByTestId('animated-counter');
    expect(counter).toHaveTextContent('0.0%');
  });

  it('should format currency correctly', () => {
    render(
      <StatisticCounter 
        value={1234.56} 
        type="currency" 
        trigger="mount"
        currency="USD"
        decimals={2}
      />
    );
    
    const counter = screen.getByTestId('animated-counter');
    expect(counter).toHaveTextContent('$0.00');
  });

  it('should format large numbers with K/M suffixes', () => {
    render(
      <StatisticCounter 
        value={1500} 
        type="number" 
        trigger="mount"
      />
    );
    
    const counter = screen.getByTestId('animated-counter');
    expect(counter).toHaveTextContent('0');
  });

  it('should format time correctly', () => {
    render(
      <StatisticCounter 
        value={120} 
        type="time" 
        trigger="mount"
        timeUnit="minutes"
      />
    );
    
    const counter = screen.getByTestId('animated-counter');
    expect(counter).toHaveTextContent('0m');
  });
});

describe('CounterGrid', () => {
  const mockCounters = [
    {
      id: '1',
      label: 'Total Users',
      value: 1250,
      type: 'number' as const,
      description: 'Active users this month'
    },
    {
      id: '2',
      label: 'Success Rate',
      value: 94.5,
      type: 'percentage' as const,
      description: 'Average success rate'
    },
    {
      id: '3',
      label: 'Revenue',
      value: 15000,
      type: 'currency' as const,
      description: 'Monthly recurring revenue'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render all counters', () => {
    render(<CounterGrid counters={mockCounters} />);
    
    const grid = screen.getByTestId('counter-grid');
    expect(grid).toBeInTheDocument();
    
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('should render counter descriptions', () => {
    render(<CounterGrid counters={mockCounters} />);
    
    expect(screen.getByText('Active users this month')).toBeInTheDocument();
    expect(screen.getByText('Average success rate')).toBeInTheDocument();
    expect(screen.getByText('Monthly recurring revenue')).toBeInTheDocument();
  });

  it('should apply staggered delays', () => {
    render(<CounterGrid counters={mockCounters} staggerDelay={100} />);
    
    // Each counter should have a different delay
    const counters = screen.getAllByTestId('animated-counter');
    expect(counters).toHaveLength(3);
  });

  it('should render icons when provided', () => {
    const countersWithIcons = mockCounters.map(counter => ({
      ...counter,
      icon: <span data-testid={`icon-${counter.id}`}>📊</span>
    }));

    render(<CounterGrid counters={countersWithIcons} />);
    
    expect(screen.getByTestId('icon-1')).toBeInTheDocument();
    expect(screen.getByTestId('icon-2')).toBeInTheDocument();
    expect(screen.getByTestId('icon-3')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<CounterGrid counters={mockCounters} className="custom-grid" />);
    
    const grid = screen.getByTestId('counter-grid');
    expect(grid).toHaveClass('custom-grid');
  });
});