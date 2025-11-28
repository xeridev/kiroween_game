# Requirements Document

## Introduction

This document specifies the requirements for interactive UI enhancements to the Kiroween Game (Creepy Companion). The enhancements focus on adding drag-and-drop inventory management, animated stat displays, enhanced narrative log animations, and visual feedback improvements while preserving the existing retro horror aesthetic and stage-based theming system.

## Glossary

- **Inventory System**: The 3-slot grid that holds PURITY and ROT offerings the player can feed to their pet
- **Drag-and-Drop**: User interaction pattern where items can be picked up and moved by clicking/touching and dragging
- **DragOverlay**: Visual representation of an item being dragged, rendered separately from the original item
- **Droppable Zone**: An area that can receive dragged items (e.g., GameCanvas for feeding)
- **CountUp Animation**: Smooth numerical transition animation when stat values change
- **FadeIn Animation**: Opacity transition from 0 to 1, optionally with blur effect
- **Stage-Based Theming**: CSS custom properties that change based on pet stage (EGG, BABY, TEEN, ABOMINATION)
- **Sanity State**: Critical (< 30) or normal (≥ 30) sanity level affecting visual styling
- **GSAP**: GreenSock Animation Platform, a JavaScript animation library
- **React Bits**: A collection of copy-paste React animation components (not an npm package)
- **@dnd-kit**: Modern drag-and-drop toolkit for React applications
- **Sensor**: Input detection mechanism for drag interactions (pointer, touch, keyboard)

## Requirements

### Requirement 1: Draggable Inventory System

**User Story:** As a player, I want to drag and reorder items in my inventory, so that I can organize my offerings and have a more tactile interaction with the game.

#### Acceptance Criteria

1. WHEN a player clicks and holds an inventory item THEN the Inventory System SHALL initiate a drag operation and display a DragOverlay showing the dragged item
2. WHEN a player drags an inventory item over another item slot THEN the Inventory System SHALL provide visual feedback indicating the potential drop position
3. WHEN a player releases a dragged item over another inventory slot THEN the Inventory System SHALL reorder the inventory array and persist the new order to localStorage
4. WHEN a player releases a dragged item outside valid drop zones THEN the Inventory System SHALL return the item to its original position without modifying inventory order
5. WHEN a drag operation is in progress THEN the Inventory System SHALL apply a visual style to the original item position indicating it is being moved
6. WHEN the inventory is empty THEN the Inventory System SHALL display the existing "No offerings found" message without drag functionality

### Requirement 2: Drag-to-Feed Interaction

**User Story:** As a player, I want to drag inventory items onto my pet to feed them, so that I have an intuitive and satisfying way to interact with my companion.

#### Acceptance Criteria

1. WHEN a player drags an inventory item over the GameCanvas THEN the GameCanvas SHALL display a visual indicator showing it is a valid drop target for feeding
2. WHEN a player releases a dragged item over the GameCanvas THEN the Inventory System SHALL trigger the feed action with the dropped item's ID
3. WHEN a feed action is triggered via drag-and-drop THEN the Inventory System SHALL remove the item from inventory and apply stat changes identical to click-to-feed
4. WHEN a player is not dragging an item THEN the GameCanvas SHALL NOT display any drop target indicators
5. WHEN a drag-to-feed operation completes successfully THEN the Inventory System SHALL play a visual feedback animation on the GameCanvas

### Requirement 3: Animated Stats Display

**User Story:** As a player, I want to see smooth animations when my pet's stats change, so that I have clear visual feedback about the effects of my actions.

#### Acceptance Criteria

1. WHEN a stat value (hunger, sanity) changes THEN the StatsPanel SHALL animate the numerical display from the old value to the new value using CountUp animation
2. WHEN a CountUp animation is in progress THEN the StatsPanel SHALL complete the animation within 500 milliseconds
3. WHEN multiple stat changes occur within 100 milliseconds THEN the StatsPanel SHALL batch the changes and animate to the final value
4. WHEN the StatsPanel first renders THEN the StatsPanel SHALL animate stat values from 0 to their current values as an entrance animation
5. WHEN a stat value changes by more than 10 points THEN the StatsPanel SHALL apply an additional emphasis animation (scale pulse) to draw attention

### Requirement 4: Enhanced Narrative Log Animations

**User Story:** As a player, I want new narrative entries to appear with atmospheric animations, so that the storytelling feels more immersive and horror-appropriate.

#### Acceptance Criteria

