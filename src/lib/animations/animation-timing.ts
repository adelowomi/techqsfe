/**
 * Animation Timing and Easing Functions
 * Provides optimized timing and easing for smooth animations
 */

// Custom easing functions for card animations
export const easingFunctions = {
  // Smooth entrance animations
  easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeOutElastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // Card physics-inspired easing
  cardFlip: 'cubic-bezier(0.4, 0, 0.2, 1)',
  cardShuffle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  cardHover: 'cubic-bezier(0.4, 0, 0.6, 1)',
  
  // Smooth transitions
  smoothTransition: 'cubic-bezier(0.4, 0, 0.2, 1)',
  gentleSpring: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  
  // Performance-optimized easing
  fastEaseOut: 'cubic-bezier(0.4, 0, 1, 1)',
  slowEaseIn: 'cubic-bezier(0, 0, 0.2, 1)'
} as const;

// Optimized animation durations based on content type
export const animationDurations = {
  // Micro-interactions
  cardHover: 200,
  buttonPress: 150,
  focusIndicator: 100,
  
  // Card animations
  cardFlip: 600,
  cardShuffle: 800,
  cardDeal: 400,
  
  // Page transitions
  sectionEntrance: 600,
  heroAnimation: 1200,
  featureReveal: 500,
  
  // Complex sequences
  gameDemo: 2000,
  statisticsAnimation: 1500,
  deckShowcase: 1800,
  
  // Stagger delays
  cardStagger: 100,
  featureStagger: 150,
  counterStagger: 200
} as const;

// Responsive duration multipliers
export const durationMultipliers = {
  mobile: 0.7,
  tablet: 0.85,
  desktop: 1.0,
  reducedMotion: 0.01
} as const;

/**
 * Get optimized animation duration based on device and preferences
 */
export function getOptimizedDuration(
  baseDuration: keyof typeof animationDurations | number,
  deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop',
  respectReducedMotion = true
): number {
  const duration = typeof baseDuration === 'number' 
    ? baseDuration 
    : animationDurations[baseDuration];

  // Check for reduced motion preference
  if (respectReducedMotion && typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return duration * durationMultipliers.reducedMotion;
    }
  }

  return duration * durationMultipliers[deviceType];
}

/**
 * Create staggered animation delays
 */
export function createStaggeredDelays(
  count: number,
  baseDelay: keyof typeof animationDurations | number,
  maxDelay = 2000
): number[] {
  const delay = typeof baseDelay === 'number' 
    ? baseDelay 
    : animationDurations[baseDelay];

  const delays: number[] = [];
  for (let i = 0; i < count; i++) {
    const staggeredDelay = Math.min(i * delay, maxDelay);
    delays.push(staggeredDelay);
  }
  
  return delays;
}

/**
 * Animation timing configuration for different contexts
 */
export const animationConfigs = {
  hero: {
    duration: animationDurations.heroAnimation,
    easing: easingFunctions.easeOutQuart,
    stagger: animationDurations.cardStagger
  },
  
  cardGrid: {
    duration: animationDurations.sectionEntrance,
    easing: easingFunctions.gentleSpring,
    stagger: animationDurations.featureStagger
  },
  
  gameDemo: {
    duration: animationDurations.gameDemo,
    easing: easingFunctions.cardShuffle,
    stagger: animationDurations.cardStagger
  },
  
  statistics: {
    duration: animationDurations.statisticsAnimation,
    easing: easingFunctions.easeOutBack,
    stagger: animationDurations.counterStagger
  },
  
  microInteraction: {
    duration: animationDurations.cardHover,
    easing: easingFunctions.cardHover,
    stagger: 0
  }
} as const;

/**
 * Get animation configuration for a specific context
 */
export function getAnimationConfig(
  context: keyof typeof animationConfigs,
  deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
) {
  const config = animationConfigs[context];
  
  return {
    ...config,
    duration: getOptimizedDuration(config.duration, deviceType),
    stagger: config.stagger * durationMultipliers[deviceType]
  };
}

/**
 * CSS custom properties for dynamic animation timing
 */
export function generateAnimationCSSProperties(
  deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
): Record<string, string> {
  const multiplier = durationMultipliers[deviceType];
  
  return {
    '--animation-duration-fast': `${200 * multiplier}ms`,
    '--animation-duration-normal': `${400 * multiplier}ms`,
    '--animation-duration-slow': `${600 * multiplier}ms`,
    '--animation-duration-card-flip': `${animationDurations.cardFlip * multiplier}ms`,
    '--animation-duration-card-shuffle': `${animationDurations.cardShuffle * multiplier}ms`,
    '--animation-duration-hero': `${animationDurations.heroAnimation * multiplier}ms`,
    '--animation-stagger-cards': `${animationDurations.cardStagger * multiplier}ms`,
    '--animation-stagger-features': `${animationDurations.featureStagger * multiplier}ms`,
    '--animation-easing-card': easingFunctions.cardFlip,
    '--animation-easing-smooth': easingFunctions.smoothTransition,
    '--animation-easing-spring': easingFunctions.gentleSpring
  };
}