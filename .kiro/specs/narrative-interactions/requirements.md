# Requirements Document

## Introduction

This document specifies the requirements for an interactive narrative system that enhances player engagement through emoji reactions and automated image generation for key game events in the Kiroween Game (Creepy Companion). The system allows players to express emotional responses to narrative events, which influence future AI-generated narratives and pet statistics. Additionally, the system automatically generates contextual images for significant events to create a richer, more immersive horror pet simulation experience.

## Glossary

- **Narrative Log**: The scrollable list of game events displayed to the player, showing timestamped entries from both the system and the pet
- **Reaction**: An emoji-based player response to a narrative log entry that influences game state and future narrative tone
- **Tone Influence**: Keywords derived from player reactions that inform AI narrative generation to match player emotional engagement
- **Auto-Generation**: Automatic triggering of image generation for specific event types without requiring manual player interaction
- **Event Type**: Category of game occurrence (evolution, death, feeding, placate, insanity, haunt, vomit)
- **Stat Delta**: The numerical change applied to pet statistics (hunger, sanity, corruption) as a result of player reactions
- **Reaction History**: Collection of all player reactions stored for AI context in narrative generation
- **Mobile Viewport**: Screen width of 768 pixels or less, requiring simplified UI and disabled auto-generation
- **Base64 Data URL**: Image encoded as a data URI string for localStorage persistence

## Requirements

### Requirement 1: Emoji Reaction System

**User Story:** As a player, I want to react to narrative events with emojis, so that I can express my emotional response and influence the pet's story.

#### Acceptance Criteria

1.1. WHEN a narrative log entry is one of the last 5 entries AND is not pending AND is not a system log THEN the system SHALL display reaction buttons below the log entry

1.2. WHEN a player clicks a reaction button THEN the system SHALL record the reaction with the log ID, reaction type, timestamp, and stat delta

1.3. WHEN a player has already reacted to a log entry THEN the system SHALL visually highlight the selected reaction

1.4. WHEN the viewport width is 768 pixels or less THEN the system SHALL hide all reaction buttons

1.5. WHEN a reaction is recorded THEN the system SHALL immediately apply the associated stat delta to the pet's statistics

### Requirement 2: Reaction Types and Stat Influence

**User Story:** As a player, I want my reactions to meaningfully affect the pet's wellbeing, so that my emotional engagement has tangible consequences.

#### Acceptance Criteria

2.1. WHEN a player selects the COMFORT reaction (🥰 cute / 😨 horror) THEN the system SHALL increase sanity by 2 points

2.2. WHEN a player selects the FEAR reaction (😊 cute / 😱 horror) THEN the system SHALL decrease sanity by 3 points AND increase corruption by 1 point

2.3. WHEN a player selects the LOVE reaction (💖 cute / 🖤 horror) THEN the system SHALL increase sanity by 3 points AND decrease corruption by 1 point

2.4. WHEN a player selects the DREAD reaction (✨ cute / 👻 horror) THEN the system SHALL decrease sanity by 2 points AND increase corruption by 2 points

2.5. WHEN a player selects the HOPE reaction (🌸 cute / 🩸 horror) THEN the system SHALL increase sanity by 1 point

### Requirement 3: Tone Influence for AI Narratives

**User Story:** As a player, I want the pet's narrative voice to reflect my reactions, so that the story feels responsive to my emotional engagement.

#### Acceptance Criteria

3.1. WHEN the system generates a new narrative THEN the system SHALL retrieve the last 10 reactions from the reaction history

3.2. WHEN reactions are retrieved THEN the system SHALL map each reaction type to tone keywords (COMFORT → "comforted", FEAR → "terrified", LOVE → "cherished", DREAD → "haunted", HOPE → "hopeful")

3.3. WHEN tone keywords are generated THEN the system SHALL include them in the AI prompt as context: "The player recently showed [tone keywords] reactions"

3.4. WHEN no reactions exist in history THEN the system SHALL generate narratives without tone influence context

3.5. WHEN multiple reactions of the same type exist THEN the system SHALL include the tone keyword only once in the prompt

### Requirement 4: Auto-Image Generation for Key Events

**User Story:** As a developer, I want images to generate automatically for significant events, so that players experience a richer visual narrative without manual interaction.

#### Acceptance Criteria

4.1. WHEN an evolution event occurs THEN the system SHALL automatically trigger image generation for the evolution narrative log entry

4.2. WHEN a death event occurs THEN the system SHALL automatically trigger image generation for the death narrative log entry

4.3. WHEN a placate action is performed THEN the system SHALL automatically trigger image generation for the placate narrative log entry

4.4. WHEN a vomit event occurs THEN the system SHALL automatically trigger image generation for the vomit narrative log entry

4.5. WHEN an insanity event occurs THEN the system SHALL automatically trigger image generation for the insanity narrative log entry

4.6. WHEN a haunt event occurs THEN the system SHALL automatically trigger image generation for the haunt narrative log entry

4.7. WHEN a regular feeding event occurs (not vomit) THEN the system SHALL NOT automatically trigger image generation

4.8. WHEN the viewport width is 768 pixels or less THEN the system SHALL disable all auto-image generation

### Requirement 5: Specialized Image Prompts

**User Story:** As a developer, I want event-specific image prompts, so that generated images accurately reflect the narrative context and event type.

