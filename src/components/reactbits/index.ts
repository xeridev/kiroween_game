/**
 * React Bits components - adapted for Kiroween game
 * 
 * These components are based on React Bits (reactbits.dev) and have been
 * customized for the game's theming and animation requirements.
 */

// Background components
export { Waves } from './Waves';
export type { WavesProps } from './Waves';

// Text animation components
export { SplitText } from './SplitText';
export type { SplitTextProps, SplitType } from './SplitText';

// Interactive components
export { Stack } from './Stack';
export type { StackProps, CardData } from './Stack';

export { Dock } from './Dock';
export type { DockProps, DockItemData, SpringOptions } from './Dock';

// Re-export existing animation components for convenience
export { CountUp } from '../animations/CountUp';
export { FadeIn } from '../animations/FadeIn';
