# Implementation Plan

- [x] 1. Set up theme infrastructure

  - [x] 1.1 Create themes.css with CSS custom properties for all 4 stages

    - Define CSS variables for EGG stage (pastel pink/lavender, Fredoka One, rounded borders)
    - Define CSS variables for BABY stage (deeper lavender, Baloo 2, purple accents)
    - Define CSS variables for TEEN stage (dark purple, Creepster, magenta borders)
    - Define CSS variables for ABOMINATION stage (near-black, Nosifer, blood-red accents)
    - Add sanity-based override variables for [data-sanity="critical"]
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.2, 10.3_

  - [ ]\* 1.2 Write property test for stage theme variable application

    - **Property 3: Stage Theme Variable Application**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

  - [x] 1.3 Add Google Fonts to index.html

    - Add link tags for: Fredoka One, Baloo 2, Quicksand, Nunito, Comic Neue, Patrick Hand, Special Elite, Courier Prime, Creepster, Nosifer
    - Use font-display: swap for performance
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 1.4 Import themes.css in index.css
    - Add @import statement at top of index.css
    - _Requirements: 18.3, 18.4_

- [x] 2. Update App component with data attributes and layout structure

  - [x] 2.1 Add data-stage and data-sanity attributes to App root container

    - Read stage from useGameStore
    - Read stats.sanity from useGameStore
    - Apply data-stage={stage} to root div
    - Apply data-sanity={stats.sanity < 30 ? "critical" : "normal"} to root div
    - _Requirements: 4.3, 10.4_

  - [ ]\* 2.2 Write property test for data attribute stage consistency

    - **Property 1: Data Attribute Stage Consistency**
    - **Validates: Requirements 4.3**

  - [ ]\* 2.3 Write property test for data attribute sanity consistency

    - **Property 2: Data Attribute Sanity Consistency**
    - **Validates: Requirements 10.4**

  - [x] 2.4 Restructure App.tsx layout with CSS Grid

    - Add header section with pet name and stage display
    - Create main grid container with stats-panel, canvas-container, log-panel
    - Move inventory panel to bottom-left position
    - _Requirements: 1.4, 17.1, 17.2, 17.3, 17.4_

  - [ ]\* 2.5 Write property test for header content consistency
    - **Property 7: Header Content Consistency**
    - **Validates: Requirements 17.1, 17.2**

- [x] 3. Implement full-page CSS Grid layout

  - [x] 3.1 Update index.css with viewport-based body styles

    - Set body to display: grid with grid-template-rows: 10vh 1fr
    - Set height: 100vh and overflow: hidden for desktop
    - _Requirements: 1.1, 1.3_

  - [x] 3.2 Update App.css with main grid layout

    - Set .app-main to grid-template-columns: 25vw 50vw 25vw
    - Position stats-panel, canvas-container, log-panel in grid
    - Add CSS transitions for theme property changes (0.5s)
    - _Requirements: 1.4, 4.1, 4.2_

  - [ ]\* 3.3 Write property test for desktop no-scroll layout

    - **Property 5: Desktop No-Scroll Layout**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 3.4 Add mobile responsive breakpoints

    - Add @media (max-width: 768px) rules
    - Set grid-template-columns: 1fr for mobile
    - Enable overflow-y: auto on body for mobile
    - Set canvas to 100vw × 50vh on mobile
    - Stack all panels vertically with full width
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]\* 3.5 Write property test for mobile scroll enabled
    - **Property 6: Mobile Scroll Enabled**
    - **Validates: Requirements 2.1**

- [x] 4. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update GameCanvas for responsive sizing

  - [x] 5.1 Implement viewport-based canvas sizing in GameCanvas.tsx

    - Calculate width as window.innerWidth \* 0.5 (desktop) or window.innerWidth (mobile)
    - Calculate height as window.innerHeight _ 0.7 (desktop) or window.innerHeight _ 0.5 (mobile)
    - Add resize event listener with debouncing
    - Update PixiJS renderer.resize() on viewport change
    - Recenter pet graphics after resize
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]\* 5.2 Write property test for canvas responsive sizing

    - **Property 4: Canvas Responsive Sizing**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [x] 5.3 Update GameCanvas.css for responsive container
    - Remove fixed dimensions
    - Use width: 100% and height: 100% within grid cell
    - Add border and shadow using CSS variables
    - _Requirements: 5.1_

