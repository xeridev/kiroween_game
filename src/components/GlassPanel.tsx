/**
 * GlassPanel - Glassmorphism wrapper component
 * 
 * Provides frosted glass effect with theme-based styling
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import type { ElementType, ReactNode, CSSProperties, MouseEvent } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './GlassPanel.css';

export interface GlassPanelProps {
  /** Child content to wrap */
  children: ReactNode;
  /** Additional CSS class names */
  className?: string;
  /** Panel variant for different use cases */
  variant?: 'default' | 'settings' | 'stats' | 'narrative';
  /** Custom inline styles */
  style?: CSSProperties;
  /** HTML element to render as */
  as?: ElementType;
  /** Accessibility role */
  role?: string;
  /** Aria label */
  'aria-label'?: string;
  /** Aria modal */
  'aria-modal'?: boolean;
  /** Click handler */
  onClick?: (e: MouseEvent) => void;
}

/**
 * GlassPanel component
 * Wraps content with glassmorphism styling that adapts to theme mode
 * 
 * Requirements:
 * - 6.1: Settings panel with frosted glass background
 * - 6.2: Stats panel with subtle glassmorphism
 * - 6.3: Narrative log with dark-tinted glass
 * - 6.4: Horror mode reduces transparency, adds red tint
 * - 6.5: Cute mode increases transparency with pink/lavender tint
 */
export function GlassPanel({
  children,
  className = '',
  variant = 'default',
  style,
  as: Component = 'div',
  role,
  'aria-label': ariaLabel,
  'aria-modal': ariaModal,
  onClick,
}: GlassPanelProps) {
  const { mode, colors, isTransitioning } = useTheme();
  
  // Build glass styles based on theme and variant
  const glassStyle: CSSProperties = {
    background: colors.glass.background,
    borderColor: colors.glass.border,
    backdropFilter: `blur(${colors.glass.blur}px)`,
    WebkitBackdropFilter: `blur(${colors.glass.blur}px)`,
    ...style,
  };
  
  // Build class names
  const classNames = [
    'glass-panel',
    `glass-panel--${variant}`,
    `glass-panel--${mode}`,
    isTransitioning ? 'glass-panel--transitioning' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component
      className={classNames}
      style={glassStyle}
      role={role}
      aria-label={ariaLabel}
      aria-modal={ariaModal}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}
