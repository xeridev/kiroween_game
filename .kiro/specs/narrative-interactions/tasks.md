# Implementation Plan

- [x] 1. Extend type system for reaction and auto-generation features
  - Add ReactionType, ReactionData, StatDelta, ToneInfluence types to src/utils/types.ts
  - Extend NarrativeLog interface with reactions, canReact, autoGenerateImage, eventType fields
  - Add EventType union for specialized image prompts
  - Define REACTION_STAT_DELTAS, REACTION_TONE_KEYWORDS, REACTION_EMOJIS constants
  - _Requirements: 1.2, 2.1-2.5, 3.2, 4.1-4.6, 5.1-5.6_

- [ ]* 1.1 Write property test for reaction data structure
  - **Property 2: Reaction Data Structure Completeness**
  - **Validates: Requirements 1.2**

- [x] 2. Implement store actions for reaction system
  - Add addReaction(logId, reactionType) action to src/store.ts
  - Implement stat delta application with clamping (0-100)
  - Add getReactionHistory() selector returning last 10 reactions
  - Add autoGenerateImages boolean flag (default: true)
  - Detect mobile viewport in onRehydrateStorage and set autoGenerateImages flag
  - Update partialize to persist reaction data in logs
  - _Requirements: 1.2, 1.5, 3.1, 4.8, 6.1, 6.2, 8.2_

- [ ]* 2.1 Write property test for stat delta application
  - **Property 4: Stat Delta Application**
  - **Validates: Requirements 1.5**

- [ ]* 2.2 Write property test for reaction history retrieval
  - **Property 5: Reaction History Retrieval**
  - **Validates: Requirements 3.1**

- [ ]* 2.3 Write property test for reaction data persistence
  - **Property 11: Reaction Data Persistence**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 3. Update narrative generator for tone influence
  - Add toneInfluence parameter to all generate*Narrative() functions in src/utils/narrativeGenerator.ts
  - Implement mapReactionsToToneKeywords() helper function
  - Implement deduplicateToneKeywords() helper function
  - Modify AI prompts to include tone context: "The player recently showed [keywords] reactions"
  - Handle empty reaction history gracefully (no tone context)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 3.1 Write property test for tone keyword mapping
  - **Property 6: Tone Keyword Mapping**
  - **Validates: Requirements 3.2**

- [ ]* 3.2 Write property test for tone keyword deduplication
  - **Property 8: Tone Keyword Deduplication**
  - **Validates: Requirements 3.5**

- [ ]* 3.3 Write property test for tone keywords in AI prompt
  - **Property 7: Tone Keywords in AI Prompt**
  - **Validates: Requirements 3.3**


- [x] 4. Extend API endpoint for specialized image prompts
  - Create buildEventImagePrompt(eventType, context) function in api/generateImage.ts
  - Define EVENT_PROMPT_EXTENSIONS mapping for all event types
  - Add archetype-specific descriptions for placate events (GLOOM, SPARK, ECHO)
  - Add insanity event type variations (WHISPERS, SHADOWS, GLITCH, INVERSION)
  - Modify handler to accept eventType parameter and use specialized prompts
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ]* 4.1 Write unit tests for specialized prompts
  - Test buildEventImagePrompt() for all event types
  - Test archetype-specific prompt variations
  - Test insanity event type variations
  - _Requirements: 5.1-5.6_

- [x] 5. Update store actions to trigger auto-generation
  - Modify feed() to set autoGenerateImage: true and eventType: "vomit" for overfeed logs
  - Modify placate() to set autoGenerateImage: true and eventType: "placate"
  - Modify triggerDeath() to set autoGenerateImage: true and eventType: "death"
  - Modify triggerInsanityEvent() to set autoGenerateImage: true and eventType: "insanity"
  - Modify triggerHaunt() to set autoGenerateImage: true and eventType: "haunt"
  - Modify tick() evolution logic to set autoGenerateImage: true and eventType: "evolution"
  - Add check for autoGenerateImages flag before setting autoGenerateImage on logs
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 8.3_

- [ ]* 5.1 Write property test for auto-generation flag respect
  - **Property 10: Auto-Generation Respects Flag**
  - **Validates: Requirements 8.3**

- [x] 6. Create ReactionButton component
  - Create src/components/ReactionButton.tsx with props interface
  - Implement emoji display with theme-aware selection (REACTION_EMOJIS)
  - Add hover scale animation (1.2x with bounce ease)
  - Add selected state with border highlight (theme-aware color)
  - Implement keyboard accessibility (tabindex, Enter/Space handlers)
  - Add aria-label for screen readers
  - _Requirements: 1.3, 9.1, 9.2, 9.3_

