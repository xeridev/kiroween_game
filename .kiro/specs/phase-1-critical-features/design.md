# Design Document: Phase 1 Critical Features

## Overview

Phase 1 Critical Features introduces the death and consequence mechanics that transform Kiroween Game from a simple pet simulator into a horror experience with meaningful stakes. The system implements:

1. **Death & Haunt System**: Permadeath with ghost persistence that haunts future pets
2. **Placate Interaction**: A sanity restoration mechanic with cooldown and tradeoffs
3. **Consequences & Fail States**: Escalating penalties for neglect and overfeeding

The design integrates with the existing Zustand store, AI narrative generation, and sound system while maintaining separation of concerns through dedicated utility modules.

## Architecture

```mermaid
graph TB
    subgraph "State Layer"
        Store[Zustand Store]
        GhostStorage[Ghost localStorage]
    end
    
    subgraph "Logic Layer"
        HauntSystem[hauntSystem.ts]
        DeathLogic[Death Detection]
        PlacateLogic[Placate Logic]
        InsanityLogic[Insanity Events]
    end
    
    subgraph "Presentation Layer"
        DeathScreen[DeathScreen.tsx]
        ActionDock[ActionDock.tsx]
        StatsPanel[StatsPanel.tsx]
        GameCanvas[GameCanvas.tsx]
    end
    
    subgraph "Services"
        NarrativeGen[narrativeGenerator.ts]
        SoundManager[soundManager.ts]
        AIClient[/api/chat]
    end
    
    Store --> DeathLogic
    Store --> PlacateLogic
    Store --> InsanityLogic
    
    DeathLogic --> HauntSystem
    HauntSystem --> GhostStorage
    
    DeathLogic --> DeathScreen
    PlacateLogic --> ActionDock
    InsanityLogic --> GameCanvas
    
    DeathLogic --> NarrativeGen
    PlacateLogic --> NarrativeGen
    InsanityLogic --> NarrativeGen
    HauntSystem --> NarrativeGen
    
    NarrativeGen --> AIClient
    Store --> SoundManager
```

## Components and Interfaces

### New Utility Module: hauntSystem.ts

Manages ghost storage and haunt trigger logic, isolated from main game state.

```typescript
// Ghost storage operations
function saveGhost(ghost: GhostData): void;
function loadGhosts(): GhostData[];
function clearGhosts(): void;
function getRandomGhost(): GhostData | null;

// Haunt evaluation
function shouldTriggerHaunt(sanity: number, lastHauntGameDay: number, currentGameDay: number): boolean;
function createGhostFromPet(traits: PetTraits, stats: PetStats, stage: PetStage, deathCause: DeathCause, epitaph: string): GhostData;
```

### Store Extensions (store.ts)

New state fields:
- `lastPlacateTime: number | null` - Game age when last placated
- `lastHauntGameDay: number` - Game day of last haunt event
- `deathData: DeathData | null` - Death information when pet dies

New actions:
- `triggerDeath(cause: DeathCause): void` - Handle death event
- `placate(): Promise<void>` - Execute placate with cooldown
- `triggerHaunt(): Promise<void>` - Execute haunt event
- `triggerInsanityEvent(): Promise<void>` - Execute insanity event
- `startNewPet(): void` - Reset for new pet, preserve ghosts

### New Component: DeathScreen.tsx

Full-screen memorial displayed when `isAlive === false`.

Props:
```typescript
interface DeathScreenProps {
  deathData: DeathData;
  onStartNew: () => void;
}
```

### Modified Component: ActionDock.tsx

Add Placate button to existing dock items.

New dock item:
```typescript
{
  icon: isPlacateOnCooldown ? '⏳' : '🤲',
  label: isPlacateOnCooldown ? `Cooldown: ${cooldownRemaining}s` : 'Placate',
  onClick: onPlacate,
  className: `action-placate ${isPlacateOnCooldown ? 'action-disabled' : ''}`,
}
```

### Modified Component: StatsPanel.tsx

Add critical warning styling when hunger ≥ 90 OR sanity ≤ 10.

### Modified Component: GameCanvas.tsx

Add visual effects:
- Placate glow pulse animation
- Vomit particle effect
- Insanity visual distortions (glitch, shadows, inversion)

## Data Models

### DeathCause (types.ts)

```typescript
export type DeathCause = "STARVATION" | "INSANITY";
```

### DeathData (types.ts)

```typescript
export interface DeathData {
  petName: string;
  archetype: Archetype;
  stage: PetStage;
  age: number;
  cause: DeathCause;
  finalStats: PetStats;
  timestamp: number;
  deathNarrative: string;
  epitaph: string;
}
```

### GhostData (types.ts)

```typescript
export interface GhostData {
  id: string;
  petName: string;
  archetype: Archetype;
  stage: PetStage;
  color: number;
  deathCause: DeathCause;
  deathTimestamp: number;
  finalCorruption: number;
  epitaph: string;
}
```

### InsanityEventType (types.ts)

```typescript
export type InsanityEventType = "WHISPERS" | "SHADOWS" | "GLITCH" | "INVERSION";
```

### PlacateState (types.ts)

```typescript
export interface PlacateState {
  lastPlacateTime: number | null;
  cooldownDuration: number; // 30 game minutes
}
```

### HauntState (types.ts)

