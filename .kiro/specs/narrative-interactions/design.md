# Design Document

## Overview

The Interactive Narrative System enhances player engagement in the Kiroween Game by introducing two complementary features: emoji-based reactions to narrative events and automated image generation for key game moments. This design integrates seamlessly with the existing Zustand state management, AI narrative generation pipeline, and RunPod image generation API.

The reaction system allows players to express emotional responses (comfort, fear, love, dread, hope) to narrative log entries. These reactions immediately affect pet statistics and accumulate as "tone influence" context that shapes future AI-generated narratives. The auto-image generation system triggers specialized image prompts for significant events (evolution, death, placate, vomit, insanity, haunt), creating a richer visual narrative without requiring manual player interaction.

Both features respect mobile constraints: reactions and auto-generation are disabled on viewports ≤768px to preserve performance. The system maintains the existing shimmer → AI generation → SplitText reveal animation pattern and integrates with the dual-theme system (cute/horror) for WCAG AA compliance.

## Architecture

### Component Hierarchy

```
App
└── UIOverlay
    └── NarrativeLog (enhanced)
        ├── GlassPanel
        ├── FadeIn (per log entry)
        ├── SplitText (for resolved text)
        ├── ReactionButtons (new)
        │   └── ReactionButton (new, per reaction type)
        ├── ImageModal (existing)
        └── StatChangeIndicator (new)
```

### State Management Flow

```
Player clicks reaction
    ↓
ReactionButton.onClick()
    ↓
store.addReaction(logId, reactionType)
    ↓
├── Update NarrativeLog.reactions array
├── Apply stat delta to pet stats
├── Trigger stat change animation
└── Persist to localStorage

AI generates narrative
    ↓
store.getReactionHistory()
    ↓
Map reactions → tone keywords
    ↓
Include in AI prompt context
    ↓
Generate narrative with tone influence
```


### Auto-Image Generation Flow

```
Event occurs (evolution, death, placate, etc.)
    ↓
store action (feed, placate, triggerDeath, etc.)
    ↓
├── Add narrative log with isPending: true
├── Check autoGenerateImages flag (false on mobile)
└── If auto-gen enabled:
    ├── Set log.autoGenerateImage: true
    └── After narrative resolves:
        ├── Call generateLogImage(logId)
        ├── Build specialized prompt with eventType
        ├── Submit to RunPod API
        └── Update log with imageUrl or failed status
```

## Components and Interfaces

### ReactionButton Component

**Purpose:** Renders a single emoji reaction button with click handling and selection state.

**Props:**
```typescript
interface ReactionButtonProps {
  reactionType: ReactionType;
  emoji: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}
```

**Behavior:**
- Displays emoji with hover scale animation (1.2x)
- Shows border highlight when selected (theme-aware color)
- Keyboard accessible (Enter/Space triggers onClick)
- Disabled state when reaction already applied

### ReactionButtons Component

**Purpose:** Container for all reaction buttons, handles reaction logic and stat feedback.

**Props:**
```typescript
interface ReactionButtonsProps {
  log: NarrativeLog;
  onReactionApplied: (statChanges: StatDelta) => void;
}
```

**Behavior:**
- Renders 5 reaction buttons (COMFORT, FEAR, LOVE, DREAD, HOPE)
- Calls store.addReaction() on click
- Triggers stat change animation via callback
- Hidden on mobile (CSS media query)


### StatChangeIndicator Component

**Purpose:** Displays animated feedback for stat changes from reactions.

**Props:**
```typescript
interface StatChangeIndicatorProps {
  statName: "sanity" | "corruption";
  delta: number;
  onComplete: () => void;
}
```

**Behavior:**
- Renders floating "+2" or "-3" text near stat display
- Animates upward with fade-out (GSAP)
- Color-coded: positive (green/theme-primary), negative (red/theme-danger)
- Respects reduceMotion setting (instant display)
- Auto-removes after 1 second

## Data Models

### Type Definitions (src/utils/types.ts)

