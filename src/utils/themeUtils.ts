/**
 * Theme utility functions and types
 * Provides theme configuration and mode selection logic for UI modernization
 * 
 * Requirements: 1.2, 1.3, 6.4, 6.5
 */

import type { PetStage } from './types';

/**
 * Theme mode - determines the visual style of the UI
 */
export type ThemeMode = 'cute' | 'horror';

/**
 * Glass effect configuration for glassmorphism panels
 */
export interface GlassConfig {
  /** Background color with alpha */
  background: string;
  /** Border color with alpha */
  border: string;
  /** Blur amount in pixels */
  blur: number;
}

/**
 * Complete theme color configuration
 * Requirements: 1.2, 1.3, 6.4, 6.5
 */
export interface ThemeColors {
  /** Primary accent color */
  primary: string;
  /** Secondary color for backgrounds and accents */
  secondary: string;
  /** Accent color for highlights and interactive elements */
  accent: string;
  /** Main background color */
  background: string;
  /** Primary text color */
  text: string;
  /** Glass effect configuration for panels */
  glass: GlassConfig;
}

/**
 * Cute theme colors - soft pastels for high sanity states
 * Requirement 1.2: Soft pastel colors (pink, lavender tones)
 */
export const CUTE_THEME: ThemeColors = {
  primary: '#FFB7D9',      // Soft pink
  secondary: '#E8D5F2',    // Lavender
  accent: '#98D9C2',       // Mint
  background: '#FFF5F8',   // Light pink
  text: '#4A4A4A',         // Dark gray for readability
  glass: {
    background: 'rgba(255, 183, 217, 0.15)',
    border: 'rgba(255, 255, 255, 0.3)',
    blur: 12,
  },
};


/**
 * Horror theme colors - dark and ominous for low sanity/abomination states
 * Requirement 1.3: Dark horror colors (deep red, black, purple)
 */
export const HORROR_THEME: ThemeColors = {
  primary: '#8B0000',      // Dark red
  secondary: '#1A0A1A',    // Deep purple-black
  accent: '#E94560',       // Blood red
  background: '#0D0D0D',   // Near black
  text: '#E0E0E0',         // Light gray for readability
  glass: {
    background: 'rgba(139, 0, 0, 0.2)',
    border: 'rgba(233, 69, 96, 0.3)',
    blur: 8,
  },
};

/**
 * Sanity thresholds for theme mode selection
 */
export const SANITY_THRESHOLDS = {
  /** Below this value triggers horror mode */
  HORROR: 30,
  /** Above this value triggers cute mode */
  CUTE: 50,
} as const;

/**
 * Determine the theme mode based on game state
 * 
 * Property 1: Theme color selection based on game state
 * - Horror mode if sanity < 30 OR stage is ABOMINATION
 * - Cute mode if sanity > 50 (and not ABOMINATION)
 * - Default to cute for transition zone (30-50)
 * 
 * Requirements: 1.2, 1.3
 * 
 * @param sanity - Current sanity value (0-100)
 * @param stage - Current pet evolution stage
 * @returns The appropriate theme mode
 */
export function determineThemeMode(sanity: number, stage: PetStage): ThemeMode {
  // Horror mode triggers (highest priority)
  // Requirement 1.3: Horror mode when sanity < 30 OR stage is ABOMINATION
  if (stage === 'ABOMINATION') {
    return 'horror';
  }
  
  if (sanity < SANITY_THRESHOLDS.HORROR) {
    return 'horror';
  }
  
  // Cute mode for healthy states
  // Requirement 1.2: Cute mode when sanity > 50 and not ABOMINATION
  if (sanity > SANITY_THRESHOLDS.CUTE) {
    return 'cute';
  }
  
  // Transition zone (30-50) - default to cute
  // This provides a buffer to prevent rapid theme switching
  return 'cute';
}

/**
 * Get the theme colors for a given mode
 * 
 * @param mode - The theme mode
 * @returns The corresponding theme colors
 */
export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'horror' ? HORROR_THEME : CUTE_THEME;
}

/**
 * Get theme colors based on game state
 * Convenience function that combines mode determination and color lookup
 * 
 * @param sanity - Current sanity value (0-100)
 * @param stage - Current pet evolution stage
 * @returns The appropriate theme colors
 */
export function getThemeColorsForState(sanity: number, stage: PetStage): ThemeColors {
  const mode = determineThemeMode(sanity, stage);
  return getThemeColors(mode);
}

/**
 * Check if a sanity value crosses a threshold compared to a previous value
 * Used to trigger theme transitions
 * 
 * Requirement 1.4: Smooth transition when sanity crosses thresholds
 * 
 * @param previousSanity - Previous sanity value
 * @param currentSanity - Current sanity value
 * @returns Object indicating which thresholds were crossed
 */
export function checkThresholdCrossing(
  previousSanity: number,
  currentSanity: number
): { crossedHorror: boolean; crossedCute: boolean; direction: 'up' | 'down' | 'none' } {
  const crossedHorror = 
    (previousSanity >= SANITY_THRESHOLDS.HORROR && currentSanity < SANITY_THRESHOLDS.HORROR) ||
    (previousSanity < SANITY_THRESHOLDS.HORROR && currentSanity >= SANITY_THRESHOLDS.HORROR);
  
  const crossedCute = 
    (previousSanity <= SANITY_THRESHOLDS.CUTE && currentSanity > SANITY_THRESHOLDS.CUTE) ||
    (previousSanity > SANITY_THRESHOLDS.CUTE && currentSanity <= SANITY_THRESHOLDS.CUTE);
  
  let direction: 'up' | 'down' | 'none' = 'none';
  if (currentSanity > previousSanity) {
    direction = 'up';
  } else if (currentSanity < previousSanity) {
    direction = 'down';
  }
  
  return { crossedHorror, crossedCute, direction };
}

/**
 * Get CSS custom properties for a theme
 * Used to apply theme colors as CSS variables
 * 
 * @param colors - Theme colors to convert
 * @returns Object with CSS custom property names and values
 */
export function getThemeCSSProperties(colors: ThemeColors): Record<string, string> {
  return {
    '--theme-primary': colors.primary,
    '--theme-secondary': colors.secondary,
    '--theme-accent': colors.accent,
    '--theme-background': colors.background,
    '--theme-text': colors.text,
    '--theme-glass-bg': colors.glass.background,
    '--theme-glass-border': colors.glass.border,
    '--theme-glass-blur': `${colors.glass.blur}px`,
  };
}

/**
 * Interpolate between two colors
 * Used for smooth theme transitions
 * 
 * @param color1 - Starting color (hex)
 * @param color2 - Ending color (hex)
 * @param factor - Interpolation factor (0-1)
 * @returns Interpolated color (hex)
 */
export function interpolateColor(color1: string, color2: string, factor: number): string {
  // Parse hex colors
  const parseHex = (hex: string) => {
    const clean = hex.replace('#', '');
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  };
  
  const c1 = parseHex(color1);
  const c2 = parseHex(color2);
  
  // Clamp factor to 0-1
  const f = Math.max(0, Math.min(1, factor));
  
  // Interpolate each channel
  const r = Math.round(c1.r + (c2.r - c1.r) * f);
  const g = Math.round(c1.g + (c2.g - c1.g) * f);
  const b = Math.round(c1.b + (c2.b - c1.b) * f);
  
  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
