// Tests for animation utilities
// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScrollAnimationController } from '../scroll-controller';
import { PerformanceMonitor } from '../performance-monitor';
import { AccessibilityHandler } from '../accessibility-handler';
import { CardPhysics } from '../card-physics';

// Mock DOM APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn().mockImplementation(cb => setTimeout(cb, 16)),
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn().mockImplementation(id => clearTimeout(id)),
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1024 * 1024, // 1MB
    },
  },
});

// Mock Web Animations API
Object.defineProperty(window, 'KeyframeEffect', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({})),
});

Object.defineProperty(window, 'Animation', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    cancel: vi.fn(),
  })),
});

describe('ScrollAnimationController', () => {
  let controller: ScrollAnimationController;
  let mockElement: HTMLElement;

  beforeEach(() => {
    controller = new ScrollAnimationController();
    mockElement = document.createElement('div');
    // Mock getAnimations method
    mockElement.getAnimations = vi.fn().mockReturnValue([
      { play: vi.fn(), pause: vi.fn(), cancel: vi.fn() }
    ]);
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    controller.destroy();
    document.body.removeChild(mockElement);
  });

  it('should create fade-in animation', () => {
    controller.createFadeInAnimation(mockElement);
    expect(mockElement.getAttribute('data-animation-id')).toBeTruthy();
  });

  it('should create slide-in animation', () => {
    controller.createSlideInAnimation(mockElement, 'up');
    expect(mockElement.getAttribute('data-animation-id')).toBeTruthy();
  });

  it('should create staggered animations', () => {
    const elements = [mockElement, document.createElement('div')];
    controller.createStaggeredAnimation(elements, 'fadeIn', 100);
    
    elements.forEach(element => {
      expect(element.getAttribute('data-animation-id')).toBeTruthy();
    });
  });

  it('should pause and resume animations', () => {
    controller.createFadeInAnimation(mockElement);
    
    expect(() => controller.pauseAll()).not.toThrow();
    expect(() => controller.resumeAll()).not.toThrow();
  });
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.stopMonitoring();
  });

  it('should start and stop monitoring', () => {
    expect(() => monitor.startMonitoring()).not.toThrow();
    expect(() => monitor.stopMonitoring()).not.toThrow();
  });

  it('should get current FPS', () => {
    const fps = monitor.getCurrentFPS();
    expect(typeof fps).toBe('number');
    expect(fps).toBeGreaterThanOrEqual(0);
  });

  it('should get performance tier', () => {
    const tier = monitor.getPerformanceTier();
    expect(['low', 'medium', 'high']).toContain(tier);
  });

  it('should check GPU acceleration', () => {
    const isGPUAccelerated = monitor.isGPUAccelerated();
    expect(typeof isGPUAccelerated).toBe('boolean');
  });

  it('should register performance callbacks', () => {
    const callback = vi.fn();
    monitor.onPerformanceIssue('test', callback);
    monitor.offPerformanceIssue('test');
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('AccessibilityHandler', () => {
  let handler: AccessibilityHandler;

  beforeEach(() => {
    handler = AccessibilityHandler.getInstance();
  });

  it('should be a singleton', () => {
    const handler2 = AccessibilityHandler.getInstance();
    expect(handler).toBe(handler2);
  });

  it('should detect reduced motion preference', () => {
    const isReduced = handler.isReducedMotionPreferred();
    expect(typeof isReduced).toBe('boolean');
  });

  it('should detect high contrast preference', () => {
    const isHighContrast = handler.isHighContrastEnabled();
    expect(typeof isHighContrast).toBe('boolean');
  });

  it('should detect screen reader usage', () => {
    const isScreenReader = handler.isScreenReaderEnabled();
    expect(typeof isScreenReader).toBe('boolean');
  });

  it('should create animation descriptions', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    
    expect(() => {
      handler.createAnimationDescription(element, 'shuffle', 'Cards shuffling');
    }).not.toThrow();
    
    document.body.removeChild(element);
  });

  it('should respect motion preferences', () => {
    expect(() => handler.respectMotionPreferences()).not.toThrow();
  });

  it('should ensure keyboard navigation', () => {
    expect(() => handler.ensureKeyboardNavigation()).not.toThrow();
  });

  it('should provide alternative content', () => {
    expect(() => handler.provideAlternativeContent()).not.toThrow();
  });
});

describe('CardPhysics', () => {
  let mockCard: HTMLElement;

  beforeEach(() => {
    mockCard = document.createElement('div');
    mockCard.animate = vi.fn().mockReturnValue({
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
    });
    
    // Add required properties for CardElement
    (mockCard as any).cardId = 'test-card';
    (mockCard as any).animationState = {
      id: 'test-card',
      position: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0 } },
      isFlipped: false,
      isHovered: false,
      isSelected: false,
      animationState: 'idle'
    };
    
    document.body.appendChild(mockCard);
  });

  afterEach(() => {
    document.body.removeChild(mockCard);
  });

  it('should create shuffle animation', () => {
    const cards = [mockCard as any];
    const animations = CardPhysics.shuffle(cards);
    
    expect(Array.isArray(animations)).toBe(true);
    expect(animations.length).toBe(1);
    expect(mockCard.animate).toHaveBeenCalled();
  });

  it('should create deal animation', () => {
    const cards = [mockCard as any];
    const positions = [{ x: 100, y: 100, z: 0, rotation: { x: 0, y: 0, z: 0 } }];
    const animations = CardPhysics.deal(cards, positions);
    
    expect(Array.isArray(animations)).toBe(true);
    expect(animations.length).toBe(1);
    expect(mockCard.animate).toHaveBeenCalled();
  });

  it('should create flip animation', () => {
    const animation = CardPhysics.flip(mockCard as any);
    
    expect(animation).toBeDefined();
    expect(mockCard.animate).toHaveBeenCalled();
  });

  it('should create stack animation', () => {
    const cards = [mockCard as any];
    const animations = CardPhysics.stack(cards, 5);
    
    expect(Array.isArray(animations)).toBe(true);
    expect(animations.length).toBe(1);
    expect(mockCard.animate).toHaveBeenCalled();
  });

  it('should create hover animation', () => {
    const animation = CardPhysics.hover(mockCard as any, 1.5);
    
    expect(animation).toBeDefined();
    expect(mockCard.animate).toHaveBeenCalled();
  });

  it('should optimize for GPU', () => {
    CardPhysics.optimizeForGPU(mockCard);
    
    expect(mockCard.style.willChange).toBe('transform');
    expect(mockCard.style.transform).toBe('translateZ(0)');
    expect(mockCard.style.backfaceVisibility).toBe('hidden');
  });

  it('should remove GPU optimization', () => {
    CardPhysics.optimizeForGPU(mockCard);
    CardPhysics.removeGPUOptimization(mockCard);
    
    expect(mockCard.style.willChange).toBe('auto');
    expect(mockCard.style.transform).toBe('');
    expect(mockCard.style.backfaceVisibility).toBe('');
  });
});