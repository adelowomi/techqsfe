import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResponsiveCard, withResponsiveAnimation } from '../components/ResponsiveCard';

// Mock the responsive controller
vi.mock('../responsive-controller', () => ({
  useResponsiveAnimation: () => ({
    shouldEnableAnimations: true,
    getOptimalDuration: (duration: number) => duration * 0.8,
    getOptimalStagger: (stagger: number) => stagger * 0.6,
    getTouchAreaSize: () => 44,
    shouldUseHoverEffects: () => true,
    getCardSizeMultiplier: () => 0.9,
    getAnimationComplexity: () => 'reduced',
    getCSSCustomProperties: () => ({
      '--animation-duration': '480ms',
      '--animation-stagger': '60ms',
      '--card-size-multiplier': '0.9',
      '--touch-area-size': '44px',
      '--animation-complexity': 'reduced',
      '--hover-enabled': '1'
    })
  })
}));

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
});
global.IntersectionObserver = mockIntersectionObserver;

describe('ResponsiveCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      render(
        <ResponsiveCard>
          <div>Test Content</div>
        </ResponsiveCard>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply responsive classes', () => {
      const { container } = render(
        <ResponsiveCard className="custom-class">
          <div>Test Content</div>
        </ResponsiveCard>
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('responsive-card');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('gpu-accelerated');
    });

    it('should apply responsive styles', () => {
      const { container } = render(
        <ResponsiveCard>
          <div>Test Content</div>
        </ResponsiveCard>
      );

      const card = container.firstChild as HTMLElement;
      const style = card.style;
      
      expect(style.getPropertyValue('--card-scale')).toBe('0.9');
      expect(style.getPropertyValue('--min-touch-size')).toBe('44px');
    });
  });

  describe('Interactive Features', () => {
    it('should handle click events when interactive', () => {
      const handleClick = vi.fn();
      
      render(
        <ResponsiveCard interactive onClick={handleClick}>
          <div>Interactive Card</div>
        </ResponsiveCard>
      );

      const card = screen.getByRole('button');
      fireEvent.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events when interactive', () => {
      const handleClick = vi.fn();
      
      render(
        <ResponsiveCard interactive onClick={handleClick}>
          <div>Interactive Card</div>
        </ResponsiveCard>
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle space key when interactive', () => {
      const handleClick = vi.fn();
      
      render(
        <ResponsiveCard interactive onClick={handleClick}>
          <div>Interactive Card</div>
        </ResponsiveCard>
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should apply interactive classes and attributes', () => {
      render(
        <ResponsiveCard interactive aria-label="Test Card">
          <div>Interactive Card</div>
        </ResponsiveCard>
      );

      const card = screen.getByRole('button');
      expect(card).toHaveClass('card-interactive');
      expect(card).toHaveAttribute('aria-label', 'Test Card');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should set minimum touch area size for interactive cards', () => {
      const { container } = render(
        <ResponsiveCard interactive>
          <div>Interactive Card</div>
        </ResponsiveCard>
      );

      const card = container.firstChild as HTMLElement;
      expect(card.style.minHeight).toBe('44px');
      expect(card.style.minWidth).toBe('44px');
    });
  });

  describe('Animation Features', () => {
    it('should apply animation classes when visible', async () => {
      const { container } = render(
        <ResponsiveCard animationType="slide">
          <div>Animated Card</div>
        </ResponsiveCard>
      );

      // Simulate intersection observer callback
      const card = container.firstChild as HTMLElement;
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      observerCallback([{ isIntersecting: true, target: card }]);

      await waitFor(() => {
        expect(card).toHaveClass('animate-slide');
      });
    });

    it('should apply animation delay', () => {
      const { container } = render(
        <ResponsiveCard delay={500}>
          <div>Delayed Card</div>
        </ResponsiveCard>
      );

      const card = container.firstChild as HTMLElement;
      expect(card.style.animationDelay).toBe('500ms');
    });

    it('should apply optimal animation duration', () => {
      const { container } = render(
        <ResponsiveCard>
          <div>Timed Card</div>
        </ResponsiveCard>
      );

      const card = container.firstChild as HTMLElement;
      expect(card.style.animationDuration).toBe('480ms'); // 600 * 0.8
    });
  });

  describe('Hover Effects', () => {
    it('should handle hover events when interactive', () => {
      const handleHover = vi.fn();
      
      render(
        <ResponsiveCard interactive onHover={handleHover}>
          <div>Hoverable Card</div>
        </ResponsiveCard>
      );

      const card = screen.getByRole('button');
      fireEvent.mouseEnter(card);
      
      expect(handleHover).toHaveBeenCalledTimes(1);
    });

    it('should apply hover classes', () => {
      const { container } = render(
        <ResponsiveCard interactive>
          <div>Hoverable Card</div>
        </ResponsiveCard>
      );

      const card = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(card);
      
      expect(card).toHaveClass('card-hovered');
    });

    it('should remove hover classes on mouse leave', () => {
      const { container } = render(
        <ResponsiveCard interactive>
          <div>Hoverable Card</div>
        </ResponsiveCard>
      );

      const card = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);
      
      expect(card).not.toHaveClass('card-hovered');
    });
  });

  describe('Accessibility', () => {
    it('should provide screen reader content for animations', () => {
      render(
        <ResponsiveCard>
          <div>Accessible Card</div>
        </ResponsiveCard>
      );

      expect(screen.getByText('Loading content')).toHaveClass('sr-only');
    });

    it('should update screen reader content when visible', async () => {
      const { container } = render(
        <ResponsiveCard>
          <div>Accessible Card</div>
        </ResponsiveCard>
      );

      // Simulate intersection observer callback
      const card = container.firstChild as HTMLElement;
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      observerCallback([{ isIntersecting: true, target: card }]);

      await waitFor(() => {
        expect(screen.getByText('Content loaded')).toHaveClass('sr-only');
      });
    });

    it('should set proper ARIA attributes for interactive cards', () => {
      render(
        <ResponsiveCard interactive role="button" aria-label="Custom Label">
          <div>ARIA Card</div>
        </ResponsiveCard>
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', 'Custom Label');
      expect(card).toHaveAttribute('role', 'button');
    });
  });

  describe('Higher-Order Component', () => {
    const TestComponent = ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    );

    it('should wrap component with responsive behavior', () => {
      const WrappedComponent = withResponsiveAnimation(TestComponent);
      
      render(
        <WrappedComponent animationType="fade" interactive>
          <span>Wrapped Content</span>
        </WrappedComponent>
      );

      expect(screen.getByText('Wrapped Content')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should pass through component props', () => {
      const TestComponentWithProps = ({ testProp, children }: any) => (
        <div data-test-prop={testProp}>{children}</div>
      );

      const WrappedComponent = withResponsiveAnimation(TestComponentWithProps);
      
      render(
        <WrappedComponent testProp="test-value">
          <span>Wrapped Content</span>
        </WrappedComponent>
      );

      expect(screen.getByText('Wrapped Content').parentElement).toHaveAttribute('data-test-prop', 'test-value');
    });
  });
});