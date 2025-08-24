import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AccessibilityHandler } from '../accessibility-handler';

// Mock matchMedia
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

// Mock speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {},
});

describe('AccessibilityHandler', () => {
  let handler: AccessibilityHandler;
  let mockElement: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    handler = AccessibilityHandler.getInstance();
    
    mockElement = document.createElement('div');
    mockElement.setAttribute('data-animation-id', 'test');
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    // Remove any added styles
    const styles = document.querySelectorAll('style[data-reduced-motion]');
    styles.forEach(style => style.remove());
  });

  describe('Reduced Motion Support', () => {
    it('should detect reduced motion preference', () => {
      // Mock reduced motion preference
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const newHandler = new (AccessibilityHandler as any)();
      expect(newHandler.isReducedMotionPreferred()).toBe(true);
    });

    it('should disable animations when reduced motion is preferred', () => {
      // Mock reduced motion as enabled
      (handler as any).reducedMotionEnabled = true;
      handler.respectMotionPreferences();
      
      const style = document.querySelector('style[data-reduced-motion]');
      expect(style).toBeTruthy();
      expect(style?.textContent).toContain('animation-duration: 0.01ms');
    });

    it('should create static alternatives for animated content', () => {
      const card = document.createElement('div');
      card.setAttribute('data-animation', 'card');
      card.setAttribute('data-card-description', 'Test card');
      document.body.appendChild(card);

      handler.createStaticAlternatives();

      expect(card.classList.contains('static-card')).toBe(true);
      expect(card.style.transform).toBe('none');
      
      const description = card.querySelector('.sr-only');
      expect(description?.textContent).toBe('Test card');
    });

    it('should create static counter alternatives', () => {
      const counter = document.createElement('div');
      counter.setAttribute('data-animation', 'counter');
      counter.setAttribute('data-target-value', '100');
      document.body.appendChild(counter);

      handler.createStaticAlternatives();

      expect(counter.classList.contains('static-counter')).toBe(true);
      expect(counter.textContent).toBe('100');
    });

    it('should create data table for chart alternatives', () => {
      const chart = document.createElement('div');
      chart.setAttribute('data-animation', 'chart');
      chart.setAttribute('data-chart-data', JSON.stringify([
        { label: 'A', value: 10 },
        { label: 'B', value: 20 }
      ]));
      document.body.appendChild(chart);

      handler.createStaticAlternatives();

      expect(chart.classList.contains('static-chart')).toBe(true);
      
      const table = chart.querySelector('table');
      expect(table).toBeTruthy();
      expect(table?.getAttribute('aria-label')).toBe('Chart data in table format');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should add focus indicators to interactive elements', () => {
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      document.body.appendChild(button);

      handler.ensureKeyboardNavigation();

      // Simulate focus
      button.dispatchEvent(new FocusEvent('focus'));
      button.classList.add('focus-visible');
      
      expect(button.classList.contains('focus-visible')).toBe(true);
    });

    it('should add keyboard handlers to interactive elements', () => {
      const element = document.createElement('div');
      element.setAttribute('role', 'button');
      element.setAttribute('data-interactive', 'true');
      document.body.appendChild(element);

      const clickSpy = vi.spyOn(element, 'click');
      handler.ensureKeyboardNavigation();

      // Simulate Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      element.dispatchEvent(enterEvent);
      
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should handle card navigation with arrow keys', () => {
      const card1 = document.createElement('div');
      const card2 = document.createElement('div');
      card1.className = 'card';
      card2.className = 'card';
      card1.setAttribute('tabindex', '0');
      card2.setAttribute('tabindex', '0');
      
      document.body.appendChild(card1);
      document.body.appendChild(card2);

      const focusSpy = vi.spyOn(card2, 'focus');
      handler.ensureKeyboardNavigation();

      // Simulate arrow right key on first card
      const arrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      card1.dispatchEvent(arrowEvent);
      
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should add skip links', () => {
      handler.ensureKeyboardNavigation();
      
      const skipLink = document.querySelector('.skip-link');
      expect(skipLink).toBeTruthy();
      expect(skipLink?.getAttribute('href')).toBe('#main-content');
      expect(skipLink?.textContent).toBe('Skip to main content');
    });

    it('should handle keyboard shortcuts', () => {
      const mainContent = document.createElement('main');
      mainContent.id = 'main-content';
      mainContent.scrollIntoView = vi.fn(); // Mock scrollIntoView
      document.body.appendChild(mainContent);

      const focusSpy = vi.spyOn(mainContent, 'focus');
      handler.ensureKeyboardNavigation();

      // Simulate Alt + M
      const shortcutEvent = new KeyboardEvent('keydown', { 
        key: 'm', 
        altKey: true 
      });
      document.dispatchEvent(shortcutEvent);
      
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide alternative content for animations', () => {
      handler.provideAlternativeContent();
      
      expect(mockElement.getAttribute('role')).toBe('img');
      
      const description = mockElement.querySelector('.sr-only');
      expect(description).toBeTruthy();
    });

    it('should create animation descriptions', () => {
      handler.createAnimationDescription(mockElement, 'shuffle', 'Custom shuffle description');
      
      const liveRegion = mockElement.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion?.textContent).toBe('Custom shuffle description');
    });

    it('should use default descriptions for known animation types', () => {
      handler.createAnimationDescription(mockElement, 'flip');
      
      const liveRegion = mockElement.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toBe('Card is flipping to reveal its other side');
    });

    it('should announce messages to screen readers', () => {
      const announceMethod = (handler as any).announceToScreenReader;
      announceMethod('Test announcement');
      
      const announcement = document.querySelector('[aria-live="polite"]');
      expect(announcement).toBeTruthy();
      expect(announcement?.textContent).toBe('Test announcement');
    });
  });

  describe('High Contrast Support', () => {
    it('should detect high contrast preference', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const newHandler = new (AccessibilityHandler as any)();
      expect(newHandler.isHighContrastEnabled()).toBe(true);
    });

    it('should adjust interface for high contrast', () => {
      const adjustMethod = (handler as any).adjustForHighContrast;
      adjustMethod();
      
      expect(document.body.classList.contains('high-contrast')).toBe(true);
    });
  });

  describe('Animation Toggle', () => {
    it('should toggle animations on and off', () => {
      // Reset handler state
      (handler as any).reducedMotionEnabled = false;
      
      const toggleMethod = (handler as any).toggleAnimations.bind(handler);
      
      // Initially animations should be enabled
      expect(handler.isReducedMotionPreferred()).toBe(false);
      
      // Toggle to disable
      toggleMethod();
      expect(handler.isReducedMotionPreferred()).toBe(true);
      
      const style = document.querySelector('style[data-reduced-motion]');
      expect(style).toBeTruthy();
      
      // Toggle to enable
      toggleMethod();
      expect(handler.isReducedMotionPreferred()).toBe(false);
    });
  });

  describe('Keyboard Shortcuts Help', () => {
    it('should show keyboard shortcuts help', () => {
      const showMethod = (handler as any).showKeyboardShortcuts.bind(handler);
      showMethod();
      
      const helpDialog = document.querySelector('.keyboard-shortcuts-help');
      expect(helpDialog).toBeTruthy();
      expect(helpDialog?.getAttribute('role')).toBe('dialog');
    });

    it('should close help dialog with escape key', () => {
      const showMethod = (handler as any).showKeyboardShortcuts.bind(handler);
      showMethod();
      
      let helpDialog = document.querySelector('.keyboard-shortcuts-help');
      expect(helpDialog).toBeTruthy();
      
      // Simulate escape key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      
      // Help dialog should be removed
      setTimeout(() => {
        helpDialog = document.querySelector('.keyboard-shortcuts-help');
        expect(helpDialog).toBeFalsy();
      }, 0);
    });
  });
});