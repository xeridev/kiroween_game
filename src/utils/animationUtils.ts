/**
 * Animation utility functions
 * Provides safe wrappers for GSAP animations with error handling and reduced motion support
 * 
 * Requirements: 6.4, 7.4, 8.2, 8.5
 */

import { gsap } from 'gsap';
import { logError } from './errorLogger';

/** Mobile breakpoint in pixels (Requirement 7.4) */
export const MOBILE_BREAKPOINT = 768;

/** Default animation durations */
export const ANIMATION_DURATIONS = {
  /** Standard duration for desktop */
  standard: 500,
  /** Reduced duration for mobile (Requirement 7.4) */
  mobile: 200,
  /** Fast duration for simple transitions */
  fast: 150,
};

/**
 * Check if user prefers reduced motion
 * Returns true if the user has enabled reduced motion in their system settings
 * 
 * Requirement 6.4, 7.4: Respect prefers-reduced-motion media query
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Subscribe to reduced motion preference changes
 * Useful for components that need to react to system preference changes
 * 
 * Requirement 7.4: Apply instant theme changes when reduce motion is enabled
 * 
 * @param callback - Function to call when preference changes
 * @returns Cleanup function to unsubscribe
 */
export function onReducedMotionChange(callback: (prefersReduced: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  const handler = (event: MediaQueryListEvent) => {
    callback(event.matches);
  };
  
  // Use addEventListener for modern browsers
  mediaQuery.addEventListener('change', handler);
  
  // Return cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}

/**
 * Check if the current viewport is mobile-sized
 * Returns true if viewport width is <= 768px
 * 
 * Requirement 7.4: Simplify animations for mobile viewports
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

/**
 * Get the appropriate animation duration based on device
 * Returns shorter duration on mobile for better performance
 * 
 * Requirements 7.4, 8.2: Maintain 30fps minimum on mobile
 * 
 * @param desktopDuration - Duration in ms for desktop
 * @param mobileDuration - Optional custom duration for mobile (defaults to 40% of desktop)
 * @returns Appropriate duration based on device
 */
export function getResponsiveDuration(
  desktopDuration: number,
  mobileDuration?: number
): number {
  if (prefersReducedMotion()) {
    return 0; // Instant for reduced motion
  }
  
  if (isMobileViewport()) {
    // Use custom mobile duration or 40% of desktop duration
    return mobileDuration ?? Math.round(desktopDuration * 0.4);
  }
  
  return desktopDuration;
}

/**
 * Check if complex animations should be disabled
 * Returns true if on mobile or reduced motion is preferred
 * 
 * Requirements 7.4, 8.2: Simplify animations on mobile
 */
export function shouldSimplifyAnimations(): boolean {
  return prefersReducedMotion() || isMobileViewport();
}

/**
 * Get animation configuration optimized for current device
 * Provides simplified settings for mobile to maintain 30fps
 * 
 * Requirements 7.4, 8.2: Mobile animation optimization
 */
export interface AnimationConfig {
  duration: number;
  useBlur: boolean;
  useGlitch: boolean;
  useTextShadow: boolean;
  ease: string;
}

export function getAnimationConfig(baseDuration: number = 500): AnimationConfig {
  const isMobile = isMobileViewport();
  const reducedMotion = prefersReducedMotion();
  
  if (reducedMotion) {
    return {
      duration: 0,
      useBlur: false,
      useGlitch: false,
      useTextShadow: false,
      ease: 'none',
    };
  }
  
  if (isMobile) {
    return {
      duration: Math.round(baseDuration * 0.4),
      useBlur: false, // Blur is expensive on mobile
      useGlitch: false, // Glitch animations are complex
      useTextShadow: false, // Text shadows can cause repaints
      ease: 'power1.out', // Simpler easing for mobile
    };
  }
  
  return {
    duration: baseDuration,
    useBlur: true,
    useGlitch: true,
    useTextShadow: true,
    ease: 'power2.out',
  };
}

/**
 * Safe wrapper for GSAP animations with error handling
 * Falls back to instant state changes if animation fails
 * 
 * Requirement 8.5: Log errors and fall back to instant state changes
 * 
 * @param element - The element to animate
 * @param props - GSAP animation properties
 * @param fallback - Optional fallback function to execute on error
 * @param context - Optional context for error logging
 * @returns The GSAP tween or null if animation failed
 */
export function safeAnimate(
  element: HTMLElement | null,
  props: gsap.TweenVars,
  fallback?: () => void,
  context?: Record<string, unknown>
): gsap.core.Tween | null {
  if (!element) {
    fallback?.();
    return null;
  }

  // Check for reduced motion preference
  if (prefersReducedMotion()) {
    // Apply final state instantly without animation
    if (props.onComplete && typeof props.onComplete === 'function') {
      props.onComplete();
    }
    fallback?.();
    return null;
  }

  try {
    return gsap.to(element, props);
  } catch (error) {
    logError(
      'Animation failed',
      error instanceof Error ? error : new Error(String(error)),
      { props: JSON.stringify(props), ...context }
    );
    fallback?.();
    return null;
  }
}

/**
 * Safe wrapper for GSAP fromTo animations with error handling
 * Falls back to instant state changes if animation fails
 * 
 * Requirement 8.5: Log errors and fall back to instant state changes
 * 
 * @param element - The element to animate
 * @param fromProps - Starting animation properties
 * @param toProps - Ending animation properties
 * @param fallback - Optional fallback function to execute on error
 * @param context - Optional context for error logging
 * @returns The GSAP tween or null if animation failed
 */
export function safeAnimateFromTo(
  element: HTMLElement | null,
  fromProps: gsap.TweenVars,
  toProps: gsap.TweenVars,
  fallback?: () => void,
  context?: Record<string, unknown>
): gsap.core.Tween | null {
  if (!element) {
    fallback?.();
    return null;
  }

  // Check for reduced motion preference
  if (prefersReducedMotion()) {
    // Apply final state instantly without animation
    if (toProps.onComplete && typeof toProps.onComplete === 'function') {
      toProps.onComplete();
    }
    fallback?.();
    return null;
  }

  try {
    return gsap.fromTo(element, fromProps, toProps);
  } catch (error) {
    logError(
      'Animation failed',
      error instanceof Error ? error : new Error(String(error)),
      { fromProps: JSON.stringify(fromProps), toProps: JSON.stringify(toProps), ...context }
    );
    fallback?.();
    return null;
  }
}

/**
 * Safe wrapper for GSAP set (instant property changes) with error handling
 * 
 * @param element - The element to set properties on
 * @param props - Properties to set
 * @param context - Optional context for error logging
 * @returns The GSAP tween or null if operation failed
 */
export function safeSet(
  element: HTMLElement | null,
  props: gsap.TweenVars,
  context?: Record<string, unknown>
): gsap.core.Tween | null {
  if (!element) {
    return null;
  }

  try {
    return gsap.set(element, props);
  } catch (error) {
    logError(
      'GSAP set failed',
      error instanceof Error ? error : new Error(String(error)),
      { props: JSON.stringify(props), ...context }
    );
    return null;
  }
}

/**
 * Safely kill all tweens on an element
 * 
 * @param element - The element to kill tweens on
 */
export function safeKillTweens(element: HTMLElement | null): void {
  if (!element) return;
  
  try {
    gsap.killTweensOf(element);
  } catch (error) {
    logError(
      'Failed to kill tweens',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/* =============================================================================
   PERFORMANCE MONITORING
   Frame rate monitoring and automatic animation reduction for low-end devices
   
   Requirements: 1.5, 7.4
   ============================================================================= */

/** Minimum acceptable frame rate before reducing animations */
const MIN_ACCEPTABLE_FPS = 30;

/** Number of frames to sample for FPS calculation */
const FPS_SAMPLE_SIZE = 60;

/** Threshold for considering device as low-end (average FPS below this triggers reduction) */
const LOW_END_FPS_THRESHOLD = 45;

/**
 * Performance state for tracking frame rate and device capability
 */
interface PerformanceState {
  /** Current measured FPS */
  currentFps: number;
  /** Whether the device is considered low-end */
  isLowEndDevice: boolean;
  /** Whether animations should be reduced due to performance */
  shouldReduceAnimations: boolean;
  /** Timestamp of last frame */
  lastFrameTime: number;
  /** Array of recent frame times for averaging */
  frameTimes: number[];
  /** Whether monitoring is active */
  isMonitoring: boolean;
  /** Animation frame request ID */
  rafId: number | null;
  /** Callbacks to notify when performance state changes */
  listeners: Set<(state: PerformanceState) => void>;
}

/** Global performance state */
const performanceState: PerformanceState = {
  currentFps: 60,
  isLowEndDevice: false,
  shouldReduceAnimations: false,
  lastFrameTime: 0,
  frameTimes: [],
  isMonitoring: false,
  rafId: null,
  listeners: new Set(),
};

/**
 * Calculate FPS from frame times
 */
function calculateFps(frameTimes: number[]): number {
  if (frameTimes.length < 2) return 60;
  
  const totalTime = frameTimes.reduce((sum, time) => sum + time, 0);
  const avgFrameTime = totalTime / frameTimes.length;
  
  return avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 60;
}

/**
 * Frame callback for FPS monitoring
 */
function frameCallback(timestamp: number): void {
  if (!performanceState.isMonitoring) return;
  
  if (performanceState.lastFrameTime > 0) {
    const frameTime = timestamp - performanceState.lastFrameTime;
    
    // Add frame time to samples
    performanceState.frameTimes.push(frameTime);
    
    // Keep only the most recent samples
    if (performanceState.frameTimes.length > FPS_SAMPLE_SIZE) {
      performanceState.frameTimes.shift();
    }
    
    // Calculate current FPS
    const newFps = calculateFps(performanceState.frameTimes);
    const previousFps = performanceState.currentFps;
    performanceState.currentFps = newFps;
    
    // Check if we should reduce animations
    const wasLowEnd = performanceState.isLowEndDevice;
    performanceState.isLowEndDevice = newFps < LOW_END_FPS_THRESHOLD;
    performanceState.shouldReduceAnimations = 
      performanceState.isLowEndDevice || 
      newFps < MIN_ACCEPTABLE_FPS ||
      prefersReducedMotion();
    
    // Notify listeners if state changed significantly
    if (wasLowEnd !== performanceState.isLowEndDevice || 
        Math.abs(newFps - previousFps) > 5) {
      performanceState.listeners.forEach(listener => listener(performanceState));
    }
  }
  
  performanceState.lastFrameTime = timestamp;
  performanceState.rafId = requestAnimationFrame(frameCallback);
}

/**
 * Start frame rate monitoring
 * Monitors FPS and automatically flags low-end devices
 * 
 * Requirement 1.5, 7.4: Monitor frame rate and reduce animations on low-end devices
 */
export function startPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;
  if (performanceState.isMonitoring) return;
  
  performanceState.isMonitoring = true;
  performanceState.lastFrameTime = 0;
  performanceState.frameTimes = [];
  performanceState.rafId = requestAnimationFrame(frameCallback);
}

/**
 * Stop frame rate monitoring
 */
export function stopPerformanceMonitoring(): void {
  performanceState.isMonitoring = false;
  
  if (performanceState.rafId !== null) {
    cancelAnimationFrame(performanceState.rafId);
    performanceState.rafId = null;
  }
}

/**
 * Get current performance state
 * 
 * @returns Current performance metrics
 */
export function getPerformanceState(): Readonly<Pick<PerformanceState, 'currentFps' | 'isLowEndDevice' | 'shouldReduceAnimations'>> {
  return {
    currentFps: performanceState.currentFps,
    isLowEndDevice: performanceState.isLowEndDevice,
    shouldReduceAnimations: performanceState.shouldReduceAnimations,
  };
}

/**
 * Subscribe to performance state changes
 * 
 * @param callback - Function to call when performance state changes
 * @returns Cleanup function to unsubscribe
 */
export function onPerformanceChange(
  callback: (state: Pick<PerformanceState, 'currentFps' | 'isLowEndDevice' | 'shouldReduceAnimations'>) => void
): () => void {
  performanceState.listeners.add(callback);
  
  return () => {
    performanceState.listeners.delete(callback);
  };
}

/**
 * Check if animations should be reduced based on performance
 * Combines device capability check with user preferences
 * 
 * Requirements 1.5, 7.4: Automatic animation reduction on low-end devices
 * 
 * @returns true if animations should be simplified
 */
export function shouldReduceAnimationsForPerformance(): boolean {
  return performanceState.shouldReduceAnimations || 
         prefersReducedMotion() || 
         isMobileViewport();
}

/**
 * Get performance-aware animation configuration
 * Automatically adjusts animation complexity based on device capability
 * 
 * Requirements 1.5, 7.4: Performance-based animation adjustment
 * 
 * @param baseDuration - Base animation duration in ms
 * @returns Animation configuration optimized for current device performance
 */
export function getPerformanceAwareConfig(baseDuration: number = 500): AnimationConfig {
  const baseConfig = getAnimationConfig(baseDuration);
  
  // If performance monitoring indicates issues, further reduce complexity
  if (performanceState.shouldReduceAnimations && !prefersReducedMotion()) {
    return {
      ...baseConfig,
      duration: Math.round(baseConfig.duration * 0.6),
      useBlur: false,
      useGlitch: false,
      useTextShadow: false,
      ease: 'power1.out',
    };
  }
  
  return baseConfig;
}

/**
 * React hook for performance monitoring
 * Returns current FPS and whether animations should be reduced
 * 
 * Usage:
 * ```tsx
 * const { fps, shouldReduce } = usePerformanceMonitor();
 * ```
 */
export function createPerformanceMonitorHook() {
  // This returns a factory function that can be used with React's useState/useEffect
  // The actual hook implementation should be in a React component file
  return {
    startMonitoring: startPerformanceMonitoring,
    stopMonitoring: stopPerformanceMonitoring,
    getState: getPerformanceState,
    subscribe: onPerformanceChange,
  };
}
