'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CardPhysics } from '../card-physics';
import { useResponsiveAnimation } from '../responsive-controller';
import type { Position } from '../types';

export interface AnimatedCardProps {
  id: string;
  front: React.ReactNode;
  back?: React.ReactNode;
  logoUrl?: string;
  logoAlt?: string;
  position?: Position;
  isFlipped?: boolean;
  onFlip?: (isFlipped: boolean) => void;
  onClick?: () => void;
  onHover?: (isHovered: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  flipAxis?: 'x' | 'y';
  flipDuration?: number;
  hoverIntensity?: number;
  showLogo?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  id,
  front,
  back,
  logoUrl = '/purple filled.svg',
  logoAlt = 'TechQS Logo',
  position = { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0 } },
  isFlipped = false,
  onFlip,
  onClick,
  onHover,
  className = '',
  style = {},
  disabled = false,
  flipAxis = 'y',
  flipDuration = 600,
  hoverIntensity = 1,
  showLogo = true
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [internalFlipped, setInternalFlipped] = useState(isFlipped);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const currentAnimation = useRef<Animation | null>(null);

  // Responsive animation hooks
  const {
    shouldEnableAnimations,
    getOptimalDuration,
    getTouchAreaSize,
    shouldUseHoverEffects,
    getCardSizeMultiplier,
    getCSSCustomProperties
  } = useResponsiveAnimation();

  // Sync internal state with prop
  useEffect(() => {
    setInternalFlipped(isFlipped);
  }, [isFlipped]);

  // Set up initial position and GPU optimization
  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    CardPhysics.optimizeForGPU(cardElement);
    
    // Apply initial position
    const transformString = `translateX(${position.x}px) translateY(${position.y}px) translateZ(${position.z}px) rotateX(${position.rotation.x}deg) rotateY(${position.rotation.y}deg) rotateZ(${position.rotation.z}deg)`;
    cardElement.style.transform = transformString;

