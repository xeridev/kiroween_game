# Requirements Document

## Introduction

This specification defines a full-page, stage-responsive UI redesign for the Kiroween Game (Creepy Companion) that transforms the visual aesthetic from cutesy to horror as the pet evolves through four stages: EGG → BABY → TEEN → ABOMINATION. The redesign replaces the current fixed-width, scrollable layout with a viewport-based, full-page design that adapts dynamically to the pet's evolutionary stage using CSS theming, animations, and responsive layouts.

## Glossary

- **System**: The Kiroween Game web application
- **Pet**: The virtual creature managed by the player
- **PetStage**: An enumerated type representing the pet's evolutionary phase ("EGG" | "BABY" | "TEEN" | "ABOMINATION")
- **Viewport**: The visible area of the browser window
- **Canvas**: The PixiJS rendering surface displaying the pet graphics
- **Theme**: A collection of CSS custom properties defining colors, fonts, shadows, and visual styles
- **Stage-Responsive**: UI behavior that changes based on the current PetStage value
- **Sanity**: A game stat (0-100) that triggers additional visual effects when below 30
- **Desktop**: Screen width greater than 768 pixels
- **Mobile**: Screen width 768 pixels or less
- **Data Attribute**: HTML attribute used for CSS selectors (e.g., data-stage="EGG")

## Requirements

### Requirement 1

**User Story:** As a player, I want the game to occupy the full viewport without scrolling on desktop, so that I have an immersive, distraction-free experience.

#### Acceptance Criteria

1. WHEN the System renders on a desktop viewport (width > 768px), THE System SHALL display all UI components within the viewport boundaries without vertical or horizontal scrolling
2. WHEN the viewport is resized on desktop, THE System SHALL maintain full-page layout without introducing scrollbars
3. THE System SHALL use CSS Grid with viewport units (vh/vw) for layout dimensions on desktop viewports
4. WHEN the System renders the main layout, THE System SHALL allocate 10vh for the header, 25vw for the left panel, 50vw for the canvas, and 25vw for the right panel

### Requirement 2

**User Story:** As a mobile player, I want the game to adapt to smaller screens with scrolling enabled, so that I can access all features on my device.

#### Acceptance Criteria

1. WHEN the System renders on a mobile viewport (width ≤ 768px), THE System SHALL enable vertical scrolling
2. WHEN the System renders on mobile, THE System SHALL stack UI components vertically with 100% width
3. WHEN the System renders the canvas on mobile, THE System SHALL size it to 100vw width and 50vh height
4. WHEN the System renders stat panels on mobile, THE System SHALL display them full-width in a stacked layout
5. WHEN the System renders the narrative log on mobile, THE System SHALL limit its maximum height to 30vh

### Requirement 3

**User Story:** As a player, I want the visual theme to change as my pet evolves, so that the aesthetic progression from cutesy to horror enhances the narrative experience.

#### Acceptance Criteria

1. WHEN the PetStage is "EGG", THE System SHALL apply a cutesy theme with pastel pink/lavender colors, rounded fonts (Fredoka One, Quicksand), and soft shadows
2. WHEN the PetStage is "BABY", THE System SHALL apply a cute-with-unease theme with deeper lavender colors, slightly bolder fonts (Baloo 2, Nunito), and purple-tinted accents
3. WHEN the PetStage is "TEEN", THE System SHALL apply an unsettling theme with dark purple backgrounds, horror fonts (Creepster, Special Elite), and magenta borders
4. WHEN the PetStage is "ABOMINATION", THE System SHALL apply a full horror theme with near-black backgrounds, dripping fonts (Nosifer), blood-red accents, and glowing shadows
5. THE System SHALL implement theme switching using CSS custom properties scoped to data-stage attributes

### Requirement 4

**User Story:** As a player, I want smooth visual transitions between themes, so that stage evolution feels polished and intentional.

#### Acceptance Criteria

1. WHEN the PetStage changes, THE System SHALL transition CSS custom properties smoothly over 0.5 seconds
2. WHEN theme colors change, THE System SHALL use CSS transitions for background, border, and shadow properties
3. THE System SHALL apply the data-stage attribute to the root container element based on the current PetStage value from the Zustand store

### Requirement 5

