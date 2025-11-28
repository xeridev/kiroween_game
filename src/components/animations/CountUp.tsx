/**
 * CountUp animation component - adapted from React Bits
 * Animates numerical values from old to new using GSAP
 * 
 * Requirements: 3.1, 3.2, 6.4, 7.4, 8.2, 8.5
 */

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { logError } from '../../utils/errorLogger';
import { getAnimationConfig } from '../../utils/animationUtils';
import type { CountUpProps } from '../../utils/types';
import './CountUp.css';

/**
 * CountUp component - animates numerical transitions
 * Automatically optimizes for mobile viewports (Requirement 7.4, 8.2)
 * 
 * @param value - Target value to animate to
 * @param duration - Animation duration in milliseconds (default: 500)
 * @param decimals - Number of decimal places to display (default: 1)
 * @param onComplete - Callback when animation completes
 * @param className - Additional CSS classes
 */
export function CountUp({
  value,
  duration = 500,
  decimals = 1,
  onComplete,
  className = ''
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Get responsive animation config (handles reduced motion and mobile)
    const config = getAnimationConfig(duration);
    
    // Handle reduced motion preference - instant display
    if (config.duration === 0) {
      setDisplayValue(value);
      previousValue.current = value;
      onComplete?.();
      return;
    }

    // Skip animation on first render if value hasn't changed
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Animate from 0 on first render for entrance animation (Requirement 3.4)
      if (previousValue.current === value) {
        previousValue.current = 0;
      }
    }

    // Kill any existing animation
    if (tweenRef.current) {
      tweenRef.current.kill();
    }

    try {
      const obj = { val: previousValue.current };

      // Use responsive duration and easing (Requirement 7.4, 8.2)
      tweenRef.current = gsap.to(obj, {
        val: value,
        duration: config.duration / 1000,
        ease: config.ease,
        onUpdate: () => {
          setDisplayValue(obj.val);
        },
        onComplete: () => {
          previousValue.current = value;
          setDisplayValue(value); // Ensure final value is exact
          onComplete?.();
        }
      });
    } catch (error) {
      // Requirement 8.5: Graceful degradation on animation failure
      logError(
        'CountUp animation failed',
        error instanceof Error ? error : new Error(String(error)),
        { value, duration, decimals }
      );
      // Fall back to instant display
      setDisplayValue(value);
      previousValue.current = value;
      onComplete?.();
    }

    return () => {
      // Cleanup: kill tween on unmount or value change
      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }
    };
  }, [value, duration, onComplete]);

  return (
    <span className={`count-up ${className}`.trim()}>
      {displayValue.toFixed(decimals)}
    </span>
  );
}
