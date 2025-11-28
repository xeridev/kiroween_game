/**
 * StatDisplay component - Animated stat value display with highlight effects
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * - Animates number transitions using CountUp component
 * - Highlights increases in green and decreases in red
 * - Respects reduce motion setting
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { CountUp } from './animations/CountUp';
import { prefersReducedMotion } from '../utils/animationUtils';
import './StatDisplay.css';

export interface StatDisplayProps {
  /** Current stat value */
  value: number;
  /** Label for the stat */
  label: string;
  /** Maximum value for the stat (default: 100) */
  maxValue?: number;
  /** Animation duration in milliseconds (default: 500) */
  duration?: number;
  /** Number of decimal places to display (default: 1) */
  decimals?: number;
  /** Additional CSS class name */
  className?: string;
  /** Whether to show the progress bar (default: true) */
  showBar?: boolean;
  /** Bar color CSS variable or color value */
  barColor?: string;
}

type ChangeDirection = 'increase' | 'decrease' | 'none';

/**
 * StatDisplay - Displays a stat value with animated transitions and directional highlights
 * 
 * Requirement 2.1: Animates number transitions using CountUp
 * Requirement 2.2: Animation duration of 500ms
 * Requirement 2.3: Highlights increases in green
 * Requirement 2.4: Highlights decreases in red
 */
export function StatDisplay({
  value,
  label,
  maxValue = 100,
  duration = 500,
  decimals = 1,
  className = '',
  showBar = true,
  barColor,
}: StatDisplayProps) {
  const [changeDirection, setChangeDirection] = useState<ChangeDirection>('none');
  const previousValue = useRef<number>(value);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Detect change direction and trigger highlight
  useEffect(() => {
    // Skip highlight on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousValue.current = value;
      return;
    }

    const diff = value - previousValue.current;
    
    // Only highlight if there's a meaningful change
    if (Math.abs(diff) > 0.01) {
      // Clear any existing timeout
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }

      // Set change direction for highlight
      const direction: ChangeDirection = diff > 0 ? 'increase' : 'decrease';
      setChangeDirection(direction);

      // Clear highlight after animation completes (duration + buffer)
      highlightTimeoutRef.current = setTimeout(() => {
        setChangeDirection('none');
      }, duration + 200);
    }

    previousValue.current = value;

    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [value, duration]);

  // Get highlight class based on change direction
  const getHighlightClass = useCallback((): string => {
    if (prefersReducedMotion()) {
      return ''; // No highlight animation when reduce motion is enabled
    }
    
    switch (changeDirection) {
      case 'increase':
        return 'stat-display--increase';
      case 'decrease':
        return 'stat-display--decrease';
      default:
        return '';
    }
  }, [changeDirection]);

  const highlightClass = getHighlightClass();
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className={`stat-display ${highlightClass} ${className}`.trim()}>
      <div className="stat-display__label">{label}</div>
      
      {showBar && (
        <div 
          className="stat-display__bar-container"
          role="progressbar"
          aria-label={`${label} progress`}
          aria-valuenow={Math.round(value)}
          aria-valuemin={0}
          aria-valuemax={maxValue}
        >
          <div 
            className="stat-display__bar"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
      )}
      
      <div className="stat-display__value">
        <CountUp
          value={value}
          duration={duration}
          decimals={decimals}
          className="stat-display__count-up"
        />
      </div>
    </div>
  );
}
