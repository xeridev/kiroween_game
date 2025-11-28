# Design Document: Interactive UI Enhancements

## Overview

This design document outlines the architecture and implementation strategy for adding interactive UI enhancements to the Kiroween Game. The enhancements include drag-and-drop inventory management using @dnd-kit, animated stat displays using adapted React Bits components, enhanced narrative log animations, and visual feedback improvements.

The implementation prioritizes:
1. Preserving the existing retro horror aesthetic and stage-based theming
2. Maintaining accessibility (keyboard navigation, screen reader support)
3. Ensuring smooth performance (60fps desktop, 30fps mobile)
4. Graceful degradation when animations fail

## Architecture

### Component Hierarchy

```
App.tsx
├── StatsPanel.tsx
│   └── CountUp.tsx (new - adapted from React Bits)
├── GameCanvas.tsx
│   └── useDroppable (new - @dnd-kit hook)
├── InventoryPanel.tsx (modified)
│   ├── DndContext (new - @dnd-kit provider)
│   ├── SortableContext (new - @dnd-kit)
│   ├── SortableItem.tsx (new)
│   │   └── useSortable (new - @dnd-kit hook)
│   └── DragOverlay (new - @dnd-kit)
└── NarrativeLog.tsx (modified)
    └── FadeIn.tsx (new - adapted from React Bits)

src/components/animations/ (new directory)
├── CountUp.tsx
├── CountUp.css
├── FadeIn.tsx
├── FadeIn.css
├── AnimatedContent.tsx (optional - for future use)
└── AnimatedContent.css
```

### State Management Strategy

**Local React State (recommended for drag operations):**
- `activeId: string | null` - Currently dragged item ID
- `overId: string | null` - Current drop target ID

**Zustand Store (for persisted state):**
- Inventory order is already persisted via the existing `inventory` array
- No new Zustand state needed for drag operations

**Rationale:** Drag state is ephemeral and UI-specific. Using React local state avoids unnecessary store updates during drag operations and keeps the Zustand store focused on game state.

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        DndContext                                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │  InventoryPanel │    │   GameCanvas    │    │  DragOverlay │ │
│  │  (SortableCtx)  │    │  (Droppable)    │    │  (Portal)    │ │
│  └────────┬────────┘    └────────┬────────┘    └──────────────┘ │
│           │                      │                               │
│           ▼                      ▼                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Event Handlers                            ││
│  │  onDragStart → setActiveId(id)                              ││
│  │  onDragOver  → setOverId(id)                                ││
│  │  onDragEnd   → if(over === canvas) feed(id)                 ││
│  │              → else if(over === slot) reorder()             ││
│  │              → setActiveId(null)                            ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### New Type Definitions (src/utils/types.ts)

```typescript
// Drag-and-drop types
export type DragItemType = 'inventory-item';

export interface DragData {
  type: DragItemType;
  item: Offering;
}

// Animation component props
export interface CountUpProps {
  value: number;
  duration?: number;        // Default: 500ms
  decimals?: number;        // Default: 1
  onComplete?: () => void;
  className?: string;
}

export interface FadeInProps {
  children: React.ReactNode;
  duration?: number;        // Default: 400ms
  delay?: number;           // Default: 0ms
  blur?: boolean;           // Default: true
  className?: string;
}

// Droppable zone identifiers
export type DroppableId = 'game-canvas' | `inventory-slot-${number}`;
```

### SortableItem Component

```typescript
// src/components/SortableItem.tsx
interface SortableItemProps {
  item: Offering;
  onFeed: (itemId: string) => void;
  isDragging?: boolean;
}
```

### Modified InventoryPanel Props

```typescript
interface InventoryPanelProps {
  inventory: Offering[];
  onFeed: (itemId: string) => void;
  onReorder: (newOrder: Offering[]) => void;  // NEW
  canScavenge: boolean;
  onScavenge: () => void;
  isScavenging?: boolean;
}
```

### Animation Components

#### CountUp Component

Adapted from React Bits, converted to TypeScript:

```typescript
// src/components/animations/CountUp.tsx
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './CountUp.css';

export function CountUp({ 
  value, 
  duration = 500, 
  decimals = 1,
  onComplete,
  className = ''
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    // Kill any existing animation
    if (tweenRef.current) {
      tweenRef.current.kill();
    }

    const obj = { val: previousValue.current };
    
    tweenRef.current = gsap.to(obj, {
      val: value,
      duration: duration / 1000,
      ease: 'power2.out',
      onUpdate: () => setDisplayValue(obj.val),
      onComplete: () => {
        previousValue.current = value;
        onComplete?.();
      }
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, [value, duration, onComplete]);

  return (
    <span className={`count-up ${className}`}>
      {displayValue.toFixed(decimals)}
    </span>
  );
}
```

