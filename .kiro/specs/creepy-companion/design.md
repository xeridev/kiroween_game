# Design Document

## Overview

Creepy Companion is a browser-based horror pet simulator that inverts traditional virtual pet mechanics through uncertainty, decay, and AI-generated narrative horror. The architecture follows a client-side React application with PixiJS canvas rendering, Zustand state management, and a serverless backend proxy for secure AI integration. The core game loop runs on a 1:60 time compression ratio (1 real second = 1 game minute), creating urgency while maintaining playability.

The design emphasizes three pillars:

1. **Uncertainty**: Players cannot see item types before feeding, creating risk in every decision
2. **Decay**: Real-time stat degradation forces continuous engagement
3. **Transformation**: The pet evolves from cute to horrifying based on accumulated corruption

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Client                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Application Layer                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │ │
│  │  │ Creation     │  │ Game Canvas  │  │ Inventory   │  │ │
│  │  │ Screen       │  │ (PixiJS)     │  │ Panel       │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │           UI Overlay (Stats, Logs)               │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              State Management (Zustand)                │ │
│  │  • Pet Identity  • Stats  • Inventory  • Logs         │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Game Loop Engine                       │ │
│  │  • Tick System  • Decay Logic  • Evolution Rules      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Local Storage Persistence                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS POST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Vercel Serverless Function                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              /api/chat.ts Proxy                        │ │
│  │  • Validates requests                                  │ │
│  │  • Injects API key from env                           │ │
│  │  • Forwards to Featherless AI                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Featherless AI API (OpenAI Compatible)          │
│  • Generates item descriptions                              │
│  • Generates narrative responses                            │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Rationale

- **Vite + React + TypeScript**: Fast development with type safety
- **PixiJS**: Hardware-accelerated 2D rendering for smooth animations
- **Zustand**: Lightweight state management without boilerplate
- **Vercel AI SDK**: Streamlined AI integration with streaming support
- **Howler.js**: Cross-browser audio with spatial sound capabilities
- **Vercel Serverless Functions**: Zero-config backend for API proxying

## Components and Interfaces

### State Store Interface

```typescript
// Core Types
type PetStage = "EGG" | "BABY" | "TEEN" | "ABOMINATION";
type Archetype = "GLOOM" | "SPARK" | "ECHO";
type ItemType = "PURITY" | "ROT";
type LogSource = "SYSTEM" | "PET";

interface PetTraits {
  name: string;
  archetype: Archetype;
  color: number; // Hex color value
}

interface PetStats {
  hunger: number; // 0-100 (0 = satisfied, 100 = starving)
  sanity: number; // 0-100 (100 = stable, 0 = psychotic)
  corruption: number; // 0-100 (hidden from UI)
}

interface Offering {
  id: string; // UUID
  type: ItemType; // Hidden from player
  description: string; // AI-generated, visible on hover
  icon: string; // Emoji or icon identifier
}

interface NarrativeLog {
  id: string;
  text: string;
  source: LogSource;
  timestamp: number; // Game time in minutes
}

interface GameState {
  // Initialization
  isInitialized: boolean;

  // Pet Identity
  traits: PetTraits;

  // Pet Status
  stats: PetStats;
  stage: PetStage;
  age: number; // In game minutes
  isAlive: boolean;

  // Inventory & Economy
  inventory: Offering[];
  dailyFeeds: number;
  gameDay: number;

  // Narrative
  logs: NarrativeLog[];

  // Timestamps
  lastTickTime: number; // Real-world timestamp for offline decay

  // Actions
  initializePet: (name: string, archetype: Archetype, color: number) => void;
  tick: () => void;
  scavenge: () => Promise<void>;
  feed: (itemId: string) => void;
  addLog: (text: string, source: LogSource) => void;
  reset: () => void;
}
```

### Component Interfaces

#### CreationScreen.tsx

```typescript
interface CreationScreenProps {
  onComplete: (name: string, archetype: Archetype, color: number) => void;
}
```

**Responsibilities:**

- Render name input field with validation
- Display three archetype buttons with descriptions
- Provide color picker interface
- Validate all inputs before submission
- Call onComplete with validated data

#### GameCanvas.tsx

```typescript
interface GameCanvasProps {
  traits: PetTraits;
  stage: PetStage;
  sanity: number;
  corruption: number;
}
```

**Responsibilities:**

- Initialize PixiJS application and stage
- Render pet geometry based on archetype
- Apply color from traits
- Animate based on archetype (squash/stretch, jitter, pulse)
- Apply horror effects when sanity < 30
- Update visual representation on stage changes
- Handle canvas resize

#### InventoryPanel.tsx

```typescript
interface InventoryPanelProps {
  inventory: Offering[];
  onFeed: (itemId: string) => void;
  canScavenge: boolean;
  onScavenge: () => void;
}
```

**Responsibilities:**