    return () => {
      CardPhysics.removeGPUOptimization(cardElement);
    };
  }, [position]);

  // Set up accessibility
  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    // Add basic accessibility attributes
    cardElement.setAttribute('aria-describedby', `${id}-description`);

    return () => {
      // Cleanup
    };
  }, [id]);

  const handleFlip = useCallback(async () => {
    if (disabled || isAnimating) return;

    const cardElement = cardRef.current;
    if (!cardElement) return;

    setIsAnimating(true);

    try {
      // Cancel any existing animation
      if (currentAnimation.current) {
        currentAnimation.current.cancel();
      }

      // Create card element with required properties
      const cardElementWithProps = cardElement as any;
      cardElementWithProps.cardId = id;
      cardElementWithProps.animationState = {
        id,
        position,
        isFlipped: internalFlipped,
        isHovered,
        isSelected: false,
        animationState: 'animating'
      };

      // Perform flip animation
      const animation = CardPhysics.flip(cardElementWithProps, flipAxis);
      currentAnimation.current = animation;

      // Wait for animation to complete
      await animation.finished;

      // Update state
      const newFlippedState = !internalFlipped;
      setInternalFlipped(newFlippedState);
      onFlip?.(newFlippedState);

    } catch (error) {
      console.warn('Card flip animation error:', error);
    } finally {
      setIsAnimating(false);
      currentAnimation.current = null;
    }
  }, [disabled, isAnimating, id, position, internalFlipped, isHovered, flipAxis, onFlip]);

  const handleHover = useCallback(async (hovered: boolean) => {
    if (disabled || isAnimating || !shouldUseHoverEffects()) return;

    const cardElement = cardRef.current;
    if (!cardElement) return;

    setIsHovered(hovered);
    onHover?.(hovered);

    if (hovered && shouldEnableAnimations) {
      try {
        // Create card element with required properties
        const cardElementWithProps = cardElement as any;
        cardElementWithProps.cardId = id;
        cardElementWithProps.animationState = {
          id,
          position,
          isFlipped: internalFlipped,
          isHovered: true,
          isSelected: false,
          animationState: 'animating'
        };

        // Perform hover animation with responsive intensity
        const responsiveIntensity = getCardSizeMultiplier() * hoverIntensity;
        const animation = CardPhysics.hover(cardElementWithProps, responsiveIntensity);
        await animation.finished;

      } catch (error) {
        console.warn('Card hover animation error:', error);
      }
    }
  }, [disabled, isAnimating, id, position, internalFlipped, hoverIntensity, onHover, shouldUseHoverEffects, shouldEnableAnimations, getCardSizeMultiplier]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    onClick?.();
    
    // Auto-flip on click if no custom click handler
    if (!onClick) {
      handleFlip();
    }
  }, [disabled, onClick, handleFlip]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }, [disabled, handleClick]);

  const handleMouseEnter = useCallback(() => {
    handleHover(true);
  }, [handleHover]);

  const handleMouseLeave = useCallback(() => {
    handleHover(false);
  }, [handleHover]);

  // Create default back content with logo
  const defaultBack = (
    <div 
      className="card-back-content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        position: 'relative'
      }}
    >
      {showLogo && logoUrl && (
        <div 
          className="card-logo"
          style={{
            marginBottom: '16px',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }}
        >
          <img 
            src={logoUrl} 
            alt={logoAlt}
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
      <div 
        className="card-pattern"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          opacity: 0.3
        }}
      >
        {/* Decorative pattern */}
        <div 
          className="pattern-lines"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%'
          }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <div 
              key={i} 
              className="pattern-line"
              style={{
                position: 'absolute',
                width: '100%',
                height: '1px',
                background: 'rgba(255,255,255,0.1)',
                top: `${20 + i * 15}%`,
                transform: `rotate(${-45 + i * 10}deg)`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // Calculate responsive dimensions and styles
  const cardSizeMultiplier = getCardSizeMultiplier();
  const touchAreaSize = getTouchAreaSize();
  const responsiveDuration = getOptimalDuration(flipDuration);
  const customProperties = getCSSCustomProperties();

  const cardStyles: React.CSSProperties = {
    position: 'relative',
    width: `${120 * cardSizeMultiplier}px`,
    height: `${180 * cardSizeMultiplier}px`,
    minWidth: touchAreaSize,
    minHeight: touchAreaSize,
    transformStyle: 'preserve-3d',
    transition: isAnimating || !shouldEnableAnimations ? 'none' : `transform ${responsiveDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    cursor: disabled ? 'default' : 'pointer',
    ...customProperties,
    ...style
  };

  return (
    <div
      ref={cardRef}
      className={`animated-card responsive-card ${className} ${internalFlipped ? 'flipped' : ''} ${isHovered ? 'hovered' : ''} ${isAnimating ? 'animating' : ''}`}
      style={cardStyles}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={`Card ${id}${internalFlipped ? ' (flipped)' : ''}`}
      aria-pressed={internalFlipped}
      aria-disabled={disabled}
      data-card-id={id}
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
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          transform: internalFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {front}
      </div>
      
      {/* Card Back */}
      <div
        className="card-face card-back"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: internalFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          color: 'white'
        }}
      >
        {back || defaultBack}
      </div>

      {/* Focus indicator for accessibility */}
      <div
        className="card-focus-indicator"
        style={{
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          right: '-2px',
          bottom: '-2px',
          borderRadius: '10px',
          border: '2px solid transparent',
          pointerEvents: 'none',
          transition: 'border-color 0.2s ease'
        }}
      />

      {/* Add CSS for hover and focus effects */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .animated-card:focus .card-focus-indicator {
            border-color: #667eea;
          }
          
          .animated-card:hover .card-face {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          
          .animated-card.animating {
            pointer-events: none;
          }
          
          @media (prefers-reduced-motion: reduce) {
            .animated-card {
              transition: none !important;
            }
            
            .card-face {
              transition: none !important;
            }
          }
        `
      }} />


    </div>
  );
};

export default AnimatedCard;