```typescript
// Reaction types matching emoji pairs (cute/horror)
export type ReactionType = "COMFORT" | "FEAR" | "LOVE" | "DREAD" | "HOPE";

// Reaction data stored with each log entry
export interface ReactionData {
  reactionType: ReactionType;
  timestamp: number;
  statDelta: StatDelta;
}

// Stat changes from a reaction
export interface StatDelta {
  sanity?: number;
  corruption?: number;
  hunger?: number;
}

// Tone keywords for AI context
export type ToneInfluence = string[];

// Extended NarrativeLog interface
export interface NarrativeLog {
  id: string;
  text: string;
  source: LogSource;
  timestamp: number;
  isPending?: boolean;
  imageUrl?: string;
  imageStatus?: ImageStatus;
  sourceImages?: string[];
  // NEW: Reaction system fields
  reactions?: ReactionData[];
  canReact?: boolean;
  // NEW: Auto-image generation flag
  autoGenerateImage?: boolean;
  eventType?: EventType; // For specialized prompts
}

// Event types for specialized image prompts
export type EventType = "evolution" | "death" | "placate" | "vomit" | "insanity" | "haunt" | "feed";
```


### Reaction to Stat Delta Mapping

```typescript
const REACTION_STAT_DELTAS: Record<ReactionType, StatDelta> = {
  COMFORT: { sanity: 2 },
  FEAR: { sanity: -3, corruption: 1 },
  LOVE: { sanity: 3, corruption: -1 },
  DREAD: { sanity: -2, corruption: 2 },
  HOPE: { sanity: 1 },
};
```

### Reaction to Tone Keyword Mapping

```typescript
const REACTION_TONE_KEYWORDS: Record<ReactionType, string> = {
  COMFORT: "comforted",
  FEAR: "terrified",
  LOVE: "cherished",
  DREAD: "haunted",
  HOPE: "hopeful",
};
```

### Emoji Mapping (Theme-Aware)