#### FadeIn Component

```typescript
// src/components/animations/FadeIn.tsx
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './FadeIn.css';

export function FadeIn({
  children,
  duration = 400,
  delay = 0,
  blur = true,
  className = ''
}: FadeInProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    gsap.fromTo(
      element,
      {
        opacity: 0,
        filter: blur ? 'blur(8px)' : 'none',
        y: 10
      },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: duration / 1000,
        delay: delay / 1000,
        ease: 'power2.out',
        onComplete: () => setIsVisible(true)
      }
    );
  }, [duration, delay, blur]);

  return (
    <div ref={elementRef} className={`fade-in ${className}`}>
      {children}
    </div>
  );
}
```

## Data Models

### Inventory Reorder Function

```typescript
// Utility function for array reordering
function reorderInventory(
  inventory: Offering[],
  fromIndex: number,
  toIndex: number
): Offering[] {
  const result = [...inventory];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}
```

### Drag Event Types

```typescript
interface DragStartEvent {
  active: { id: string; data: { current: DragData } };
}

interface DragEndEvent {
  active: { id: string };
  over: { id: DroppableId } | null;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Inventory reorder preserves items
*For any* inventory array and any valid source/destination indices, reordering the inventory SHALL preserve all items (no items lost or duplicated) and only change their positions.
**Validates: Requirements 1.3**

### Property 2: Invalid drop preserves inventory state
*For any* inventory state and any drag operation that ends outside valid drop zones (not over another slot or the canvas), the inventory array SHALL remain unchanged.
**Validates: Requirements 1.4**

### Property 3: Drag-feed equivalence
*For any* inventory item, feeding via drag-and-drop onto the GameCanvas SHALL produce identical state changes (hunger, sanity, corruption, inventory removal) as feeding via click-to-feed.
**Validates: Requirements 2.2, 2.3**

### Property 4: CountUp interpolation correctness
*For any* stat value change from oldValue to newValue, the CountUp animation SHALL interpolate through values between oldValue and newValue, ending exactly at newValue.
**Validates: Requirements 3.1**

### Property 5: Stat change batching
*For any* sequence of stat changes occurring within 100 milliseconds, the CountUp animation SHALL animate only to the final value, not intermediate values.
**Validates: Requirements 3.3**

### Property 6: Emphasis animation threshold
*For any* stat change where |newValue - oldValue| > 10, the emphasis animation SHALL be triggered; for changes where |newValue - oldValue| <= 10, the emphasis animation SHALL NOT be triggered.
**Validates: Requirements 3.5**

### Property 7: Log entry stagger timing
*For any* batch of N log entries added simultaneously, entry at index i SHALL have animation delay of i * 150 milliseconds.
**Validates: Requirements 4.2**

### Property 8: Sanity-based glitch effects
*For any* sanity value < 30, new log entry animations SHALL include glitch effects; for sanity >= 30, glitch effects SHALL NOT be applied to new entries.
**Validates: Requirements 4.4**

### Property 9: Quick tap triggers click behavior
*For any* touch interaction shorter than 200 milliseconds on an inventory item, the click-to-feed behavior SHALL be triggered instead of drag initiation.
**Validates: Requirements 7.3**

### Property 10: Animation throttle on tick
*For any* sequence of game ticks, CountUp animations SHALL only be triggered at most once every 5 ticks (5 seconds).
**Validates: Requirements 8.3**

### Property 11: Animation error graceful degradation
*For any* animation initialization failure, the system SHALL log the error via errorLogger and display the final state value instantly without throwing an exception.
**Validates: Requirements 8.5**

### Property 12: Stage theme reactivity
*For any* pet stage change, all animation components using CSS custom properties SHALL reflect the new stage's theme values within one render cycle.
**Validates: Requirements 9.1**

### Property 13: Sanity state theme reactivity
*For any* sanity transition crossing the 30-point threshold (critical ↔ normal), animation components SHALL apply or remove glitch/distortion effects accordingly.
**Validates: Requirements 9.2**

### Property 14: ABOMINATION drag glitch
*For any* drag operation when pet stage is ABOMINATION, the DragOverlay SHALL include glitch animation effects; for other stages, glitch effects SHALL NOT be applied to DragOverlay.
**Validates: Requirements 9.5**

## Error Handling

### Animation Failures

```typescript
// Wrap GSAP animations in try-catch with fallback
function safeAnimate(
  element: HTMLElement,
  props: gsap.TweenVars,
  fallbackValue?: () => void
) {
  try {
    return gsap.to(element, props);
  } catch (error) {
    logError('Animation failed', error instanceof Error ? error : undefined, {
      props: JSON.stringify(props)
    });
    fallbackValue?.();
    return null;
  }
}
```

### Drag-and-Drop Failures

```typescript
// Handle @dnd-kit errors gracefully
function handleDragError(error: Error) {
  logError('Drag operation failed', error);
  // Reset drag state
  setActiveId(null);
  setOverId(null);
}
```

## Testing Strategy

### Dual Testing Approach

This implementation requires both unit tests and property-based tests:

**Unit Tests** verify specific examples and edge cases:
- Empty inventory renders correctly
- Single item drag and drop
- Keyboard navigation flow
- Animation component mounting/unmounting

**Property-Based Tests** verify universal properties:
- Inventory reordering preserves all items
- Drag-feed produces identical results to click-feed
- Animation throttling behavior
- Theme reactivity on stage/sanity changes

### Testing Framework

- **Framework**: Vitest (already configured)
- **Property-Based Testing**: fast-check (already installed)
- **Component Testing**: @testing-library/react (already installed)

### Property-Based Test Configuration

Each property-based test MUST:
1. Run a minimum of 100 iterations
2. Be tagged with a comment referencing the correctness property
3. Use the format: `**Feature: interactive-ui-enhancements, Property {number}: {property_text}**`

### Test File Locations

Following the co-located test pattern:
- `src/components/InventoryPanel.test.tsx` - Drag-and-drop tests
- `src/components/animations/CountUp.test.tsx` - CountUp animation tests
- `src/components/animations/FadeIn.test.tsx` - FadeIn animation tests
- `src/components/NarrativeLog.test.tsx` - Log animation tests

### Example Property Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { reorderInventory } from './inventoryUtils';
import type { Offering } from '../utils/types';

describe('Inventory Reordering', () => {
  /**
   * **Feature: interactive-ui-enhancements, Property 1: Inventory reorder preserves items**
   */
  it('should preserve all items when reordering', () => {
    fc.assert(
      fc.property(
        // Generate random inventory (1-3 items)
        fc.array(
          fc.record({
            id: fc.uuid(),
            type: fc.constantFrom('PURITY', 'ROT') as fc.Arbitrary<'PURITY' | 'ROT'>,
            description: fc.string(),
            icon: fc.constantFrom('✨', '🦴')
          }),
          { minLength: 1, maxLength: 3 }
        ),
        fc.nat(),
        fc.nat(),
        (inventory, fromRaw, toRaw) => {
          const from = fromRaw % inventory.length;
          const to = toRaw % inventory.length;
          
          const result = reorderInventory(inventory, from, to);
          
          // Same length
          expect(result.length).toBe(inventory.length);
          
          // Same items (by ID)
          const originalIds = inventory.map(i => i.id).sort();
          const resultIds = result.map(i => i.id).sort();
          expect(resultIds).toEqual(originalIds);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## CSS Integration

### Theme Variable Usage

All new components MUST use existing CSS custom properties:

```css
/* CountUp.css */
.count-up {
  font-family: var(--font-body);
  color: var(--text-primary);
  transition: color 0.3s ease;
}

