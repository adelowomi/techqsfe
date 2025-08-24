'use client';

import React from 'react';
import { useResponsiveAnimation } from '../responsive-controller';

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  animationType?: 'fade' | 'slide' | 'flip' | 'scale';
  delay?: number;
  onClick?: () => void;
  onHover?: () => void;
  'aria-label'?: string;
  role?: string;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = '',
  interactive = false,
  animationType = 'fade',
  delay = 0,
  onClick,
  onHover,
  'aria-label': ariaLabel,
  role
}) => {
  const {
    shouldEnableAnimations,
    getOptimalDuration,
    getTouchAreaSize,
    shouldUseHoverEffects,
    getCardSizeMultiplier,
    getCSSCustomProperties
  } = useResponsiveAnimation();

  const [isVisible, setIsVisible] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Intersection observer for scroll-triggered animations
  React.useEffect(() => {
    if (!shouldEnableAnimations || !cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [shouldEnableAnimations]);

  const handleMouseEnter = () => {
    if (shouldUseHoverEffects()) {
      setIsHovered(true);
      onHover?.();
    }
  };

  const handleMouseLeave = () => {
    if (shouldUseHoverEffects()) {
      setIsHovered(false);
    }
  };

  const handleClick = () => {
    onClick?.();
  };

  const getAnimationClass = () => {
    if (!shouldEnableAnimations || !isVisible) return '';
    
    const baseClass = `animate-${animationType}`;
    return baseClass;
  };

  const getCardStyles = (): React.CSSProperties => {
    const customProperties = getCSSCustomProperties();
    const cardSizeMultiplier = getCardSizeMultiplier();
    const touchAreaSize = getTouchAreaSize();
    
    return {
      ...customProperties,
      '--card-scale': cardSizeMultiplier,
      '--min-touch-size': `${touchAreaSize}px`,
      animationDelay: shouldEnableAnimations ? `${delay}ms` : '0ms',
      animationDuration: shouldEnableAnimations ? `${getOptimalDuration(600)}ms` : '0ms',
      transform: `scale(${cardSizeMultiplier})`,
      minHeight: interactive ? touchAreaSize : 'auto',
      minWidth: interactive ? touchAreaSize : 'auto',
      cursor: interactive ? 'pointer' : 'default',
      transition: shouldEnableAnimations ? 'transform 0.2s ease, box-shadow 0.2s ease' : 'none'
    } as React.CSSProperties;
  };

  const cardClasses = [
    'responsive-card',
    className,
    getAnimationClass(),
    interactive ? 'card-interactive' : '',
    isHovered && shouldUseHoverEffects() ? 'card-hovered' : '',
    shouldEnableAnimations ? 'gpu-accelerated' : ''
  ].filter(Boolean).join(' ');

  const cardProps = {
    ref: cardRef,
    className: cardClasses,
    style: getCardStyles(),
    onClick: interactive ? handleClick : undefined,
    onMouseEnter: interactive ? handleMouseEnter : undefined,
    onMouseLeave: interactive ? handleMouseLeave : undefined,
    'aria-label': ariaLabel,
    role: role || (interactive ? 'button' : undefined),
    tabIndex: interactive ? 0 : undefined,
    onKeyDown: interactive ? (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    } : undefined
  };

  return (
    <div {...cardProps}>
      {children}
      {/* Screen reader content for animations */}
      {shouldEnableAnimations && (
        <span className="sr-only">
          {isVisible ? 'Content loaded' : 'Loading content'}
        </span>
      )}
    </div>
  );
};

// Higher-order component for adding responsive behavior to existing cards
export function withResponsiveAnimation<P extends object>(
  Component: React.ComponentType<P>
) {
  return React.forwardRef<any, P & ResponsiveCardProps>((props, ref) => {
    const { animationType, delay, interactive, ...componentProps } = props;
    
    return (
      <ResponsiveCard
        animationType={animationType}
        delay={delay}
        interactive={interactive}
      >
        <Component {...(componentProps as P)} ref={ref} />
      </ResponsiveCard>
    );
  });
}

export default ResponsiveCard;