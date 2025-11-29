# Design Document

## Overview

This design document specifies enhancements to the Kiroween Game's narrative and image generation systems. Building on the existing narrative-interactions feature, these enhancements provide:

1. **Image Gallery** - A dedicated UI for browsing and filtering generated images
2. **Progress Indicators** - Real-time feedback during 90-second image generation
3. **Memory System** - Narrative continuity through contextual AI prompts
4. **Dialogue Choices** - Player agency through selectable narrative responses
5. **Story Summary** - AI-generated life recaps for reflection and sharing
6. **Character Consistency** - Improved prompt engineering for stable pet appearance
7. **Scene Composition** - Multi-panel layouts for complex narrative events

These features integrate with the existing Zustand store, RunPod image API, and Featherless AI narrative generation while maintaining mobile responsiveness and accessibility standards.

## Architecture

### Component Hierarchy

```
App
└── UIOverlay
    ├── NarrativeLog (existing, enhanced)
    │   ├── ProgressIndicator (new)
    │   └── DialogueChoices (new)
    ├── ImageGallery (new)
    │   ├── GalleryGrid
    │   ├── GalleryTimeline
    │   ├── GalleryFilters
    │   └── GalleryModal
    └── StorySummary (new)
        └── SummaryModal
```

### State Management Flow

```
Image Generation with Progress:
    generateLogImage() called
        ↓
    Set imageStatus: "generating"
    Set generationProgress: { startTime, pollCount }
        ↓
    Poll RunPod API every 2s
        ↓
    Update progress indicator
        ↓
    Complete: Set imageUrl, imageStatus: "completed"
    Failed: Set imageStatus: "failed"

Dialogue Choice Flow:
    Significant event occurs
        ↓
    30% chance: Generate dialogue choices
        ↓
    Present 2-3 options to player
        ↓
    Player selects choice (or 60s timeout)
        ↓
    Generate follow-up narrative with choice context
        ↓
    Apply stat changes based on choice
        ↓
    Store choice in log entry

Memory System Flow:
    Generate narrative triggered
        ↓
    Retrieve last 5 log entries
        ↓
    Extract key events (evolution, placate, etc.)
        ↓
    Build context string (max 2000 chars)
        ↓
    Include in AI prompt
        ↓
    Generate narrative with continuity
```


## Components and Interfaces

### ImageGallery Component

**Purpose:** Dedicated view for browsing all generated images with filtering and timeline modes.

**Props:**
```typescript
interface ImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: EventType | "all";
  viewMode?: "grid" | "timeline";
}
```

**State:**
```typescript
interface GalleryState {
  filter: EventType | "all";
  viewMode: "grid" | "timeline";
  selectedImageId: string | null;
  currentPage: number;
}
```

**Behavior:**
- Fetches all logs with completed images from store
- Filters by event type when filter is active
- Displays in grid (3 columns desktop, 1 mobile) or timeline layout
- Opens full-screen modal on image click
- Supports keyboard navigation (arrow keys, escape)
- Implements pagination for >20 images

### ProgressIndicator Component

**Purpose:** Shows real-time feedback during image generation polling.

**Props:**
```typescript
interface ProgressIndicatorProps {
  startTime: number;
  pollCount: number;
  status: "generating" | "completed" | "failed";
}
```

**Behavior:**
- Calculates elapsed time from startTime
- Displays estimated time remaining based on 90s max
- Shows spinner animation while generating
- Updates every 2 seconds during polling
- Transitions to success/error state on completion


### DialogueChoices Component

**Purpose:** Presents player-selectable narrative response options.

**Props:**
```typescript
interface DialogueChoicesProps {
  choices: DialogueChoice[];
  onSelect: (choiceId: string) => void;
  timeoutSeconds: number;
}

interface DialogueChoice {
  id: string;
  text: string;
  emotionalTone: "comforting" | "fearful" | "loving" | "neutral";
  statDelta: StatDelta;
}
```

**Behavior:**
- Displays 2-3 choice buttons with emotional tone indicators
- Starts 60-second countdown timer
- Auto-selects neutral option on timeout
- Applies stat changes on selection
- Triggers follow-up narrative generation
- Keyboard accessible (tab, enter/space)

### StorySummary Component

**Purpose:** Displays AI-generated life recap with export options.

**Props:**
```typescript
interface StorySummaryProps {
  isOpen: boolean;
  onClose: () => void;
  petName: string;
  autoGenerate?: boolean; // True for death memorial
}
```

