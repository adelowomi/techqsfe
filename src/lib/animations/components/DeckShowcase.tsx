'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollAnimationController } from '../scroll-controller';
import { CardPhysics } from '../card-physics';
import type { Difficulty } from '~/lib/types';

export interface DeckData {
  difficulty: Difficulty;
  totalCards: number;
  usedCards: number;
  averageUsage: number;
  color: string;
  description: string;
}

export interface DeckShowcaseProps {
  decks: DeckData[];
  logoUrl?: string;
  logoAlt?: string;
  className?: string;
  style?: React.CSSProperties;
  onDeckSelect?: (difficulty: Difficulty) => void;
  staggerDelay?: number;
  title?: string;
  subtitle?: string;
}

export const DeckShowcase: React.FC<DeckShowcaseProps> = ({
  decks,
  logoUrl = '/purple filled.svg',
  logoAlt = 'TechQS Logo',
  className = '',
  style = {},
  onDeckSelect,
  staggerDelay = 150,
  title = 'Card Decks',
  subtitle = 'Choose your difficulty level'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollController = useRef<ScrollAnimationController | null>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const [hoveredDeck, setHoveredDeck] = useState<Difficulty | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<Difficulty | null>(null);
  const deckRefs = useRef<Map<Difficulty, HTMLDivElement>>(new Map());

  // Initialize scroll controller and entrance animations
  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;

    // Initialize scroll controller
    scrollController.current = new ScrollAnimationController();

    // Set initial state for entrance animation
    containerElement.style.opacity = '0';
    containerElement.style.transform = 'translateY(50px)';

    // Custom intersection observer for entrance animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasEnteredView) {
            setHasEnteredView(true);
            animateEntrance();
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(containerElement);

    return () => {
      observer.disconnect();
      if (scrollController.current) {
        scrollController.current.destroy();
      }
    };
  }, [hasEnteredView]);

  const animateEntrance = useCallback(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;

    // Animate container entrance
    const containerAnimation = new Animation(
      new KeyframeEffect(containerElement, [
        { opacity: '0', transform: 'translateY(50px)' },
        { opacity: '1', transform: 'translateY(0)' }
      ], {
        duration: 600,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
      }),
      document.timeline
    );

    containerAnimation.play();

    // Animate deck cards with stagger
    deckRefs.current.forEach((deckElement, difficulty) => {
      const index = decks.findIndex(deck => deck.difficulty === difficulty);
      const delay = index * staggerDelay;

      // Set initial state
      deckElement.style.opacity = '0';
      deckElement.style.transform = 'translateY(30px) scale(0.95) rotateX(5deg)';

      // Create staggered entrance animation
      setTimeout(() => {
        const deckAnimation = new Animation(
          new KeyframeEffect(deckElement, [
            { 
              opacity: '0', 
              transform: 'translateY(30px) scale(0.95) rotateX(5deg)',
              filter: 'blur(2px)'
            },
            { 
              opacity: '1', 
              transform: 'translateY(0) scale(1) rotateX(0deg)',
              filter: 'blur(0px)'
            }
          ], {
            duration: 700,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards'
          }),
          document.timeline
        );

        deckAnimation.play();

        // Add card stack animation after entrance
        setTimeout(() => {
          animateCardStack(deckElement, difficulty);
        }, 400);
      }, delay);
    });
  }, [decks, staggerDelay]);

  const animateCardStack = useCallback(async (deckElement: HTMLDivElement, difficulty: Difficulty) => {
    const cardElements = deckElement.querySelectorAll('.deck-card');
    if (cardElements.length === 0) return;

    try {
      // Create card elements with required properties for CardPhysics
      const cardElementsWithProps = Array.from(cardElements).map((card, index) => {
        const cardWithProps = card as any;
        cardWithProps.cardId = `${difficulty}-card-${index}`;
        cardWithProps.animationState = {
          id: `${difficulty}-card-${index}`,
          position: { x: 0, y: 0, z: index * 2, rotation: { x: 0, y: 0, z: 0 } },
          isFlipped: false,
          isHovered: false,
          isSelected: false,
          animationState: 'idle'
        };
        return cardWithProps;
      });

      // Animate card stack with physics
      const stackAnimations = CardPhysics.stack(cardElementsWithProps, 3);
      await Promise.all(stackAnimations.map(animation => animation.finished));

    } catch (error) {
      console.warn('Deck stack animation error:', error);
    }
  }, []);

  const handleDeckHover = useCallback(async (difficulty: Difficulty, hovered: boolean) => {
    setHoveredDeck(hovered ? difficulty : null);

    const deckElement = deckRefs.current.get(difficulty);
    if (!deckElement) return;

    if (hovered) {
      try {
        // Create deck element with required properties
        const deckElementWithProps = deckElement as any;
        deckElementWithProps.cardId = `deck-${difficulty}`;
        deckElementWithProps.animationState = {
          id: `deck-${difficulty}`,
          position: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0 } },
          isFlipped: false,
          isHovered: true,
          isSelected: selectedDeck === difficulty,
          animationState: 'animating'
        };

        // Perform hover animation
        const animation = CardPhysics.hover(deckElementWithProps, 0.8);
        await animation.finished;

      } catch (error) {
        console.warn('Deck hover animation error:', error);
      }
    }
  }, [selectedDeck]);

  const handleDeckClick = useCallback((difficulty: Difficulty) => {
    setSelectedDeck(difficulty);
    onDeckSelect?.(difficulty);
  }, [onDeckSelect]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, difficulty: Difficulty) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDeckClick(difficulty);
    }
  }, [handleDeckClick]);

  const getDifficultyColor = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case 'EASY':
        return '#10b981'; // green-500
      case 'MEDIUM':
        return '#f59e0b'; // amber-500
      case 'HARD':
        return '#ef4444'; // red-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getDifficultyLabel = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case 'EASY':
        return 'Easy';
      case 'MEDIUM':
        return 'Medium';
      case 'HARD':
        return 'Hard';
      default:
        return difficulty;
    }
  };

  const getUsagePercentage = (deck: DeckData): number => {
    return deck.totalCards > 0 ? (deck.usedCards / deck.totalCards) * 100 : 0;
  };

  return (
    <div
      ref={containerRef}
      className={`deck-showcase ${className}`}
      style={{
        padding: '48px 24px',
        ...style
      }}
      role="region"
      aria-label="Card deck showcase"
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '2.5rem',
          fontWeight: '700',
          color: '#1a202c',
          lineHeight: '1.2'
        }}>
          {title}
        </h2>
        <p style={{
          margin: '0',
          fontSize: '1.125rem',
          color: '#4a5568',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          {subtitle}
        </p>
      </div>

      {/* Deck Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '32px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {decks.map((deck) => {
          const usagePercentage = getUsagePercentage(deck);
          const difficultyColor = getDifficultyColor(deck.difficulty);
          const isHovered = hoveredDeck === deck.difficulty;
          const isSelected = selectedDeck === deck.difficulty;

          return (
            <div
              key={deck.difficulty}
              ref={(el) => {
                if (el) {
                  deckRefs.current.set(deck.difficulty, el);
                }
              }}
              className={`deck-container ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
              style={{
                position: 'relative',
                cursor: onDeckSelect ? 'pointer' : 'default',
                transformStyle: 'preserve-3d'
              }}
              onClick={() => handleDeckClick(deck.difficulty)}
              onMouseEnter={() => handleDeckHover(deck.difficulty, true)}
              onMouseLeave={() => handleDeckHover(deck.difficulty, false)}
              onKeyDown={(e) => handleKeyDown(e, deck.difficulty)}
              tabIndex={onDeckSelect ? 0 : -1}
              role={onDeckSelect ? 'button' : 'article'}
              aria-label={`${getDifficultyLabel(deck.difficulty)} deck: ${deck.usedCards}/${deck.totalCards} cards used`}
              aria-pressed={onDeckSelect ? isSelected : undefined}
            >
              {/* Main Deck Card */}
              <div
                className="deck-card main-card"
                style={{
                  width: '100%',
                  height: '280px',
                  borderRadius: '16px',
                  background: 'white',
                  border: `2px solid ${difficultyColor}`,
                  boxShadow: isSelected 
                    ? `0 8px 32px ${difficultyColor}40` 
                    : '0 4px 16px rgba(0,0,0,0.1)',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
                }}
              >
                {/* Background Pattern */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.05,
                    background: `linear-gradient(135deg, ${difficultyColor} 0%, transparent 100%)`
                  }}
                />

                {/* Header */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <img 
                        src={logoUrl} 
                        alt={logoAlt}
                        style={{
                          width: '32px',
                          height: '32px',
                          filter: `hue-rotate(${deck.difficulty === 'EASY' ? '120deg' : deck.difficulty === 'MEDIUM' ? '30deg' : '0deg'})`
                        }}
                      />
                      <h3 style={{
                        margin: '0',
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        color: difficultyColor
                      }}>
                        {getDifficultyLabel(deck.difficulty)}
                      </h3>
                    </div>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: difficultyColor,
                        boxShadow: `0 0 12px ${difficultyColor}60`
                      }}
                    />
                  </div>

                  <p style={{
                    margin: '0 0 24px 0',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    {deck.description}
                  </p>
                </div>

                {/* Statistics */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Total Cards
                      </div>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#1f2937'
                      }}>
                        {deck.totalCards}
                      </div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Used Cards
                      </div>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: difficultyColor
                      }}>
                        {deck.usedCards}
                      </div>
                    </div>
                  </div>

                  {/* Usage Progress Bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Usage
                      </span>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        {Math.round(usagePercentage)}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          width: `${usagePercentage}%`,
                          height: '100%',
                          backgroundColor: difficultyColor,
                          borderRadius: '4px',
                          transition: 'width 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
                          boxShadow: `0 0 8px ${difficultyColor}40`
                        }}
                      />
                    </div>
                  </div>

                  {/* Average Usage */}
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    Avg. usage per card: <span style={{ fontWeight: '600', color: '#1f2937' }}>
                      {deck.averageUsage.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stack Effect Cards */}
              <div
                className="deck-card stack-card-1"
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '4px',
                  right: '4px',
                  height: '280px',
                  borderRadius: '16px',
                  background: 'white',
                  border: `1px solid ${difficultyColor}40`,
                  zIndex: -1,
                  transform: 'translateZ(-4px) rotateX(2deg)'
                }}
              />
              <div
                className="deck-card stack-card-2"
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  right: '8px',
                  height: '280px',
                  borderRadius: '16px',
                  background: 'white',
                  border: `1px solid ${difficultyColor}20`,
                  zIndex: -2,
                  transform: 'translateZ(-8px) rotateX(4deg)'
                }}
              />

              {/* Selection Indicator */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    right: '-4px',
                    bottom: '-4px',
                    borderRadius: '20px',
                    border: `3px solid ${difficultyColor}`,
                    pointerEvents: 'none',
                    animation: 'pulse 2s infinite'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Inline styles for animations and responsive design */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .deck-container:hover .main-card {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          }
          
          .deck-container:hover .stack-card-1 {
            transform: translateZ(-4px) rotateX(2deg) translateY(-4px);
          }
          
          .deck-container:hover .stack-card-2 {
            transform: translateZ(-8px) rotateX(4deg) translateY(-2px);
          }
          
          .deck-container:focus {
            outline: none;
          }
          
          .deck-container:focus .main-card {
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.5);
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          
          @media (prefers-reduced-motion: reduce) {
            .deck-container:hover .main-card,
            .deck-container:hover .stack-card-1,
            .deck-container:hover .stack-card-2 {
              transform: none !important;
            }
            
            .deck-container .main-card {
              transition: none !important;
            }
          }
          
          @media (max-width: 768px) {
            .deck-showcase {
              padding: 32px 16px !important;
            }
            
            .deck-showcase h2 {
              font-size: 2rem !important;
            }
            
            .deck-container .main-card {
              height: 240px !important;
              padding: 24px !important;
            }
          }
          
          @media (max-width: 480px) {
            .deck-showcase h2 {
              font-size: 1.75rem !important;
            }
            
            .deck-container .main-card {
              height: 220px !important;
              padding: 20px !important;
            }
          }
        `
      }} />
    </div>
  );
};

export default DeckShowcase;