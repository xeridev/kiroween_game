# Implementation Plan

## Phase 1A: Death System (Foundational)

- [x] 1. Add death and ghost types to types.ts
  - [x] 1.1 Add DeathCause type ("STARVATION" | "INSANITY")
    - Add string literal union type for death causes
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Add DeathData interface
    - Include petName, archetype, stage, age, cause, finalStats, timestamp, deathNarrative, epitaph
    - _Requirements: 1.4, 2.3_
  - [x] 1.3 Add GhostData interface
    - Include id, petName, archetype, stage, color, deathCause, deathTimestamp, finalCorruption, epitaph
    - _Requirements: 3.1_
  - [x] 1.4 Add InsanityEventType type ("WHISPERS" | "SHADOWS" | "GLITCH" | "INVERSION")
    - _Requirements: 10.2_
  - [x] 1.5 Add PlacateState and HauntState interfaces
    - PlacateState: lastPlacateTime, cooldownDuration
    - HauntState: lastHauntGameDay, hauntsEnabled
    - _Requirements: 6.4, 4.3_

- [x] 2. Create hauntSystem.ts utility module
  - [x] 2.1 Implement ghost storage functions
    - saveGhost(ghost: GhostData): void - saves to localStorage "creepy-companion-ghosts"
    - loadGhosts(): GhostData[] - loads from localStorage with error handling
    - clearGhosts(): void - clears ghost storage
    - getRandomGhost(): GhostData | null - returns random ghost or null
    - _Requirements: 3.1, 3.2, 3.4_
  - [x] 2.2 Implement FIFO eviction logic
    - When array exceeds 10, remove oldest by deathTimestamp
    - _Requirements: 3.3_
  - [x] 2.3 Implement haunt evaluation functions
    - shouldTriggerHaunt(sanity, lastHauntGameDay, currentGameDay): boolean
    - 1% chance when sanity < 50, max 1 per game day
    - _Requirements: 4.2, 4.3_
  - [x] 2.4 Implement createGhostFromPet helper
    - Creates GhostData from current pet state and death info
    - _Requirements: 3.1_
  - [ ]* 2.5 Write property test for ghost FIFO eviction
    - **Property 2: Ghost storage FIFO eviction**
    - **Validates: Requirements 3.3**
  - [ ]* 2.6 Write property test for haunt daily limit
    - **Property 4: Haunt daily limit**
    - **Validates: Requirements 4.3**

- [x] 3. Add death detection and handling to store.ts
  - [x] 3.1 Add new state fields
    - deathData: DeathData | null
    - lastPlacateTime: number | null
    - lastHauntGameDay: number
    - _Requirements: 1.4, 6.4, 4.3_
  - [x] 3.2 Add triggerDeath action
    - Set isAlive to false
    - Create DeathData with all required fields
    - Save ghost to localStorage via hauntSystem
    - Call playSound("death", context)
    - _Requirements: 1.3, 1.4, 3.1, 2.4_
  - [x] 3.3 Modify tick action for death detection
    - Check hunger >= 100 triggers death with cause "STARVATION"
    - Check sanity <= 0 triggers death with cause "INSANITY"
    - _Requirements: 1.1, 1.2_
  - [x] 3.4 Add startNewPet action
    - Reset game state to initial values
    - Preserve ghost data in separate localStorage
    - Set isInitialized to false to show CreationScreen
    - _Requirements: 5.3, 5.4_
  - [x] 3.5 Update partialize function for persistence
    - Add lastPlacateTime, lastHauntGameDay, deathData to persisted fields
    - _Requirements: 11.1, 11.3_
  - [ ]* 3.6 Write property test for death triggers
    - **Property 1: Death triggers at correct thresholds**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  - [ ]* 3.7 Write property test for ghost data independence
    - **Property 3: Ghost data independence**
    - **Validates: Requirements 3.4, 5.3**