#### Acceptance Criteria

5.1. WHEN generating an image for an evolution event THEN the system SHALL include "dramatic transformation scene with [fromStage] morphing into [toStage], body horror elements, cosmic horror aesthetic" in the prompt

5.2. WHEN generating an image for a death event THEN the system SHALL include "somber memorial scene, [petName] fading into spectral form, melancholic atmosphere, ghost wisps, soft mourning light" in the prompt

5.3. WHEN generating an image for a placate event THEN the system SHALL include "intimate comforting moment, [archetype]-specific glow, gentle warmth amid horror" in the prompt with archetype-specific descriptions (GLOOM: dark purple aura, SPARK: electric sparkles, ECHO: rippling echoes)

5.4. WHEN generating an image for a vomit event THEN the system SHALL include "visceral expulsion scene, grotesque splatters, creature convulsing, body horror, disturbing biological details without gratuitousness" in the prompt

5.5. WHEN generating an image for an insanity event THEN the system SHALL include event-type-specific descriptions (WHISPERS: "auditory hallucination, soundwaves visualized", SHADOWS: "visual hallucination, impossible shadows", GLITCH: "reality glitch, fragmented duplicates", INVERSION: "inverted reality, upside-down environment") in the prompt

5.6. WHEN generating an image for a haunt event THEN the system SHALL include "spectral visitation, [ghostName] appearing as translucent apparition, memories bleeding through, current pet sensing presence, ethereal horror" in the prompt

### Requirement 6: Reaction History Storage

**User Story:** As a developer, I want reaction data persisted to localStorage, so that tone influence context survives page refreshes and maintains narrative continuity.

#### Acceptance Criteria

6.1. WHEN a reaction is recorded THEN the system SHALL store the reaction in the NarrativeLog interface extension with reactionType, timestamp, and statDelta fields

6.2. WHEN the game state is persisted to localStorage THEN the system SHALL include all reaction data within the narrative logs array

6.3. WHEN the game state is rehydrated from localStorage THEN the system SHALL restore all reaction data for each narrative log entry

6.4. WHEN localStorage quota is exceeded THEN the system SHALL trim logs to the last 50 entries including their reaction data

### Requirement 7: Visual Feedback for Stat Changes

**User Story:** As a player, I want to see immediate feedback when my reactions affect the pet's stats, so that I understand the consequences of my emotional engagement.

#### Acceptance Criteria

7.1. WHEN a reaction is applied THEN the system SHALL trigger a flash animation on the affected stat display (sanity or corruption)

7.2. WHEN sanity increases THEN the system SHALL display the stat change with a positive color indicator (theme-aware: cute theme uses bright colors, horror theme uses muted colors)

7.3. WHEN sanity or corruption decreases THEN the system SHALL display the stat change with a negative color indicator (theme-aware)

7.4. WHEN multiple stats change simultaneously THEN the system SHALL animate each stat change sequentially with a 100ms stagger delay

7.5. WHEN the reduceMotion setting is enabled THEN the system SHALL skip all stat change animations and apply changes instantly

### Requirement 8: Mobile Responsive Behavior

**User Story:** As a mobile player, I want a simplified experience that preserves performance, so that the game remains playable on my device.

#### Acceptance Criteria

8.1. WHEN the viewport width is 768 pixels or less THEN the system SHALL hide all reaction buttons using CSS media queries

8.2. WHEN the viewport width is 768 pixels or less THEN the system SHALL set autoGenerateImages flag to false in the store

8.3. WHEN autoGenerateImages is false THEN the system SHALL NOT automatically trigger image generation for any event type

8.4. WHEN autoGenerateImages is false THEN the system SHALL preserve manual image generation via log entry clicks

8.5. WHEN the viewport width increases above 768 pixels THEN the system SHALL re-enable reaction buttons and auto-image generation on the next page load

### Requirement 9: Accessibility and Keyboard Navigation

**User Story:** As a player using keyboard navigation, I want to interact with reactions using my keyboard, so that I can fully engage with the narrative system.

#### Acceptance Criteria

9.1. WHEN reaction buttons are displayed THEN the system SHALL make them keyboard-focusable with tabindex="0"

9.2. WHEN a reaction button has keyboard focus AND the player presses Enter or Space THEN the system SHALL trigger the reaction

9.3. WHEN a reaction button is focused THEN the system SHALL display a visible focus indicator with theme-aware styling

9.4. WHEN a reaction is selected THEN the system SHALL announce the stat change to screen readers using aria-live regions

9.5. WHEN the player navigates through reaction buttons THEN the system SHALL maintain logical tab order from left to right

### Requirement 10: Error Handling and Graceful Degradation

**User Story:** As a developer, I want the reaction system to fail gracefully, so that errors do not disrupt the core game experience.

#### Acceptance Criteria

10.1. WHEN a reaction fails to apply stat changes THEN the system SHALL log the error and continue without crashing

10.2. WHEN auto-image generation fails THEN the system SHALL mark the log entry with "failed" status and allow manual retry

10.3. WHEN tone influence context cannot be retrieved THEN the system SHALL generate narratives without tone keywords

10.4. WHEN localStorage is unavailable THEN the system SHALL store reactions in memory for the current session only

10.5. WHEN a reaction is applied to a non-existent log entry THEN the system SHALL log a warning and ignore the reaction
