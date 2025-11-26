# Implementation Plan

- [x] 1. Initialize project and install dependencies

  - Create Vite project with React and TypeScript
  - Install core dependencies: pixi.js, zustand, howler, ai, @ai-sdk/openai, fast-check, vitest
  - Configure TypeScript with strict mode
  - Set up Vitest for testing
  - _Requirements: All_

- [x] 2. Implement serverless AI proxy

  - Create `/api/chat.ts` Vercel serverless function
  - Configure OpenAI provider with Featherless base URL
  - Implement request validation and error handling
  - Add environment variable for API key
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 3. Create core type definitions and interfaces

  - Define PetStage, Archetype, ItemType, LogSource enums
  - Create PetTraits, PetStats, Offering, NarrativeLog interfaces
  - Define GameState interface with all actions
  - _Requirements: 1.2, 1.3, 1.4_

- [-] 4. Implement Zustand game store
- [x] 4.1 Create store with initial state structure

  - Set up Zustand store with all state fields
  - Implement initializePet action
  - Add localStorage persistence middleware
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 10.1_

- [ ]\* 4.2 Write property test for pet initialization

  - **Property 1: Pet initialization creates valid starting state**
  - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**

- [x] 4.3 Implement tick action with decay logic

  - Create tick function that advances game time
  - Implement hunger increase (0.05 per minute)
  - Implement sanity decrease (0.02 per minute)
  - Add stat clamping (0-100 bounds)
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]\* 4.4 Write property tests for time and decay

  - **Property 2: Time conversion consistency**
  - **Property 3: Hunger decay rate consistency**
  - **Property 4: Sanity decay rate consistency**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 4.5 Implement evolution logic in tick

  - Add age-based evolution checks (EGG→BABY at 5 min, BABY→TEEN at 24 hrs)
  - Add corruption-based evolution (TEEN→ABOMINATION at 80 corruption)
  - Generate narrative log on evolution
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 8.3_

- [ ]\* 4.6 Write property test for evolution logging

  - **Property 5: Evolution creates narrative log**
  - **Validates: Requirements 3.5, 8.3**

- [x] 4.7 Implement scavenge action

  - Generate random item type (50/50 PURITY/ROT)
  - Call AI proxy for description generation
  - Create offering with UUID, type, description, icon
  - Add to inventory if space available (max 3)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]\* 4.8 Write property tests for scavenging

  - **Property 6: Scavenge probability distribution**
  - **Property 7: AI description integration**
  - **Property 8: Inventory addition with space**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 4.9 Implement feed action

  - Find offering by ID in inventory
  - Apply stat changes based on item type (PURITY: -20 hunger, +10 sanity, -5 corruption; ROT: -20 hunger, -15 sanity, +10 corruption)
  - Remove offering from inventory
  - Increment dailyFeeds counter
  - Handle vomit event if dailyFeeds > 3
  - Generate narrative log with appropriate tone
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.5, 8.1, 8.2_

- [ ]\* 4.10 Write property tests for feeding

  - **Property 9: PURITY feeding effects**
  - **Property 10: ROT feeding effects**
  - **Property 11: Feeding removes item and increments counter**
  - **Property 16: PURITY narrative tone**
  - **Property 17: ROT narrative tone**
  - **Validates: Requirements 5.1, 5.2, 5.3, 8.1, 8.2**

- [x] 4.11 Implement daily reset logic

  - Check if 24 game hours elapsed
  - Reset dailyFeeds to 0
  - Increment gameDay counter
  - _Requirements: 5.5_

- [ ]\* 4.12 Write property test for daily reset

  - **Property 12: Daily feed counter reset**
  - **Validates: Requirements 5.5**

- [x] 4.13 Implement addLog action and critical event warnings

  - Create addLog function with timestamp
  - Add warning logs for hunger >= 100, sanity <= 0, dailyFeeds > 3
  - _Requirements: 8.4, 8.5_

- [ ]\* 4.14 Write property tests for narrative logging

  - **Property 18: Critical events generate warnings**
  - **Property 19: Narrative logs include timestamps**
  - **Validates: Requirements 8.4, 8.5**