- [x] 4. Add death narrative generation to narrativeGenerator.ts
  - [x] 4.1 Add fallback messages for death events
    - death_starvation array with 3+ messages
    - death_insanity array with 3+ messages
    - _Requirements: 2.5_
  - [x] 4.2 Implement generateDeathNarrative function
    - Accept DeathContext with pet info and cause
    - Call /api/chat with death-themed prompt
    - Return fallback on failure
    - _Requirements: 2.1_
  - [x] 4.3 Implement generateEpitaph function
    - Generate short epitaph summarizing pet's life
    - Include age, stage reached, archetype
    - _Requirements: 2.2_

- [x] 5. Create DeathScreen component
  - [x] 5.1 Create DeathScreen.tsx
    - Full-screen memorial overlay
    - Display pet name, archetype, stage, age, cause, corruption
    - Show death narrative and epitaph
    - "Start New Pet" button
    - _Requirements: 2.3, 5.1, 5.2_
  - [x] 5.2 Create DeathScreen.css
    - Dark, somber styling
    - Memorial card layout
    - Responsive design
    - _Requirements: 2.3_
  - [x] 5.3 Integrate DeathScreen into App.tsx
    - Render DeathScreen when isAlive === false
    - Connect onStartNew to startNewPet action
    - _Requirements: 5.1, 5.4_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 1B: Placate Interaction (Independent)

- [x] 7. Add placate action to store.ts
  - [x] 7.1 Implement placate action
    - Check isAlive and cooldown before executing
    - Increase sanity by 15 (or 5 if sanity >= 80 and corruption < 50)
    - Increase hunger by 5
    - Set lastPlacateTime to current age
    - Call playSound("placate", context)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_
  - [x] 7.2 Add cooldown calculation helper
    - getPlacateCooldownRemaining(lastPlacateTime, currentAge): number
    - Return remaining game minutes (0 if not on cooldown)
    - _Requirements: 6.7_
  - [ ]* 7.3 Write property test for placate sanity effect
    - **Property 6: Placate sanity effect with conditional reduction**
    - **Validates: Requirements 6.1, 6.2**
  - [ ]* 7.4 Write property test for placate hunger cost
    - **Property 7: Placate hunger cost**
    - **Validates: Requirements 6.3**
  - [ ]* 7.5 Write property test for placate cooldown
    - **Property 8: Placate cooldown initialization**
    - **Validates: Requirements 6.4**

- [x] 8. Add placate narrative generation
  - [x] 8.1 Add fallback messages for placate
    - placate array with 3+ archetype-neutral messages
    - _Requirements: 6.8_
  - [x] 8.2 Implement generatePlacateNarrative function
    - Accept PlacateContext with pet info and archetype
    - Generate archetype-specific comfort narrative
    - _Requirements: 6.5_

- [x] 9. Add Placate button to ActionDock
  - [x] 9.1 Modify ActionDock.tsx
    - Add Placate button to dock items array
    - Show cooldown timer when on cooldown
    - Disable button during cooldown
    - _Requirements: 6.7_
  - [x] 9.2 Update ActionDock props
    - Add onPlacate handler
    - Add isPlacateOnCooldown boolean
    - Add placateCooldownRemaining number
    - _Requirements: 6.7_
  - [x] 9.3 Connect ActionDock to store in App.tsx
    - Calculate cooldown from lastPlacateTime and age
    - Pass placate action and cooldown state
    - _Requirements: 6.7_

- [x] 10. Add placate visual effects to GameCanvas
  - [x] 10.1 Add placate glow animation state
    - Track when placate animation should play
    - _Requirements: 7.1_
  - [x] 10.2 Implement archetype-specific effects
    - GLOOM: dark purple glow pulse
    - SPARK: bright sparkle particles
    - ECHO: rippling wave effect
    - _Requirements: 7.2, 7.3, 7.4_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 1C: Consequences & Fail States

