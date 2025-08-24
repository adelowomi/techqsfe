// Animation type definitions

export interface Position {
  x: number;
  y: number;
  z: number;
  rotation: { x: number; y: number; z: number };
}

export interface CardData {
  id: string;
  front: React.ReactNode;
  back: React.ReactNode;
  position: Position;
  rotation: { x: number; y: number; z: number };
}

export interface AnimationConfig {
  trigger: 'enter' | 'exit' | 'progress';
  threshold: number;
  animation: KeyframeEffect;
  options: KeyframeAnimationOptions;
}

export interface ComponentAnimationState {
  isPlaying: boolean;
  currentAnimation: string | null;
  queuedAnimations: string[];
  performance: {
    fps: number;
    memoryUsage: number;
    gpuAccelerated: boolean;
  };
}

export interface CardState {
  id: string;
  position: Position;
  isFlipped: boolean;
  isHovered: boolean;
  isSelected: boolean;
  animationState: 'idle' | 'animating' | 'paused';
}

export interface PerformanceError {
  type: 'low-fps' | 'high-memory' | 'gpu-unavailable';
  threshold: number;
  current: number;
}

export type AnimationType = 'shuffle' | 'deal' | 'flip' | 'hover' | 'stack';

export interface CardElement extends HTMLElement {
  cardId: string;
  animationState: CardState;
}

// Counter and Statistics Animation Types
export interface CounterAnimationConfig {
  startValue: number;
  endValue: number;
  duration: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'easeOutCubic';
  formatter?: (value: number) => string;
}

export interface StatisticItem {
  id: string;
  label: string;
  value: number;
  type: 'number' | 'percentage' | 'currency' | 'time';
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: number;
    period: string;
  };
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartAnimationConfig {
  type: 'bar' | 'line' | 'pie' | 'donut' | 'area';
  staggerDelay: number;
  duration: number;
  easing: string;
  entrance: 'fade' | 'slide' | 'scale' | 'draw';
}