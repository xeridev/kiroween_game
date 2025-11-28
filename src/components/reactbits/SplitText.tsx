/**
 * SplitText animation component - adapted from React Bits
 * Animates text character-by-character or word-by-word using GSAP
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { logError } from '../../utils/errorLogger';

export type SplitType = 'chars' | 'words' | 'lines';

export interface SplitTextProps {
  /** Text to animate */
  text: string;
  /** How to split the text */
  splitType?: SplitType;
  /** Delay between each element animation (ms) */
  staggerDelay?: number;
  /** Duration of each element animation (seconds) */
  duration?: number;
  /** GSAP easing function */
  ease?: string;
  /** Starting animation properties */
  from?: gsap.TweenVars;
  /** Ending animation properties */
  to?: gsap.TweenVars;
  /** Intersection observer threshold */
  threshold?: number;
  /** Intersection observer root margin */
  rootMargin?: string;
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Custom class name */
  className?: string;
  /** Whether to disable animation (for reduce motion) */
  disableAnimation?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * SplitText component - animates text with character/word splitting
 * Supports reduce motion preference (Requirement 3.4)
 */
export function SplitText({
  text,
  splitType = 'chars',
  staggerDelay = 50,
  duration = 0.5,
  ease = 'power2.out',
  from = { opacity: 0, y: 20 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '0px',
  textAlign = 'left',
  className = '',
  disableAnimation = false,
  onComplete,
}: SplitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);


  // Split text into elements based on splitType
  const elements = useMemo(() => {
    switch (splitType) {
      case 'words':
        return text.split(/\s+/).map((word, i, arr) => ({
          content: word,
          key: `word-${i}`,
          addSpace: i < arr.length - 1,
        }));
      case 'lines':
        return text.split('\n').map((line, i) => ({
          content: line,
          key: `line-${i}`,
          addSpace: false,
        }));
      case 'chars':
      default:
        return text.split('').map((char, i) => ({
          content: char === ' ' ? '\u00A0' : char, // Non-breaking space
          key: `char-${i}`,
          addSpace: false,
        }));
    }
  }, [text, splitType]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || hasAnimated.current) return;

    // Handle reduce motion - show instantly
    if (disableAnimation) {
      const spans = container.querySelectorAll('.split-text-element');
      spans.forEach((span) => {
        (span as HTMLElement).style.opacity = '1';
        (span as HTMLElement).style.transform = 'none';
      });
      onComplete?.();
      return;
    }

    // Set up intersection observer for scroll-triggered animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            animateElements();
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [disableAnimation, threshold, rootMargin, onComplete]);

  const animateElements = () => {
    const container = containerRef.current;
    if (!container) return;

    const spans = container.querySelectorAll('.split-text-element');
    
    try {
      // Set initial state
      gsap.set(spans, from);

      // Animate with stagger
      gsap.to(spans, {
        ...to,
        duration,
        ease,
        stagger: staggerDelay / 1000,
        onComplete,
      });
    } catch (error) {
      logError(
        'SplitText animation failed',
        error instanceof Error ? error : new Error(String(error)),
        { text, splitType }
      );
      // Fallback: show all elements
      spans.forEach((span) => {
        (span as HTMLElement).style.opacity = '1';
        (span as HTMLElement).style.transform = 'none';
      });
      onComplete?.();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`split-text ${className}`.trim()}
      style={{ textAlign, display: 'inline-block' }}
      aria-label={text}
    >
      {elements.map((el) => (
        <span
          key={el.key}
          className="split-text-element"
          style={{
            display: 'inline-block',
            opacity: disableAnimation ? 1 : 0,
            whiteSpace: splitType === 'chars' ? 'pre' : 'normal',
          }}
        >
          {el.content}
          {el.addSpace && ' '}
        </span>
      ))}
    </div>
  );
}

export default SplitText;
