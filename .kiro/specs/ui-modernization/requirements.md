# Requirements Document

## Introduction

This feature modernizes the Kiroween game UI by replacing the retro CRT aesthetic with a sleek, modern design using React Bits components. The new design maintains the horror/cute thematic duality, dynamically shifting visual styles based on game state (sanity level, pet stage). The goal is to create a visually engaging, polished experience while preserving the game's atmospheric identity.

## Glossary

- **React Bits**: A collection of animated React components for creating visually engaging web experiences
- **Sanity Level**: A game stat (0-100) that influences visual theme; low sanity triggers horror aesthetics
- **Pet Stage**: Evolution phases (EGG, BABY, TEEN, ABOMINATION) that influence visual theme
- **Cute Mode**: Visual theme applied when sanity > 50 and stage is not ABOMINATION
- **Horror Mode**: Visual theme applied when sanity < 30 or stage is ABOMINATION
- **CountUp**: React Bits component for animated number transitions
- **SplitText**: React Bits component for character-by-character text animations
- **Waves**: React Bits background component with animated wave patterns
- **Stack**: React Bits component for interactive card stacking
- **Dock**: React Bits component for macOS-style icon dock with magnification
- **Glassmorphism**: Modern UI design pattern using frosted glass effects

## Requirements

### Requirement 1

**User Story:** As a player, I want the game background to dynamically reflect the current mood, so that I feel immersed in the horror/cute atmosphere.

#### Acceptance Criteria

1. WHEN the game loads THEN the System SHALL display an animated Waves background component behind the game canvas
2. WHILE sanity is above 50 AND stage is not ABOMINATION THEN the System SHALL render the background with soft pastel colors (pink, lavender tones)
3. WHILE sanity is below 30 OR stage is ABOMINATION THEN the System SHALL render the background with dark horror colors (deep red, black, purple)
4. WHEN sanity crosses the 30 or 50 threshold THEN the System SHALL smoothly transition background colors over 1 second
5. WHEN the reduce motion setting is enabled THEN the System SHALL disable background wave animations

### Requirement 2

**User Story:** As a player, I want stat changes to animate smoothly, so that I can clearly see when my pet's stats increase or decrease.

#### Acceptance Criteria

1. WHEN a stat value changes THEN the System SHALL animate the number transition using CountUp component
2. WHEN hunger, sanity, or corruption changes THEN the System SHALL display the animation over 500 milliseconds
3. WHEN a stat increases THEN the System SHALL briefly highlight the stat in green
4. WHEN a stat decreases THEN the System SHALL briefly highlight the stat in red
5. WHEN the reduce motion setting is enabled THEN the System SHALL update stat values instantly without animation

### Requirement 3

**User Story:** As a player, I want the pet name and stage indicator to have engaging text animations, so that key information feels dynamic and alive.

#### Acceptance Criteria

1. WHEN the game canvas loads THEN the System SHALL animate the pet name using SplitText with character-by-character fade-in
2. WHEN the pet evolves to a new stage THEN the System SHALL animate the new stage name with a dramatic reveal effect
3. WHILE sanity is below 30 THEN the System SHALL apply a glitch effect to the pet name text
4. WHEN the reduce motion setting is enabled THEN the System SHALL display text without animation effects

### Requirement 4

**User Story:** As a player, I want the inventory to display as an interactive card stack, so that managing offerings feels tactile and engaging.

#### Acceptance Criteria

1. WHEN inventory contains items THEN the System SHALL display offerings as a draggable Stack component
2. WHEN a player drags a card from the stack THEN the System SHALL reveal the next card underneath with a smooth animation
3. WHEN a player taps or clicks a card THEN the System SHALL cycle to the next card in the stack
4. WHEN the stack is empty THEN the System SHALL display a placeholder indicating no items available
5. WHEN an item is fed to the pet THEN the System SHALL animate the card flying toward the pet canvas

### Requirement 5

**User Story:** As a player, I want modern floating action buttons, so that key actions are easily accessible and visually appealing.

#### Acceptance Criteria

1. WHEN the game is active THEN the System SHALL display a Dock component with action buttons (Scavenge, Settings, Zen Mode)
2. WHEN a player hovers over a dock item THEN the System SHALL magnify the icon with spring animation
3. WHEN a player clicks a dock item THEN the System SHALL execute the corresponding action
4. WHEN on mobile viewport THEN the System SHALL position the dock at the bottom of the screen
5. WHEN on desktop viewport THEN the System SHALL position the dock at the right side of the screen

### Requirement 6

**User Story:** As a player, I want panels and modals to use glassmorphism styling, so that the UI feels modern and cohesive.

#### Acceptance Criteria

1. WHEN the settings panel opens THEN the System SHALL render it with a frosted glass background effect
2. WHEN the stats panel is visible THEN the System SHALL apply subtle glassmorphism styling
3. WHEN the narrative log panel is visible THEN the System SHALL apply glassmorphism with dark tint
4. WHILE in horror mode THEN the System SHALL reduce glass transparency and add red tint to panels
5. WHILE in cute mode THEN the System SHALL increase glass transparency with pink/lavender tint

### Requirement 7

**User Story:** As a player, I want smooth theme transitions between cute and horror modes, so that mood changes feel natural rather than jarring.

#### Acceptance Criteria

1. WHEN transitioning from cute to horror mode THEN the System SHALL animate all theme changes over 1.5 seconds
2. WHEN transitioning from horror to cute mode THEN the System SHALL animate all theme changes over 1.5 seconds
3. WHEN theme transitions occur THEN the System SHALL update colors, shadows, and effects simultaneously
4. WHEN the reduce motion setting is enabled THEN the System SHALL apply theme changes instantly without transition animations

### Requirement 8

**User Story:** As a player, I want the CRT effect to be removed by default but available as an option, so that I get a modern experience with retro fallback.

#### Acceptance Criteria

1. WHEN the game loads for a new user THEN the System SHALL display the modern UI without CRT effects
2. WHEN a player enables "Retro Mode" in settings THEN the System SHALL apply CRT scanline overlay
3. WHEN "Retro Mode" is enabled THEN the System SHALL disable React Bits animations and use simpler effects
4. WHEN switching between modern and retro modes THEN the System SHALL persist the preference to localStorage
