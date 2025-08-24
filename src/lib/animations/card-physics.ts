// Card physics engine for realistic card animations

import type { Position, CardElement, AnimationType } from './types';

export class CardPhysics {
  private static readonly GRAVITY = 0.5;
  private static readonly FRICTION = 0.98;
  private static readonly BOUNCE_DAMPING = 0.7;

  /**
   * Creates a shuffle animation for multiple cards
   */
  static shuffle(cards: CardElement[]): Animation[] {
    const animations: Animation[] = [];
    const shufflePositions = this.generateShufflePositions(cards.length);
    
    cards.forEach((card, index) => {
      const targetPosition = shufflePositions[index] || { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0 } };
      const keyframes = [
        {
          transform: this.getTransformString(card.animationState.position),
          offset: 0
        },
        {
          transform: `translateX(${Math.random() * 100 - 50}px) translateY(${Math.random() * 50 - 25}px) rotateZ(${Math.random() * 20 - 10}deg)`,
          offset: 0.5
        },
        {
          transform: this.getTransformString(targetPosition),
          offset: 1
        }
      ];

      const animation = card.animate(keyframes, {
        duration: 800 + Math.random() * 400,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        fill: 'forwards'
      });

      animations.push(animation);
    });

    return animations;
  }

  /**
   * Creates a dealing animation for cards
   */
  static deal(cards: CardElement[], positions: Position[]): Animation[] {
    const animations: Animation[] = [];
    
    cards.forEach((card, index) => {
      const targetPosition = positions[index] || positions[positions.length - 1] || { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0 } };
      const delay = index * 150; // Stagger the dealing
      
      const keyframes = [
        {
          transform: 'translateX(-100vw) rotateY(0deg)',
          opacity: '0',
          offset: 0
        },
        {
          transform: `translateX(0) translateY(0) rotateY(180deg)`,
          opacity: '1',
          offset: 0.7
        },
        {
          transform: this.getTransformString(targetPosition),
          opacity: '1',
          offset: 1
        }
      ];

      const animation = card.animate(keyframes, {
        duration: 600,
        delay,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
      });

      animations.push(animation);
    });

    return animations;
  }

  /**
   * Creates a flip animation for a single card
   */
  static flip(card: CardElement, axis: 'x' | 'y' = 'y'): Animation {
    const rotationAxis = axis === 'x' ? 'rotateX' : 'rotateY';
    
    const keyframes = [
      {
        transform: `${rotationAxis}(0deg)`,
        offset: 0
      },
      {
        transform: `${rotationAxis}(90deg)`,
        offset: 0.5
      },
      {
        transform: `${rotationAxis}(180deg)`,
        offset: 1
      }
    ];

    return card.animate(keyframes, {
      duration: 600,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      fill: 'forwards'
    });
  }

  /**
   * Creates a stacking animation for multiple cards
   */
  static stack(cards: CardElement[], offset: number = 2): Animation[] {
    const animations: Animation[] = [];
    
    cards.forEach((card, index) => {
      const stackOffset = index * offset;
      
      const keyframes = [
        {
          transform: this.getTransformString(card.animationState.position),
          zIndex: index.toString(),
          offset: 0
        },
        {
          transform: `translateX(${stackOffset}px) translateY(${stackOffset}px) translateZ(${index}px)`,
          zIndex: index.toString(),
          offset: 1
        }
      ];

      const animation = card.animate(keyframes, {
        duration: 400,
        delay: index * 50,
        easing: 'ease-out',
        fill: 'forwards'
      });

      animations.push(animation);
    });

    return animations;
  }

  /**
   * Creates a hover animation for a card
   */
  static hover(card: CardElement, intensity: number = 1): Animation {
    const hoverOffset = 10 * intensity;
    const rotationIntensity = 5 * intensity;
    
    const keyframes = [
      {
        transform: this.getTransformString(card.animationState.position),
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        offset: 0
      },
      {
        transform: `translateY(-${hoverOffset}px) rotateX(${rotationIntensity}deg) rotateY(${rotationIntensity}deg)`,
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        offset: 1
      }
    ];

    return card.animate(keyframes, {
      duration: 200,
      easing: 'ease-out',
      fill: 'forwards'
    });
  }

  /**
   * Generates random positions for shuffle animation
   */
  private static generateShufflePositions(count: number): Position[] {
    const positions: Position[] = [];
    
    for (let i = 0; i < count; i++) {
      positions.push({
        x: Math.random() * 200 - 100,
        y: Math.random() * 100 - 50,
        z: i,
        rotation: {
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
          z: Math.random() * 20 - 10
        }
      });
    }
    
    return positions;
  }

  /**
   * Converts position object to CSS transform string
   */
  private static getTransformString(position: Position): string {
    return `translateX(${position.x}px) translateY(${position.y}px) translateZ(${position.z}px) rotateX(${position.rotation.x}deg) rotateY(${position.rotation.y}deg) rotateZ(${position.rotation.z}deg)`;
  }

  /**
   * Applies GPU acceleration optimizations
   */
  static optimizeForGPU(element: HTMLElement): void {
    element.style.willChange = 'transform';
    element.style.transform = 'translateZ(0)';
    element.style.backfaceVisibility = 'hidden';
  }

  /**
   * Removes GPU acceleration optimizations
   */
  static removeGPUOptimization(element: HTMLElement): void {
    element.style.willChange = 'auto';
    element.style.transform = '';
    element.style.backfaceVisibility = '';
  }
}