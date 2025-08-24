// Example component demonstrating animation utilities usage

'use client';

import React, { useEffect, useRef } from 'react';
import { useAnimations } from '../../hooks/useAnimations';

export function AnimationExample() {
  const cardRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  
  const {
    createFadeInAnimation,
    createSlideInAnimation,
    optimizeForGPU,
    isReducedMotionPreferred,
    createAnimationDescription
  } = useAnimations();

  useEffect(() => {
    if (!cardRef.current || !fadeRef.current || !slideRef.current) return;

    // Optimize cards for GPU acceleration
    optimizeForGPU(cardRef.current);

    // Create scroll-triggered animations
    createFadeInAnimation(fadeRef.current, { delay: 200 });
    createSlideInAnimation(slideRef.current, 'up', { delay: 400 });

    // Add accessibility descriptions
    createAnimationDescription(cardRef.current, 'hover', 'Interactive card with hover effects');
    createAnimationDescription(fadeRef.current, 'fadeIn', 'Content fading into view');
    createAnimationDescription(slideRef.current, 'slideIn', 'Content sliding up into view');
  }, [createFadeInAnimation, createSlideInAnimation, optimizeForGPU, createAnimationDescription]);

  const reducedMotion = isReducedMotionPreferred();

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-4">Animation Examples</h2>
      
      {reducedMotion && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Reduced motion is enabled. Animations are simplified for accessibility.
        </div>
      )}

      {/* Interactive Card Example */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Interactive Card</h3>
        <div
          ref={cardRef}
          className="w-64 h-40 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-lg cursor-pointer transition-transform hover:scale-105 card-3d"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="p-6 text-white">
            <h4 className="text-xl font-bold">Sample Card</h4>
            <p className="mt-2">Hover to see animation effects</p>
          </div>
        </div>
      </div>

      {/* Fade In Animation Example */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Fade In Animation</h3>
        <div
          ref={fadeRef}
          className="p-6 bg-gray-100 rounded-lg opacity-0"
        >
          <p>This content will fade in when scrolled into view.</p>
        </div>
      </div>

      {/* Slide In Animation Example */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Slide In Animation</h3>
        <div
          ref={slideRef}
          className="p-6 bg-green-100 rounded-lg opacity-0"
        >
          <p>This content will slide up when scrolled into view.</p>
        </div>
      </div>

      {/* Performance Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Performance Info</h3>
        <p className="text-sm text-gray-600">
          Reduced Motion: {reducedMotion ? 'Enabled' : 'Disabled'}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          All animations use GPU acceleration and respect user accessibility preferences.
        </p>
      </div>
    </div>
  );
}