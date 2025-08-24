import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useAccessibility, 
  useReducedMotion, 
  useCardKeyboardNavigation, 
  useFocusIndicator 
} from '../useAccessibility';
import { AccessibilityHandler } from '../../animations/accessibility-handler';

// Mock the AccessibilityHandler
vi.mock('../../animations/accessibility-handler', () => ({
  AccessibilityHandler: {
    getInstance: vi.fn(() => ({
      isReducedMotionPreferred: vi.fn(() => false),
      isHighContrastEnabled: vi.fn(() => false),
      isScreenReaderEnabled: vi.fn(() => false),
      respectMotionPreferences: vi.fn(),
      ensureKeyboardNavigation: vi.fn(),
      provideAlternativeContent: vi.fn(),
      createAnimationDescription: vi.fn(),
    })),
  },
}));

describe('useAccessibility', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize accessibility handler on mount', () => {
    const mockHandler = {
      isReducedMotionPreferred: vi.fn(() => false),
      isHighContrastEnabled: vi.fn(() => false),
      isScreenReaderEnabled: vi.fn(() => false),
      respectMotionPreferences: vi.fn(),
      ensureKeyboardNavigation: vi.fn(),
      provideAlternativeContent: vi.fn(),
      createAnimationDescription: vi.fn(),
    };

    (AccessibilityHandler.getInstance as any).mockReturnValue(mockHandler);

    renderHook(() => useAccessibility());

    expect(AccessibilityHandler.getInstance).toHaveBeenCalled();
    expect(mockHandler.respectMotionPreferences).toHaveBeenCalled();
    expect(mockHandler.ensureKeyboardNavigation).toHaveBeenCalled();
    expect(mockHandler.provideAlternativeContent).toHaveBeenCalled();
  });

  it('should return accessibility status methods', () => {
    const mockHandler = {
      isReducedMotionPreferred: vi.fn(() => true),
      isHighContrastEnabled: vi.fn(() => true),
      isScreenReaderEnabled: vi.fn(() => true),
      respectMotionPreferences: vi.fn(),
      ensureKeyboardNavigation: vi.fn(),
      provideAlternativeContent: vi.fn(),
      createAnimationDescription: vi.fn(),
    };

    (AccessibilityHandler.getInstance as any).mockReturnValue(mockHandler);

    const { result } = renderHook(() => useAccessibility());

    expect(result.current.isReducedMotionPreferred()).toBe(true);
    expect(result.current.isHighContrastEnabled()).toBe(true);
    expect(result.current.isScreenReaderEnabled()).toBe(true);
  });

  it('should handle missing handler gracefully', () => {
    (AccessibilityHandler.getInstance as any).mockReturnValue(null);

    const { result } = renderHook(() => useAccessibility());

    expect(result.current.isReducedMotionPreferred()).toBe(false);
    expect(result.current.isHighContrastEnabled()).toBe(false);
    expect(result.current.isScreenReaderEnabled()).toBe(false);
  });

  it('should announce messages to screen readers', () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.announceToScreenReader('Test message');
    });

    const announcement = document.querySelector('[aria-live="polite"]');
    expect(announcement).toBeTruthy();
    expect(announcement?.textContent).toBe('Test message');
  });
});

describe('useReducedMotion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return reduced motion preference when enabled', () => {
    const mockHandler = {
      isReducedMotionPreferred: vi.fn(() => true),
      respectMotionPreferences: vi.fn(),
      ensureKeyboardNavigation: vi.fn(),
      provideAlternativeContent: vi.fn(),
    };

    (AccessibilityHandler.getInstance as any).mockReturnValue(mockHandler);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.prefersReducedMotion).toBe(true);
  });

  it('should return zero duration when reduced motion is preferred', () => {
    const mockHandler = {
      isReducedMotionPreferred: vi.fn(() => true),
      respectMotionPreferences: vi.fn(),
      ensureKeyboardNavigation: vi.fn(),
      provideAlternativeContent: vi.fn(),
    };

    (AccessibilityHandler.getInstance as any).mockReturnValue(mockHandler);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.getAnimationDuration(1000)).toBe(0);
  });

  it('should return normal duration when reduced motion is not preferred', () => {
    const mockHandler = {
      isReducedMotionPreferred: vi.fn(() => false),
      respectMotionPreferences: vi.fn(),
      ensureKeyboardNavigation: vi.fn(),
      provideAlternativeContent: vi.fn(),
    };

    (AccessibilityHandler.getInstance as any).mockReturnValue(mockHandler);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.getAnimationDuration(1000)).toBe(1000);
  });

  it('should return modified animation props for reduced motion', () => {
    const mockHandler = {
      isReducedMotionPreferred: vi.fn(() => true),
      respectMotionPreferences: vi.fn(),
      ensureKeyboardNavigation: vi.fn(),
      provideAlternativeContent: vi.fn(),
    };

    (AccessibilityHandler.getInstance as any).mockReturnValue(mockHandler);

    const { result } = renderHook(() => useReducedMotion());

    const props = {
      animate: { opacity: 1, y: 0 },
      initial: { opacity: 0, y: 20 },
      transition: { duration: 0.5 }
    };

    const modifiedProps = result.current.getAnimationProps(props);

    expect(modifiedProps.animate).toEqual(props.initial);
    expect(modifiedProps.initial).toEqual(props.initial);
    expect(modifiedProps.transition.duration).toBe(0);
  });
});