```typescript
export interface HauntState {
  lastHauntGameDay: number;
  hauntsEnabled: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Death triggers at correct thresholds

*For any* game state where isAlive is true, if hunger reaches 100 OR sanity reaches 0, then after the tick action executes, isAlive should be false and deathData should contain the correct cause ("STARVATION" for hunger >= 100, "INSANITY" for sanity <= 0).

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Ghost storage FIFO eviction

*For any* sequence of ghost additions, the ghost array in localStorage should never exceed 10 entries, and when the 11th ghost is added, the oldest ghost (by deathTimestamp) should be removed.

**Validates: Requirements 3.3**

### Property 3: Ghost data independence

*For any* game state reset operation, ghost data stored in "creepy-companion-ghosts" localStorage key should remain unchanged while main game state in "creepy-companion-storage" is reset.

**Validates: Requirements 3.4, 5.3**

### Property 4: Haunt daily limit

*For any* game session with ghosts present, at most one haunt event should trigger per game day, regardless of how many ticks occur with sanity below 50.

**Validates: Requirements 4.3**

### Property 5: Haunt sanity reduction

*For any* haunt event that triggers, the pet's sanity should decrease by exactly 5 points (clamped to minimum 0).

**Validates: Requirements 4.5**

### Property 6: Placate sanity effect with conditional reduction

*For any* placate action on a living pet not on cooldown, sanity should increase by 15 points (clamped to 100), UNLESS sanity >= 80 AND corruption < 50, in which case sanity should increase by only 5 points.

**Validates: Requirements 6.1, 6.2**

### Property 7: Placate hunger cost

*For any* placate action that executes, hunger should increase by exactly 5 points (clamped to 100).

**Validates: Requirements 6.3**

### Property 8: Placate cooldown initialization

*For any* placate action that executes, lastPlacateTime should be set to the current game age, and subsequent placate attempts within 30 game minutes should be rejected.

**Validates: Requirements 6.4**

### Property 9: Starvation sanity decay acceleration

*For any* game tick where hunger > 80 and isAlive is true, sanity should decay at 0.05 per minute instead of the base 0.02 per minute.

**Validates: Requirements 8.1**

### Property 10: Critical hunger decay acceleration

*For any* game tick where hunger >= 90 and isAlive is true, hunger should increase at 0.1 per minute instead of the base 0.05 per minute.

**Validates: Requirements 8.2**

### Property 11: Insanity event probability

*For any* game tick where sanity < 30 and isAlive is true, insanity events should trigger with approximately 1% probability (verified over 1000+ iterations).

**Validates: Requirements 10.1**

### Property 12: Insanity event type selection

*For any* insanity event that triggers, the selected event type should be one of exactly four values: "WHISPERS", "SHADOWS", "GLITCH", or "INVERSION".

**Validates: Requirements 10.2**

### Property 13: State persistence round-trip

*For any* game state with lastPlacateTime and lastHauntGameDay set, after serializing to localStorage and deserializing back, both values should be preserved exactly.

**Validates: Requirements 11.1, 11.2, 11.3**

## Error Handling

### AI Narrative Failures

All narrative generation functions follow the existing pattern in narrativeGenerator.ts:
1. Attempt AI generation via /api/chat
2. On failure, log warning via errorLogger
3. Return fallback message from predefined arrays

New fallback message arrays:
```typescript
const FALLBACK_MESSAGES = {
  // ... existing messages ...
  death_starvation: [
    "succumbs to the gnawing emptiness within.",
    "fades away, consumed by hunger's final embrace.",
    "withers into silence, starved of sustenance.",
  ],
  death_insanity: [
    "loses itself to the void between thoughts.",
    "shatters into fragments of what once was.",
    "dissolves into the madness that claimed it.",
  ],
  haunt: [
    "A familiar presence stirs in the shadows...",
    "The air grows cold with memories of the departed.",
    "Something watches from beyond the veil.",
  ],
  placate: [
    "finds momentary peace in your presence.",
    "calms slightly, though darkness still lingers.",
    "settles into an uneasy stillness.",
  ],
  insanity_whispers: [
    "hears voices that aren't there.",
    "listens to whispers from the void.",
    "catches fragments of impossible conversations.",
  ],
  insanity_shadows: [
    "sees shapes moving in the corners.",
    "watches shadows that move against the light.",
    "glimpses figures that vanish when observed.",
  ],
  insanity_glitch: [
    "reality flickers and distorts.",
    "the world stutters and skips.",
    "existence momentarily fragments.",
  ],
  insanity_inversion: [
    "everything feels wrong, inverted.",
    "up becomes down, light becomes dark.",
    "the world turns inside out.",
  ],
};
```

### Ghost Storage Errors

- localStorage quota exceeded: Log warning, attempt to evict oldest ghosts
- JSON parse errors: Log error, return empty array, do not corrupt main game state
- Missing localStorage: Gracefully degrade, haunts disabled

### Sound System Errors

Follow existing pattern: log error, continue without audio (game never crashes due to sound failures).

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property-based tests**: Verify universal properties hold across all valid inputs

### Property-Based Testing Framework

Use **fast-check** (already configured in project) with minimum 100 iterations per property test.

### Test File Organization

- `src/store.test.ts`: Add death, placate, and consequence tests
- `src/utils/hauntSystem.test.ts`: Ghost storage and haunt logic tests

### Property Test Annotation Format

Each property-based test must include a comment in this exact format:
```typescript
// **Feature: phase-1-critical-features, Property 1: Death triggers at correct thresholds**
// **Validates: Requirements 1.1, 1.2, 1.3**
```

### Unit Test Coverage

Unit tests should cover:
- Death screen rendering with all required fields
- Placate button disabled state during cooldown
- Critical warning CSS class application
- Sound event triggers (mock playSound calls)
- Narrative fallback message selection

### Test Utilities

Create generators for:
- Random valid game states
- Random pet traits
- Random ghost data arrays
- Random stat values within valid ranges
