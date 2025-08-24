/**
 * Cross-Browser Support Utilities
 * Handles browser compatibility for animation features
 */

interface BrowserSupport {
  webAnimations: boolean;
  cssTransforms: boolean;
  cssTransitions: boolean;
  intersectionObserver: boolean;
  requestAnimationFrame: boolean;
  cssCustomProperties: boolean;
  cssGrid: boolean;
  flexbox: boolean;
}

class CrossBrowserSupport {
  private static instance: CrossBrowserSupport;
  private support: BrowserSupport;

  private constructor() {
    this.support = this.detectBrowserSupport();
  }

  static getInstance(): CrossBrowserSupport {
    if (!CrossBrowserSupport.instance) {
      CrossBrowserSupport.instance = new CrossBrowserSupport();
    }
    return CrossBrowserSupport.instance;
  }

  /**
   * Detect browser support for various features
   */
  private detectBrowserSupport(): BrowserSupport {
    if (typeof window === 'undefined') {
      // Server-side rendering - assume modern browser
      return {
        webAnimations: true,
        cssTransforms: true,
        cssTransitions: true,
        intersectionObserver: true,
        requestAnimationFrame: true,
        cssCustomProperties: true,
        cssGrid: true,
        flexbox: true
      };
    }

    const testElement = document.createElement('div');
    const style = testElement.style;

    return {
      webAnimations: 'animate' in testElement,
      cssTransforms: 'transform' in style || 'webkitTransform' in style,
      cssTransitions: 'transition' in style || 'webkitTransition' in style,
      intersectionObserver: 'IntersectionObserver' in window,
      requestAnimationFrame: 'requestAnimationFrame' in window,
      cssCustomProperties: CSS.supports('color', 'var(--test)'),
      cssGrid: CSS.supports('display', 'grid'),
      flexbox: CSS.supports('display', 'flex')
    };
  }

  /**
   * Get browser support information
   */
  static getSupport(): BrowserSupport {
    return CrossBrowserSupport.getInstance().support;
  }

  /**
   * Check if a specific feature is supported
   */
  static isSupported(feature: keyof BrowserSupport): boolean {
    return CrossBrowserSupport.getInstance().support[feature];
  }

  /**
   * Get vendor-prefixed CSS property
   */
  static getVendorPrefixedProperty(property: string): string {
    if (typeof window === 'undefined') return property;

    const testElement = document.createElement('div');
    const style = testElement.style;

    // Check if property is supported without prefix
    if (property in style) {
      return property;
    }

    // Try vendor prefixes
    const prefixes = ['webkit', 'moz', 'ms', 'o'];
    const capitalizedProperty = property.charAt(0).toUpperCase() + property.slice(1);

    for (const prefix of prefixes) {
      const prefixedProperty = prefix + capitalizedProperty;
      if (prefixedProperty in style) {
        return prefixedProperty;
      }
    }

    return property; // Return original if no prefix works
  }

  /**
   * Create fallback animation using CSS transitions
   */
  static createFallbackAnimation(
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions
  ): Animation | null {
    if (!element || keyframes.length === 0) return null;

    try {
      // Use Web Animations API if supported
      if (this.isSupported('webAnimations')) {
        return element.animate(keyframes, options);
      }

      // Fallback to CSS transitions
      if (this.isSupported('cssTransitions')) {
        return this.createCSSTransitionFallback(element, keyframes, options);
      }

      // No animation support - apply final state immediately
      const finalKeyframe = keyframes[keyframes.length - 1];
      if (finalKeyframe) {
        Object.assign(element.style, finalKeyframe);
      }

      return null;
    } catch (error) {
      console.warn('Animation creation failed:', error);
      return null;
    }
  }