**State:**
```typescript
interface SummaryState {
  summaryText: string | null;
  isGenerating: boolean;
  error: string | null;
}
```

**Behavior:**
- Generates summary on mount if autoGenerate is true
- Displays formatted narrative text
- Provides "Copy to Clipboard" button
- Provides "Download as Text" button
- Shows loading state during generation
- Handles errors with retry option


## Data Models

### Type Definitions (src/utils/types.ts)

```typescript
// Gallery-related types
export type GalleryViewMode = "grid" | "timeline";
export type GalleryFilter = EventType | "all";

// Progress tracking for image generation
export interface GenerationProgress {
  startTime: number;
  pollCount: number;
  estimatedTimeRemaining: number;
}

// Dialogue choice system
export interface DialogueChoice {
  id: string;
  text: string;
  emotionalTone: "comforting" | "fearful" | "loving" | "neutral";
  statDelta: StatDelta;
}

export interface DialogueChoicePoint {
  logId: string;
  choices: DialogueChoice[];
  selectedChoiceId: string | null;
  timestamp: number;
}

// Visual traits for character consistency
export interface VisualTraits {
  archetype: Archetype;
  stage: PetStage;
  colorPalette: string[]; // Hex colors
  keyFeatures: string[]; // e.g., ["glowing purple eyes", "translucent body"]
  styleKeywords: string[]; // e.g., ["ethereal", "shadowy", "crystalline"]
}

// Story summary
export interface StorySummary {
  petName: string;
  summaryText: string;
  generatedAt: number;
  keyEvents: string[]; // Event descriptions
  finalStats: PetStats;
  totalAge: number;
}

// Extended NarrativeLog interface
export interface NarrativeLog {
  // ... existing fields
  generationProgress?: GenerationProgress;
  dialogueChoice?: DialogueChoicePoint;
  visualTraits?: VisualTraits;
}
```

### Narrative Context Window

```typescript
interface NarrativeContext {
  recentLogs: NarrativeLog[]; // Last 5 entries
  keyEvents: {
    type: EventType;
    text: string;
    age: number;
  }[];
  statChanges: {
    sanity: number;
    corruption: number;
  };
  timeElapsed: number; // Game minutes since last narrative
}
```


### Scene Composition Prompts