**User Story:** As a player, I want the PixiJS canvas to resize responsively, so that the pet graphics adapt to different screen sizes and layouts.

#### Acceptance Criteria

1. WHEN the viewport is resized, THE System SHALL recalculate canvas dimensions based on viewport units (50vw × 70vh on desktop)
2. WHEN the canvas is resized, THE System SHALL update the PixiJS renderer dimensions to match the new size
3. WHEN the canvas is resized, THE System SHALL recenter the pet graphics within the new canvas bounds
4. THE System SHALL listen for window resize events and update canvas dimensions dynamically

### Requirement 6

**User Story:** As a player experiencing the EGG stage, I want gentle, playful animations, so that the aesthetic feels innocent and welcoming.

#### Acceptance Criteria

1. WHEN the PetStage is "EGG", THE System SHALL animate UI elements with a gentle floating motion (translateY oscillation over 4 seconds)
2. WHEN the PetStage is "EGG", THE System SHALL display sparkle particle effects using CSS keyframe animations with rotation and scale
3. WHEN the PetStage is "EGG", THE System SHALL pulse stat bars smoothly with brightness changes over 3 seconds
4. WHEN the PetStage is "EGG", THE System SHALL apply a bounce animation to buttons on hover with scale transformation

### Requirement 7

**User Story:** As a player experiencing the BABY stage, I want playful animations with subtle unease, so that the aesthetic hints at darker themes while remaining approachable.

#### Acceptance Criteria

1. WHEN the PetStage is "BABY", THE System SHALL apply a slight wobble animation to inventory items (rotation oscillation over 2 seconds)
2. WHEN the PetStage is "BABY", THE System SHALL animate stat bars with a heartbeat effect (scale pulsing at 2-second intervals)
3. WHEN the PetStage is "BABY", THE System SHALL slide new log entries in from the right with translateX animation over 0.4 seconds

### Requirement 8

**User Story:** As a player experiencing the TEEN stage, I want erratic, glitchy animations, so that the aesthetic conveys instability and corruption.

#### Acceptance Criteria

1. WHEN the PetStage is "TEEN", THE System SHALL apply a horizontal glitch animation to the UI overlay (translateX and skew transformations with hue rotation over 8 seconds)
2. WHEN the PetStage is "TEEN", THE System SHALL flicker stat bars with opacity changes (rapid on/off transitions every 5 seconds)
3. WHEN the PetStage is "TEEN", THE System SHALL distort text with chromatic aberration using multi-colored text shadows over 3 seconds
4. WHEN the PetStage is "TEEN", THE System SHALL animate borders with a crack-spread effect using clip-path transformations

### Requirement 9

**User Story:** As a player experiencing the ABOMINATION stage, I want violent, chaotic animations, so that the aesthetic conveys complete corruption and horror.

#### Acceptance Criteria

1. WHEN the PetStage is "ABOMINATION", THE System SHALL apply an intense screen shake animation to the body element (translate and rotate transformations over 0.5 seconds)
2. WHEN the PetStage is "ABOMINATION", THE System SHALL apply chromatic aberration to text with multi-directional colored shadows over 1 second
3. WHEN the PetStage is "ABOMINATION", THE System SHALL animate blood drip effects on stat bars using clip-path and blur filters over 2 seconds
4. WHEN the PetStage is "ABOMINATION", THE System SHALL display a VHS static overlay using repeating linear gradients with animated background position over 0.2 seconds
5. WHEN the PetStage is "ABOMINATION", THE System SHALL display random eye blink effects in UI corners using opacity and scale animations over 5 seconds

### Requirement 10

**User Story:** As a player with low sanity, I want additional visual effects regardless of stage, so that the sanity stat has meaningful visual feedback.

#### Acceptance Criteria

1. WHEN the sanity stat is below 30, THE System SHALL apply additional glitch animations to the UI overlay regardless of PetStage
2. WHEN the sanity stat is below 30, THE System SHALL intensify stat bar flicker animations with faster timing
3. WHEN the sanity stat is below 30, THE System SHALL apply chromatic aberration to the log container
4. THE System SHALL apply a data-sanity attribute with value "critical" when sanity is below 30, and "normal" otherwise

### Requirement 11

