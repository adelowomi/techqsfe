import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponsiveAnimationController } from '../responsive-controller';

// Mock window and navigator objects
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1,
  matchMedia: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
};

const mockNavigator = {
  maxTouchPoints: 0,
  connection: {
    effectiveType: '4g'
  }
};

// Mock MediaQueryList
const createMockMediaQueryList = (matches: boolean) => ({
  matches,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
});

describe('ResponsiveAnimationController', () => {
  let controller: ResponsiveAnimationController;

  beforeEach(() => {
    // Reset window and navigator mocks
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    });

    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    });

    // Mock matchMedia
    mockWindow.matchMedia = vi.fn((query: string) => {
      if (query.includes('max-width: 768px')) {
        return createMockMediaQueryList(false); // Desktop by default
      }
      if (query.includes('min-width: 769px') && query.includes('max-width: 1024px')) {
        return createMockMediaQueryList(false);
      }
      if (query.includes('min-width: 1025px')) {
        return createMockMediaQueryList(true);
      }
      if (query.includes('prefers-reduced-motion')) {
        return createMockMediaQueryList(false);
      }
      if (query.includes('hover: hover')) {
        return createMockMediaQueryList(true);
      }
      return createMockMediaQueryList(false);
    });

    controller = ResponsiveAnimationController.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Device Detection', () => {
    it('should detect desktop device correctly', () => {
      const capabilities = controller.getDeviceCapabilities();
      
      expect(capabilities.isDesktop).toBe(true);
      expect(capabilities.isMobile).toBe(false);
      expect(capabilities.isTablet).toBe(false);
    });

    it('should detect mobile device correctly', () => {
      mockWindow.innerWidth = 600;
      mockWindow.matchMedia = vi.fn((query: string) => {
        if (query.includes('max-width: 768px')) {
          return createMockMediaQueryList(true);
        }
        return createMockMediaQueryList(false);
      });

      const newController = ResponsiveAnimationController.getInstance();
      const capabilities = newController.getDeviceCapabilities();
      
      expect(capabilities.isMobile).toBe(true);
      expect(capabilities.isDesktop).toBe(false);
      expect(capabilities.isTablet).toBe(false);
    });

    it('should detect tablet device correctly', () => {
      mockWindow.innerWidth = 900;
      mockWindow.matchMedia = vi.fn((query: string) => {
        if (query.includes('min-width: 769px') && query.includes('max-width: 1024px')) {
          return createMockMediaQueryList(true);
        }
        return createMockMediaQueryList(false);
      });

      const newController = ResponsiveAnimationController.getInstance();
      const capabilities = newController.getDeviceCapabilities();
      
      expect(capabilities.isTablet).toBe(true);
      expect(capabilities.isMobile).toBe(false);
      expect(capabilities.isDesktop).toBe(false);
    });

    it('should detect touch capability', () => {
      mockNavigator.maxTouchPoints = 1;
      Object.defineProperty(global, 'ontouchstart', {
        value: true,
        writable: true
      });

      const newController = ResponsiveAnimationController.getInstance();
      const capabilities = newController.getDeviceCapabilities();
      
      expect(capabilities.hasTouch).toBe(true);
    });

    it('should detect reduced motion preference', () => {
      mockWindow.matchMedia = vi.fn((query: string) => {
        if (query.includes('prefers-reduced-motion')) {
          return createMockMediaQueryList(true);
        }
        return createMockMediaQueryList(false);
      });

      const newController = ResponsiveAnimationController.getInstance();
      const capabilities = newController.getDeviceCapabilities();
      
      expect(capabilities.reducedMotion).toBe(true);
    });
  });

  describe('Animation Configuration', () => {
    it('should provide desktop configuration for desktop devices', () => {
      const config = controller.getActiveDeviceConfig();
      
      expect(config.complexity).toBe('full');
      expect(config.duration).toBe(600);
      expect(config.stagger).toBe(100);
      expect('hoverEffects' in config).toBe(true);
    });

    it('should disable animations when reduced motion is preferred', () => {
      mockWindow.matchMedia = vi.fn((query: string) => {
        if (query.includes('prefers-reduced-motion')) {
          return createMockMediaQueryList(true);
        }
        return createMockMediaQueryList(false);
      });

      const newController = ResponsiveAnimationController.getInstance();
      
      expect(newController.shouldEnableAnimations()).toBe(false);
    });

    it('should provide optimal duration based on device', () => {
      const baseDuration = 1000;
      const optimizedDuration = controller.getOptimalDuration(baseDuration);
      
      // Desktop should use full duration
      expect(optimizedDuration).toBe(baseDuration);
    });

    it('should provide optimal stagger based on device', () => {
      const baseStagger = 100;
      const optimizedStagger = controller.getOptimalStagger(baseStagger);
      
      // Desktop should use full stagger
      expect(optimizedStagger).toBe(baseStagger);
    });
  });

  describe('Touch and Interaction', () => {
    it('should provide appropriate touch area size', () => {
      const touchAreaSize = controller.getTouchAreaSize();
      
      expect(touchAreaSize).toBe(44); // Standard minimum touch target
    });

    it('should determine hover effects availability', () => {
      const shouldUseHover = controller.shouldUseHoverEffects();
      
      expect(shouldUseHover).toBe(true); // Desktop with hover support
    });

    it('should provide card size multiplier', () => {
      const multiplier = controller.getCardSizeMultiplier();
      
      expect(multiplier).toBe(1); // Full size on desktop
    });
  });

  describe('CSS Custom Properties', () => {
    it('should generate CSS custom properties', () => {
      const properties = controller.getCSSCustomProperties();
      
      expect(properties).toHaveProperty('--animation-duration');
      expect(properties).toHaveProperty('--animation-stagger');
      expect(properties).toHaveProperty('--card-size-multiplier');
      expect(properties).toHaveProperty('--touch-area-size');
      expect(properties).toHaveProperty('--animation-complexity');
      expect(properties).toHaveProperty('--hover-enabled');
    });

    it('should set correct values for desktop', () => {
      const properties = controller.getCSSCustomProperties();
      
      expect(properties['--animation-duration']).toBe('600ms');
      expect(properties['--card-size-multiplier']).toBe('1');
      expect(properties['--hover-enabled']).toBe('1');
    });
  });

  describe('Connection Speed Detection', () => {
    it('should detect slow connection', () => {
      mockNavigator.connection = {
        effectiveType: '2g'
      };

      const newController = ResponsiveAnimationController.getInstance();
      const capabilities = newController.getDeviceCapabilities();
      
      expect(capabilities.connectionSpeed).toBe('slow');
    });

    it('should detect fast connection', () => {
      mockNavigator.connection = {
        effectiveType: '4g'
      };

      const newController = ResponsiveAnimationController.getInstance();
      const capabilities = newController.getDeviceCapabilities();
      
      expect(capabilities.connectionSpeed).toBe('fast');
    });

    it('should handle missing connection API', () => {
      const originalConnection = mockNavigator.connection;
      delete (mockNavigator as any).connection;

      const newController = ResponsiveAnimationController.getInstance();
      const capabilities = newController.getDeviceCapabilities();
      
      expect(capabilities.connectionSpeed).toBe('unknown');

      // Restore connection
      mockNavigator.connection = originalConnection;
    });
  });

  describe('Animation Complexity', () => {
    it('should return minimal complexity for reduced motion', () => {
      mockWindow.matchMedia = vi.fn((query: string) => {
        if (query.includes('prefers-reduced-motion')) {
          return createMockMediaQueryList(true);
        }
        return createMockMediaQueryList(false);
      });

      const newController = ResponsiveAnimationController.getInstance();
      const complexity = newController.getAnimationComplexity();
      
      expect(complexity).toBe('minimal');
    });

    it('should return full complexity for desktop', () => {
      const complexity = controller.getAnimationComplexity();
      
      expect(complexity).toBe('full');
    });
  });
});