  /**
   * Create CSS transition-based fallback
   */
  private static createCSSTransitionFallback(
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions
  ): Animation | null {
    const duration = typeof options.duration === 'number' ? options.duration : 300;
    const easing = typeof options.easing === 'string' ? options.easing : 'ease';

    // Set transition properties
    const transformProperty = this.getVendorPrefixedProperty('transform');
    const transitionProperty = this.getVendorPrefixedProperty('transition');

    element.style[transitionProperty as any] = `all ${duration}ms ${easing}`;

    // Apply final keyframe
    const finalKeyframe = keyframes[keyframes.length - 1];
    if (finalKeyframe) {
      setTimeout(() => {
        Object.assign(element.style, finalKeyframe);
      }, 10);
    }

    // Create a mock Animation object
    return {
      cancel: () => {
        element.style[transitionProperty as any] = '';
      },
      finish: () => {
        element.style[transitionProperty as any] = '';
      },
      pause: () => {
        // CSS transitions can't be paused easily
      },
      play: () => {
        // Already playing
      },
      reverse: () => {
        // Not easily supported with CSS transitions
      }
    } as Animation;
  }

  /**
   * Get appropriate intersection observer options for browser
   */
  static getIntersectionObserverOptions(): IntersectionObserverInit {
    const support = this.getSupport();

    if (!support.intersectionObserver) {
      return {}; // Will be handled by fallback
    }

    return {
      threshold: [0, 0.25, 0.5, 0.75, 1],
      rootMargin: '50px'
    };
  }

  /**
   * Create intersection observer with fallback
   */
  static createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver | null {
    if (!this.isSupported('intersectionObserver')) {
      // Fallback: trigger callback immediately for all elements
      console.warn('IntersectionObserver not supported, using fallback');
      return null;
    }

    try {
      return new IntersectionObserver(callback, options);
    } catch (error) {
      console.warn('Failed to create IntersectionObserver:', error);
      return null;
    }
  }

  /**
   * Request animation frame with fallback
   */
  static requestAnimationFrame(callback: FrameRequestCallback): number {
    if (this.isSupported('requestAnimationFrame')) {
      return window.requestAnimationFrame(callback);
    }

    // Fallback to setTimeout
    return window.setTimeout(callback, 16) as any; // ~60fps
  }

  /**
   * Cancel animation frame with fallback
   */
  static cancelAnimationFrame(id: number): void {
    if (this.isSupported('requestAnimationFrame')) {
      window.cancelAnimationFrame(id);
    } else {
      window.clearTimeout(id);
    }
  }

  /**
   * Apply CSS custom properties with fallback
   */
  static setCSSCustomProperty(
    element: HTMLElement,
    property: string,
    value: string,
    fallbackProperty?: string,
    fallbackValue?: string
  ): void {
    if (this.isSupported('cssCustomProperties')) {
      element.style.setProperty(property, value);
    } else if (fallbackProperty && fallbackValue) {
      element.style.setProperty(fallbackProperty, fallbackValue);
    }
  }

  /**
   * Get browser-specific CSS classes
   */
  static getBrowserClasses(): string[] {
    const support = this.getSupport();
    const classes: string[] = [];

    if (support.webAnimations) classes.push('web-animations');
    if (support.cssTransforms) classes.push('css-transforms');
    if (support.cssTransitions) classes.push('css-transitions');
    if (support.intersectionObserver) classes.push('intersection-observer');
    if (support.cssCustomProperties) classes.push('css-custom-properties');
    if (support.cssGrid) classes.push('css-grid');
    if (support.flexbox) classes.push('flexbox');

    // Add browser detection
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) classes.push('chrome');
    if (userAgent.includes('firefox')) classes.push('firefox');
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) classes.push('safari');
    if (userAgent.includes('edge')) classes.push('edge');

    return classes;
  }

  /**
   * Apply browser compatibility classes to document
   */
  static applyBrowserClasses(): void {
    if (typeof document === 'undefined') return;

    const classes = this.getBrowserClasses();
    document.documentElement.classList.add(...classes);
  }
}

export { CrossBrowserSupport };
export type { BrowserSupport };