```typescript
const SCENE_COMPOSITIONS: Record<EventType, string> = {
  evolution: "Two-panel comic layout: LEFT panel shows [fromStage] appearance, RIGHT panel shows [toStage] appearance, connected by transformation energy",
  haunt: "Split-screen composition: LEFT shows translucent ghost of [ghostName], RIGHT shows current pet [petName] sensing the presence, ethereal connection between them",
  vomit: "Three-panel sequence: TOP shows pet looking uncomfortable, MIDDLE shows expulsion moment, BOTTOM shows aftermath with pet exhausted",
  insanity: "Fragmented multi-panel layout with 4-6 irregular panels showing different perspectives of the same moment, reality breaking apart",
  death: "Single solemn panel with vignette effect, pet fading into spectral wisps",
  placate: "Single intimate panel with warm glow, close-up of comforting moment",
  feed: "Single panel showing feeding moment",
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Gallery Image Completeness

*For any* set of narrative logs, the gallery must display exactly those logs that have imageStatus === "completed" and imageUrl !== null.

**Validates: Requirements 1.1**

### Property 2: Gallery Filter Correctness

*For any* selected event type filter, all displayed images must have that eventType, and no images with different eventTypes should be displayed.

**Validates: Requirements 2.2**

### Property 3: Progress Time Accuracy

*For any* generation progress with startTime T and current time C, the estimated time remaining must be max(0, 90 - (C - T)).

**Validates: Requirements 4.2, 4.3, 4.4**

### Property 4: Memory Context Window Size

*For any* narrative generation request, the context window must contain at most 5 log entries and at most 2000 characters.

**Validates: Requirements 5.1, 13.1, 13.2**

### Property 5: Dialogue Choice Timeout

*For any* dialogue choice presentation at time T, if no selection is made by time T + 60 seconds, the neutral option must be auto-selected.

**Validates: Requirements 6.5**


### Property 6: Dialogue Choice Stat Application

*For any* dialogue choice with statDelta D, selecting that choice must change pet stats by exactly D (clamped to 0-100).

**Validates: Requirements 6.4**

### Property 7: Story Summary Key Events

*For any* story summary generation, the summary must reference all evolution events and the death event (if applicable).

**Validates: Requirements 7.2**

### Property 8: Visual Traits Persistence

*For any* image generation that stores visual traits, subsequent image generations must include those traits in the prompt.

**Validates: Requirements 8.4, 8.5**

### Property 9: Scene Composition Fallback

*For any* image generation where scene composition fails, the system must fall back to single-panel composition without crashing.

**Validates: Requirements 15.5**

### Property 10: Gallery Keyboard Navigation

*For any* gallery modal with N images, pressing right arrow N-1 times from the first image must navigate to the last image.

**Validates: Requirements 1.4, 10.2**

## Error Handling

### Gallery Errors

1. **Empty Gallery**: When no images exist, display "No images generated yet. Images will appear here as your pet's story unfolds."
2. **Load Failure**: When gallery fails to load, show error with "Retry" button
3. **Filter No Results**: When filter returns no images, show "No images for this event type"
4. **Modal Navigation Error**: When navigation fails, log error and stay on current image

### Progress Indicator Errors

1. **Timeout Exceeded**: When 90s passes without completion, show "Taking longer than expected..." but continue polling
2. **API Polling Error**: When status check fails, retry up to 3 times before marking as failed
3. **Progress Calculation Error**: When time calculation fails, show generic "Generating..." message


### Memory System Errors

1. **Context Retrieval Failure**: When logs cannot be retrieved, generate narrative without context
2. **Context Too Large**: When context exceeds 2000 chars, truncate oldest entries first
3. **Key Event Extraction Error**: When event parsing fails, use raw log text as context

### Dialogue Choice Errors

1. **Generation Failure**: When AI fails to generate choices, fall back to standard narrative
2. **Invalid Choice Selection**: When selected choice doesn't exist, log warning and use neutral option
3. **Timeout Handler Failure**: When timeout mechanism fails, immediately select neutral option

### Story Summary Errors

1. **Generation Failure**: When AI fails, create fallback summary from log entry text
2. **Export Failure**: When clipboard/download fails, show error toast with retry option
3. **Cache Failure**: When caching fails, regenerate on each request

### Character Consistency Errors

1. **Visual Traits Storage Failure**: When traits can't be stored, continue without consistency features
2. **Trait Retrieval Failure**: When traits can't be retrieved, use archetype defaults
3. **Prompt Construction Error**: When trait injection fails, use base prompt

## Testing Strategy

### Unit Testing

**Gallery Component:**
- Test image filtering by event type
- Test grid vs timeline layout rendering
- Test pagination logic
- Test modal navigation
- Test empty state handling

**Progress Indicator:**
- Test time remaining calculation
- Test progress state transitions
- Test timeout handling
- Test polling interval accuracy

**Dialogue Choices:**
- Test choice generation (30% probability)
- Test timeout mechanism
- Test stat delta application
- Test choice storage in logs

**Memory System:**
- Test context window size limits
- Test key event extraction
- Test context string building
- Test truncation logic

**Story Summary:**
- Test summary generation
- Test key event inclusion
- Test export functionality
- Test caching mechanism


### Property-Based Testing

This feature will use **fast-check** for property-based testing. Each test will run 100 iterations.

**Test Configuration:**
```typescript
import * as fc from 'fast-check';
const testConfig = { numRuns: 100 };
```

**Property Test Tagging:**
```typescript
/**
 * Feature: narrative-enhancements, Property 1: Gallery Image Completeness
 * For any set of narrative logs, the gallery must display exactly those logs
 * that have imageStatus === "completed" and imageUrl !== null.
 */
```

**Generator Strategy:**

1. **Gallery Generators:**
   - `fc.array(logGenerator)` for log arrays
   - `fc.constantFrom(...EVENT_TYPES, "all")` for filters
   - `fc.constantFrom("grid", "timeline")` for view modes

2. **Progress Generators:**
   - `fc.integer({ min: Date.now() - 90000, max: Date.now() })` for startTime
   - `fc.integer({ min: 0, max: 45 })` for pollCount

3. **Context Generators:**
   - `fc.array(logGenerator, { maxLength: 5 })` for context window
   - `fc.string({ maxLength: 2000 })` for context text

4. **Choice Generators:**
   - `fc.array(choiceGenerator, { minLength: 2, maxLength: 3 })` for choices
   - `fc.constantFrom("comforting", "fearful", "loving", "neutral")` for tones

### Integration Testing

1. **Gallery Flow:**
   - Open gallery → verify images displayed
   - Apply filter → verify filtered results
   - Click image → verify modal opens
   - Navigate with arrows → verify navigation works
   - Close modal → verify cleanup

2. **Progress Indicator Flow:**
   - Start generation → verify progress shown
   - Wait 30s → verify time update
   - Complete → verify success state
   - Fail → verify error state with retry

3. **Dialogue Choice Flow:**
   - Trigger event → verify 30% chance
   - Display choices → verify options shown
   - Select choice → verify stat changes
   - Timeout → verify auto-selection

4. **Memory System Flow:**
   - Generate narrative → verify context included
   - Check prompt → verify last 5 logs referenced
   - Verify key events highlighted
   - Check character limit enforcement

5. **Story Summary Flow:**
   - Request summary → verify generation
   - Check content → verify key events included
   - Copy to clipboard → verify success
   - Download → verify file created


## Implementation Notes

### Store Actions

**New Actions:**
```typescript
// Gallery
getCompletedImages(): NarrativeLog[]
getImagesByEventType(eventType: EventType): NarrativeLog[]

