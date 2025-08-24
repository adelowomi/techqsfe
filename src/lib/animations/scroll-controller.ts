// Scroll animation controller with intersection observers

import type { AnimationConfig } from './types';

export class ScrollAnimationController {
  private observers: Map<string, IntersectionObserver> = new Map();
  private animations: Map<string, AnimationConfig> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Registers an animation to be triggered by scroll
   */
  registerAnimation(element: Element, config: AnimationConfig): void {
    const elementId = this.getElementId(element);
    
    // Store animation config
    this.animations.set(elementId, config);

    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries, elementId),
      {
        threshold: config.threshold,
        rootMargin: '0px 0px -10% 0px' // Trigger slightly before element is fully visible
      }
    );

    observer.observe(element);
    this.observers.set(elementId, observer);
  }

  /**
   * Unregisters an animation
   */
  unregisterAnimation(elementId: string): void {
    const observer = this.observers.get(elementId);
    if (observer) {
      observer.disconnect();
      this.observers.delete(elementId);
    }
    this.animations.delete(elementId);
  }

  /**
   * Pauses all animations
   */
  pauseAll(): void {
    this.isEnabled = false;
    this.animations.forEach((config, elementId) => {
      const element = document.querySelector(`[data-animation-id="${elementId}"]`);
      if (element) {
        const animations = element.getAnimations();
        animations.forEach(animation => animation.pause());
      }
    });
  }

  /**
   * Resumes all animations
   */
  resumeAll(): void {
    this.isEnabled = true;
    this.animations.forEach((config, elementId) => {
      const element = document.querySelector(`[data-animation-id="${elementId}"]`);
      if (element) {
        const animations = element.getAnimations();
        animations.forEach(animation => animation.play());
      }
    });
  }

  /**
   * Creates a scroll-triggered fade-in animation
   */
  createFadeInAnimation(element: Element, options: { delay?: number; duration?: number } = {}): void {
    const { delay = 0, duration = 600 } = options;
    
    const keyframes = [
      { opacity: '0', transform: 'translateY(20px)' },
      { opacity: '1', transform: 'translateY(0)' }
    ];

    const animationConfig: AnimationConfig = {
      trigger: 'enter',
      threshold: 0.1,
      animation: new KeyframeEffect(element, keyframes, {
        duration,
        delay,
        easing: 'ease-out',
        fill: 'forwards'
      }),
      options: { duration, delay, easing: 'ease-out', fill: 'forwards' }
    };

    this.registerAnimation(element, animationConfig);
  }

  /**
   * Creates a scroll-triggered slide-in animation
   */
  createSlideInAnimation(
    element: Element, 
    direction: 'left' | 'right' | 'up' | 'down' = 'up',
    options: { delay?: number; duration?: number; distance?: number } = {}
  ): void {
    const { delay = 0, duration = 600, distance = 50 } = options;
    
    const transforms = {
      left: `translateX(-${distance}px)`,
      right: `translateX(${distance}px)`,
      up: `translateY(${distance}px)`,
      down: `translateY(-${distance}px)`
    };

    const keyframes = [
      { opacity: '0', transform: transforms[direction] },
      { opacity: '1', transform: 'translateX(0) translateY(0)' }
    ];

    const animationConfig: AnimationConfig = {
      trigger: 'enter',
      threshold: 0.1,
      animation: new KeyframeEffect(element, keyframes, {
        duration,
        delay,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
      }),
      options: { duration, delay, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' }
    };

    this.registerAnimation(element, animationConfig);
  }

  /**
   * Creates a staggered animation for multiple elements
   */
  createStaggeredAnimation(
    elements: Element[],
    animationType: 'fadeIn' | 'slideIn' = 'fadeIn',
    staggerDelay: number = 100
  ): void {
    elements.forEach((element, index) => {
      const delay = index * staggerDelay;
      
      if (animationType === 'fadeIn') {
        this.createFadeInAnimation(element, { delay });
      } else {
        this.createSlideInAnimation(element, 'up', { delay });
      }
    });
  }

  /**
   * Handles intersection observer callbacks
   */
  private handleIntersection(entries: IntersectionObserverEntry[], elementId: string): void {
    if (!this.isEnabled) return;

    const config = this.animations.get(elementId);
    if (!config) return;

    entries.forEach(entry => {
      const shouldTrigger = 
        (config.trigger === 'enter' && entry.isIntersecting) ||
        (config.trigger === 'exit' && !entry.isIntersecting);

      if (shouldTrigger) {
        this.triggerAnimation(entry.target, config);
      }
    });
  }

  /**
   * Triggers the animation for an element
   */
  private triggerAnimation(element: Element, config: AnimationConfig): void {
    try {
      const animation = new Animation(config.animation, document.timeline);
      animation.play();
    } catch (error) {
      console.warn('Animation failed to play:', error);
      // Fallback to CSS classes if Web Animations API fails
      this.fallbackToCSSAnimation(element);
    }
  }

  /**
   * Fallback animation using CSS classes
   */
  private fallbackToCSSAnimation(element: Element): void {
    element.classList.add('animate-fade-in');
  }

  /**
   * Generates or retrieves element ID for tracking
   */
  private getElementId(element: Element): string {
    let id = element.getAttribute('data-animation-id');
    if (!id) {
      id = `animation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      element.setAttribute('data-animation-id', id);
    }
    return id;
  }

  /**
   * Handles page visibility changes to pause/resume animations
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.pauseAll();
    } else {
      this.resumeAll();
    }
  }

  /**
   * Cleanup method to remove all observers and listeners
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.animations.clear();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}