describe('useCardKeyboardNavigation', () => {
  it('should set up keyboard navigation for card element', () => {
    const cardElement = document.createElement('div');
    document.body.appendChild(cardElement);

    const cardRef = { current: cardElement };

    renderHook(() => useCardKeyboardNavigation(cardRef));

    expect(cardElement.getAttribute('tabindex')).toBe('0');
    expect(cardElement.getAttribute('data-card')).toBe('true');
    expect(cardElement.getAttribute('role')).toBe('button');
  });

  it('should handle Enter key activation', () => {
    const cardElement = document.createElement('div');
    document.body.appendChild(cardElement);

    const clickSpy = vi.spyOn(cardElement, 'click');
    const cardRef = { current: cardElement };

    renderHook(() => useCardKeyboardNavigation(cardRef));

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    cardElement.dispatchEvent(enterEvent);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should handle Space key activation', () => {
    const cardElement = document.createElement('div');
    document.body.appendChild(cardElement);

    const clickSpy = vi.spyOn(cardElement, 'click');
    const cardRef = { current: cardElement };

    renderHook(() => useCardKeyboardNavigation(cardRef));

    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
    cardElement.dispatchEvent(spaceEvent);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should not override existing tabindex', () => {
    const cardElement = document.createElement('div');
    cardElement.setAttribute('tabindex', '1');
    document.body.appendChild(cardElement);

    const cardRef = { current: cardElement };

    renderHook(() => useCardKeyboardNavigation(cardRef));

    expect(cardElement.getAttribute('tabindex')).toBe('1');
  });

  it('should not override existing role', () => {
    const cardElement = document.createElement('div');
    cardElement.setAttribute('role', 'tab');
    document.body.appendChild(cardElement);

    const cardRef = { current: cardElement };

    renderHook(() => useCardKeyboardNavigation(cardRef));

    expect(cardElement.getAttribute('role')).toBe('tab');
  });
});

describe('useFocusIndicator', () => {
  it('should add focus-visible class on focus', () => {
    const element = document.createElement('button');
    document.body.appendChild(element);

    const elementRef = { current: element };

    renderHook(() => useFocusIndicator(elementRef));

    element.dispatchEvent(new FocusEvent('focus'));

    expect(element.classList.contains('focus-visible')).toBe(true);
  });

  it('should remove focus-visible class on blur', () => {
    const element = document.createElement('button');
    document.body.appendChild(element);

    const elementRef = { current: element };

    renderHook(() => useFocusIndicator(elementRef));

    element.dispatchEvent(new FocusEvent('focus'));
    expect(element.classList.contains('focus-visible')).toBe(true);

    element.dispatchEvent(new FocusEvent('blur'));
    expect(element.classList.contains('focus-visible')).toBe(false);
  });

  it('should remove focus-visible class on mouse down', () => {
    const element = document.createElement('button');
    document.body.appendChild(element);

    const elementRef = { current: element };

    renderHook(() => useFocusIndicator(elementRef));

    element.dispatchEvent(new FocusEvent('focus'));
    expect(element.classList.contains('focus-visible')).toBe(true);

    element.dispatchEvent(new MouseEvent('mousedown'));
    expect(element.classList.contains('focus-visible')).toBe(false);
  });

  it('should handle null ref gracefully', () => {
    const elementRef = { current: null };

    expect(() => {
      renderHook(() => useFocusIndicator(elementRef));
    }).not.toThrow();
  });
});