/**
 * AnimatedPetName component - displays pet name with character-by-character animation
 * Uses SplitText for animation and adds glitch effect when sanity < 30
 * 
 * Requirements: 3.1, 3.3
 */

import { useMemo } from 'react';
import { SplitText } from './reactbits/SplitText';
import './AnimatedPetName.css';

export interface AnimatedPetNameProps {
  /** Pet name to display */
  name: string;
  /** Current sanity level (0-100) */
  sanity: number;
  /** Whether to disable animation (for reduce motion) */
  disableAnimation?: boolean;
  /** Custom class name */
  className?: string;
}

/** Sanity threshold below which glitch effect is applied */
export const GLITCH_SANITY_THRESHOLD = 30;

/**
 * Determines if glitch effect should be active based on sanity level
 * Property 3: Glitch effect activation based on sanity
 */
export function shouldShowGlitch(sanity: number): boolean {
  return sanity < GLITCH_SANITY_THRESHOLD;
}

/**
 * AnimatedPetName - Animated pet name display with glitch effect
 * Requirement 3.1: Animate pet name using SplitText with character-by-character fade-in
 * Requirement 3.3: Apply glitch effect when sanity < 30
 */
export function AnimatedPetName({
  name,
  sanity,
  disableAnimation = false,
  className = '',
}: AnimatedPetNameProps) {
  // Determine if glitch effect should be active (Requirement 3.3)
  const showGlitch = useMemo(() => shouldShowGlitch(sanity), [sanity]);

  // Build class names
  const containerClasses = useMemo(() => {
    const classes = ['animated-pet-name'];
    if (showGlitch) {
      classes.push('glitch-active');
    }
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [showGlitch, className]);

  return (
    <div className={containerClasses} data-text={name}>
      <SplitText
        text={name}
        splitType="chars"
        staggerDelay={50}
        duration={0.5}
        ease="power2.out"
        from={{ opacity: 0, y: 20 }}
        to={{ opacity: 1, y: 0 }}
        textAlign="center"
        className="pet-name-text"
        disableAnimation={disableAnimation}
      />
    </div>
  );
}

export default AnimatedPetName;
