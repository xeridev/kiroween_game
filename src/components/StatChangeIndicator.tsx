/**
 * StatChangeIndicator - Floating stat change feedback component
 * 
 * Displays animated "+2" or "-3" text that floats upward and fades out
 * when reactions affect pet statistics.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.5
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGameStore } from '../store';
import { prefersReducedMotion, isMobileViewport } from '../utils/animationUtils';
import './StatChangeIndicator.css';

export interface StatChangeIndicatorProps {
  /** Name of the stat being changed */
  statName: 'sanity' | 'corruption' | 'hunger';
  /** Delta value (positive or negative) */
  delta: number;
  /** Callback when animation completes */
  onComplete: () => void;
}

/**
 * StatChangeIndicator Component
 * 
 * Displays a floating text indicator showing stat changes from reactions.
 * Animates upward with fade-out using GSAP.
 * 
 * Requirements:
 * - 7.1: Trigger flash animation on affected stat display
 * - 7.2: Display stat change with positive color indicator (theme-aware)
 * - 7.3: Display stat change with negative color indicator (theme-aware)
 * - 7.5: Respect reduceMotion setting (instant display, no animation)
 */
export function StatChangeIndicator({
  statName,
  delta,
  onComplete,
}: StatChangeIndicatorProps) {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useGameStore((state) => state.reduceMotion);

  useEffect(() => {
    const element = indicatorRef.current;
    if (!element) return;

    // Check for reduced motion preference (Requirement 7.5)
    const shouldAnimate = !reduceMotion && !prefersReducedMotion();

    if (!shouldAnimate) {
      // Instant display without animation
      // Show briefly then complete
      const timeout = setTimeout(() => {
        onComplete();
      }, 500);

      return () => clearTimeout(timeout);
    }

    // Determine duration based on viewport (Requirement 7.3)
    // 1s on desktop, 0.6s on mobile
    const duration = isMobileViewport() ? 0.6 : 1.0;

    // Animate upward with fade-out using GSAP
    const tween = gsap.fromTo(
      element,
      {
        y: 0,
        opacity: 1,
      },
      {
        y: -30,
        opacity: 0,
        duration,
        ease: 'power2.out',
        onComplete: () => {
          onComplete();
        },
      }
    );

    // Cleanup: kill animation on unmount
    return () => {
      tween.kill();
    };
  }, [delta, onComplete, reduceMotion]);

  // Determine if change is positive or negative
  const isPositive = delta > 0;

  // Format delta with sign
  const formattedDelta = isPositive ? `+${delta}` : `${delta}`;

  // Determine CSS class for color coding (Requirements 7.2, 7.3)
  const colorClass = isPositive ? 'stat-change--positive' : 'stat-change--negative';

  return (
    <div
      ref={indicatorRef}
      className={`stat-change-indicator ${colorClass}`}
      role="status"
      aria-live="polite"
      aria-label={`${statName} changed by ${formattedDelta}`}
    >
      {formattedDelta}
    </div>
  );
}
