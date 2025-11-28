# Implementation Plan

- [x] 1. Set up React Bits components and theme foundation
  - [x] 1.1 Create React Bits components directory structure
    - Create `src/components/reactbits/` folder
    - Copy Waves, CountUp, SplitText, Stack, and Dock components from React Bits
    - Ensure GSAP dependency is properly configured
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

  - [x] 1.2 Create theme utility functions and types
    - Create `src/utils/themeUtils.ts` with ThemeColors interface
    - Implement CUTE_THEME and HORROR_THEME color configurations
    - Implement `determineThemeMode(sanity, stage)` function
    - _Requirements: 1.2, 1.3, 6.4, 6.5_

  - [ ]* 1.3 Write property test for theme mode selection
    - **Property 1: Theme color selection based on game state**
    - **Validates: Requirements 1.2, 1.3**

  - [x] 1.4 Create ThemeContext provider
    - Create `src/contexts/ThemeContext.tsx`
    - Implement ThemeContextValue interface
    - Add mode, colors, and helper functions
    - Integrate with game store for sanity/stage values
    - _Requirements: 1.2, 1.3, 7.1, 7.2_

- [x] 2. Implement animated background
  - [x] 2.1 Integrate Waves background component
    - Create `src/components/BackgroundLayer.tsx`
    - Configure Waves with theme-based colors
    - Position behind game canvas with proper z-index
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Add theme transition animations for background
    - Implement color interpolation using GSAP
    - Add 1-second transition when sanity crosses thresholds
    - Respect reduce motion setting
    - _Requirements: 1.4, 1.5, 7.1, 7.2_

  - [ ]* 2.3 Write unit tests for BackgroundLayer
    - Test correct color rendering for each mode
    - Test reduce motion disables animation
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement animated stats display
  - [x] 4.1 Create StatDisplay component with CountUp
    - Create `src/components/StatDisplay.tsx`
    - Integrate CountUp for animated number transitions
    - Add highlight effect for increases (green) and decreases (red)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 4.2 Write property test for stat highlight colors
    - **Property 2: Stat highlight color reflects change direction**
    - **Validates: Requirements 2.3, 2.4**

  - [x] 4.3 Update StatsPanel to use StatDisplay
    - Replace static number displays with StatDisplay components
    - Track previous values for change detection
    - Respect reduce motion setting
    - _Requirements: 2.1, 2.2, 2.5_

  - [ ]* 4.4 Write unit tests for StatDisplay
    - Test CountUp animation triggers on value change
    - Test highlight colors match change direction
    - Test reduce motion shows instant updates
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Implement text animations
  - [x] 5.1 Create AnimatedPetName component with SplitText
    - Create `src/components/AnimatedPetName.tsx`
    - Use SplitText for character-by-character animation
    - Add glitch effect class when sanity < 30
    - _Requirements: 3.1, 3.3_

  - [ ]* 5.2 Write property test for glitch effect activation
    - **Property 3: Glitch effect activation based on sanity**
    - **Validates: Requirements 3.3**

  - [x] 5.3 Create AnimatedStageIndicator component
    - Create `src/components/AnimatedStageIndicator.tsx`
    - Add dramatic reveal animation on stage change
    - Respect reduce motion setting
    - _Requirements: 3.2, 3.4_

  - [x] 5.4 Update GameCanvas overlay to use animated text components
    - Replace static pet name with AnimatedPetName
    - Replace static stage indicator with AnimatedStageIndicator
    - _Requirements: 3.1, 3.2_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement inventory card stack
  - [x] 7.1 Create InventoryStack component with Stack
    - Create `src/components/InventoryStack.tsx`
    - Configure Stack with offering card data
    - Implement drag and click interactions
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 7.2 Add empty state and feed animation
    - Display placeholder when inventory is empty
    - Animate card flying to pet canvas on feed
    - _Requirements: 4.4, 4.5_

  - [x] 7.3 Update InventoryPanel to use InventoryStack
    - Replace current inventory grid with InventoryStack
    - Maintain drag-to-feed functionality
    - Keep scavenge button accessible
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 7.4 Write unit tests for InventoryStack
    - Test renders correct number of cards
    - Test empty state displays placeholder
    - Test click cycles to next card
    - _Requirements: 4.1, 4.3, 4.4_