// Progress tracking
updateGenerationProgress(logId: string, progress: GenerationProgress): void

// Dialogue choices
generateDialogueChoices(eventType: EventType): DialogueChoice[]
selectDialogueChoice(logId: string, choiceId: string): void

// Memory system
buildNarrativeContext(): NarrativeContext
extractKeyEvents(logs: NarrativeLog[]): KeyEvent[]

// Story summary
generateStorySummary(): Promise<StorySummary>
cacheStorySummary(summary: StorySummary): void

// Visual traits
storeVisualTraits(logId: string, traits: VisualTraits): void
getVisualTraits(): VisualTraits | null
```

### Narrative Generator Updates

**Add Memory Context:**
```typescript
function buildMemoryContext(logs: NarrativeLog[]): string {
  const recentLogs = logs.slice(-5);
  const keyEvents = extractKeyEvents(recentLogs);
  
  let context = "Recent events:\n";
  for (const event of keyEvents) {
    context += `- ${event.text}\n`;
  }
  
  // Truncate if needed
  if (context.length > 2000) {
    context = context.substring(0, 2000) + "...";
  }
  
  return context;
}
```

**Add Dialogue Choice Generation:**
```typescript
async function generateDialogueChoices(
  eventType: EventType,
  context: NarrativeContext
): Promise<DialogueChoice[]> {
  const prompt = `Generate 2-3 dialogue response options for this event.
Event: ${eventType}
Context: ${JSON.stringify(context)}

Each option should have:
- Clear emotional tone (comforting, fearful, loving, neutral)
- Brief text (max 50 chars)
- Appropriate stat changes

Format as JSON array.`;

  const response = await generateText({ prompt, maxTokens: 300 });
  return JSON.parse(response.text);
}
```


### API Endpoint Updates

**Extend generateImage.ts:**
```typescript
// Add scene composition to prompt building
function buildSceneCompositionPrompt(
  eventType: EventType,
  context: ImageContext
): string {
  const composition = SCENE_COMPOSITIONS[eventType];
  if (!composition) {
    return buildStandardPrompt(context);
  }
  
  return `${composition}

${buildStandardPrompt(context)}

IMPORTANT: Follow the specified panel layout exactly.`;
}

