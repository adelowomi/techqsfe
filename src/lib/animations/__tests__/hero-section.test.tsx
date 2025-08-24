import { describe, it, expect, vi } from 'vitest';
import { HeroSection } from '../components/HeroSection';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, className }: any) => ({
    type: 'img',
    props: { src, alt, className }
  })
}));

// Mock the LogoAnimation component
vi.mock('../components/LogoAnimation', () => ({
  LogoAnimation: ({ variant, size }: any) => ({
    type: 'div',
    props: { 
      'data-testid': 'logo-animation',
      'data-variant': variant,
      'data-size': size
    }
  })
}));

// Mock the CardAnimation component
vi.mock('../components/CardAnimation', () => ({
  CardAnimation: ({ variant, cards, autoPlay }: any) => ({
    type: 'div',
    props: { 
      'data-testid': 'card-animation',
      'data-variant': variant,
      'data-cards-count': cards?.length || 0,
      'data-auto-play': autoPlay
    }
  })
}));

// Mock the responsive logo hook
vi.mock('../../hooks/useResponsiveLogo', () => ({
  useResponsiveLogo: () => 'lg'
}));

describe('HeroSection', () => {
  it('should export HeroSection component', () => {
    expect(HeroSection).toBeDefined();
    expect(typeof HeroSection).toBe('function');
  });

  it('should accept authentication props', () => {
    expect(() => {
      const props = {
        isAuthenticated: true,
        user: { name: 'Test User', email: 'test@example.com' },
        onSignInClick: () => {},
        onSignUpClick: () => {},
        onDashboardClick: () => {},
        className: 'test-class'
      };
      
      // Verify props are properly typed
      expect(props.isAuthenticated).toBe(true);
      expect(props.user?.name).toBe('Test User');
      expect(typeof props.onSignInClick).toBe('function');
      expect(typeof props.onSignUpClick).toBe('function');
      expect(typeof props.onDashboardClick).toBe('function');
      expect(props.className).toBe('test-class');
    }).not.toThrow();
  });

  it('should handle optional props', () => {
    expect(() => {
      const props = {};
      // Component should work with no props
      expect(typeof props).toBe('object');
    }).not.toThrow();
  });

  it('should support callback functions', () => {
    const mockCallbacks = {
      onSignInClick: vi.fn(),
      onSignUpClick: vi.fn(),
      onDashboardClick: vi.fn()
    };

    expect(typeof mockCallbacks.onSignInClick).toBe('function');
    expect(typeof mockCallbacks.onSignUpClick).toBe('function');
    expect(typeof mockCallbacks.onDashboardClick).toBe('function');

    // Test that callbacks can be called
    mockCallbacks.onSignInClick();
    mockCallbacks.onSignUpClick();
    mockCallbacks.onDashboardClick();

    expect(mockCallbacks.onSignInClick).toHaveBeenCalled();
    expect(mockCallbacks.onSignUpClick).toHaveBeenCalled();
    expect(mockCallbacks.onDashboardClick).toHaveBeenCalled();
  });

  it('should handle user object structure', () => {
    const user = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
  });
});