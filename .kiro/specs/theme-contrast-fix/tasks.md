# Implementation Plan

- [x] 1. Add theme type and store infrastructure
  - [x] 1.1 Add Theme type to src/utils/types.ts
    - Add `export type Theme = "cute" | "horror";`
    - Update SettingsState interface to include `theme: Theme`
    - Update SettingsActions interface to include `setTheme: (theme: Theme) => void`
    - _Requirements: 6.1, 6.2_
  - [x] 1.2 Add theme state and action to src/store.ts
    - Add `theme: "cute"` to initialSettingsState
    - Implement `setTheme` action that updates theme state
    - Add `theme` to partialize config for persistence
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ]* 1.3 Write property test for setTheme action correctness
    - **Property 6: setTheme action correctness**
    - **Validates: Requirements 6.2**

- [x] 2. Update CSS theme definitions
  - [x] 2.1 Replace [data-theme="flexible"] with [data-theme="cute"] in src/themes.css
    - Define cute theme CSS custom properties with WCAG AA compliant colors
    - Include backgrounds, text, accents, states, and effects
    - Use light pastel backgrounds (#FFF5F8, #F5E6F0)
    - Use dark text colors (#2D2D3A, #4A4A5E)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.4_
  - [x] 2.2 Audit and update [data-theme="horror"] for WCAG compliance
    - Verify all text/background pairs meet 4.5:1 contrast ratio
    - Update colors if needed to meet accessibility standards
    - Use dark backgrounds (#0D0A12, #1A1520)
    - Use light text colors (#E8E4EC, #B8B0C0)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.4_
  - [ ]* 2.3 Write property test for contrast ratio compliance
    - **Property 3: Contrast ratio compliance**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
  - [ ]* 2.4 Write property test for cute theme color characteristics
    - **Property 4: Cute theme color characteristics**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  - [ ]* 2.5 Write property test for horror theme color characteristics
    - **Property 5: Horror theme color characteristics**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement theme toggle UI
  - [x] 4.1 Add theme toggle to SettingsPanel component
    - Import theme and setTheme from store
    - Add toggle button with "Cute 🌸" and "Horror 💀" labels
    - Apply theme to document root on toggle: `document.documentElement.setAttribute('data-theme', theme)`
    - Style toggle to match existing settings panel aesthetic
    - _Requirements: 1.1, 1.2_
  - [ ]* 4.2 Write property test for theme selection applies to DOM
    - **Property 1: Theme selection applies to DOM**
    - **Validates: Requirements 1.2, 5.2**

- [x] 5. Apply theme on application initialization
  - [x] 5.1 Update App.tsx to apply persisted theme on mount
    - Add useEffect to apply theme from store to document root
    - Ensure theme is applied before first render completes
    - _Requirements: 1.3, 6.4_
  - [ ]* 5.2 Write property test for theme persistence round-trip
    - **Property 2: Theme persistence round-trip**
    - **Validates: Requirements 1.3, 6.3**
  - [ ]* 5.3 Write property test for theme initialization from persisted state
    - **Property 7: Theme initialization from persisted state**
    - **Validates: Requirements 6.4**

- [x] 6. Update components to use theme variables
  - [x] 6.1 Update GlassPanel to use theme CSS variables
    - Replace hardcoded colors with CSS custom properties
    - Ensure glass effects work in both themes
    - _Requirements: 2.5, 5.1_
  - [x] 6.2 Update StatsPanel to use theme CSS variables
    - Ensure stat bars have sufficient contrast in both themes
    - Update stat gradients to use theme-aware colors
    - _Requirements: 2.5, 5.1_
  - [x] 6.3 Update NarrativeLog to use theme CSS variables
    - Ensure log text is readable in both themes
    - Update log background and border colors
    - _Requirements: 2.1, 2.3, 5.1_

- [ ] 7. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 8. Write unit tests for theme toggle UI
  - [ ]* 8.1 Test SettingsPanel renders theme toggle
    - Verify toggle displays "Cute 🌸" and "Horror 💀" options
    - _Requirements: 1.1_
  - [ ]* 8.2 Test default theme is "cute"
    - Verify new store instance has theme set to "cute"
    - _Requirements: 1.4_