- [x] 8. Implement action dock
  - [x] 8.1 Create ActionDock component with Dock
    - Create `src/components/ActionDock.tsx`
    - Configure with Scavenge, Settings, Zen Mode actions
    - Add magnification on hover
    - _Requirements: 5.1, 5.2_

  - [ ]* 8.2 Write property test for dock action mapping
    - **Property 4: Dock action mapping correctness**
    - **Validates: Requirements 5.3**

  - [x] 8.3 Add responsive positioning for dock
    - Position at bottom on mobile viewports
    - Position at right side on desktop viewports
    - _Requirements: 5.4, 5.5_

  - [x] 8.4 Integrate ActionDock into App layout
    - Replace current top-right buttons with ActionDock
    - Wire up action handlers
    - _Requirements: 5.1, 5.3_

  - [ ]* 8.5 Write unit tests for ActionDock
    - Test renders all action items
    - Test correct action executes on click
    - Test responsive positioning
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement glassmorphism panels
  - [x] 10.1 Create GlassPanel wrapper component
    - Create `src/components/GlassPanel.tsx`
    - Implement frosted glass effect with backdrop-filter
    - Accept theme-based styling props
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 10.2 Write property test for panel styling by mode
    - **Property 5: Panel styling matches current theme mode**
    - **Validates: Requirements 6.4, 6.5**

  - [x] 10.3 Update SettingsPanel with glassmorphism
    - Wrap content in GlassPanel
    - Apply theme-based tinting
    - _Requirements: 6.1, 6.4, 6.5_

  - [x] 10.4 Update StatsPanel with glassmorphism
    - Apply subtle glass effect
    - Adjust for theme mode
    - _Requirements: 6.2, 6.4, 6.5_

  - [x] 10.5 Update NarrativeLog with glassmorphism
    - Apply dark-tinted glass effect
    - Adjust for theme mode
    - _Requirements: 6.3, 6.4, 6.5_

- [x] 11. Implement theme transitions
  - [x] 11.1 Add GSAP-based theme transition animations
    - Implement 1.5-second color transitions
    - Animate colors, shadows, and effects simultaneously
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 11.2 Add reduce motion support for transitions
    - Check prefers-reduced-motion media query
    - Apply instant theme changes when enabled
    - _Requirements: 7.4_

  - [ ]* 11.3 Write unit tests for theme transitions
    - Test transition duration
    - Test reduce motion applies instant changes
    - _Requirements: 7.1, 7.2, 7.4_

- [x] 12. Implement retro mode toggle
  - [x] 12.1 Add retro mode setting to store
    - Add `retroMode` boolean to settings state
    - Default to false for new users
    - _Requirements: 8.1, 8.4_

  - [ ]* 12.2 Write property test for settings persistence
    - **Property 6: Settings persistence round-trip**
    - **Validates: Requirements 8.4**

  - [x] 12.3 Implement retro mode UI toggle
    - Add toggle in SettingsPanel
    - Apply CRT overlay when enabled
    - Disable React Bits animations in retro mode
    - _Requirements: 8.2, 8.3_

  - [x] 12.4 Update App.tsx for mode switching
    - Conditionally render modern or retro UI
    - Persist preference to localStorage
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 13. Final cleanup and polish
  - [x] 13.1 Remove old CRT-specific CSS
    - Remove CRT overlay styles from App.css
    - Clean up unused retro theme variables
    - Update default theme to modern
    - _Requirements: 8.1_

  - [x] 13.2 Update CSS variables for modern theme
    - Replace retro variables with modern equivalents
    - Ensure all components use theme context
    - _Requirements: 1.2, 1.3, 6.4, 6.5_

  - [x] 13.3 Performance optimization
    - Add frame rate monitoring
    - Implement automatic animation reduction on low-end devices
    - Test on various viewport sizes
    - _Requirements: 1.5, 7.4_

- [x] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