/* FadeIn.css */
.fade-in {
  /* Uses transform/opacity for GPU acceleration */
}

/* Drag overlay theming */
.drag-overlay {
  border: var(--border-style);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  background: var(--bg-secondary);
}

/* ABOMINATION glitch on drag */
[data-stage="ABOMINATION"] .drag-overlay {
  animation: glitch-horizontal 0.3s ease-in-out infinite;
}
```

### Mobile Responsive Breakpoints

```css
@media (max-width: 768px) {
  /* Simplify animations for mobile */
  .count-up {
    transition: none;
  }
  
  .fade-in {
    animation-duration: 200ms;
  }
}

@media (prefers-reduced-motion: reduce) {
  .count-up,
  .fade-in,
  .drag-overlay {
    animation: none !important;
    transition: none !important;
  }
}
```

## Dependencies

### New Dependencies Required

```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "gsap": "^3.12.5"
}
```

### Installation Command

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities gsap
```

## Performance Considerations

1. **GSAP GPU Acceleration**: All animations use only `transform` and `opacity` properties
2. **Animation Throttling**: CountUp updates throttled to every 5 game ticks
3. **Mobile Simplification**: Reduced animation complexity on viewports ≤768px
4. **Reduced Motion**: Full support for `prefers-reduced-motion` media query
5. **Lazy Loading**: Animation components only initialize when needed
6. **Cleanup**: All GSAP tweens properly killed on component unmount

