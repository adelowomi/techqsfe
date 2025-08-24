'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ScrollAnimationController } from '../scroll-controller';

export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  trigger?: 'scroll' | 'mount';
  delay?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 2000,
  format,
  trigger = 'scroll',
  delay = 0,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0
}) => {
  const [currentValue, setCurrentValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const scrollControllerRef = useRef<ScrollAnimationController | undefined>(undefined);

  // Default formatter based on value type
  const defaultFormat = (val: number): string => {
    const formatted = decimals > 0 ? val.toFixed(decimals) : Math.floor(val).toString();
    return `${prefix}${formatted}${suffix}`;
  };

  const formatter = format || defaultFormat;

  const animateValue = (startValue: number, endValue: number, animationDuration: number) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Use easeOutCubic for smooth deceleration
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentVal = startValue + (endValue - startValue) * easeOutCubic;
      
      setCurrentValue(currentVal);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(endValue);
        setIsAnimating(false);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const startAnimation = () => {
    if (delay > 0) {
      setTimeout(() => animateValue(0, value, duration), delay);
    } else {
      animateValue(0, value, duration);
    }
  };

  useEffect(() => {
    if (trigger === 'mount') {
      startAnimation();
    } else if (trigger === 'scroll' && elementRef.current) {
      // Initialize scroll controller
      scrollControllerRef.current = new ScrollAnimationController();
      
      // Create custom intersection observer for counter animation
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !isAnimating && currentValue === 0) {
              startAnimation();
            }
          });
        },
        {
          threshold: 0.3,
          rootMargin: '0px 0px -10% 0px'
        }
      );
      
      observer.observe(elementRef.current);
      
      return () => {
        observer.disconnect();
        if (scrollControllerRef.current) {
          scrollControllerRef.current.destroy();
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trigger, value, duration, delay]);

  // Reset animation when value changes
  useEffect(() => {
    if (trigger === 'mount') {
      setCurrentValue(0);
      setIsAnimating(false);
      startAnimation();
    }
  }, [value]);

  return (
    <span
      ref={elementRef}
      className={`animated-counter ${className}`}
      data-testid="animated-counter"
      aria-live="polite"
      aria-label={`Count: ${formatter(currentValue)}`}
    >
      {formatter(currentValue)}
    </span>
  );
};

// Specialized counter components for common use cases

export interface StatisticCounterProps extends Omit<AnimatedCounterProps, 'format'> {
  type: 'number' | 'percentage' | 'currency' | 'time';
  currency?: string;
  timeUnit?: 'seconds' | 'minutes' | 'hours' | 'days';
}

export const StatisticCounter: React.FC<StatisticCounterProps> = ({
  type,
  currency = 'USD',
  timeUnit = 'seconds',
  ...props
}) => {
  const getFormatter = (): (value: number) => string => {
    switch (type) {
      case 'percentage':
        return (val: number) => `${val.toFixed(props.decimals || 1)}%`;
      
      case 'currency':
        return (val: number) => new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: props.decimals || 0,
          maximumFractionDigits: props.decimals || 0
        }).format(val);
      
      case 'time':
        return (val: number) => {
          const units = {
            seconds: 's',
            minutes: 'm',
            hours: 'h',
            days: 'd'
          };
          return `${Math.floor(val)}${units[timeUnit]}`;
        };
      
      case 'number':
      default:
        return (val: number) => {
          if (val >= 1000000) {
            return `${(val / 1000000).toFixed(1)}M`;
          } else if (val >= 1000) {
            return `${(val / 1000).toFixed(1)}K`;
          }
          return val.toFixed(props.decimals || 0);
        };
    }
  };

  return <AnimatedCounter {...props} format={getFormatter()} />;
};

// Counter grid component for displaying multiple statistics
export interface CounterGridProps {
  counters: Array<{
    id: string;
    label: string;
    value: number;
    type: StatisticCounterProps['type'];
    icon?: React.ReactNode;
    description?: string;
  }>;
  staggerDelay?: number;
  className?: string;
}

export const CounterGrid: React.FC<CounterGridProps> = ({
  counters,
  staggerDelay = 200,
  className = ''
}) => {
  return (
    <div className={`counter-grid grid gap-6 ${className}`} data-testid="counter-grid">
      {counters.map((counter, index) => (
        <div
          key={counter.id}
          className="counter-card bg-white rounded-lg p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
        >
          {counter.icon && (
            <div className="counter-icon mb-3 text-purple-600">
              {counter.icon}
            </div>
          )}
          <div className="counter-value text-3xl font-bold text-gray-900 mb-2">
            <StatisticCounter
              value={counter.value}
              type={counter.type}
              trigger="scroll"
              delay={index * staggerDelay}
              duration={2000}
            />
          </div>
          <div className="counter-label text-sm font-medium text-gray-600 mb-1">
            {counter.label}
          </div>
          {counter.description && (
            <div className="counter-description text-xs text-gray-500">
              {counter.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};