- [ ]* 6.1 Write component test for keyboard triggering
  - **Property 14: Keyboard Reaction Triggering**
  - **Validates: Requirements 9.2**

- [x] 7. Create ReactionButtons container component
  - Create src/components/ReactionButtons.tsx with props interface
  - Render 5 ReactionButton components (COMFORT, FEAR, LOVE, DREAD, HOPE)
  - Implement onClick handler calling store.addReaction()
  - Trigger stat change animation callback with delta
  - Check if log already has reaction and disable duplicate reactions
  - Add CSS class for mobile hiding (.log-reactions)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1_

- [ ]* 7.1 Write property test for reaction button visibility
  - **Property 1: Reaction Button Visibility**
  - **Validates: Requirements 1.1**


- [x] 8. Create StatChangeIndicator component
  - Create src/components/StatChangeIndicator.tsx with props interface
  - Implement floating "+2" or "-3" text animation using GSAP
  - Add color coding: positive (theme-primary), negative (theme-danger)
  - Implement upward float with fade-out (1s duration, 0.6s on mobile)
  - Respect reduceMotion setting (instant display, no animation)
  - Auto-remove after animation completes
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ]* 8.1 Write property test for stat change animation triggering
  - **Property 12: Stat Change Animation Triggering**
  - **Validates: Requirements 7.1**

- [ ]* 8.2 Write property test for sequential stat animation stagger
  - **Property 13: Sequential Stat Animation Stagger**
  - **Validates: Requirements 7.4**

- [x] 9. Update NarrativeLog component for reactions
  - Import ReactionButtons and StatChangeIndicator components
  - Add canReact logic: last 5 entries, not pending, not system logs
  - Render ReactionButtons below log text for eligible entries
  - Implement onReactionApplied callback to trigger StatChangeIndicator
  - Add aria-live region for screen reader announcements
  - Update CSS to include .log-reactions container styles
  - _Requirements: 1.1, 1.3, 1.4, 7.1, 9.4_

- [ ]* 9.1 Write property test for screen reader announcements
  - **Property 15: Screen Reader Announcements**
  - **Validates: Requirements 9.4**

- [x] 10. Implement auto-image generation in NarrativeLog
  - Add useEffect to watch for new logs with autoGenerateImage: true
  - Call generateLogImage(logId) after narrative resolves (isPending: false)
  - Pass eventType to generateLogImage for specialized prompts
  - Handle mobile detection (skip auto-gen if autoGenerateImages: false)
  - Preserve manual generation via handleLogClick
  - _Requirements: 4.1-4.8, 8.3, 8.4_

- [x] 11. Add CSS styling for reaction system
  - Create src/components/ReactionButton.css with button styles
  - Add hover/active/selected states with theme-aware colors
  - Add focus indicators (2px outline, WCAG AA compliant)
  - Create src/components/StatChangeIndicator.css with animation styles
  - Add mobile media query to hide .log-reactions (max-width: 768px)
  - Ensure WCAG AA contrast ratios for both cute and horror themes
  - _Requirements: 1.3, 1.4, 7.2, 7.3, 8.1, 9.3_

- [x] 12. Implement error handling
  - Add try-catch in addReaction() with error logging
  - Add validation for log ID existence before applying reaction
  - Add localStorage fallback to in-memory storage on quota exceeded
  - Add graceful degradation for tone influence retrieval failures
  - Add failed status handling for auto-image generation errors
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 12.1 Write property test for error handling without crash
  - **Property 16: Error Handling Without Crash**
  - **Validates: Requirements 10.1**

- [ ]* 12.2 Write property test for failed image generation recovery
  - **Property 17: Failed Image Generation Recovery**
  - **Validates: Requirements 10.2**

- [ ]* 12.3 Write property test for graceful tone influence degradation
  - **Property 18: Graceful Tone Influence Degradation**
  - **Validates: Requirements 10.3**

- [ ]* 12.4 Write property test for in-memory reaction fallback
  - **Property 19: In-Memory Reaction Fallback**
  - **Validates: Requirements 10.4**

- [ ]* 12.5 Write property test for invalid log ID handling
  - **Property 20: Invalid Log ID Handling**
  - **Validates: Requirements 10.5**

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