- Display inventory items as icon grid
- Show tooltips with descriptions on hover
- Handle click events to trigger feeding
- Display scavenge button with disabled state
- Show inventory capacity (current/max)

#### UIOverlay.tsx

```typescript
interface UIOverlayProps {
  stats: PetStats;
  stage: PetStage;
  age: number;
  logs: NarrativeLog[];
  gameDay: number;
  dailyFeeds: number;
}
```

**Responsibilities:**

- Display hunger and sanity bars (corruption hidden)
- Show pet stage and age
- Render scrollable narrative log
- Display game day and feed counter
- Apply visual styling based on sanity level

### AI Client Interface

```typescript
interface AIRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

interface AIResponse {
  text: string;
  error?: string;
}

async function generateText(request: AIRequest): Promise<AIResponse>;
```

### Game Loop Interface

```typescript
interface GameLoopConfig {
  tickInterval: number; // Milliseconds between ticks (1000ms = 1 sec)
  onTick: () => void;
}

class GameLoop {
  start(): void;
  stop(): void;
  isRunning(): boolean;
}
```

## Data Models

### Pet Evolution Model

```
EGG (0-5 min)
  ↓ age > 5 min
BABY (5 min - 24 hrs)
  ↓ age > 24 hrs
TEEN (24+ hrs)
  ↓ corruption > 80 (any age)
ABOMINATION (terminal stage)
```

### Stat Decay Model

Per game minute (every real second):

- Hunger: +0.05 (reaches 100 in ~33 real minutes)
- Sanity: -0.02 (reaches 0 in ~83 real minutes)
- Corruption: Modified only by feeding

### Feeding Effects Model

| Item Type | Hunger | Sanity | Corruption | Narrative Tone |
| --------- | ------ | ------ | ---------- | -------------- |
| PURITY    | -20    | +10    | -5         | Comforting     |
| ROT       | -20    | -15    | +10        | Disturbing     |

### Daily Feed Limit Model

- Feeds 1-3: Normal effects
- Feed 4+: Vomit event (Sanity -20, no other effects)
- Reset: Every 24 game hours (24 real minutes)

### Inventory Model

- Capacity: 3 items maximum
- Item generation: 50/50 PURITY/ROT distribution
- Item consumption: Immediate removal on feed

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Pet initialization creates valid starting state

_For any_ valid name (length >= 1), archetype (GLOOM, SPARK, or ECHO), and hex color value, initializing a pet should result in a pet with EGG stage, zero age, hunger at 0, sanity at 100, corruption at 0, and isAlive set to true.
**Validates: Requirements 1.2, 1.3, 1.4, 1.5**

### Property 2: Time conversion consistency

_For any_ number of elapsed real-world seconds, the game time should advance by exactly that many game minutes (1:60 ratio).
**Validates: Requirements 2.1**

### Property 3: Hunger decay rate consistency

_For any_ number of game minutes elapsed, the hunger stat should increase by exactly 0.05 per minute, capped at 100.
**Validates: Requirements 2.2**

### Property 4: Sanity decay rate consistency

_For any_ number of game minutes elapsed, the sanity stat should decrease by exactly 0.02 per minute, floored at 0.
**Validates: Requirements 2.3**

### Property 5: Evolution creates narrative log

_For any_ stage transition (EGG→BABY, BABY→TEEN, TEEN→ABOMINATION), the system should add a narrative log entry with source 'SYSTEM' describing the transformation.
**Validates: Requirements 3.5, 8.3**

### Property 6: Scavenge probability distribution

_For any_ large number of scavenge operations (n >= 100), the ratio of PURITY to ROT items generated should approach 50:50 within a reasonable tolerance (e.g., 40:60 to 60:40).
**Validates: Requirements 4.1**

### Property 7: AI description integration

_For any_ offering generation, if the AI returns a description, the created offering should contain that exact description text.
**Validates: Requirements 4.2, 4.3**

### Property 8: Inventory addition with space

_For any_ offering, if the inventory has fewer than 3 items, scavenging should add the offering to the inventory and increase inventory size by 1.
**Validates: Requirements 4.4**

### Property 9: PURITY feeding effects

_For any_ PURITY offering, feeding it to the pet should decrease hunger by 20, increase sanity by 10, and decrease corruption by 5 (respecting stat bounds 0-100).
**Validates: Requirements 5.1**

### Property 10: ROT feeding effects

_For any_ ROT offering, feeding it to the pet should decrease hunger by 20, decrease sanity by 15, and increase corruption by 10 (respecting stat bounds 0-100).
**Validates: Requirements 5.2**

### Property 11: Feeding removes item and increments counter

_For any_ offering in inventory, feeding it should remove the offering from inventory, decrease inventory size by 1, and increment the dailyFeeds counter by 1.
**Validates: Requirements 5.3, 7.5**

### Property 12: Daily feed counter reset

_For any_ game state where 24 game hours have elapsed since the last reset, the dailyFeeds counter should reset to 0 and gameDay should increment by 1.
**Validates: Requirements 5.5**

