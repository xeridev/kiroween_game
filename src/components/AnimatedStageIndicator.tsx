/**
 * AnimatedStageIndicator component - displays pet stage with dramatic reveal animation
 * Animates on stage change with a dramatic reveal effect
 * 
 * Requirements: 3.2, 3.4
 */

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import type { PetStage } from '../utils/types';
import { logError } from '../utils/errorLogger';
import './AnimatedStageIndicator.css';

export interface AnimatedStageIndicatorProps {
  /** Current pet stage */
  stage: PetStage;
  /** Whether to disable animation (for reduce motion) */
  disableAnimation?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

/**
 * AnimatedStageIndicator - Animated stage display with dramatic reveal
 * Requirement 3.2: Animate new stage name with dramatic reveal effect on evolution
 * Requirement 3.4: Respect reduce motion setting
 */
export function AnimatedStageIndicator({
  stage,
  disableAnimation = false,
  className = '',
  onAnimationComplete,
}: AnimatedStageIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [displayedStage, setDisplayedStage] = useState<PetStage>(stage);
  const previousStageRef = useRef<PetStage>(stage);
  const isFirstRender = useRef(true);

  // Handle stage changes with animation
  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousStageRef.current = stage;
      return;
    }

    // Only animate if stage actually changed
    if (stage === previousStageRef.current) {
      return;
    }

    previousStageRef.current = stage;

    // If reduce motion is enabled, update instantly (Requirement 3.4)
    if (disableAnimation) {
      setDisplayedStage(stage);
      onAnimationComplete?.();
      return;
    }

    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) {
      setDisplayedStage(stage);
      return;
    }

    try {
      // Create dramatic reveal animation timeline
      const tl = gsap.timeline({
        onComplete: () => {
          onAnimationComplete?.();
        },
      });

      // Phase 1: Fade out and scale down current stage
      tl.to(text, {
        opacity: 0,
        scale: 0.5,
        y: -20,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          // Update displayed stage after fade out
          setDisplayedStage(stage);
        },
      });

      // Phase 2: Flash effect
      tl.to(container, {
        backgroundColor: 'rgba(233, 69, 96, 0.3)',
        duration: 0.1,
        ease: 'none',
      });

      tl.to(container, {
        backgroundColor: 'transparent',
        duration: 0.2,
        ease: 'power2.out',
      });

      // Phase 3: Dramatic reveal of new stage
      tl.fromTo(
        text,
        {
          opacity: 0,
          scale: 1.5,
          y: 30,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          ease: 'back.out(1.7)',
        },
        '-=0.1'
      );

      // Phase 4: Subtle pulse effect
      tl.to(text, {
        scale: 1.1,
        duration: 0.15,
        ease: 'power2.out',
      });

      tl.to(text, {
        scale: 1,
        duration: 0.15,
        ease: 'power2.in',
      });

    } catch (error) {
      logError(
        'AnimatedStageIndicator animation failed',
        error instanceof Error ? error : new Error(String(error)),
        { stage }
      );
      // Fallback: update instantly
      setDisplayedStage(stage);
      onAnimationComplete?.();
    }
  }, [stage, disableAnimation, onAnimationComplete]);

  // Build class names
  const containerClasses = [
    'animated-stage-indicator',
    `stage-${displayedStage.toLowerCase()}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div ref={containerRef} className={containerClasses}>
      <span ref={textRef} className="stage-text">
        {displayedStage}
      </span>
    </div>
  );
}

export default AnimatedStageIndicator;
