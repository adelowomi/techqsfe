'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CardPhysics } from '../card-physics';
import { useOptimizedAnimation, useStaggeredAnimations } from '../../hooks/useOptimizedAnimation';
import { useResponsiveAnimation } from '../responsive-controller';
import type { Position, CardData, AnimationType, CardElement } from '../types';

export interface CardAnimationProps {
  variant: AnimationType;
  cards: CardData[];
  autoPlay?: boolean;
  trigger?: 'scroll' | 'hover' | 'click' | 'auto';
  duration?: number;
  stagger?: number;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CardAnimation: React.FC<CardAnimationProps> = ({
  variant,
  cards,
  autoPlay = false,
  trigger = 'auto',
  duration = 600,
  stagger = 100,
  onAnimationStart,
  onAnimationEnd,
  className = '',
  style
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [isAnimating, setIsAnimating] = useState(false);

  // Use responsive animation hooks
  const {
    shouldEnableAnimations,
    getOptimalDuration,
    getOptimalStagger,
    getCardSizeMultiplier,
    getCSSCustomProperties
  } = useResponsiveAnimation();

  // Use optimized animation for container
  const [containerElementRef, containerControls] = useOptimizedAnimation({
    enabled: shouldEnableAnimations,
    priority: 'medium',
    onComplete: () => {
      setIsAnimating(false);
      onAnimationEnd?.();
    },
    onError: (error) => {
      console.error('Card animation error:', error);
      setIsAnimating(false);
      onAnimationEnd?.();
    }
  });

  // Use staggered animations for individual cards
  const cardAnimations = useStaggeredAnimations(cards.length, {
    enabled: shouldEnableAnimations,
    priority: 'medium',
    stagger: getOptimalStagger(stagger)
  });

  // Sync container ref
  useEffect(() => {
    if (containerRef.current && containerElementRef.current !== containerRef.current) {
      (containerElementRef as any).current = containerRef.current;
    }
  }, [containerElementRef]);

  // Auto-play animation on mount
  useEffect(() => {
    if (autoPlay && trigger === 'auto') {
      playAnimation();
    }
  }, [autoPlay, trigger]);

  // Set up card refs and GPU optimization
  useEffect(() => {
    cards.forEach(card => {
      const cardElement = cardRefs.current.get(card.id);
      if (cardElement) {
        CardPhysics.optimizeForGPU(cardElement);
        
        // Set initial position
        const transformString = `translateX(${card.position.x}px) translateY(${card.position.y}px) translateZ(${card.position.z}px) rotateX(${card.rotation.x}deg) rotateY(${card.rotation.y}deg) rotateZ(${card.rotation.z}deg)`;
        cardElement.style.transform = transformString;
      }
    });

    return () => {
      // Cleanup GPU optimizations
      cards.forEach(card => {
        const cardElement = cardRefs.current.get(card.id);
        if (cardElement) {
          CardPhysics.removeGPUOptimization(cardElement);
        }
      });
    };
  }, [cards]);

  const playAnimation = useCallback(async () => {
    if (isAnimating || !shouldEnableAnimations) return;

    setIsAnimating(true);
    onAnimationStart?.();

    try {
      const optimizedDuration = getOptimalDuration(duration);
      const optimizedStagger = getOptimalStagger(stagger);

      // Generate keyframes based on animation variant
      const keyframes = generateKeyframesForVariant(variant);
      const animationOptions: Partial<KeyframeAnimationOptions> = {
        duration: optimizedDuration,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        fill: 'forwards'
      };

      // Start container animation
      await containerControls.start(keyframes, animationOptions);

      // Start staggered card animations if available
      if (cardAnimations.length > 0 && cardAnimations[0] && (cardAnimations[0][1] as any).startAll) {
        const cardKeyframes = generateCardKeyframes(variant);
        await (cardAnimations[0][1] as any).startAll(cardKeyframes, {
          ...animationOptions,
          duration: optimizedDuration * 0.8 // Slightly faster for individual cards
        });
      }

    } catch (error) {
      console.error('Optimized animation error:', error);
      setIsAnimating(false);
      onAnimationEnd?.();
    }
  }, [variant, duration, stagger, isAnimating, shouldEnableAnimations, getOptimalDuration, getOptimalStagger, onAnimationStart, onAnimationEnd, containerControls, cardAnimations]);

  // Generate keyframes based on animation variant
  const generateKeyframesForVariant = useCallback((animationVariant: AnimationType): Keyframe[] => {
    switch (animationVariant) {
      case 'shuffle':
        return [
          { transform: 'translateX(0) translateY(0) rotateZ(0deg)', opacity: 1 },
          { transform: 'translateX(-20px) translateY(-10px) rotateZ(-5deg)', opacity: 0.9 },
          { transform: 'translateX(20px) translateY(-20px) rotateZ(5deg)', opacity: 0.8 },
          { transform: 'translateX(-10px) translateY(-5px) rotateZ(-2deg)', opacity: 0.9 },
          { transform: 'translateX(0) translateY(0) rotateZ(0deg)', opacity: 1 }
        ];
      case 'deal':
        return [
          { transform: 'translateX(-100px) translateY(-50px) rotateZ(-10deg)', opacity: 0 },
          { transform: 'translateX(0) translateY(0) rotateZ(0deg)', opacity: 1 }
        ];
      case 'flip':
        return [
          { transform: 'rotateY(0deg)' },
          { transform: 'rotateY(90deg)' },
          { transform: 'rotateY(180deg)' }
        ];
      case 'hover':
        return [
          { transform: 'translateY(0) rotateX(0deg) scale(1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
          { transform: 'translateY(-10px) rotateX(5deg) scale(1.05)', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }
        ];
      case 'stack':
        return [
          { transform: 'translateZ(0px) rotateZ(0deg)', opacity: 1 },
          { transform: 'translateZ(10px) rotateZ(2deg)', opacity: 0.95 }
        ];
      default:
        return [
          { opacity: 0, transform: 'translateY(20px)' },
          { opacity: 1, transform: 'translateY(0px)' }
        ];
    }
  }, []);

  const generateCardKeyframes = useCallback((animationVariant: AnimationType): Keyframe[] => {
    // Simplified keyframes for individual cards
    switch (animationVariant) {
      case 'shuffle':
        return [
          { transform: 'rotateZ(0deg)', opacity: 1 },
          { transform: 'rotateZ(5deg)', opacity: 0.9 },
          { transform: 'rotateZ(0deg)', opacity: 1 }
        ];
      default:
        return [
          { opacity: 0.8, transform: 'scale(0.95)' },
          { opacity: 1, transform: 'scale(1)' }
        ];
    }
  }, []);

  const handleCardRef = useCallback((cardId: string) => (ref: HTMLDivElement | null) => {
    if (ref) {
      cardRefs.current.set(cardId, ref);
    } else {
      cardRefs.current.delete(cardId);
    }
  }, []);

  const handleTrigger = useCallback((event: React.MouseEvent | React.KeyboardEvent) => {
    if (trigger === 'click' || (trigger === 'hover' && event.type === 'mouseenter')) {
      playAnimation();
    }
  }, [trigger, playAnimation]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (trigger === 'click' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      playAnimation();
    }
  }, [trigger, playAnimation]);

  // Get responsive styles
  const cardSizeMultiplier = getCardSizeMultiplier();
  const customProperties = getCSSCustomProperties();

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        (containerElementRef as any).current = el;
      }}
      className={`card-animation-container ${className}`}
      style={{
        position: 'relative',
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        ...customProperties,
        ...style
      }}
      onClick={handleTrigger}
      onMouseEnter={trigger === 'hover' ? handleTrigger : undefined}
      onKeyDown={handleKeyDown}
      tabIndex={trigger === 'click' ? 0 : -1}
      role={trigger === 'click' ? 'button' : undefined}
      aria-label={trigger === 'click' ? `Play ${variant} animation` : undefined}
    >
      {cards.map((card, index) => {
        const [cardRef] = cardAnimations[index] || [React.createRef(), null];
        
        return (
          <div
            key={card.id}
            ref={(el) => {
              handleCardRef(card.id)(el);
              if (cardRef) {
                (cardRef as any).current = el;
              }
            }}
            className="animated-card"
            style={{
              position: 'absolute',
              width: `${120 * cardSizeMultiplier}px`,
              height: `${180 * cardSizeMultiplier}px`,
              transformStyle: 'preserve-3d',
              transition: isAnimating || !shouldEnableAnimations ? 'none' : 'transform 0.3s ease',
              zIndex: index,
              cursor: trigger === 'click' ? 'pointer' : 'default',
              transform: `translateX(${card.position.x * cardSizeMultiplier}px) translateY(${card.position.y * cardSizeMultiplier}px) translateZ(${card.position.z}px) rotateX(${card.rotation.x}deg) rotateY(${card.rotation.y}deg) rotateZ(${card.rotation.z}deg)`
            }}
            data-card-id={card.id}
          >
          {/* Card Front */}
          <div
            className="card-face card-front"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              background: 'white',
              border: '1px solid #e2e8f0'
            }}
          >
            {card.front}
          </div>
          
          {/* Card Back */}
          <div
            className="card-face card-back"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: '1px solid #e2e8f0'
            }}
          >
            {card.back}
          </div>
        </div>
        );
      })}
      
      {/* Animation Status Indicator (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            left: '0',
            fontSize: '12px',
            color: '#666',
            pointerEvents: 'none'
          }}
        >
          {isAnimating ? `Animating: ${variant}` : 'Ready'}
          <span style={{ marginLeft: '10px' }}>
            Active: {containerControls.metrics.activeAnimations}
          </span>
          <span style={{ marginLeft: '10px' }}>
            FPS: {containerControls.metrics.fps}
          </span>
          <span style={{ marginLeft: '10px' }}>
            Tier: {containerControls.metrics.performanceTier}
          </span>
        </div>
      )}
    </div>
  );
};

export default CardAnimation;