**User Story:** As a player, I want stat bars to use organic shapes instead of rectangles, so that the UI feels more thematic and visually interesting.

#### Acceptance Criteria

1. WHEN the System renders the hunger stat bar, THE System SHALL use a heart-shaped clip-path defined by an SVG path
2. WHEN the System renders the sanity stat bar, THE System SHALL use a brain-shaped clip-path defined by an ellipse
3. THE System SHALL maintain stat bar fill percentage accuracy within organic shapes

### Requirement 12

**User Story:** As a player, I want inventory items displayed as cards instead of a grid, so that each offering feels more tangible and important.

#### Acceptance Criteria

1. WHEN the System renders the inventory, THE System SHALL display offerings as flexbox cards with 150px width and 200px height
2. WHEN the System renders an offering card, THE System SHALL include the item icon, a "Mystery Item" title, and the AI-generated description
3. WHEN a player hovers over an offering card, THE System SHALL translate it upward by 10px and scale it to 1.05 with a 0.3-second transition
4. WHEN the PetStage is "ABOMINATION" and a player hovers over a card, THE System SHALL apply a glitch animation to the card

### Requirement 13

**User Story:** As a player, I want the narrative log to have a journal-style appearance, so that it feels like a handwritten record of events.

#### Acceptance Criteria

1. WHEN the System renders the narrative log, THE System SHALL apply a lined-paper background using repeating linear gradients with 1.5em spacing
2. WHEN the PetStage is "EGG", THE System SHALL use a soft pink paper texture background color (#FFF5F7)
3. WHEN the PetStage is "ABOMINATION", THE System SHALL use a black background with red-tinted lines and static noise texture
4. THE System SHALL use the stage-appropriate log font (Comic Neue for EGG, Patrick Hand for BABY, Courier Prime for TEEN, Special Elite for ABOMINATION)

### Requirement 14

**User Story:** As a player, I want fonts to load from Google Fonts, so that the custom typography enhances the stage-specific aesthetics.

#### Acceptance Criteria

1. THE System SHALL load the following fonts from Google Fonts CDN: Fredoka One, Baloo 2, Quicksand, Nunito, Comic Neue, Patrick Hand, Special Elite, Courier Prime, Creepster, Nosifer
2. THE System SHALL include font link tags in the index.html head element
3. THE System SHALL apply fonts using CSS custom properties that change based on data-stage attributes

### Requirement 15

**User Story:** As a developer, I want all animations to use hardware-accelerated CSS properties, so that the game maintains 60fps performance.

#### Acceptance Criteria

1. THE System SHALL implement all animations using only transform and opacity CSS properties
2. THE System SHALL avoid animating layout properties such as width, height, top, left, margin, or padding
3. THE System SHALL use CSS keyframe animations instead of JavaScript animation loops for visual effects

### Requirement 16

**User Story:** As a mobile player, I want performance-intensive animations disabled, so that the game remains responsive on lower-powered devices.

#### Acceptance Criteria

1. WHEN the viewport width is 768px or less, THE System SHALL disable the ABOMINATION stage body shake animation
2. WHEN the viewport width is 768px or less, THE System SHALL reduce or disable VHS static overlay effects
3. THE System SHALL use CSS media queries to conditionally disable animations on mobile viewports

### Requirement 17

**User Story:** As a player, I want the header to display the pet name and current stage, so that I always know my pet's identity and status.

#### Acceptance Criteria

1. WHEN the System renders the header, THE System SHALL display the pet name from the Zustand store traits
2. WHEN the System renders the header, THE System SHALL display the current PetStage value
3. THE System SHALL allocate 10vh of viewport height to the header section
4. THE System SHALL style the header using stage-appropriate fonts and colors from CSS custom properties

### Requirement 18

**User Story:** As a developer, I want CSS organized by component, so that styles remain maintainable and follow existing project patterns.

#### Acceptance Criteria

1. THE System SHALL maintain separate CSS files for each component (App.css, GameCanvas.css, UIOverlay.css, InventoryPanel.css)
2. THE System SHALL create a new themes.css file containing all CSS custom property definitions scoped to data-stage attributes
3. THE System SHALL import themes.css in the main index.css file
4. THE System SHALL reference CSS custom properties using var() function in component stylesheets