// Add visual traits to prompt
function injectVisualTraits(
  prompt: string,
  traits: VisualTraits | null
): string {
  if (!traits) return prompt;
  
  const traitString = `
Character consistency requirements:
- Key features: ${traits.keyFeatures.join(", ")}
- Color palette: ${traits.colorPalette.join(", ")}
- Style: ${traits.styleKeywords.join(", ")}
- Maintain exact appearance from previous images
`;
  
  return prompt + traitString;
}
```

**Add storySummary.ts endpoint:**
```typescript
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { logs, petName, finalStats, totalAge } = req.body;
  
  // Build summary prompt
  const keyEvents = extractKeyEvents(logs);
  const prompt = `Write a cohesive narrative summary of ${petName}'s life.

Key events:
${keyEvents.map(e => `- ${e.text}`).join('\n')}

Final state:
- Age: ${totalAge} minutes
- Sanity: ${finalStats.sanity}
- Corruption: ${finalStats.corruption}

Write a 300-500 word narrative that captures the essence of this pet's journey.`;

  const response = await generateText({ prompt, maxTokens: 600 });
  
  return res.status(200).json({
    summaryText: response.text,
    keyEvents: keyEvents.map(e => e.text),
  });
}
```


### UI/UX Considerations

**Gallery Design:**
- Grid: 3 columns on desktop (>1024px), 2 on tablet (768-1024px), 1 on mobile (<768px)
- Timeline: Vertical line with images alternating left/right on desktop, single column on mobile
- Filters: Horizontal pill buttons with active state highlighting
- Modal: Full-screen overlay with semi-transparent backdrop, image centered
- Navigation: Arrow buttons on sides, keyboard shortcuts (←/→), swipe gestures on mobile

**Progress Indicator Design:**
- Inline with log entry (not blocking)
- Spinner animation with pulsing effect
- Time remaining text updates every 2s
- Smooth transition to completed/failed state
- Theme-aware colors (cute: bright, horror: muted)

**Dialogue Choices Design:**
- Card-style buttons with emotional tone icons
- Hover effects: scale(1.05) with shadow
- Countdown timer displayed prominently
- Selected choice highlighted before follow-up narrative
- Disabled state after selection
- Mobile: Full-width stacked buttons

**Story Summary Design:**
- Modal overlay with scrollable content
- Formatted text with paragraph breaks
- Action buttons at bottom (Copy, Download, Close)
- Loading state with shimmer effect
- Error state with retry button
- Print-friendly styling

### Accessibility

**Gallery:**
- Alt text for all images: "[EventType] event at [age]: [narrative excerpt]"
- Keyboard navigation: Tab to images, Enter to open, Arrow keys in modal, Escape to close
- Focus trap in modal
- Screen reader announcements for filter changes
- ARIA labels for all interactive elements

**Progress Indicator:**
- aria-live="polite" for time updates
- aria-label describing current state
- Screen reader announcement on completion/failure

**Dialogue Choices:**
- Keyboard focusable with visible focus indicators
- aria-label describing emotional tone and stat effects
- Screen reader announcement when choices appear
- Countdown announced at 30s, 10s, 5s remaining

**Story Summary:**
- Semantic HTML (article, paragraphs)
- Keyboard accessible buttons
- Screen reader friendly export actions
- Focus management on modal open/close


### Performance Optimizations

**Gallery:**
- Lazy load images (only render visible + 5 above/below)
- Use CSS `content-visibility: auto` for off-screen images
- Implement virtual scrolling for >100 images
- Cache filtered results for 30 seconds
- Debounce filter changes by 300ms

**Progress Indicator:**
- Use requestAnimationFrame for smooth updates
- Throttle time calculations to every 2s
- Cancel polling on component unmount
- Reuse progress state across re-renders

**Memory System:**
- Cache context window for 5 minutes
- Memoize key event extraction
- Limit context to 2000 chars (prevents large prompts)
- Use shallow comparison for log array changes

**Dialogue Choices:**
- Pre-generate choices during event processing (async)
- Cache generated choices for 60s
- Debounce selection handler by 100ms
- Clean up timeout on unmount

**Story Summary:**
- Cache generated summaries for 5 minutes
- Use Web Workers for text processing (if available)
- Implement progressive loading for long summaries
- Compress summary text before localStorage

**Visual Traits:**
- Store traits in separate localStorage key
- Limit to last 10 trait sets
- Use LRU cache for trait retrieval
- Compress trait data (remove duplicates)

### Mobile Considerations

**Gallery:**
- Single column layout
- Touch-friendly image sizes (min 120px)
- Swipe gestures for modal navigation
- Reduced animation duration (40% of desktop)
- Lazy load more aggressively (visible + 2)

**Progress Indicator:**
- Compact layout (icon + time only)
- Reduced polling frequency (3s instead of 2s)
- Simplified animations

**Dialogue Choices:**
- Full-width buttons with larger touch targets
- Stacked vertical layout
- Simplified timeout display
- Haptic feedback on selection (if supported)

**Story Summary:**
- Simplified modal (no backdrop blur)
- Reduced text size for readability
- Sticky action buttons at bottom
- Share API integration (if available)


## Integration with Existing Systems

### Zustand Store Integration

**State Extensions:**
```typescript
interface GameState {
  // ... existing fields
  
  // Gallery state
  galleryOpen: boolean;
  galleryFilter: GalleryFilter;
  galleryViewMode: GalleryViewMode;
  
  // Visual traits for consistency
  currentVisualTraits: VisualTraits | null;
  
