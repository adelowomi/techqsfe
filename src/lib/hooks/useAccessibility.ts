import { useEffect, useRef } from 'react';
import { AccessibilityHandler } from '../animations/accessibility-handler';

/**
 * Hook for managing accessibility features in animated components
 */
export function useAccessibility() {
  const handlerRef = useRef<AccessibilityHandler | null>(null);

  useEffect(() => {
    // Initialize accessibility handler
    handlerRef.current = AccessibilityHandler.getInstance();
    
    // Set up accessibility features
    if (handlerRef.current) {
      handlerRef.current.respectMotionPreferences();
      handlerRef.current.ensureKeyboardNavigation();
      handlerRef.current.provideAlternativeContent();
    }

    return () => {
      // Cleanup is handled by the singleton instance
    };
  }, []);

  return {
    /**
     * Check if reduced motion is preferred
     */
    isReducedMotionPreferred: () => handlerRef.current?.isReducedMotionPreferred() ?? false,
    
    /**
     * Check if high contrast is enabled
     */
    isHighContrastEnabled: () => handlerRef.current?.isHighContrastEnabled() ?? false,
    
    /**
     * Check if screen reader is likely being used
     */
    isScreenReaderEnabled: () => handlerRef.current?.isScreenReaderEnabled() ?? false,
    
    /**
     * Create animation description for screen readers
     */
    createAnimationDescription: (
      element: HTMLElement,
      animationType: string,
      description?: string
    ) => {
      handlerRef.current?.createAnimationDescription(element, animationType, description);
    },
    
    /**
     * Announce message to screen readers
     */
    announceToScreenReader: (message: string) => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    }
  };
}

/**
 * Hook for managing reduced motion preferences in components
 */
export function useReducedMotion() {
  const { isReducedMotionPreferred } = useAccessibility();
  const prefersReducedMotion = isReducedMotionPreferred();
  
  return {
    prefersReducedMotion,
    
    /**
     * Get animation duration based on motion preferences
     */
    getAnimationDuration: (normalDuration: number) => {
      return prefersReducedMotion ? 0 : normalDuration;
    },
    
    /**
     * Get animation props with reduced motion support
     */
    getAnimationProps: (props: {
      animate?: any;
      initial?: any;
      transition?: any;
    }) => {
      if (prefersReducedMotion) {
        return {
          animate: props.initial || {},
          initial: props.initial || {},
          transition: { duration: 0 }
        };
      }
      return props;
    }
  };
}

/**
 * Hook for managing keyboard navigation in card components
 */
export function useCardKeyboardNavigation(cardRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Make card focusable
    if (!card.hasAttribute('tabindex')) {
      card.setAttribute('tabindex', '0');
    }
    
    // Add data attribute for keyboard navigation
    card.setAttribute('data-card', 'true');
    
    // Add role if not present
    if (!card.getAttribute('role')) {
      card.setAttribute('role', 'button');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Enter and Space for activation
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    };

    card.addEventListener('keydown', handleKeyDown);

    return () => {
      card.removeEventListener('keydown', handleKeyDown);
    };
  }, [cardRef]);
}

/**
 * Hook for managing focus indicators
 */
export function useFocusIndicator(elementRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleFocus = () => {
      element.classList.add('focus-visible');
    };

    const handleBlur = () => {
      element.classList.remove('focus-visible');
    };

    const handleMouseDown = () => {
      element.classList.remove('focus-visible');
    };

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);
    element.addEventListener('mousedown', handleMouseDown);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
      element.removeEventListener('mousedown', handleMouseDown);
    };
  }, [elementRef]);
}