- [x] 12. Modify tick action for starvation consequences
  - [x] 12.1 Implement accelerated sanity decay
    - When hunger > 80, sanity decays at 0.05/min instead of 0.02/min
    - _Requirements: 8.1_
  - [x] 12.2 Implement accelerated hunger decay
    - When hunger >= 90, hunger increases at 0.1/min instead of 0.05/min
    - _Requirements: 8.2_
  - [ ]* 12.3 Write property test for sanity decay acceleration
    - **Property 9: Starvation sanity decay acceleration**
    - **Validates: Requirements 8.1**
  - [ ]* 12.4 Write property test for hunger decay acceleration
    - **Property 10: Critical hunger decay acceleration**
    - **Validates: Requirements 8.2**

- [x] 13. Add critical warning to StatsPanel
  - [x] 13.1 Modify StatsPanel.tsx
    - Add isCritical prop or calculate from stats
    - Apply pulsing red border class when hunger >= 90 OR sanity <= 10
    - _Requirements: 8.3_
  - [x] 13.2 Add critical warning CSS
    - Pulsing red border animation
    - High contrast for visibility
    - _Requirements: 8.3_
  - [x] 13.3 Add critical warning sound trigger
    - Play sound on first threshold crossing only
    - Track previous critical state to detect crossing
    - _Requirements: 8.4_

- [x] 14. Enhance vomit event
  - [x] 14.1 Add vomit narrative generation
    - Add fallback messages for vomit
    - Implement generateVomitNarrative function
    - _Requirements: 9.3, 9.5_
  - [x] 14.2 Add vomit sound trigger
    - Call playSound("vomit", context) on overfeed
    - _Requirements: 9.4_
  - [x] 14.3 Add vomit particle effect to GameCanvas
    - Splatter animation on overfeed
    - _Requirements: 9.2_

- [x] 15. Implement insanity events
  - [x] 15.1 Add insanity event trigger to tick action
    - 1% chance per tick when sanity < 30
    - Select random InsanityEventType
    - _Requirements: 10.1, 10.2_
  - [x] 15.2 Add insanity narrative generation
    - Fallback messages for each event type
    - generateInsanityNarrative function
    - _Requirements: 10.5, 10.7_
  - [x] 15.3 Add insanity sound triggers
    - WHISPERS: playSound("insanity_whispers")
    - Others: playSound("insanity_stinger")
    - _Requirements: 10.3, 10.4_
  - [x] 15.4 Add insanity visual effects to GameCanvas
    - Brief distortion matching event type
    - _Requirements: 10.6_
  - [ ]* 15.5 Write property test for insanity probability
    - **Property 11: Insanity event probability**
    - **Validates: Requirements 10.1**
  - [ ]* 15.6 Write property test for insanity event types
    - **Property 12: Insanity event type selection**
    - **Validates: Requirements 10.2**

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 1D: Haunt Integration

- [x] 17. Add haunt mechanics to store
  - [x] 17.1 Add triggerHaunt action
    - Select random ghost from storage
    - Reduce sanity by 5
    - Generate haunt narrative
    - Update lastHauntGameDay
    - Call playSound("haunt", context)
    - _Requirements: 4.4, 4.5, 4.6_
  - [x] 17.2 Integrate haunt check into tick action
    - Check if ghosts exist on pet initialization
    - Evaluate haunt trigger each tick when sanity < 50
    - Respect daily limit
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 17.3 Write property test for haunt sanity reduction
    - **Property 5: Haunt sanity reduction**
    - **Validates: Requirements 4.5**

- [x] 18. Add haunt narrative generation
  - [x] 18.1 Add fallback messages for haunt
    - haunt array with 3+ messages referencing ghost
    - _Requirements: 4.7_
  - [x] 18.2 Implement generateHauntNarrative function
    - Accept HauntContext with ghost info
    - Reference ghost's name and traits
    - _Requirements: 4.4_

- [ ]* 19. Write property test for state persistence
  - **Property 13: State persistence round-trip**
  - **Validates: Requirements 11.1, 11.2, 11.3**

- [x] 20. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
