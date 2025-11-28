/**
 * ThemeContext - Provides theme state and utilities to the application
 * 
 * Requirements: 1.2, 1.3, 7.1, 7.2, 7.3, 7.4
 */

import { createContext, useContext, useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import { useGameStore } from '../store';
import type { ThemeMode, ThemeColors, GlassConfig } from '../utils/themeUtils';
import { 
  determineThemeMode, 
  getThemeColors,
  getThemeCSSProperties,
  interpolateColor,
  CUTE_THEME,
  HORROR_THEME,
} from '../utils/themeUtils';
import type { WavesProps } from '../components/reactbits/Waves';
import { prefersReducedMotion } from '../utils/animationUtils';

/**
 * Theme context value interface
 * Provides theme state and helper functions to consumers
 */
export interface ThemeContextValue {
  /** Current theme mode */
  mode: ThemeMode;
  /** Whether a theme transition is in progress */
  isTransitioning: boolean;
  /** Current theme colors */
  colors: ThemeColors;
  /** Get props for Waves background component */
  getBackgroundProps: () => Partial<WavesProps>;
  /** Get inline styles for glass panels */
  getPanelStyle: () => React.CSSProperties;
  /** Get CSS custom properties for theme */
  getCSSProperties: () => Record<string, string>;
}

// Default context value
const defaultContextValue: ThemeContextValue = {
  mode: 'cute',
  isTransitioning: false,
  colors: CUTE_THEME,
  getBackgroundProps: () => ({}),
  getPanelStyle: () => ({}),
  getCSSProperties: () => ({}),
};

// Create the context
const ThemeContext = createContext<ThemeContextValue>(defaultContextValue);

/**
 * Theme transition duration in seconds
 * Requirement 7.1, 7.2: 1.5 second transitions
 */
const TRANSITION_DURATION_SEC = 1.5;

/**
 * Interpolate between two glass configurations
 * Used for smooth glass effect transitions
 */
function interpolateGlass(from: GlassConfig, to: GlassConfig, factor: number): GlassConfig {
  // Parse rgba values
  const parseRgba = (rgba: string) => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
    if (!match) return { r: 0, g: 0, b: 0, a: 1 };
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      a: match[4] ? parseFloat(match[4]) : 1,
    };
  };
  
  const fromBg = parseRgba(from.background);
  const toBg = parseRgba(to.background);
  const fromBorder = parseRgba(from.border);
  const toBorder = parseRgba(to.border);
  
  const f = Math.max(0, Math.min(1, factor));
  
  const interpRgba = (from: { r: number; g: number; b: number; a: number }, to: { r: number; g: number; b: number; a: number }) => {
    const r = Math.round(from.r + (to.r - from.r) * f);
    const g = Math.round(from.g + (to.g - from.g) * f);
    const b = Math.round(from.b + (to.b - from.b) * f);
    const a = from.a + (to.a - from.a) * f;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  };
  
  return {
    background: interpRgba(fromBg, toBg),
    border: interpRgba(fromBorder, toBorder),
    blur: Math.round(from.blur + (to.blur - from.blur) * f),
  };
}

/**
 * Interpolate between two complete theme color sets
 */
function interpolateThemeColors(from: ThemeColors, to: ThemeColors, factor: number): ThemeColors {
  return {
    primary: interpolateColor(from.primary, to.primary, factor),
    secondary: interpolateColor(from.secondary, to.secondary, factor),
    accent: interpolateColor(from.accent, to.accent, factor),
    background: interpolateColor(from.background, to.background, factor),
    text: interpolateColor(from.text, to.text, factor),
    glass: interpolateGlass(from.glass, to.glass, factor),
  };
}