  // Story summary cache
  cachedSummary: StorySummary | null;
  summaryCacheTime: number | null;
}
```

**Action Integration:**
- `generateLogImage()` - Add progress tracking
- `addLog()` - Check for dialogue choice trigger
- All narrative generators - Add memory context
- `triggerDeath()` - Auto-generate story summary

### Narrative Generator Integration

**Update all generate*Narrative functions:**
```typescript
async function generateFeedingNarrative(params: FeedingParams): Promise<string> {
  // Build memory context
  const context = buildNarrativeContext();
  
  // Get tone influence (existing)
  const toneKeywords = getToneKeywords();
  
  // Build enhanced prompt
  const prompt = `${basePrompt}

Recent context:
${context.recentEvents}

Player reactions: ${toneKeywords.join(", ")}

Generate narrative...`;
  
  return await generateText({ prompt });
}
```

### Image Generation Integration

**Update generateImage API:**
```typescript
// Add visual traits to request
const requestBody = {
  narrativeText,
  petName,
  archetype,
  stage,
  sourceImages,
  eventType,
  visualTraits: currentVisualTraits, // NEW
  sceneComposition: SCENE_COMPOSITIONS[eventType], // NEW
};
```

### Component Integration

**UIOverlay updates:**
```typescript
<UIOverlay>
  <NarrativeLog 
    logs={logs}
    onOpenGallery={() => setGalleryOpen(true)}
  />
  
  {galleryOpen && (
    <ImageGallery
      isOpen={galleryOpen}
      onClose={() => setGalleryOpen(false)}
    />
  )}
  
  {showStorySummary && (
    <StorySummary
      isOpen={showStorySummary}
      onClose={() => setShowStorySummary(false)}
      petName={petName}
    />
  )}
</UIOverlay>
```


## CSS Architecture

### Gallery Styles

```css
.image-gallery {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: var(--theme-background);
  display: flex;
  flex-direction: column;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--theme-border);
}

.gallery-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.gallery-filter-button {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid var(--theme-border);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.gallery-filter-button.active {
  background: var(--theme-primary);
  color: var(--theme-background);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}

.gallery-timeline {
  position: relative;
  padding: 2rem;
  overflow-y: auto;
}

.timeline-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--theme-border);
}

.timeline-item {
  display: flex;
  margin-bottom: 2rem;
  position: relative;
}

.timeline-item:nth-child(even) {
  flex-direction: row-reverse;
}
```

### Progress Indicator Styles

```css
.progress-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--theme-surface);
  border-radius: 8px;
  margin-top: 0.5rem;
}

.progress-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--theme-border);
  border-top-color: var(--theme-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-text {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
}
```

### Dialogue Choices Styles

```css
.dialogue-choices {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  background: var(--theme-surface);
  border-radius: 12px;
}

.dialogue-choice-button {
  padding: 1rem;
  border: 2px solid var(--theme-border);
  border-radius: 8px;
  background: var(--theme-background);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.dialogue-choice-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.dialogue-choice-button.selected {
  border-color: var(--theme-primary);
  background: var(--theme-primary-alpha);
}

.choice-tone-indicator {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.choice-timeout {
  text-align: center;
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
}
```


### Story Summary Styles

```css
.story-summary-modal {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
}

.story-summary-content {
  max-width: 600px;
  max-height: 80vh;
  background: var(--theme-background);
  border-radius: 16px;
  padding: 2rem;
  overflow-y: auto;
}

.summary-text {
  line-height: 1.8;
  margin-bottom: 2rem;
  white-space: pre-wrap;
}

.summary-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.summary-button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.summary-button.primary {
  background: var(--theme-primary);
  color: var(--theme-background);
}

.summary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
```

## Future Enhancements

### Phase 2 Considerations

1. **Advanced Gallery Features:**
   - Image comparison slider (before/after)
   - Slideshow mode with auto-advance
   - Image annotations/notes
   - Favorite/bookmark images

2. **Enhanced Memory System:**
   - Long-term memory (references events from days ago)
   - Personality development (pet "learns" from interactions)
   - Relationship tracking (how pet feels about player)

3. **Dialogue System Expansion:**
   - Branching dialogue trees
   - Consequence tracking (choices affect future options)
   - Personality-based choice generation
   - Voice acting (text-to-speech)

4. **Story Export Enhancements:**
   - PDF generation with images
   - Social media sharing templates
   - Video compilation of key moments
   - Interactive web page export

5. **Visual Consistency Improvements:**
   - Style transfer between images
   - Character model training
   - Animation generation
   - 3D model generation

6. **Performance Optimizations:**
   - Image CDN integration
   - Progressive image loading
   - Service worker caching
   - WebP/AVIF format support

