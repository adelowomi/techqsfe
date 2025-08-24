import React, { useEffect, useRef } from 'react';

interface AriaLiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
  onClear?: () => void;
}

/**
 * Component for announcing messages to screen readers
 */
export function AriaLiveRegion({ 
  message, 
  priority = 'polite', 
  clearAfter = 3000,
  onClear 
}: AriaLiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && clearAfter > 0) {
      const timer = setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = '';
        }
        onClear?.();
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter, onClear]);

  if (!message) return null;

  return (
    <div
      ref={regionRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {message}
    </div>
  );
}

/**
 * Hook for managing ARIA live announcements
 */
export function useAriaAnnouncements() {
  const [announcement, setAnnouncement] = React.useState<{
    message: string;
    priority: 'polite' | 'assertive';
    id: string;
  } | null>(null);

  const announce = React.useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    setAnnouncement({
      message,
      priority,
      id: Math.random().toString(36).substr(2, 9)
    });
  }, []);

  const clearAnnouncement = React.useCallback(() => {
    setAnnouncement(null);
  }, []);

  return {
    announcement,
    announce,
    clearAnnouncement,
    AriaLiveRegion: announcement ? (
      <AriaLiveRegion
        key={announcement.id}
        message={announcement.message}
        priority={announcement.priority}
        onClear={clearAnnouncement}
      />
    ) : null
  };
}

/**
 * Component for providing animation descriptions to screen readers
 */
interface AnimationDescriptionProps {
  animationType: 'shuffle' | 'flip' | 'deal' | 'hover' | 'counter' | 'chart';
  customDescription?: string;
  isActive?: boolean;
}

export function AnimationDescription({ 
  animationType, 
  customDescription, 
  isActive = false 
}: AnimationDescriptionProps) {
  const descriptions = {
    shuffle: 'Cards are being shuffled with a mixing motion',
    flip: 'Card is flipping to reveal its other side',
    deal: 'Cards are being dealt one by one from the deck',
    hover: 'Card is lifting slightly with a hover effect',
    counter: 'Counter is animating to show the final value',
    chart: 'Chart is animating to display data visualization'
  };

  const description = customDescription || descriptions[animationType];

  if (!isActive) return null;

  return (
    <AriaLiveRegion
      message={description}
      priority="polite"
      clearAfter={2000}
    />
  );
}

/**
 * Component for keyboard navigation instructions
 */
interface KeyboardInstructionsProps {
  elementType: 'card' | 'button' | 'navigation' | 'form';
  customInstructions?: string;
}

export function KeyboardInstructions({ 
  elementType, 
  customInstructions 
}: KeyboardInstructionsProps) {
  const instructions = {
    card: 'Use Enter or Space to activate, arrow keys to navigate between cards',
    button: 'Press Enter or Space to activate',
    navigation: 'Use Tab to navigate, Enter to select, Escape to close menus',
    form: 'Use Tab to navigate fields, Enter to submit, Escape to cancel'
  };

  const instruction = customInstructions || instructions[elementType];

  return (
    <div className="sr-instructions" aria-hidden="true">
      {instruction}
    </div>
  );
}

/**
 * Component for providing alternative content for complex animations
 */
interface AnimationAlternativeProps {
  children: React.ReactNode;
  alternativeText: string;
  showAlternative?: boolean;
}

export function AnimationAlternative({ 
  children, 
  alternativeText, 
  showAlternative = false 
}: AnimationAlternativeProps) {
  if (showAlternative) {
    return (
      <div role="img" aria-label={alternativeText}>
        <div className="sr-only">{alternativeText}</div>
        <div aria-hidden="true">{children}</div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component for adding accessibility features to animated components
 */
interface WithAccessibilityProps {
  ariaLabel?: string;
  ariaDescription?: string;
  keyboardInstructions?: string;
  animationType?: string;
  isInteractive?: boolean;
  reducedMotion?: boolean;
}

export function withAccessibility<P extends object>(
  Component: React.ComponentType<P>
) {
  return React.forwardRef<HTMLElement, P & WithAccessibilityProps>(
    function AccessibleComponent(props, ref) {
      const {
        ariaLabel,
        ariaDescription,
        keyboardInstructions,
        animationType,
        isInteractive = false,
        reducedMotion = false,
        ...componentProps
      } = props;

      const elementRef = useRef<HTMLElement>(null);
      const { announce } = useAriaAnnouncements();

      // Combine refs
      React.useImperativeHandle(ref, () => elementRef.current!);

      useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        // Add ARIA attributes
        if (ariaLabel) {
          element.setAttribute('aria-label', ariaLabel);
        }

        if (ariaDescription) {
          const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
          const descElement = document.createElement('div');
          descElement.id = descId;
          descElement.className = 'sr-only';
          descElement.textContent = ariaDescription;
          element.appendChild(descElement);
          element.setAttribute('aria-describedby', descId);
        }

        // Add role if interactive
        if (isInteractive && !element.getAttribute('role')) {
          element.setAttribute('role', 'button');
        }

        // Add keyboard handlers for interactive elements
        if (isInteractive) {
          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              element.click();
            }
          };

          element.addEventListener('keydown', handleKeyDown);
          return () => element.removeEventListener('keydown', handleKeyDown);
        }
      }, [ariaLabel, ariaDescription, isInteractive]);

      // Announce animation start for screen readers
      useEffect(() => {
        if (animationType && !reducedMotion) {
          announce(`${animationType} animation started`);
        }
      }, [animationType, reducedMotion, announce]);

      const enhancedProps = {
        ...(componentProps as P),
        'data-accessible': 'true',
        'data-animation-type': animationType,
        'data-interactive': isInteractive?.toString(),
      };

      return (
        <Component
          {...enhancedProps}
          ref={elementRef}
        />
      );
    }
  );
}