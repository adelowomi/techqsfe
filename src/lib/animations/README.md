# Animation Utilities

This module provides a comprehensive set of animation utilities for the TechQS landing page, including card physics, scroll-triggered animations, performance monitoring, and accessibility features.

## Features

- **Card Physics Engine**: Realistic card animations (shuffle, deal, flip, hover, stack)
- **Scroll Animation Controller**: Intersection Observer-based scroll animations
- **Performance Monitoring**: FPS tracking and device capability detection
- **Accessibility Handler**: Reduced motion support and screen reader compatibility
- **GPU Acceleration**: Optimized animations using CSS transforms
- **React Hook**: Easy-to-use React integration

## Quick Start

### Using the React Hook

```tsx
import { useAnimations } from '@/lib/hooks/useAnimations';

function MyComponent() {
  const {
    createFadeInAnimation,
    createSlideInAnimation,
    animateCards,
    isReducedMotionPreferred
  } = useAnimations();

  useEffect(() => {
    if (elementRef.current) {
      createFadeInAnimation(elementRef.current);
    }
  }, [createFadeInAnimation]);

  return <div ref={elementRef}>Content</div>;
}
```

### Direct Usage

```tsx
import { 
  ScrollAnimationController, 
  CardPhysics, 
  AccessibilityHandler 
} from '@/lib/animations';

// Create scroll animations
const controller = new ScrollAnimationController();
controller.createFadeInAnimation(element);

// Animate cards
const cards = document.querySelectorAll('.card');
CardPhysics.shuffle(cards);

// Handle accessibility
const accessibility = AccessibilityHandler.getInstance();
accessibility.respectMotionPreferences();
```

## API Reference

### ScrollAnimationController

Controls scroll-triggered animations using Intersection Observer.

#### Methods

- `createFadeInAnimation(element, options?)`: Creates fade-in animation
- `createSlideInAnimation(element, direction?, options?)`: Creates slide-in animation
- `createStaggeredAnimation(elements, type?, delay?)`: Creates staggered animations
- `registerAnimation(element, config)`: Registers custom animation
- `pauseAll()`: Pauses all animations
- `resumeAll()`: Resumes all animations
- `destroy()`: Cleanup method

#### Options

```typescript
interface AnimationOptions {
  delay?: number;      // Animation delay in ms
  duration?: number;   // Animation duration in ms
  distance?: number;   // Slide distance in px
}
```

### CardPhysics

Provides realistic card animation effects.

#### Methods

- `shuffle(cards)`: Shuffles multiple cards with random positions
- `deal(cards, positions)`: Deals cards to specific positions
- `flip(card, axis?)`: Flips a single card on X or Y axis
- `stack(cards, offset?)`: Stacks cards with offset
- `hover(card, intensity?)`: Creates hover lift effect
- `optimizeForGPU(element)`: Applies GPU acceleration
- `removeGPUOptimization(element)`: Removes GPU acceleration

#### Example

```tsx
// Shuffle animation
const cards = document.querySelectorAll('.card');
const animations = CardPhysics.shuffle(cards);

// Deal animation with positions
const positions = [
  { x: 100, y: 100, z: 0, rotation: { x: 0, y: 0, z: 0 } },
  { x: 200, y: 100, z: 1, rotation: { x: 0, y: 0, z: 5 } }
];
CardPhysics.deal(cards, positions);
```

### PerformanceMonitor

Monitors animation performance and device capabilities.

#### Methods

- `startMonitoring()`: Starts FPS monitoring
- `stopMonitoring()`: Stops monitoring
- `getCurrentFPS()`: Returns current FPS
- `getPerformanceTier()`: Returns 'low', 'medium', or 'high'
- `isGPUAccelerated()`: Checks GPU acceleration availability
- `onPerformanceIssue(id, callback)`: Registers performance callback

#### Example

```tsx
const monitor = new PerformanceMonitor();
monitor.startMonitoring();

monitor.onPerformanceIssue('low-fps', (error) => {
  console.log('Low FPS detected:', error.current);
  // Reduce animation complexity
});
```

### AccessibilityHandler

Handles accessibility features and user preferences.

#### Methods

- `isReducedMotionPreferred()`: Checks prefers-reduced-motion
- `respectMotionPreferences()`: Disables animations if needed
- `ensureKeyboardNavigation()`: Adds focus indicators
- `provideAlternativeContent()`: Adds ARIA labels
- `createAnimationDescription(element, type, description?)`: Adds screen reader descriptions

#### Example

```tsx
const accessibility = AccessibilityHandler.getInstance();

if (accessibility.isReducedMotionPreferred()) {
  // Use static content instead of animations
} else {
  // Full animations
}

accessibility.createAnimationDescription(
  cardElement, 
  'shuffle', 
  'Cards are being shuffled'
);
```

## CSS Classes

The module includes CSS utility classes for common animations:

### Animation Classes

- `.animate-fade-in`: Fade in animation
- `.animate-slide-in-up`: Slide in from bottom
- `.animate-slide-in-left`: Slide in from left
- `.animate-slide-in-right`: Slide in from right

### Utility Classes

- `.gpu-accelerated`: Applies GPU acceleration
- `.card-3d`: 3D transform context for cards
- `.card-face`: Card face styling
- `.card-face-back`: Back face styling (rotated 180°)

### Accessibility Classes

- `.sr-only`: Screen reader only content
- `.focus-visible`: Focus indicator styling
- `.reduced-motion`: Applied when reduced motion is preferred
- `.high-contrast`: Applied when high contrast is preferred

## Performance Considerations

### GPU Acceleration

All animations use CSS transforms and GPU acceleration:

```css
.gpu-accelerated {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### Performance Tiers

The system automatically detects device performance:

- **High**: 8+ CPU cores, 8GB+ RAM - Full animations
- **Medium**: 4+ CPU cores, 4GB+ RAM - Standard animations  
- **Low**: <4 CPU cores, <4GB RAM - Reduced animations

### Memory Management

- Animations are cleaned up on component unmount
- Intersection observers are properly disconnected
- GPU optimizations are removed when not needed

## Accessibility Features

### Reduced Motion Support

Automatically detects and respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Reader Support

- ARIA labels for animated content
- Live regions for animation descriptions
- Alternative static content when needed

### Keyboard Navigation

- Focus indicators for all interactive elements
- Skip links for main content
- Proper tab order

## Testing

Run the test suite:

```bash
npm test src/lib/animations/__tests__/animation-utilities.test.ts
```

The tests cover:
- Animation creation and execution
- Performance monitoring
- Accessibility features
- Error handling
- Browser compatibility

## Browser Support

- Modern browsers with Web Animations API support
- Graceful fallback to CSS animations
- IE11+ with polyfills

## Examples

See `src/lib/animations/examples/AnimationExample.tsx` for a complete working example.