```typescript
const REACTION_EMOJIS: Record<Theme, Record<ReactionType, string>> = {
  cute: {
    COMFORT: "🥰",
    FEAR: "😊",
    LOVE: "💖",
    DREAD: "✨",
    HOPE: "🌸",
  },
  horror: {
    COMFORT: "😨",
    FEAR: "😱",
    LOVE: "🖤",
    DREAD: "👻",
    HOPE: "🩸",
  },
};
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Reaction Button Visibility

*For any* array of narrative logs, only logs that are in the last 5 positions AND are not pending AND are not system logs should display reaction buttons.

**Validates: Requirements 1.1**

### Property 2: Reaction Data Structure Completeness

*For any* log ID and reaction type, when a reaction is recorded, the resulting ReactionData object must contain logId, reactionType, timestamp, and statDelta fields.

**Validates: Requirements 1.2**

### Property 3: Reaction Selection Highlighting

*For any* narrative log with a recorded reaction, the rendered component must include a visual highlight indicator for the selected reaction type.

**Validates: Requirements 1.3**

### Property 4: Stat Delta Application

*For any* initial pet stats and reaction type, applying the reaction must change the stats by exactly the delta defined in REACTION_STAT_DELTAS.

**Validates: Requirements 1.5**

### Property 5: Reaction History Retrieval

*For any* reaction history array, retrieving the last 10 reactions must return at most 10 reactions, and they must be the most recent ones by timestamp.

**Validates: Requirements 3.1**


### Property 6: Tone Keyword Mapping

*For any* array of reaction types, mapping them to tone keywords must produce keywords that match the REACTION_TONE_KEYWORDS mapping for each reaction type.

**Validates: Requirements 3.2**

### Property 7: Tone Keywords in AI Prompt

*For any* set of tone keywords, the constructed AI prompt must contain all keywords in the tone influence context section.

**Validates: Requirements 3.3**

### Property 8: Tone Keyword Deduplication

*For any* array of reactions with duplicate reaction types, the resulting tone keyword list must contain each unique keyword exactly once.

**Validates: Requirements 3.5**

### Property 9: Auto-Generation Flag Disabled on Mobile

*For any* viewport width of 768 pixels or less, the autoGenerateImages flag in the store must be set to false.

**Validates: Requirements 4.8, 8.2**

### Property 10: Auto-Generation Respects Flag

*For any* event type, when autoGenerateImages is false, no automatic image generation must be triggered.

**Validates: Requirements 8.3**

### Property 11: Reaction Data Persistence

*For any* game state with narrative logs containing reactions, serializing and deserializing the state must preserve all reaction data.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 12: Stat Change Animation Triggering

*For any* reaction that changes stats, the stat change animation function must be called with the correct stat name and delta value.

**Validates: Requirements 7.1**


### Property 13: Sequential Stat Animation Stagger

*For any* reaction that changes multiple stats, the animations must be triggered sequentially with a 100ms delay between each stat.

**Validates: Requirements 7.4**

### Property 14: Keyboard Reaction Triggering

*For any* reaction button with keyboard focus, pressing Enter or Space must trigger the same reaction as clicking.

**Validates: Requirements 9.2**

### Property 15: Screen Reader Announcements

*For any* reaction that changes stats, an aria-live region must be updated with the stat change information.

**Validates: Requirements 9.4**

### Property 16: Error Handling Without Crash

*For any* reaction application that encounters an error, the system must log the error and continue execution without throwing an exception.

**Validates: Requirements 10.1**

### Property 17: Failed Image Generation Recovery

*For any* auto-image generation that fails, the log entry's imageStatus must be set to "failed" and manual retry must remain available.

**Validates: Requirements 10.2**

### Property 18: Graceful Tone Influence Degradation

*For any* narrative generation where tone influence context cannot be retrieved, the narrative must still generate successfully without tone keywords.

**Validates: Requirements 10.3**

### Property 19: In-Memory Reaction Fallback

*For any* reaction recorded when localStorage is unavailable, the reaction must be stored in memory and accessible for the current session.

**Validates: Requirements 10.4**

### Property 20: Invalid Log ID Handling

*For any* reaction applied to a non-existent log ID, the system must log a warning and not modify any game state.

**Validates: Requirements 10.5**


## Error Handling

### Reaction System Errors

1. **Invalid Log ID**: When addReaction() is called with a non-existent log ID, log a warning and return early without modifying state
2. **Stat Overflow**: When applying stat deltas would exceed bounds (0-100), clamp values to valid range
3. **Duplicate Reactions**: When a player attempts to react to the same log twice, ignore the second reaction and show a brief toast notification
4. **localStorage Failure**: When reaction data cannot be persisted, store in memory and display a warning banner about session-only storage

### Auto-Image Generation Errors

1. **API Timeout**: When RunPod API exceeds 90s timeout, mark log as "failed" and allow manual retry
2. **Invalid Event Type**: When buildEventImagePrompt() receives an unknown event type, fall back to generic prompt
3. **Missing Pet Sprite**: When currentPetSpriteUrl is null, skip auto-generation and log a warning
4. **Mobile Detection Failure**: When viewport width cannot be determined, default to desktop behavior (auto-gen enabled)

### Tone Influence Errors

1. **Empty Reaction History**: When getReactionHistory() returns empty array, generate narrative without tone context
2. **Invalid Reaction Type**: When mapping encounters unknown reaction type, skip that reaction and continue with others
3. **Prompt Construction Failure**: When tone keywords cannot be inserted into prompt, generate narrative with base prompt only

## Testing Strategy

### Unit Testing

**Reaction System:**
- Test REACTION_STAT_DELTAS mapping for all reaction types
- Test REACTION_TONE_KEYWORDS mapping for all reaction types
- Test REACTION_EMOJIS mapping for both themes
- Test canReact logic (last 5, not pending, not system)
- Test stat clamping (0-100 bounds)
- Test duplicate reaction prevention

**Auto-Image Generation:**
- Test buildEventImagePrompt() for all event types
- Test archetype-specific prompt variations (GLOOM, SPARK, ECHO)
- Test insanity event type variations (WHISPERS, SHADOWS, GLITCH, INVERSION)
- Test mobile detection logic (viewport ≤768px)
- Test autoGenerateImages flag toggling

**Tone Influence:**
- Test getReactionHistory() with various history lengths
- Test tone keyword deduplication
- Test prompt construction with tone keywords
- Test empty history handling


### Property-Based Testing

This feature will use **fast-check** for property-based testing, as specified in the project's tech stack. Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage of the input space.

**Test Configuration:**
```typescript
import * as fc from 'fast-check';

// Configure all property tests to run 100 iterations
const testConfig = { numRuns: 100 };
```

**Property Test Tagging:**
Each property-based test must include a comment explicitly referencing the correctness property from this design document using this format:

```typescript
/**
 * Feature: narrative-interactions, Property 1: Reaction Button Visibility
 * For any array of narrative logs, only logs that are in the last 5 positions
 * AND are not pending AND are not system logs should display reaction buttons.
 */