### Property 13: Item type hidden in UI

_For any_ offering in inventory, the rendered UI representation should not contain or reveal the ItemType (PURITY or ROT) value.
**Validates: Requirements 7.1**

### Property 14: Tooltip displays description

_For any_ offering in inventory, hovering over its icon should display a tooltip containing the offering's AI-generated description.
**Validates: Requirements 7.2**

### Property 15: Click triggers feed action

_For any_ offering in inventory, clicking its icon should invoke the feed action with that offering's ID.
**Validates: Requirements 7.3**

### Property 16: PURITY narrative tone

_For any_ PURITY offering fed to the pet, the generated narrative log should contain positive or comforting language (e.g., "purrs", "calms", "glows").
**Validates: Requirements 8.1**

### Property 17: ROT narrative tone

_For any_ ROT offering fed to the pet, the generated narrative log should contain disturbing or unsettling language (e.g., "glitches", "writhes", "screams").
**Validates: Requirements 8.2**

### Property 18: Critical events generate warnings

_For any_ critical event (hunger >= 100, sanity <= 0, dailyFeeds > 3), the system should generate a narrative log entry with appropriate warning text.
**Validates: Requirements 8.4**

### Property 19: Narrative logs include timestamps

_For any_ narrative log entry created, it should contain a timestamp field with the current game time in minutes.
**Validates: Requirements 8.5**

### Property 20: AI calls route through proxy

_For any_ AI generation request from the client, the HTTP request should target the /api/chat endpoint, not the Featherless API directly.
**Validates: Requirements 9.1, 9.2, 9.4**

### Property 21: State persistence on change

_For any_ state modification (stat change, inventory update, stage evolution), the updated state should be serialized to localStorage immediately after the change.
**Validates: Requirements 10.1**

### Property 22: State restoration round-trip

_For any_ valid game state, saving it to localStorage and then restoring it should produce an equivalent state with all fields matching.
**Validates: Requirements 10.2**

### Property 23: Offline decay calculation

_For any_ elapsed real-world time between sessions, the restored state should have hunger and sanity values that reflect decay at the correct rates (0.05 hunger/min, 0.02 sanity/min).
**Validates: Requirements 10.3**

## Error Handling

### Client-Side Error Handling

**AI Request Failures:**

- Network errors: Display user-friendly message "Unable to generate description. Try again."
- Timeout errors: Retry once automatically, then show error message
- Malformed responses: Use fallback generic description "A mysterious artifact"

**State Persistence Errors:**

- localStorage quota exceeded: Clear old logs, keep only last 50 entries
- Corrupted state data: Reset to initial state, show warning to user
- Parse errors: Attempt migration, fallback to new game

**Game Loop Errors:**

- Tick function exceptions: Log error, continue loop (don't crash game)
- Animation errors: Fallback to static rendering
- Audio errors: Mute audio, continue gameplay

### Server-Side Error Handling

**API Proxy Errors:**

- Missing API key: Return 500 with generic error (don't expose config details)
- Invalid request format: Return 400 with validation message
- Upstream API errors: Return 502 with retry-after header
- Rate limiting: Return 429 with exponential backoff suggestion

### Validation Rules

**Pet Creation:**

- Name: 1-50 characters, trim whitespace
- Archetype: Must be one of GLOOM, SPARK, ECHO
- Color: Valid hex format (#RRGGBB)

**Stat Boundaries:**

- All stats clamped to 0-100 range
- Negative values floor to 0
- Values > 100 cap at 100

**Inventory Operations:**

- Scavenge: Blocked if inventory.length >= 3
- Feed: Blocked if item ID not in inventory
- Feed: Blocked if pet is dead (isAlive === false)

## Testing Strategy

### Unit Testing Approach

**Framework:** Vitest with React Testing Library

**Unit Test Coverage:**

- Component rendering: Verify each component renders without crashing
- User interactions: Test button clicks, input changes, hover events
- State updates: Verify Zustand actions update state correctly
- Utility functions: Test time conversion, stat clamping, ID generation
- Edge cases: Empty inventory, stat boundaries, dead pet state

### Property-Based Testing Approach

**Framework:** fast-check (JavaScript property-based testing library)

**Configuration:**

- Minimum 100 iterations per property test
- Use seed for reproducible failures
- Shrink failing cases to minimal examples

**Property Test Implementation:**

- Each property test MUST be tagged with a comment: `// Feature: creepy-companion, Property N: [property text]`
- Each correctness property from the design document MUST have exactly ONE corresponding property-based test
- Tests should generate random valid inputs and verify the property holds

**Generator Strategies:**

- Pet names: Random strings of length 1-50
- Archetypes: Random selection from enum
- Colors: Random valid hex values
- Stats: Random integers 0-100
- Time intervals: Random positive integers
- Offerings: Random type with random descriptions
