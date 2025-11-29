# Implementation Plan

- [x] 1. Extend type definitions and data models
  - Add new types to src/utils/types.ts (GenerationProgress, DialogueChoice, VisualTraits, StorySummary, etc.)
  - Extend NarrativeLog interface with new optional fields
  - Add GalleryViewMode, GalleryFilter, and related types
  - _Requirements: All_

- [x] 2. Implement progress tracking for image generation
- [x] 2.1 Update store.ts generateLogImage() to track progress
  - Add generationProgress field to log entry when starting
  - Update progress every 2 seconds during polling
  - Calculate estimated time remaining
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2.2 Create ProgressIndicator component
  - Display spinner animation and time remaining
  - Update every 2 seconds
  - Handle completed/failed states
  - Theme-aware styling
  - _Requirements: 4.1, 4.6, 4.7_

- [ ]* 2.3 Write property test for progress time calculation
  - **Property 3: Progress Time Accuracy**
  - **Validates: Requirements 4.2, 4.3, 4.4**

- [x] 2.4 Integrate ProgressIndicator into NarrativeLog
  - Show indicator when imageStatus is "generating"
  - Pass progress data as props
  - Handle transitions to completed/failed
  - _Requirements: 4.1, 4.6, 4.7_

- [x] 3. Implement memory system for narrative continuity
- [x] 3.1 Create buildNarrativeContext() function
  - Retrieve last 5 log entries
  - Extract key events (evolution, placate, death, etc.)
  - Calculate stat changes since last narrative
  - Build context string (max 2000 chars)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 13.1, 13.2_

- [x] 3.2 Create extractKeyEvents() helper
  - Identify significant events by eventType
  - Format event descriptions
  - Include age/timestamp
  - _Requirements: 5.2_

- [ ]* 3.3 Write property test for context window size
  - **Property 4: Memory Context Window Size**
  - **Validates: Requirements 5.1, 13.1, 13.2**

- [x] 3.4 Update all narrative generators to use memory context
  - Modify generateFeedingNarrative()
  - Modify generateEvolutionNarrative()
  - Modify generatePlacateNarrative()
  - Modify generateInsanityNarrative()
  - Modify generateHauntNarrative()
  - Modify generateVomitNarrative()
  - Include context in AI prompts
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. Implement dialogue choice system
- [x] 4.1 Create generateDialogueChoices() function
  - 30% probability check
  - Generate 2-3 options via AI
  - Assign emotional tones and stat deltas
  - _Requirements: 6.1, 6.2_

- [x] 4.2 Create DialogueChoices component
  - Display choice buttons with tone indicators
  - Implement 60-second countdown timer
  - Handle selection and auto-timeout
  - Apply stat changes on selection
  - Keyboard accessible
  - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 4.3 Write property test for dialogue timeout
  - **Property 5: Dialogue Choice Timeout**
  - **Validates: Requirements 6.5**

- [ ]* 4.4 Write property test for stat application
  - **Property 6: Dialogue Choice Stat Application**
  - **Validates: Requirements 6.4**

- [x] 4.5 Add selectDialogueChoice() store action
  - Store choice in log entry
  - Apply stat deltas
  - Trigger follow-up narrative generation
  - _Requirements: 6.3, 6.4, 6.7_

- [x] 4.6 Integrate DialogueChoices into NarrativeLog
  - Check for dialogue choice trigger on significant events
  - Display choices when present
  - Handle selection callback
  - _Requirements: 6.1, 6.2_

- [x] 5. Implement visual traits for character consistency
- [x] 5.1 Create storeVisualTraits() and getVisualTraits() actions
  - Extract traits from generated images
  - Store in separate localStorage key
  - Implement LRU cache (last 10 traits)
  - _Requirements: 8.4, 8.5_

- [x] 5.2 Update generateImage API to include visual traits
  - Add visualTraits to request body
  - Inject traits into prompt
  - Include "maintain character appearance" instruction
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [ ]* 5.3 Write property test for visual traits persistence
  - **Property 8: Visual Traits Persistence**
  - **Validates: Requirements 8.4, 8.5**

