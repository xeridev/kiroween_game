/**
 * FadeIn animation component - adapted from React Bits
 * Animates children with fade + optional blur effect using GSAP
 * 
 * Requirements: 4.1, 6.4, 7.4, 8.2
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { logError } from '../../utils/errorLogger';
import { getAnimationConfig } from '../../utils/animationUtils';
import type { FadeInProps } from '../../utils/types';
import './FadeIn.css';

/**
 * FadeIn component - animates children with fade and optional blur
 * Automatically optimizes for mobile viewports (Requirement 7.4, 8.2)
 * 
 * @param children - Content to animate
 * @param duration - Animation duration in milliseconds (default: 400)
 * @param delay - Delay before animation starts in milliseconds (default: 0)
 * @param blur - Whether to include blur-to-clear effect (default: true)
 * @param className - Additional CSS classes
 * @param onComplete - Callback when animation completes (Requirements 4.3)
 */
export function FadeIn({
  children,
  duration = 400,
  delay = 0,
  blur = true,
  className = '',
  onComplete
}: FadeInProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasAnimated.current) return;

    // Mark as animated to prevent re-animation
    hasAnimated.current = true;

    // Get responsive animation config (handles reduced motion and mobile)
    const config = getAnimationConfig(duration);

    // Handle reduced motion preference - show instantly
    if (config.duration === 0) {
      element.style.opacity = '1';
      element.style.filter = 'none';
      element.style.transform = 'none';
      // Call onComplete immediately for reduced motion
      onComplete?.();
      return;
    }

    // Determine if blur should be used (disabled on mobile for performance)
    const useBlur = blur && config.useBlur;
    
    // Scale delay proportionally for mobile (Requirement 7.4)
    const responsiveDelay = config.duration === duration 
      ? delay 
      : Math.round(delay * (config.duration / duration));

    try {
      // Set initial state
      gsap.set(element, {
        opacity: 0,
        filter: useBlur ? 'blur(8px)' : 'none',
        y: useBlur ? 10 : 5 // Smaller movement on mobile
      });

      // Animate to visible state with responsive settings
      gsap.to(element, {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: config.duration / 1000,
        delay: responsiveDelay / 1000,
        ease: config.ease,
        onComplete: onComplete
      });
    } catch (error) {
      // Graceful degradation on animation failure
      logError(
        'FadeIn animation failed',
        error instanceof Error ? error : new Error(String(error)),
        { duration, delay, blur }
      );
      // Fall back to instant display
      if (element) {
        element.style.opacity = '1';
        element.style.filter = 'none';
        element.style.transform = 'none';
      }
      // Call onComplete even on error for graceful degradation
      onComplete?.();
    }
  }, [duration, delay, blur, onComplete]);

  return (
    <div ref={elementRef} className={`fade-in ${className}`.trim()}>
      {children}
    </div>
  );
}