- [x] 5. Implement state persistence

  - Add localStorage save on every state change
  - Implement state restoration on app load
  - Calculate offline decay based on elapsed time
  - Handle corrupted state with fallback
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ]\* 5.1 Write property tests for persistence

  - **Property 21: State persistence on change**
  - **Property 22: State restoration round-trip**
  - **Property 23: Offline decay calculation**
  - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 6. Create AI client utility

  - Implement generateText function that calls /api/chat
  - Add error handling for network failures
  - Add retry logic for timeouts
  - Implement fallback descriptions
  - _Requirements: 4.2, 9.1, 9.4_

- [ ]\* 6.1 Write property test for AI proxy routing

  - **Property 20: AI calls route through proxy**
  - **Validates: Requirements 9.1, 9.2, 9.4**

- [x] 7. Implement game loop engine

  - Create GameLoop class with start/stop/isRunning methods
  - Use setInterval for 1-second tick interval
  - Call store.tick() on each interval
  - Handle errors gracefully without crashing
  - _Requirements: 2.1_

- [x] 8. Build CreationScreen component

  - Create form with name input, archetype buttons, color picker
  - Validate name (1-50 characters)
  - Validate archetype selection
  - Validate color format
  - Call initializePet on submit
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]\* 8.1 Write unit tests for CreationScreen

  - Test empty name validation
  - Test archetype selection
  - Test color picker
  - Test form submission

- [x] 9. Build GameCanvas component with PixiJS

  - Initialize PixiJS application
  - Render pet geometry based on archetype (GLOOM: circle, SPARK: triangle, ECHO: diamond)
  - Apply color from traits
  - Implement animations (GLOOM: squash/stretch, SPARK: jitter, ECHO: pulse)
  - Apply horror effects when sanity < 30
  - Handle canvas resize
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]\* 9.1 Write unit tests for GameCanvas

  - Test PixiJS initialization
  - Test geometry rendering for each archetype
  - Test color application
  - Test horror effect triggers

- [x] 10. Build InventoryPanel component

  - Display inventory items as icon grid
  - Implement tooltip on hover showing description
  - Handle click to trigger feed action
  - Show scavenge button with disabled state when full
  - Display inventory capacity (current/3)
  - Hide item type from UI
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]\* 10.1 Write property tests for inventory UI

  - **Property 13: Item type hidden in UI**
  - **Property 14: Tooltip displays description**
  - **Property 15: Click triggers feed action**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ]\* 10.2 Write unit tests for InventoryPanel

  - Test empty inventory state
  - Test tooltip display
  - Test scavenge button disabled state
  - Test feed click handler

- [x] 11. Build UIOverlay component

  - Display hunger and sanity bars (hide corruption)
  - Show pet stage and age
  - Render scrollable narrative log with timestamps
  - Display game day and daily feed counter
  - Apply visual styling based on sanity level
  - _Requirements: 2.4, 2.5, 8.5_

- [ ]\* 11.1 Write unit tests for UIOverlay

  - Test stat bar rendering
  - Test corruption is hidden
  - Test log display with timestamps
  - Test sanity-based styling

- [x] 12. Create main App component

  - Conditionally render CreationScreen or game interface
  - Initialize game loop on mount
  - Clean up game loop on unmount
  - Wire up all components with store
  - _Requirements: 1.1, 10.4_

- [x] 13. Add error boundaries and fallbacks

  - Implement React error boundary
  - Add fallback UI for AI failures
  - Handle localStorage errors gracefully
  - Add error logging
  - _Requirements: Error Handling section_

- [x] 14. Implement accessibility features

  - Add ARIA labels to all interactive elements
  - Ensure keyboard navigation works
  - Add live regions for dynamic content
  - Test with screen reader
  - _Requirements: Accessibility section_

- [x] 15. Configure Vercel deployment

  - Create vercel.json configuration
  - Set up environment variables
  - Configure build settings
  - Test serverless function deployment
  - _Requirements: 9.1, 9.2_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