```

**Generator Strategy:**

1. **Reaction Generators:**
   - `fc.constantFrom(...Object.keys(REACTION_STAT_DELTAS))` for reaction types
   - `fc.record()` for ReactionData with valid timestamps and stat deltas
   - `fc.array()` for reaction histories with configurable length

2. **Log Generators:**
   - `fc.record()` for NarrativeLog with all required fields
   - `fc.boolean()` for isPending flag
   - `fc.constantFrom("SYSTEM", "PET")` for source
   - `fc.array()` with length constraints for log arrays

3. **Stat Generators:**
   - `fc.integer({ min: 0, max: 100 })` for sanity/corruption values
   - `fc.record()` for PetStats with all three stats

4. **Viewport Generators:**
   - `fc.integer({ min: 320, max: 1920 })` for viewport widths
   - Specific values around breakpoint: `fc.constantFrom(767, 768, 769)`

**Property Test Implementation:**

Each correctness property will be implemented as a single property-based test. The tests will:
- Generate random valid inputs using fast-check arbitraries
- Execute the system function/component
- Assert the correctness property holds
- Run 100 iterations to catch edge cases

**Integration Testing:**

1. **End-to-End Reaction Flow:**
   - Render NarrativeLog with test logs
   - Simulate reaction button click
   - Verify stat changes in store
   - Verify reaction data persisted
   - Verify tone influence in next narrative

2. **Auto-Image Generation Flow:**
   - Trigger event (evolution, death, etc.)
   - Verify log created with autoGenerateImage flag
   - Mock RunPod API response
   - Verify image URL stored in log
   - Verify specialized prompt used

3. **Mobile Responsive Flow:**
   - Set viewport to 768px
   - Verify reaction buttons hidden (CSS)
   - Verify autoGenerateImages flag false
   - Verify manual generation still works

4. **Accessibility Flow:**
   - Tab through reaction buttons
   - Press Enter/Space to trigger reaction
   - Verify aria-live announcement
   - Verify focus indicators visible


## Mobile Strategy

### Detection

Mobile detection occurs in two places:

1. **Store Initialization (onRehydrate):**
```typescript
onRehydrateStorage: () => {
  return (state, error) => {
    // ... existing rehydration logic
    
    // Detect mobile viewport
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    useGameStore.setState({ autoGenerateImages: !isMobile });
  };
}
```

2. **Component Rendering (NarrativeLog):**
```typescript
// CSS media query handles hiding reaction buttons
@media (max-width: 768px) {
  .log-reactions {
    display: none;
  }
}
```

### Behavior Differences

| Feature | Desktop (>768px) | Mobile (≤768px) |
|---------|------------------|-----------------|
| Reaction Buttons | Visible | Hidden (CSS) |
| Auto-Image Generation | Enabled | Disabled |
| Manual Image Generation | Available | Available |
| Stat Change Animations | Full duration | 40% reduced (existing pattern) |
| Tone Influence | Active | Active |

### Performance Considerations

Mobile devices skip auto-image generation to:
- Reduce network requests (RunPod API calls)
- Preserve battery life (no background image processing)
- Minimize localStorage usage (no base64 image data)
- Maintain smooth gameplay (no 90s API waits)

Players can still manually generate images by clicking log entries, giving them control over when to incur the performance cost.

## Stat Balance

### Reaction Impact Analysis

**Sanity Changes:**
- COMFORT: +2 (gentle positive)
- FEAR: -3 (moderate negative)
- LOVE: +3 (strong positive)
- DREAD: -2 (moderate negative)
- HOPE: +1 (small positive)

**Corruption Changes:**
- FEAR: +1 (slight increase)
- LOVE: -1 (slight decrease)
- DREAD: +2 (moderate increase)

**Net Effect:**
- 3 reactions increase sanity (COMFORT, LOVE, HOPE)
- 2 reactions decrease sanity (FEAR, DREAD)
- Positive reactions slightly outweigh negative (encourages engagement)
- Corruption changes are subtle (prevents exploitation)

### Exploitation Prevention

1. **Time Limits**: Only last 5 log entries can be reacted to (prevents farming old logs)
2. **One Reaction Per Log**: Each log can only be reacted to once (prevents spam)
3. **Stat Caps**: All stats clamped to 0-100 range (prevents overflow)
4. **No Hunger Impact**: Reactions don't reduce hunger (prevents bypassing feeding mechanic)
5. **Corruption Trade-offs**: Positive reactions have corruption costs (LOVE reduces corruption, but FEAR increases it)

### Balance Rationale

Reactions are designed to:
- Provide meaningful but not game-breaking stat changes
- Encourage emotional engagement without trivializing core mechanics
- Reward positive reactions slightly more (player retention)
- Maintain tension through corruption trade-offs
- Complement existing placate action (placate: +15 sanity, 30min cooldown vs reactions: +1 to +3 sanity, limited to recent logs)


## Implementation Notes

### Integration with Existing Systems

**Zustand Store:**
- Add `addReaction(logId, reactionType)` action
- Add `getReactionHistory()` selector
- Add `autoGenerateImages` boolean flag
- Extend `addLog()` to accept optional `eventType` parameter
- Modify `feed()`, `placate()`, `triggerDeath()`, `triggerInsanityEvent()`, `triggerHaunt()` to set `autoGenerateImage: true` on logs

**Narrative Generator:**
- Add `toneInfluence` parameter to all `generate*Narrative()` functions
- Modify AI prompts to include tone context when available
- Create `buildEventImagePrompt(eventType, context)` helper function

**API Endpoint (api/generateImage.ts):**
- Extend `buildImagePrompt()` to accept `eventType` parameter
- Add `EVENT_PROMPT_EXTENSIONS` mapping for specialized prompts
- Inject event-specific descriptions into base prompt

**NarrativeLog Component:**
- Add `ReactionButtons` component after log text
- Add `StatChangeIndicator` component (portal to StatsPanel)
- Modify `handleLogClick()` to check `autoGenerateImage` flag
- Add `useEffect` to trigger auto-generation for new logs with flag

**CSS Styling:**
- Add `.log-reactions` container styles
- Add `.reaction-button` with hover/active/selected states
- Add `.stat-change-indicator` with GSAP animation
- Add mobile media query to hide reactions

### Animation Integration

**Existing Pattern:**
```
Shimmer placeholder → AI resolves → SplitText reveal (20ms char stagger)
```

**New Pattern for Reactions:**
```
Reaction click → Stat change → StatChangeIndicator fade-in → Float up → Fade out (1s total)
```

**GSAP Configuration:**
```typescript
// Respect existing mobile optimization (40% duration reduction)
const duration = isMobile ? 0.6 : 1.0;