- [x] 6. Implement scene composition for complex events
- [x] 6.1 Create SCENE_COMPOSITIONS mapping
  - Define multi-panel layouts for each event type
  - Evolution: two-panel before/after
  - Haunt: split-screen ghost + current pet
  - Vomit: three-panel sequence
  - Insanity: fragmented multi-panel
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 6.2 Create buildSceneCompositionPrompt() function
  - Check if event type has composition
  - Inject layout instructions into prompt
  - Fall back to single-panel if not supported
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 15.5_

- [ ]* 6.3 Write property test for composition fallback
  - **Property 9: Scene Composition Fallback**
  - **Validates: Requirements 15.5**

- [x] 6.4 Update generateImage API to use scene composition
  - Call buildSceneCompositionPrompt() for each event
  - Handle composition errors gracefully
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 7. Implement image gallery view
- [x] 7.1 Create ImageGallery component
  - Modal overlay with header and close button
  - Support grid and timeline view modes
  - Implement view mode toggle
  - _Requirements: 1.1, 1.2, 3.1_

- [x] 7.2 Create GalleryGrid subcomponent
  - Responsive grid layout (3/2/1 columns)
  - Display images with event type badges
  - Handle click to open modal
  - Implement pagination for >20 images
  - _Requirements: 1.1, 1.2, 1.5, 1.6_

- [x] 7.3 Create GalleryTimeline subcomponent
  - Vertical timeline with alternating images
  - Display age at each image
  - Show stage transition markers
  - Mark death event if applicable
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7.4 Create GalleryFilters subcomponent
  - Filter buttons for each event type + "All"
  - Active state highlighting
  - Handle filter selection
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7.5 Create GalleryModal subcomponent
  - Full-screen image display
  - Navigation arrows (prev/next)
  - Keyboard navigation (arrow keys, escape)
  - Display associated narrative text
  - _Requirements: 1.3, 1.4, 10.2, 10.3_

- [ ]* 7.6 Write property test for gallery filtering
  - **Property 2: Gallery Filter Correctness**
  - **Validates: Requirements 2.2**

- [ ]* 7.7 Write property test for gallery completeness
  - **Property 1: Gallery Image Completeness**
  - **Validates: Requirements 1.1**

- [ ]* 7.8 Write property test for keyboard navigation
  - **Property 10: Gallery Keyboard Navigation**
  - **Validates: Requirements 1.4, 10.2**

- [x] 7.9 Add gallery store actions
  - getCompletedImages()
  - getImagesByEventType()
  - Gallery state management (open, filter, viewMode)
  - _Requirements: 1.1, 2.2_

- [x] 7.10 Add gallery accessibility features
  - Alt text for all images
  - Focus trap in modal
  - Screen reader announcements
  - ARIA labels
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 7.11 Add gallery CSS styles
  - Grid and timeline layouts
  - Filter buttons
  - Modal overlay
  - Responsive breakpoints
  - Theme-aware colors
  - _Requirements: 1.6, 2.5, 3.5_

- [x] 7.12 Integrate gallery into UIOverlay
  - Add "Gallery" button to UI
  - Handle open/close state
  - Pass necessary props
  - _Requirements: 1.1_

- [x] 8. Implement story summary generation
- [x] 8.1 Create api/storySummary.ts endpoint
  - Accept logs, petName, finalStats, totalAge
  - Extract key events
  - Build AI prompt for cohesive narrative
  - Return summary text and key events
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 8.2 Create generateStorySummary() store action
  - Call storySummary API
  - Cache result for 5 minutes
  - Handle errors with fallback
  - _Requirements: 7.1, 14.4_

- [x] 8.3 Create StorySummary component
  - Modal overlay with formatted text
  - Copy to clipboard button
  - Download as text button
  - Loading and error states
  - _Requirements: 7.1, 7.6, 7.7_

- [ ]* 8.4 Write property test for key events inclusion
  - **Property 7: Story Summary Key Events**
  - **Validates: Requirements 7.2**

- [x] 8.5 Add auto-generation on death
  - Trigger summary generation in triggerDeath()
  - Display memorial summary automatically
  - _Requirements: 7.5_

- [x] 8.6 Add summary CSS styles
  - Modal layout
  - Text formatting
  - Action buttons
  - Loading/error states
  - _Requirements: 7.1, 7.6, 7.7_

- [x] 8.7 Integrate summary into UIOverlay
  - Add "Story Summary" button
  - Handle open/close state
  - Auto-open on death
  - _Requirements: 7.1, 7.5_

