/**
 * BackgroundLayer - Animated Waves background component
 * Displays theme-based animated wave patterns behind the game canvas
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { useTheme } from '../contexts/ThemeContext';
import { useGameStore } from '../store';
import { Waves } from './reactbits/Waves';
import { 
  interpolateColor, 
  CUTE_THEME, 
  HORROR_THEME,
  SANITY_THRESHOLDS,
} from '../utils/themeUtils';
import { 
  prefersReducedMotion,
  startPerformanceMonitoring,
  stopPerformanceMonitoring,
  onPerformanceChange,
  getPerformanceState,
} from '../utils/animationUtils';
import './BackgroundLayer.css';

export interface BackgroundLayerProps {
  /** Additional CSS class name */
  className?: string;
}

/** Background transition duration in seconds (Requirement 1.4) */
const BACKGROUND_TRANSITION_DURATION = 1;

/**
 * BackgroundLayer component
 * Renders an animated Waves background that responds to theme changes
 * with smooth color transitions using GSAP
 * 
 * Requirement 1.1: Display animated Waves background behind game canvas
 * Requirement 1.2: Soft pastel colors when sanity > 50 and not ABOMINATION
 * Requirement 1.3: Dark horror colors when sanity < 30 or ABOMINATION
 * Requirement 1.4: Smooth 1-second transition when sanity crosses thresholds
 * Requirement 1.5: Disable animations when reduce motion is enabled
 */
export function BackgroundLayer({ className = '' }: BackgroundLayerProps) {
  const { getBackgroundProps, mode, isTransitioning } = useTheme();
  const reduceMotion = useGameStore((state) => state.reduceMotion);
  const retroMode = useGameStore((state) => state.retroMode);
  const sanity = useGameStore((state) => state.stats.sanity);
  
  // Track previous sanity for threshold detection
  const previousSanityRef = useRef(sanity);
  const previousModeRef = useRef(mode);
  
  // Performance monitoring state (Requirement 1.5)
  const [shouldReduceForPerformance, setShouldReduceForPerformance] = useState(false);
  
  // Start performance monitoring on mount
  useEffect(() => {
    startPerformanceMonitoring();
    
    // Subscribe to performance changes
    const unsubscribe = onPerformanceChange((state) => {
      setShouldReduceForPerformance(state.shouldReduceAnimations);
    });
    
    // Check initial state
    const initialState = getPerformanceState();
    setShouldReduceForPerformance(initialState.shouldReduceAnimations);
    
    return () => {
      unsubscribe();
      stopPerformanceMonitoring();
    };
  }, []);
  
  // Animated color state for smooth transitions
  const [animatedColors, setAnimatedColors] = useState(() => ({
    lineColor: mode === 'horror' ? HORROR_THEME.accent : CUTE_THEME.primary,
    backgroundColor: mode === 'horror' ? HORROR_THEME.background : CUTE_THEME.background,
  }));
  
  // Animation progress ref for GSAP
  const animationRef = useRef<gsap.core.Tween | null>(null);
  
  /**
   * Check if sanity crossed a threshold
   * Requirement 1.4: Detect threshold crossings for transitions
   */
  const checkThresholdCrossed = useCallback((prevSanity: number, currSanity: number): boolean => {
    const crossedHorror = 
      (prevSanity >= SANITY_THRESHOLDS.HORROR && currSanity < SANITY_THRESHOLDS.HORROR) ||
      (prevSanity < SANITY_THRESHOLDS.HORROR && currSanity >= SANITY_THRESHOLDS.HORROR);
    
    const crossedCute = 
      (prevSanity <= SANITY_THRESHOLDS.CUTE && currSanity > SANITY_THRESHOLDS.CUTE) ||
      (prevSanity > SANITY_THRESHOLDS.CUTE && currSanity <= SANITY_THRESHOLDS.CUTE);
    
    return crossedHorror || crossedCute;
  }, []);
  
  /**
   * Animate color transition using GSAP
   * Requirement 1.4: 1-second smooth transition
   * Requirement 1.5, 7.1, 7.2: Respect reduce motion setting and performance
   */
  useEffect(() => {
    const shouldAnimate = !reduceMotion && !prefersReducedMotion() && !shouldReduceForPerformance;
    const modeChanged = previousModeRef.current !== mode;
    const thresholdCrossed = checkThresholdCrossed(previousSanityRef.current, sanity);
    
    // Determine target colors based on mode
    const targetColors = {
      lineColor: mode === 'horror' ? HORROR_THEME.accent : CUTE_THEME.primary,
      backgroundColor: mode === 'horror' ? HORROR_THEME.background : CUTE_THEME.background,
    };
    
    // Only animate if mode changed or threshold crossed
    if (modeChanged || thresholdCrossed) {
      // Kill any existing animation
      if (animationRef.current) {
        animationRef.current.kill();
      }
      
      if (shouldAnimate) {
        // Create interpolation animation
        const progress = { value: 0 };
        const startColors = { ...animatedColors };
        
        animationRef.current = gsap.to(progress, {
          value: 1,
          duration: BACKGROUND_TRANSITION_DURATION,
          ease: 'power2.inOut',
          onUpdate: () => {
            setAnimatedColors({
              lineColor: interpolateColor(startColors.lineColor, targetColors.lineColor, progress.value),
              backgroundColor: interpolateColor(startColors.backgroundColor, targetColors.backgroundColor, progress.value),
            });
          },
          onComplete: () => {
            setAnimatedColors(targetColors);
          },
        });
      } else {
        // Instant change for reduced motion
        setAnimatedColors(targetColors);
      }
    }
    
    // Update refs
    previousSanityRef.current = sanity;
    previousModeRef.current = mode;
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [mode, sanity, reduceMotion, checkThresholdCrossed]);
  
  // Get base props from theme context
  const baseProps = getBackgroundProps();
  
  // Override colors with animated values
  // Requirement 1.5: Disable animation when performance is poor
  const wavesProps = {
    ...baseProps,
    lineColor: animatedColors.lineColor,
    backgroundColor: animatedColors.backgroundColor,
    disableAnimation: baseProps.disableAnimation || shouldReduceForPerformance,
  };
  
  // Requirement 8.3: Disable React Bits animations in retro mode
  // Also disable for performance reasons if FPS drops below threshold
  if (retroMode || shouldReduceForPerformance) {
    return (
      <div 
        className={`background-layer background-layer--retro ${className}`}
        data-mode={mode}
        aria-hidden="true"
        style={{
          backgroundColor: animatedColors.backgroundColor,
        }}
      />
    );
  }
  
  return (
    <div 
      className={`background-layer ${className} ${isTransitioning ? 'transitioning' : ''}`}
      data-mode={mode}
      aria-hidden="true"
    >
      <Waves
        {...wavesProps}
        className="background-waves"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}

export default BackgroundLayer;