- [x] 6. Refactor UIOverlay into Stats Panel and Log Panel

  - [x] 6.1 Split UIOverlay component into StatsPanel and NarrativeLog

    - Create stats-section as standalone panel for left sidebar
    - Create narrative-log-section as standalone panel for right sidebar
    - Keep pet-info-section in stats panel
    - _Requirements: 1.4_

  - [x] 6.2 Update UIOverlay.css with theme variables

    - Replace hardcoded colors with var(--bg-primary), var(--text-primary), etc.
    - Replace hardcoded fonts with var(--font-primary), var(--font-body), var(--font-log)
    - Replace hardcoded borders with var(--border-style), var(--border-radius)
    - Replace hardcoded shadows with var(--shadow)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 6.3 Implement organic stat bar shapes with clip-path

    - Add heart-shaped clip-path to hunger-bar-container using SVG path
    - Add brain/oval clip-path to sanity-bar-container using ellipse
    - Ensure fill percentage remains accurate within shapes
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 6.4 Implement journal-style narrative log
    - Add lined-paper background using repeating linear gradients
    - Set line-height to 1.5em with matching background-size
    - Apply stage-specific background colors (#FFF5F7 for EGG, #0A0010 for ABOMINATION)
    - Use var(--font-log) for log text
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 7. Convert InventoryPanel to card-based layout

  - [x] 7.1 Update InventoryPanel.tsx with card structure

    - Replace grid layout with flexbox cards
    - Add card-icon, card-title ("Mystery Item"), card-description elements
    - Maintain click handler for feeding
    - _Requirements: 12.1, 12.2_

  - [ ]\* 7.2 Write property test for inventory card rendering

    - **Property 8: Inventory Card Rendering**
    - **Validates: Requirements 12.1, 12.2**

  - [x] 7.3 Update InventoryPanel.css with card styles and theme variables
    - Set card dimensions to 150px × 200px
    - Apply var(--bg-secondary), var(--border-style), var(--border-radius), var(--shadow)
    - Add hover effect: translateY(-10px) scale(1.05) with 0.3s transition
    - Add ABOMINATION hover glitch animation
    - _Requirements: 12.3, 12.4_

- [x] 8. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement stage-specific animations

  - [x] 9.1 Add EGG stage animations to themes.css

    - Define @keyframes gentle-float (translateY oscillation, 4s)
    - Define @keyframes sparkle-twinkle (opacity/scale/rotate, varies)
    - Define @keyframes stat-pulse-calm (brightness, 3s)
    - Define @keyframes button-bounce (scale, 0.6s on hover)
    - Apply animations to [data-stage="EGG"] selectors
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 9.2 Add BABY stage animations to themes.css

    - Define @keyframes baby-wobble (rotation oscillation, 2s)
    - Define @keyframes heartbeat (scale pulse, 2s)
    - Define @keyframes slide-in-right (translateX, 0.4s)
    - Apply animations to [data-stage="BABY"] selectors
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 9.3 Add TEEN stage animations to themes.css

    - Define @keyframes glitch-horizontal (translateX/skew/hue-rotate, 8s)
    - Define @keyframes stat-flicker (opacity, 5s)
    - Define @keyframes text-distort (text-shadow chromatic aberration, 3s)
    - Define @keyframes crack-spread (clip-path, 10s)
    - Apply animations to [data-stage="TEEN"] selectors
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 9.4 Add ABOMINATION stage animations to themes.css

    - Define @keyframes violent-shake (translate/rotate, 0.5s)
    - Define @keyframes chromatic-aberration (multi-color text-shadow, 1s)
    - Define @keyframes blood-drip (clip-path/blur, 2s)
    - Define @keyframes vhs-static (background-position/opacity, 0.2s)
    - Define @keyframes eye-appear (opacity/scale, 5s)
    - Apply animations to [data-stage="ABOMINATION"] selectors
    - Add VHS static overlay using ::before pseudo-element on body
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 9.5 Add sanity-based animation overrides
    - Apply glitch-horizontal to [data-sanity="critical"] .ui-overlay
    - Apply stat-flicker with faster timing to [data-sanity="critical"] .stat-bar
    - Apply chromatic-aberration to [data-sanity="critical"] .log-container
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 10. Add performance optimizations and mobile adaptations

  - [x] 10.1 Ensure all animations use transform/opacity only

    - Audit all @keyframes for non-hardware-accelerated properties
    - Replace any width/height/margin animations with transform equivalents
    - Add will-change hints where appropriate
    - _Requirements: 15.1, 15.2, 15.3_

  - [x] 10.2 Add mobile animation disabling

    - Add @media (max-width: 768px) rules to disable violent-shake on body
    - Reduce or disable VHS static overlay on mobile
    - Simplify complex animations for mobile performance
    - _Requirements: 16.1, 16.2, 16.3_

  - [x] 10.3 Add prefers-reduced-motion support
    - Add @media (prefers-reduced-motion: reduce) rules
    - Disable all non-essential animations for users who prefer reduced motion
    - _Requirements: 15.1_

- [x] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