/**
 * ThemeProvider component
 * Wraps the application and provides theme context
 * 
 * Requirements: 1.2, 1.3, 7.1, 7.2, 7.3, 7.4
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Get game state from store
  const sanity = useGameStore((state) => state.stats.sanity);
  const stage = useGameStore((state) => state.stage);
  const reduceMotion = useGameStore((state) => state.reduceMotion);
  
  // Track previous sanity for threshold detection
  const previousSanityRef = useRef(sanity);
  
  // Theme state
  const [mode, setMode] = useState<ThemeMode>(() => determineThemeMode(sanity, stage));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [colors, setColors] = useState<ThemeColors>(() => getThemeColors(mode));
  
  // GSAP animation ref for cleanup
  const animationRef = useRef<gsap.core.Tween | null>(null);
  
  // Store starting colors for interpolation
  const startColorsRef = useRef<ThemeColors>(colors);

  /**
   * Animate theme transition using GSAP
   * Requirements 7.1, 7.2, 7.3: 1.5-second transitions with simultaneous updates
   */
  const animateThemeTransition = useCallback((fromColors: ThemeColors, toColors: ThemeColors, onComplete: () => void) => {
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }
    
    // Create progress object for GSAP to animate
    const progress = { value: 0 };
    
    animationRef.current = gsap.to(progress, {
      value: 1,
      duration: TRANSITION_DURATION_SEC,
      ease: 'power2.inOut',
      onUpdate: () => {
        // Interpolate all colors simultaneously (Requirement 7.3)
        const interpolatedColors = interpolateThemeColors(fromColors, toColors, progress.value);
        setColors(interpolatedColors);
      },
      onComplete: () => {
        // Ensure final colors are exact
        setColors(toColors);
        onComplete();
      },
    });
  }, []);

  // Update theme when game state changes
  useEffect(() => {
    const newMode = determineThemeMode(sanity, stage);
    
    // Check if mode actually changed
    if (newMode !== mode) {
      const shouldAnimate = !reduceMotion && !prefersReducedMotion();
      const targetColors = newMode === 'horror' ? HORROR_THEME : CUTE_THEME;
      
      if (shouldAnimate) {
        // Start transition
        setIsTransitioning(true);
        setMode(newMode);
        
        // Store current colors as starting point
        startColorsRef.current = { ...colors };
        
        // Animate using GSAP (Requirements 7.1, 7.2, 7.3)
        animateThemeTransition(startColorsRef.current, targetColors, () => {
          setIsTransitioning(false);
        });
      } else {
        // Instant change for reduced motion (Requirement 7.4)
        setMode(newMode);
        setColors(targetColors);
      }
    }
    
    // Update previous sanity ref
    previousSanityRef.current = sanity;
    
    // Cleanup animation on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [sanity, stage, mode, reduceMotion, colors, animateThemeTransition]);

  // Get background props for Waves component
  const getBackgroundProps = useCallback((): Partial<WavesProps> => {
    const shouldDisableAnimation = reduceMotion || prefersReducedMotion();
    
    if (mode === 'horror') {
      return {
        lineColor: colors.accent,
        backgroundColor: colors.background,
        waveSpeedX: 0.015,
        waveSpeedY: 0.008,
        waveAmpX: 30,
        waveAmpY: 15,
        disableAnimation: shouldDisableAnimation,
      };
    }
    
    // Cute mode
    return {
      lineColor: colors.primary,
      backgroundColor: colors.background,
      waveSpeedX: 0.02,
      waveSpeedY: 0.01,
      waveAmpX: 40,
      waveAmpY: 20,
      disableAnimation: shouldDisableAnimation,
    };
  }, [mode, colors, reduceMotion]);

  // Get panel styles for glassmorphism
  // Note: We don't use CSS transitions here since GSAP handles the color interpolation
  const getPanelStyle = useCallback((): React.CSSProperties => {
    return {
      background: colors.glass.background,
      borderColor: colors.glass.border,
      backdropFilter: `blur(${colors.glass.blur}px)`,
      WebkitBackdropFilter: `blur(${colors.glass.blur}px)`,
    };
  }, [colors]);

  // Get CSS custom properties
  const getCSSProperties = useCallback((): Record<string, string> => {
    return getThemeCSSProperties(colors);
  }, [colors]);

  // Memoize context value
  const contextValue = useMemo<ThemeContextValue>(() => ({
    mode,
    isTransitioning,
    colors,
    getBackgroundProps,
    getPanelStyle,
    getCSSProperties,
  }), [mode, isTransitioning, colors, getBackgroundProps, getPanelStyle, getCSSProperties]);

  // Apply CSS custom properties to document root
  useEffect(() => {
    const root = document.documentElement;
    const cssProps = getCSSProperties();
    
    Object.entries(cssProps).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // Add transition class during transitions
    if (isTransitioning) {
      root.classList.add('theme-transitioning');
    } else {
      root.classList.remove('theme-transitioning');
    }
    
    // Add mode class
    root.classList.remove('theme-cute', 'theme-horror');
    root.classList.add(`theme-${mode}`);
  }, [getCSSProperties, isTransitioning, mode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * 
 * @returns Theme context value
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (context === defaultContextValue) {
    // This check works because we're comparing object references
    // If the context is the default value, we're outside the provider
    console.warn('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

/**
 * Hook to get current theme mode
 * Convenience hook for components that only need the mode
 */
export function useThemeMode(): ThemeMode {
  return useTheme().mode;
}

/**
 * Hook to get current theme colors
 * Convenience hook for components that only need colors
 */
export function useThemeColors(): ThemeColors {
  return useTheme().colors;
}

export { ThemeContext };