- [x] 9. Performance optimizations
- [x] 9.1 Implement gallery lazy loading
  - Render only visible images + buffer
  - Use IntersectionObserver
  - Add CSS content-visibility
  - _Requirements: 1.5_

- [x] 9.2 Add memory system caching
  - Cache context window for 5 minutes
  - Memoize key event extraction
  - Use shallow comparison for logs
  - _Requirements: 13.3, 13.4_

- [x] 9.3 Optimize progress indicator updates
  - Use requestAnimationFrame
  - Throttle calculations to 2s
  - Cancel polling on unmount
  - _Requirements: 4.2_

- [x] 9.4 Add dialogue choice caching
  - Pre-generate choices async
  - Cache for 60s
  - Clean up timeout on unmount
  - _Requirements: 6.1_

- [x] 9.5 Implement summary caching
  - Cache for 5 minutes
  - Compress before localStorage
  - _Requirements: 14.4_

- [x] 10. Accessibility enhancements
- [x] 10.1 Add progress indicator accessibility
  - aria-live for time updates
  - Screen reader announcements
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 10.2 Add dialogue choice accessibility
  - Keyboard focus management
  - Screen reader announcements
  - Timeout announcements
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 10.3 Add gallery accessibility
  - Already covered in 7.10
  - _Requirements: 10.1-10.5_

- [x] 11. Error handling and graceful degradation
- [x] 11.1 Add gallery error handling
  - Empty state message
  - Load failure with retry
  - Filter no results message
  - _Requirements: 15.1_

- [x] 11.2 Add dialogue choice error handling
  - Generation failure fallback
  - Invalid selection handling
  - Timeout handler failure
  - _Requirements: 15.2_

- [x] 11.3 Add story summary error handling
  - Generation failure fallback
  - Export failure with retry
  - Cache failure handling
  - _Requirements: 15.3_

- [x] 11.4 Add visual traits error handling
  - Storage failure graceful degradation
  - Retrieval failure with defaults
  - _Requirements: 15.4_

- [x] 11.5 Add scene composition error handling
  - Already covered in 6.2
  - _Requirements: 15.5_

- [x] 12. Mobile optimizations
- [x] 12.1 Add mobile-specific gallery styles
  - Single column layout
  - Touch-friendly sizes
  - Swipe gestures
  - Reduced animations
  - _Requirements: 1.6, 3.5_

- [x] 12.2 Add mobile-specific dialogue styles
  - Full-width buttons
  - Stacked layout
  - Larger touch targets
  - _Requirements: 6.6_

- [x] 12.3 Add mobile-specific progress styles
  - Compact layout
  - Reduced polling frequency
  - _Requirements: 4.1_

- [x] 13. Final integration and testing
- [x] 13.1 Integration test: Gallery flow
  - Open gallery → verify images
  - Apply filter → verify results
  - Click image → verify modal
  - Navigate → verify arrows work
  - _Requirements: 1.1-1.6, 2.1-2.5_

- [x] 13.2 Integration test: Progress indicator flow
  - Start generation → verify progress
  - Wait 30s → verify update
  - Complete → verify success
  - Fail → verify error
  - _Requirements: 4.1-4.7_

- [x] 13.3 Integration test: Dialogue choice flow
  - Trigger event → verify 30% chance
  - Display choices → verify options
  - Select → verify stats change
  - Timeout → verify auto-select
  - _Requirements: 6.1-6.7_

- [x] 13.4 Integration test: Memory system flow
  - Generate narrative → verify context
  - Check prompt → verify last 5 logs
  - Verify key events highlighted
  - _Requirements: 5.1-5.5_

- [x] 13.5 Integration test: Story summary flow
  - Request summary → verify generation
  - Check content → verify key events
  - Copy → verify clipboard
  - Download → verify file
  - _Requirements: 7.1-7.7_

- [x] 14. Documentation and polish
- [x] 14.1 Update README with new features
  - Document gallery usage
  - Document dialogue choices
  - Document story summary
  - _Requirements: All_

- [x] 14.2 Add inline code comments
  - Document complex logic
  - Explain design decisions
  - _Requirements: All_

- [x] 14.3 Final visual polish
  - Smooth animations
  - Consistent spacing
  - Theme integration
  - _Requirements: All_

