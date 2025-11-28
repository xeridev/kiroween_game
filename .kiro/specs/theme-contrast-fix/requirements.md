# Requirements Document

## Introduction

This feature addresses color contrast accessibility issues in the Kiroween Game by replacing the existing flexible theme system with a dedicated dual-theme approach: a "cute" theme for early game stages and a "horror" theme for corrupted states. Both themes must meet WCAG AA accessibility standards (4.5:1 contrast ratio for normal text, 3:1 for large text) while maintaining the game's aesthetic identity.

## Glossary

- **Theme System**: The CSS custom property-based styling mechanism that controls the visual appearance of the game UI
- **Cute Theme**: A pastel-colored, cheerful visual style with light backgrounds and high-contrast dark text
- **Horror Theme**: A dark, atmospheric visual style with deep backgrounds and light text for readability
- **WCAG AA**: Web Content Accessibility Guidelines Level AA, requiring 4.5:1 contrast ratio for normal text and 3:1 for large text
- **CSS Custom Properties**: CSS variables (e.g., `--theme-primary`) that enable dynamic theming
- **Theme Toggle**: A UI control allowing users to switch between cute and horror themes
- **Contrast Ratio**: The luminance difference between foreground and background colors, measured as a ratio

## Requirements

### Requirement 1

**User Story:** As a player, I want to choose between a cute pastel theme and a dark horror theme, so that I can enjoy the game with my preferred visual style.

#### Acceptance Criteria

1. WHEN the user opens the Settings panel THEN the Theme System SHALL display a theme toggle control with "Cute 🌸" and "Horror 💀" options
2. WHEN the user selects a theme option THEN the Theme System SHALL immediately apply the selected theme to all UI components
3. WHEN the user closes and reopens the game THEN the Theme System SHALL restore the previously selected theme preference
4. THE Theme System SHALL default to the "cute" theme for new users

### Requirement 2

**User Story:** As a player with visual accessibility needs, I want all text to be clearly readable against backgrounds, so that I can play the game without eye strain.

#### Acceptance Criteria

1. THE Cute Theme SHALL maintain a minimum contrast ratio of 4.5:1 between normal text and background colors
2. THE Cute Theme SHALL maintain a minimum contrast ratio of 3:1 between large text (18pt+) and background colors
3. THE Horror Theme SHALL maintain a minimum contrast ratio of 4.5:1 between normal text and background colors
4. THE Horror Theme SHALL maintain a minimum contrast ratio of 3:1 between large text (18pt+) and background colors
5. WHEN displaying stat bars, buttons, or interactive elements THEN the Theme System SHALL ensure sufficient contrast for all states (default, hover, active, disabled)

### Requirement 3

**User Story:** As a player, I want the cute theme to feel cheerful and inviting, so that early game stages feel welcoming.

#### Acceptance Criteria

1. THE Cute Theme SHALL use light pastel backgrounds (cream, soft pink, lavender tones)
2. THE Cute Theme SHALL use dark text colors (charcoal, dark purple) for primary content
3. THE Cute Theme SHALL use pastel accent colors (pink, mint, sky blue) for interactive elements
4. THE Cute Theme SHALL apply soft shadows and rounded borders for a gentle aesthetic
5. THE Cute Theme SHALL use warm, friendly typography styling

### Requirement 4

**User Story:** As a player, I want the horror theme to feel atmospheric and unsettling, so that the game maintains its creepy identity.

#### Acceptance Criteria

1. THE Horror Theme SHALL use dark backgrounds (deep purple, black, dark red tones)
2. THE Horror Theme SHALL use light text colors (off-white, pale gray) for primary content
3. THE Horror Theme SHALL use blood-red and sickly green accent colors for interactive elements
4. THE Horror Theme SHALL apply sharp shadows for atmospheric depth
5. THE Horror Theme SHALL maintain readability while preserving the unsettling aesthetic

### Requirement 5

**User Story:** As a developer, I want theme colors defined as CSS custom properties, so that themes can be easily maintained and extended.

#### Acceptance Criteria

1. THE Theme System SHALL define all theme colors using CSS custom properties in src/themes.css
2. WHEN a theme is selected THEN the Theme System SHALL apply the theme by setting `data-theme` attribute on the document root element
3. THE Theme System SHALL organize CSS custom properties into logical groups (backgrounds, text, accents, effects)
4. THE Theme System SHALL support both `[data-theme="cute"]` and `[data-theme="horror"]` selectors

### Requirement 6

**User Story:** As a developer, I want theme state managed through Zustand, so that theme preferences integrate with existing state management patterns.

#### Acceptance Criteria

1. THE Theme System SHALL store theme preference as `theme: "cute" | "horror"` in the Zustand store
2. THE Theme System SHALL provide a `setTheme(theme: "cute" | "horror")` action in the store
3. THE Theme System SHALL persist theme preference via Zustand's persist middleware
4. WHEN the application initializes THEN the Theme System SHALL apply the persisted theme to the document root