gsap.to(indicatorRef.current, {
  y: -30,
  opacity: 0,
  duration,
  ease: "power2.out",
  onComplete: () => onComplete(),
});
```

### Theme Integration

**Cute Theme:**
- Reaction emojis: 🥰😊💖✨🌸
- Positive stat color: `var(--theme-primary)` (bright)
- Negative stat color: `var(--theme-danger)` (muted red)
- Reaction button hover: scale(1.2) with bounce ease

**Horror Theme:**
- Reaction emojis: 😨😱🖤👻🩸
- Positive stat color: `var(--theme-primary)` (dark green)
- Negative stat color: `var(--theme-danger)` (blood red)
- Reaction button hover: scale(1.2) with easeOut

Both themes maintain WCAG AA contrast ratios for accessibility.

### Accessibility Considerations

1. **Keyboard Navigation:**
   - All reaction buttons have `tabindex="0"`
   - Enter/Space triggers reaction
   - Focus indicators visible with 2px outline

2. **Screen Readers:**
   - Reaction buttons have `aria-label`: "React with [emotion]"
   - Stat changes announced via `aria-live="polite"` region
   - Selected reactions have `aria-pressed="true"`

3. **Reduced Motion:**
   - Respect `prefers-reduced-motion` media query
   - Skip stat change animations when `reduceMotion: true`
   - Apply stat changes instantly without visual feedback

4. **Color Contrast:**
   - All text meets WCAG AA (4.5:1 for normal text)
   - Focus indicators meet WCAG AA (3:1 for UI components)
   - Theme-aware colors tested for both cute and horror modes

