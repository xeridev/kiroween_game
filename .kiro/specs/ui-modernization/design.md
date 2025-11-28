# Design Document: UI Modernization

## Overview

This feature modernizes the Kiroween game UI by replacing the retro CRT aesthetic with a sleek, modern design using React Bits components. The implementation introduces dynamic theming that shifts between "cute" and "horror" modes based on game state, animated stat displays, interactive card-based inventory, and glassmorphism panels.

The design leverages GSAP (already in use) and React Bits components which are copy-paste components that integrate seamlessly with the existing codebase.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              ThemeProvider (Context)                 │    │
│  │  - currentMode: 'cute' | 'horror' | 'transition'    │    │
│  │  - themeColors: computed from sanity/stage          │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│  ┌─────────────┬───────────┴───────────┬─────────────┐     │
│  │             │                       │             │     │
│  ▼             ▼                       ▼             ▼     │
│ Waves      GameCanvas              Panels         Dock     │
│ Background  + SplitText           + Glass        Actions   │
│             + CountUp             Surface                  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  InventoryStack                      │   │
│  │              (Stack component)                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### ThemeContext

```typescript
interface ThemeContextValue {
  mode: 'cute' | 'horror';
  isTransitioning: boolean;
  colors: ThemeColors;
  getBackgroundProps: () => WavesProps;
  getPanelStyle: () => React.CSSProperties;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  glass: {
    background: string;
    border: string;
    blur: number;
  };
}
```

### React Bits Components to Integrate

1. **Waves** (Background)
   - Location: `src/components/reactbits/Waves.tsx`
   - Props: lineColor, backgroundColor, waveSpeedX, waveSpeedY

2. **CountUp** (Stats)
   - Location: `src/components/reactbits/CountUp.tsx`
   - Props: end, duration, onComplete

3. **SplitText** (Text Animations)
   - Location: `src/components/reactbits/SplitText.tsx`
   - Props: text, splitType, staggerDelay, duration

4. **Stack** (Inventory)
   - Location: `src/components/reactbits/Stack.tsx`
   - Props: cardsData, cardDimensions, sendToBackOnClick

5. **Dock** (Action Buttons)
   - Location: `src/components/reactbits/Dock.tsx`
   - Props: items, magnification, panelHeight

### Modified Components

```typescript
// StatsPanel.tsx - Updated interface
interface StatDisplayProps {
  label: string;
  value: number;
  previousValue: number;
  maxValue: number;
  showChange: boolean;
}

// InventoryPanel.tsx - Updated to use Stack
interface InventoryStackProps {
  inventory: Offering[];
  onFeed: (itemId: string) => void;
  onCardClick: (itemId: string) => void;
}

// App.tsx - New background layer
interface BackgroundLayerProps {
  mode: 'cute' | 'horror';
  reduceMotion: boolean;
}
```

## Data Models

### Theme Configuration

```typescript
const CUTE_THEME: ThemeColors = {
  primary: '#FFB7D9',      // Soft pink
  secondary: '#E8D5F2',    // Lavender
  accent: '#98D9C2',       // Mint
  background: '#FFF5F8',   // Light pink
  text: '#4A4A4A',
  glass: {
    background: 'rgba(255, 183, 217, 0.15)',
    border: 'rgba(255, 255, 255, 0.3)',
    blur: 12,
  },
};

const HORROR_THEME: ThemeColors = {
  primary: '#8B0000',      // Dark red
  secondary: '#1A0A1A',    // Deep purple-black
  accent: '#E94560',       // Blood red
  background: '#0D0D0D',   // Near black
  text: '#E0E0E0',
  glass: {
    background: 'rgba(139, 0, 0, 0.2)',
    border: 'rgba(233, 69, 96, 0.3)',
    blur: 8,
  },
};
```

### Theme Selection Logic

```typescript
function determineThemeMode(sanity: number, stage: PetStage): 'cute' | 'horror' {
  // Horror mode triggers
  if (stage === 'ABOMINATION') return 'horror';
  if (sanity < 30) return 'horror';
  
  // Cute mode for healthy states
  if (sanity > 50) return 'cute';
  
  // Transition zone (30-50) - use previous mode or default to cute
  return 'cute';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Theme color selection based on game state
*For any* combination of sanity value and pet stage, the theme mode SHALL be 'horror' if sanity < 30 OR stage is ABOMINATION, otherwise 'cute' if sanity > 50
**Validates: Requirements 1.2, 1.3**

### Property 2: Stat highlight color reflects change direction
*For any* stat change event, the highlight color SHALL be green when the new value is greater than the previous value, and red when the new value is less than the previous value
**Validates: Requirements 2.3, 2.4**

### Property 3: Glitch effect activation based on sanity
*For any* sanity value below 30, the pet name text SHALL have the glitch effect class applied
**Validates: Requirements 3.3**

### Property 4: Dock action mapping correctness
*For any* dock item click, the executed action SHALL match the action defined for that item's label
**Validates: Requirements 5.3**

### Property 5: Panel styling matches current theme mode
*For any* theme mode (cute or horror), all visible panels SHALL have styling properties consistent with that mode's glass configuration
**Validates: Requirements 6.4, 6.5**

### Property 6: Settings persistence round-trip
*For any* UI mode preference change (modern/retro), saving to localStorage and reloading SHALL restore the same preference
**Validates: Requirements 8.4**

## Error Handling

1. **React Bits Component Failures**
   - If a React Bits component fails to render, fall back to simple HTML/CSS equivalent
   - Log error but don't crash the game

2. **Theme Transition Errors**
   - If GSAP animation fails, apply theme instantly
   - Ensure game remains playable regardless of animation state

3. **Reduce Motion Handling**
   - Check `prefers-reduced-motion` media query on load
   - Respect user's system preference as default
   - Allow manual override in settings

4. **Performance Degradation**
   - Monitor frame rate during animations
   - Automatically reduce animation complexity on low-end devices
   - Disable Waves background if performance drops below 30fps

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

- **Unit tests** verify specific UI behaviors, component rendering, and integration points
- **Property-based tests** verify universal properties that should hold across all valid inputs

### Property-Based Testing

**Library**: fast-check (already configured in project)

**Test Configuration**: Minimum 100 iterations per property test

**Properties to Test**:

1. Theme mode selection (Property 1)
2. Stat highlight colors (Property 2)
3. Glitch effect activation (Property 3)
4. Dock action mapping (Property 4)
5. Panel styling consistency (Property 5)
6. Settings persistence (Property 6)

### Unit Tests

1. **Theme Context**
   - Renders correct mode based on initial state
   - Transitions between modes correctly
   - Provides correct colors for each mode

2. **CountUp Integration**
   - Animates from previous to new value
   - Respects reduce motion setting
   - Calls onComplete callback

3. **Stack Component**
   - Renders correct number of cards
   - Handles empty state
   - Responds to click/drag interactions

4. **Dock Component**
   - Renders all action items
   - Positions correctly for viewport size
   - Executes correct action on click

5. **Waves Background**
   - Renders with correct colors for mode
   - Disables animation when reduce motion enabled
   - Transitions colors smoothly

### Test File Locations

- `src/utils/themeUtils.test.ts` - Theme logic and color selection
- `src/components/StatsPanel.test.tsx` - CountUp integration
- `src/components/InventoryStack.test.tsx` - Stack component
- `src/components/ActionDock.test.tsx` - Dock component