1. WHEN a new log entry is added THEN the NarrativeLog SHALL animate the entry with a fade-in effect combined with blur-to-clear transition
2. WHEN multiple log entries are added simultaneously THEN the NarrativeLog SHALL stagger the animations with 150 millisecond delays between entries
3. WHEN a log entry animation completes THEN the NarrativeLog SHALL scroll the container to show the newest entry
4. WHEN sanity is critical (< 30) THEN the NarrativeLog SHALL apply additional glitch effects to new entry animations
5. WHEN the NarrativeLog first renders with existing entries THEN the NarrativeLog SHALL NOT animate existing entries (only new additions)

### Requirement 5: Visual Feedback Enhancements

**User Story:** As a player, I want buttons and interactive elements to provide satisfying visual feedback, so that the interface feels responsive and polished.

#### Acceptance Criteria

1. WHEN a player hovers over the scavenge button THEN the button SHALL display a subtle scale animation while preserving the retro aesthetic
2. WHEN the scavenge button is in loading state THEN the button SHALL display a pulsing animation indicating activity
3. WHEN a feed action completes THEN the fed item's card position SHALL display a fade-out animation before removal
4. WHEN an evolution occurs THEN the GameCanvas SHALL display a flash/pulse animation effect
5. WHEN a player hovers over an inventory card THEN the card SHALL display a lift animation (translateY + shadow increase) consistent with stage theming

### Requirement 6: Accessibility Requirements

**User Story:** As a player using assistive technology, I want all interactive enhancements to be accessible, so that I can enjoy the game regardless of my abilities.

#### Acceptance Criteria

1. WHEN a player uses keyboard navigation THEN the Inventory System SHALL support Tab to focus items and Enter/Space to initiate drag mode
2. WHEN keyboard drag mode is active THEN the Inventory System SHALL support Arrow keys to move items and Enter to drop or Escape to cancel
3. WHEN a drag operation occurs THEN the Inventory System SHALL announce the action to screen readers via ARIA live regions
4. WHEN animations are playing THEN the UI System SHALL respect the prefers-reduced-motion media query and disable non-essential animations
5. WHEN a droppable zone is active THEN the zone SHALL have appropriate ARIA attributes (aria-dropeffect, aria-grabbed)

### Requirement 7: Mobile Touch Support

**User Story:** As a mobile player, I want touch-friendly drag interactions, so that I can play the game comfortably on my phone or tablet.

#### Acceptance Criteria

1. WHEN a player touches and holds an inventory item for 200 milliseconds THEN the Inventory System SHALL initiate a drag operation
2. WHEN a touch drag is in progress THEN the Inventory System SHALL prevent page scrolling within the inventory area
3. WHEN a player performs a quick tap on an inventory item THEN the Inventory System SHALL trigger the existing click-to-feed behavior
4. WHEN the viewport width is 768 pixels or less THEN the UI System SHALL simplify animations to maintain 60fps performance
5. WHEN touch drag is active THEN the DragOverlay SHALL be positioned relative to the touch point with appropriate offset for finger visibility

### Requirement 8: Animation Performance

**User Story:** As a player, I want smooth animations that don't impact game performance, so that the visual enhancements don't detract from gameplay.

#### Acceptance Criteria

1. WHEN animations are running THEN the UI System SHALL maintain a minimum of 60 frames per second on desktop devices
2. WHEN animations are running on mobile devices THEN the UI System SHALL maintain a minimum of 30 frames per second
3. WHEN the game tick updates stats THEN the CountUp animation SHALL throttle updates to every 5 ticks (5 seconds) to prevent excessive re-renders
4. WHEN GSAP animations are used THEN the UI System SHALL use transform and opacity properties exclusively for GPU acceleration
5. WHEN an animation fails to initialize THEN the UI System SHALL log the error and fall back to instant state changes without crashing

### Requirement 9: Theme Integration

**User Story:** As a player, I want the new animations to match the current pet stage theme, so that the visual enhancements feel cohesive with the game's aesthetic.

#### Acceptance Criteria

1. WHEN the pet stage changes THEN all animation components SHALL update their styling to use the new stage's CSS custom properties
2. WHEN the sanity state changes to critical THEN animation components SHALL apply additional glitch/distortion effects consistent with existing theme
3. WHEN rendering DragOverlay THEN the overlay SHALL use the current stage's border-style, shadow, and accent colors
4. WHEN CountUp animations complete THEN the final value display SHALL match the existing stat bar styling for the current stage
5. WHEN the ABOMINATION stage is active THEN drag interactions SHALL include subtle glitch animations on the DragOverlay

