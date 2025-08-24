'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollAnimationController } from '../scroll-controller';
import { CardPhysics } from '../card-physics';

export interface DemoCard {
  id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface GameDemoProps {
  demoCards: DemoCard[];
  autoAdvance?: boolean;
  showControls?: boolean;
  autoPlay?: boolean;
  stepDuration?: number;
  className?: string;
  style?: React.CSSProperties;
  onStepChange?: (step: number) => void;
}

type GameStep = 'intro' | 'dealing' | 'question' | 'thinking' | 'answer' | 'scoring' | 'complete';

export const GameDemo: React.FC<GameDemoProps> = ({
  demoCards,
  autoAdvance = true,
  showControls = true,
  autoPlay = false,
  stepDuration = 3000,
  className = '',
  style = {},
  onStepChange
}) => {
  const demoRef = useRef<HTMLDivElement>(null);
  const scrollController = useRef<ScrollAnimationController | null>(null);
  const [currentStep, setCurrentStep] = useState<GameStep>('intro');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const [score, setScore] = useState(0);
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const steps: GameStep[] = ['intro', 'dealing', 'question', 'thinking', 'answer', 'scoring', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);

  // Initialize scroll controller and entrance animation
  useEffect(() => {
    const demoElement = demoRef.current;
    if (!demoElement) return;

    scrollController.current = new ScrollAnimationController();

    // Set up entrance animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasEnteredView) {
            setHasEnteredView(true);
            if (autoPlay) {
              startDemo();
            }
          }
        });
      },
      { threshold: 0.3, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(demoElement);

    return () => {
      observer.disconnect();
      if (scrollController.current) {
        scrollController.current.destroy();
      }
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }
    };
  }, [hasEnteredView, autoPlay]);

  // Auto-advance logic
  useEffect(() => {
    if (isPlaying && autoAdvance && currentStep !== 'complete') {
      stepTimeoutRef.current = setTimeout(() => {
        nextStep();
      }, stepDuration);
    }

    return () => {
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }
    };
  }, [currentStep, isPlaying, autoAdvance, stepDuration]);

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(currentStepIndex);
  }, [currentStepIndex, onStepChange]);

  const startDemo = useCallback(() => {
    setIsPlaying(true);
    setCurrentStep('intro');
    setCurrentCardIndex(0);
    setScore(0);
  }, []);

  const stopDemo = useCallback(() => {
    setIsPlaying(false);
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
    }
  }, []);

  const resetDemo = useCallback(() => {
    stopDemo();
    setCurrentStep('intro');
    setCurrentCardIndex(0);
    setScore(0);
  }, [stopDemo]);

  const nextStep = useCallback(() => {
    const nextStepIndex = currentStepIndex + 1;
    
    if (nextStepIndex < steps.length) {
      const nextStepName = steps[nextStepIndex];
      if (nextStepName) {
        setCurrentStep(nextStepName);
        
        // Handle special step logic
        if (nextStepName === 'scoring') {
          // Simulate scoring
          setScore(prev => prev + (Math.random() > 0.3 ? 10 : 0));
        } else if (nextStepName === 'complete') {
          setIsPlaying(false);
        }
      }
    } else {
      // Move to next card or complete
      if (currentCardIndex < demoCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setCurrentStep('dealing');
      } else {
        setCurrentStep('complete');
        setIsPlaying(false);
      }
    }
  }, [currentStepIndex, steps, currentCardIndex, demoCards.length]);

  const previousStep = useCallback(() => {
    const prevStepIndex = currentStepIndex - 1;
    
    if (prevStepIndex >= 0) {
      const prevStepName = steps[prevStepIndex];
      if (prevStepName) {
        setCurrentStep(prevStepName);
      }
    } else if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setCurrentStep('scoring');
    }
  }, [currentStepIndex, steps, currentCardIndex]);

  const handleCardRef = useCallback((cardId: string) => (ref: HTMLDivElement | null) => {
    if (ref) {
      cardRefs.current.set(cardId, ref);
      CardPhysics.optimizeForGPU(ref);
    } else {
      const existingRef = cardRefs.current.get(cardId);
      if (existingRef) {
        CardPhysics.removeGPUOptimization(existingRef);
      }
      cardRefs.current.delete(cardId);
    }
  }, []);

  const currentCard = demoCards[currentCardIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const getStepDescription = () => {
    switch (currentStep) {
      case 'intro':
        return 'Welcome to TechQS! Let\'s see how the game works.';
      case 'dealing':
        return 'Drawing a question card from the deck...';
      case 'question':
        return 'Here\'s your question! Take your time to think.';
      case 'thinking':
        return 'Thinking... What\'s your answer?';
      case 'answer':
        return 'Here\'s the correct answer!';
      case 'scoring':
        return `Great job! You earned ${score > 0 ? '10' : '0'} points.`;
      case 'complete':
        return `Demo complete! Final score: ${score} points.`;
      default:
        return '';
    }
  };

  const getDifficultyColor = (difficulty: DemoCard['difficulty']) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div
      ref={demoRef}
      className={`game-demo ${className}`}
      style={{
        padding: '40px 20px',
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center',
        ...style
      }}
    >
      {/* Demo Header */}
      <div className="game-demo-header" style={{ marginBottom: '32px' }}>
        <h3 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#1a202c',
          margin: '0 0 16px 0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Game Demo
        </h3>
        <p style={{
          fontSize: '1rem',
          color: '#4a5568',
          margin: '0 0 24px 0',
          lineHeight: '1.6'
        }}>
          {getStepDescription()}
        </p>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#e2e8f0',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            transition: 'width 0.5s ease',
            borderRadius: '2px'
          }} />
        </div>
      </div>

      {/* Game Area */}
      <div className="game-demo-area" style={{
        position: 'relative',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '32px'
      }}>
        {/* Card Display */}
        {currentCard && (currentStep === 'dealing' || currentStep === 'question' || currentStep === 'thinking' || currentStep === 'answer' || currentStep === 'scoring') && (
          <div
            ref={handleCardRef(currentCard.id)}
            className={`demo-card ${currentStep === 'dealing' ? 'dealing' : ''}`}
            style={{
              width: '300px',
              height: '200px',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              background: 'white',
              border: `3px solid ${getDifficultyColor(currentCard.difficulty)}`,
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              position: 'relative',
              transform: currentStep === 'dealing' ? 'translateY(-20px) rotateX(10deg)' : 'translateY(0) rotateX(0)',
              transition: 'all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
              animation: currentStep === 'dealing' ? 'cardDeal 0.8s ease-out' : 'none'
            }}
          >
            {/* Difficulty Badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              padding: '4px 8px',
              borderRadius: '12px',
              backgroundColor: getDifficultyColor(currentCard.difficulty),
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {currentCard.difficulty}
            </div>

            {/* Category */}
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '16px',
              fontWeight: '500'
            }}>
              {currentCard.category}
            </div>

            {/* Question/Answer Content */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              {currentStep === 'question' || currentStep === 'thinking' ? (
                <div>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1a202c',
                    margin: '0',
                    lineHeight: '1.4'
                  }}>
                    {currentCard.question}
                  </h4>
                  {currentStep === 'thinking' && (
                    <div style={{
                      marginTop: '16px',
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      fontStyle: 'italic'
                    }}>
                      Thinking...
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#059669',
                    marginBottom: '8px',
                    fontWeight: '600'
                  }}>
                    Answer:
                  </div>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1a202c',
                    lineHeight: '1.4'
                  }}>
                    {currentCard.answer}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deck Representation */}
        {(currentStep === 'intro' || currentStep === 'dealing') && (
          <div className="card-deck" style={{
            position: 'relative',
            width: '120px',
            height: '180px'
          }}>
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: '1px solid #5a67d8',
                  transform: `translateX(${index * 2}px) translateY(${index * -2}px) rotateZ(${index * 2}deg)`,
                  zIndex: 3 - index,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  animation: currentStep === 'dealing' && index === 2 ? 'cardFly 0.8s ease-out forwards' : 'none'
                }}
              >
                <img 
                  src="/purple filled.svg" 
                  alt="TechQS Logo"
                  style={{
                    width: '40px',
                    height: '40px',
                    filter: 'brightness(0) invert(1)'
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Score Display */}
        {currentStep === 'scoring' && (
          <div style={{
            marginTop: '24px',
            padding: '16px 24px',
            borderRadius: '12px',
            background: score > 0 ? '#d1fae5' : '#fef3c7',
            border: `2px solid ${score > 0 ? '#10b981' : '#f59e0b'}`,
            color: score > 0 ? '#065f46' : '#92400e'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
              {score > 0 ? '🎉 Correct!' : '🤔 Not quite'}
            </div>
            <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>
              Score: {score} points
            </div>
          </div>
        )}

        {/* Complete Message */}
        {currentStep === 'complete' && (
          <div style={{
            padding: '32px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🏆</div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 8px 0' }}>
              Demo Complete!
            </h4>
            <p style={{ fontSize: '1rem', margin: '0', opacity: 0.9 }}>
              Final Score: {score} points
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="game-demo-controls" style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <button
            onClick={previousStep}
            disabled={currentStepIndex === 0 && currentCardIndex === 0}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '2px solid #e2e8f0',
              background: 'white',
              color: '#4a5568',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: currentStepIndex === 0 && currentCardIndex === 0 ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            ← Previous
          </button>

          <button
            onClick={isPlaying ? stopDemo : startDemo}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <button
            onClick={nextStep}
            disabled={currentStep === 'complete'}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '2px solid #e2e8f0',
              background: 'white',
              color: '#4a5568',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: currentStep === 'complete' ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            Next →
          </button>

          <button
            onClick={resetDemo}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '2px solid #e2e8f0',
              background: 'white',
              color: '#4a5568',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Reset
          </button>
        </div>
      )}

      {/* Animations CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes cardDeal {
            0% {
              transform: translateY(-100px) rotateX(90deg) scale(0.8);
              opacity: 0;
            }
            50% {
              transform: translateY(-20px) rotateX(45deg) scale(0.9);
              opacity: 0.7;
            }
            100% {
              transform: translateY(0) rotateX(0) scale(1);
              opacity: 1;
            }
          }
          
          @keyframes cardFly {
            0% {
              transform: translateX(2px) translateY(-2px) rotateZ(2deg) scale(1);
            }
            50% {
              transform: translateX(100px) translateY(-50px) rotateZ(15deg) scale(0.8);
            }
            100% {
              transform: translateX(200px) translateY(-100px) rotateZ(25deg) scale(0.6);
              opacity: 0;
            }
          }
          
          .game-demo-controls button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          
          .game-demo-controls button:disabled {
            cursor: not-allowed;
          }
          
          @media (prefers-reduced-motion: reduce) {
            .demo-card {
              animation: none !important;
              transition: none !important;
            }
            
            @keyframes cardDeal {
              0%, 100% {
                transform: translateY(0) rotateX(0) scale(1);
                opacity: 1;
              }
            }
            
            @keyframes cardFly {
              0%, 100% {
                transform: translateX(2px) translateY(-2px) rotateZ(2deg) scale(1);
                opacity: 1;
              }
            }
          }
          
          @media (max-width: 768px) {
            .game-demo {
              padding: 24px 16px !important;
            }
            
            .demo-card {
              width: 280px !important;
              height: 180px !important;
              padding: 20px !important;
            }
            
            .game-demo-controls {
              flex-wrap: wrap !important;
              gap: 8px !important;
            }
            
            .game-demo-controls button {
              padding: 6px 12px !important;
              font-size: 0.8rem !important;
            }
          }
        `
      }} />
    </div>
  );
};

export default GameDemo;