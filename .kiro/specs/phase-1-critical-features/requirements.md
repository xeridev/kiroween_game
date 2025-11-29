# Requirements Document

## Introduction

Phase 1 Critical Features implements the core death and consequence mechanics for Kiroween Game, a horror virtual pet simulator. This phase introduces permadeath with ghost haunting, a "Placate" interaction for sanity restoration, and escalating fail states that create tension and meaningful consequences for player decisions.

The system builds upon the existing Zustand-based state management, AI narrative generation, and sound system to deliver an atmospheric horror experience where player choices have lasting impact.

## Glossary

- **Pet**: The virtual creature the player nurtures through life stages (EGG → BABY → TEEN → ABOMINATION)
- **Death Event**: The termination of a pet's life when hunger reaches 100 or sanity reaches 0
- **Ghost**: A persistent record of a deceased pet stored separately from active game state
- **Haunt**: A supernatural event where a ghost of a previous pet affects the current pet
- **Placate**: A player action that restores sanity with a cooldown period
- **Insanity Event**: A hallucination or disturbance triggered when sanity is critically low
- **Critical State**: When hunger ≥ 90 OR sanity ≤ 10, indicating imminent death
- **Game Minute**: One unit of game time, equivalent to one real second
- **Game Day**: 1440 game minutes (24 real minutes)
- **Archetype**: Pet personality type (GLOOM, SPARK, or ECHO) affecting interactions

## Requirements

### Requirement 1: Death Detection and Triggering

**User Story:** As a player, I want my pet to die when neglected, so that my care decisions have meaningful consequences.

#### Acceptance Criteria

1. WHEN hunger reaches 100 WHILE the pet isAlive equals true THEN the Death_System SHALL trigger a death event with cause "STARVATION"
2. WHEN sanity reaches 0 WHILE the pet isAlive equals true THEN the Death_System SHALL trigger a death event with cause "INSANITY"
3. WHEN a death event triggers THEN the Death_System SHALL set isAlive to false and stop the game loop
4. WHEN a death event triggers THEN the Death_System SHALL record the death timestamp, cause, final stats, and pet traits

### Requirement 2: Death Narrative and Memorial

**User Story:** As a player, I want to see a memorial for my deceased pet, so that I can reflect on our time together.

#### Acceptance Criteria

1. WHEN a death event triggers THEN the Narrative_System SHALL generate an AI death narrative describing the pet's final moments
2. WHEN a death event triggers THEN the Narrative_System SHALL generate an AI epitaph summarizing the pet's life
3. WHEN a death event triggers THEN the UI_System SHALL display a full-screen death memorial showing pet name, archetype, stage reached, age at death, cause of death, and final corruption level
4. WHEN the death memorial displays THEN the Sound_System SHALL play a death sound effect via playSound with eventType "death"
5. WHEN AI narrative generation fails THEN the Narrative_System SHALL display a fallback death message

### Requirement 3: Ghost Storage and Persistence

**User Story:** As a player, I want my deceased pets to be remembered, so that they can influence future playthroughs.

#### Acceptance Criteria

1. WHEN a death event triggers THEN the Ghost_System SHALL create a GhostData record containing pet traits, final stats, death cause, death timestamp, and epitaph
2. WHEN a GhostData record is created THEN the Ghost_System SHALL store the record in localStorage key "creepy-companion-ghosts" as a JSON array
3. WHEN the ghost array exceeds 10 entries THEN the Ghost_System SHALL remove the oldest ghost using FIFO eviction
4. WHEN ghost data is stored THEN the Ghost_System SHALL preserve the data independently from the main game state storage

### Requirement 4: Haunt Mechanics

**User Story:** As a player, I want to be haunted by my previous pets, so that death has lasting consequences across playthroughs.

#### Acceptance Criteria

1. WHEN a new pet is initialized WHILE ghost data exists in storage THEN the Haunt_System SHALL enable haunt mechanics for the current session
2. WHEN a game tick occurs WHILE sanity is below 50 AND haunt mechanics are enabled THEN the Haunt_System SHALL evaluate a 1% chance to trigger a haunt event
3. WHEN a haunt event triggers WHILE no haunt has occurred in the current game day THEN the Haunt_System SHALL select a random ghost from storage
4. WHEN a haunt event triggers THEN the Narrative_System SHALL generate an AI haunt narrative referencing the selected ghost's name and traits
5. WHEN a haunt event triggers THEN the Haunt_System SHALL reduce current pet sanity by 5 points
6. WHEN a haunt event triggers THEN the Sound_System SHALL play a haunt sound effect via playSound with eventType "haunt"
7. WHEN AI haunt narrative generation fails THEN the Narrative_System SHALL display a fallback haunt message referencing the ghost's name

### Requirement 5: Death Screen UI

**User Story:** As a player, I want a clear way to start over after my pet dies, so that I can continue playing.

#### Acceptance Criteria

1. WHEN isAlive equals false THEN the UI_System SHALL display the DeathScreen component instead of the main game interface
2. WHEN the DeathScreen displays THEN the UI_System SHALL show a "Start New Pet" button
3. WHEN the player clicks "Start New Pet" THEN the Game_System SHALL reset game state to initial values while preserving ghost data
4. WHEN the player clicks "Start New Pet" THEN the UI_System SHALL navigate to the CreationScreen

### Requirement 6: Placate Interaction

**User Story:** As a player, I want to comfort my pet, so that I can restore its sanity and prevent insanity death.

#### Acceptance Criteria

1. WHEN the player clicks the Placate button WHILE the pet isAlive equals true AND placate is not on cooldown THEN the Placate_System SHALL increase sanity by 15 points clamped to maximum 100
2. WHEN sanity is 80 or above WHILE corruption is below 50 THEN the Placate_System SHALL apply reduced effect of 5 sanity points instead of 15
3. WHEN a placate action executes THEN the Placate_System SHALL increase hunger by 5 points clamped to maximum 100
4. WHEN a placate action executes THEN the Placate_System SHALL set lastPlacateTime to current game age and start a 30 game minute cooldown
5. WHEN a placate action executes THEN the Narrative_System SHALL generate an AI placate narrative based on pet archetype
6. WHEN a placate action executes THEN the Sound_System SHALL play a placate sound effect via playSound with eventType "placate"
7. WHEN placate is on cooldown THEN the UI_System SHALL disable the Placate button and display remaining cooldown time
8. WHEN AI placate narrative generation fails THEN the Narrative_System SHALL display a fallback placate message

### Requirement 7: Placate Visual Feedback

**User Story:** As a player, I want visual feedback when I placate my pet, so that I know the action was successful.

#### Acceptance Criteria

1. WHEN a placate action executes THEN the UI_System SHALL display a glow pulse animation on the pet sprite
2. WHEN a placate action executes for a GLOOM archetype THEN the UI_System SHALL display a dark purple glow effect
3. WHEN a placate action executes for a SPARK archetype THEN the UI_System SHALL display a bright sparkle particle effect
4. WHEN a placate action executes for an ECHO archetype THEN the UI_System SHALL display a rippling echo wave effect

### Requirement 8: Starvation Consequences

**User Story:** As a player, I want hunger to have escalating consequences, so that feeding decisions feel urgent.

#### Acceptance Criteria

1. WHEN hunger exceeds 80 WHILE the pet isAlive equals true THEN the Decay_System SHALL accelerate sanity decay to 0.05 per game minute instead of 0.02
2. WHEN hunger reaches or exceeds 90 WHILE the pet isAlive equals true THEN the Decay_System SHALL accelerate hunger decay to 0.1 per game minute instead of 0.05
3. WHEN hunger reaches or exceeds 90 OR sanity reaches or falls below 10 THEN the UI_System SHALL display a critical warning with pulsing red border on StatsPanel
4. WHEN critical warning activates for the first time per threshold crossing THEN the Sound_System SHALL play an alarm sound via playSound with eventType "critical_warning"

### Requirement 9: Vomit Event Enhancement

**User Story:** As a player, I want overfeeding to have visceral consequences, so that I learn to feed responsibly.

#### Acceptance Criteria

1. WHEN dailyFeeds exceeds 3 THEN the Consequence_System SHALL trigger a vomit event
2. WHEN a vomit event triggers THEN the UI_System SHALL display a particle splatter animation on the GameCanvas
3. WHEN a vomit event triggers THEN the Narrative_System SHALL generate an AI vomit narrative
4. WHEN a vomit event triggers THEN the Sound_System SHALL play a vomit sound effect via playSound with eventType "vomit"
5. WHEN AI vomit narrative generation fails THEN the Narrative_System SHALL display a fallback vomit message

### Requirement 10: Insanity Events

**User Story:** As a player, I want low sanity to cause disturbing events, so that maintaining sanity feels important.

#### Acceptance Criteria

1. WHEN sanity falls below 30 WHILE the pet isAlive equals true THEN the Insanity_System SHALL evaluate a 1% chance per game tick to trigger an insanity event
2. WHEN an insanity event triggers THEN the Insanity_System SHALL select a random event type from WHISPERS, SHADOWS, GLITCH, or INVERSION
3. WHEN a WHISPERS insanity event triggers THEN the Sound_System SHALL play whisper sounds via playSound with eventType "insanity_whispers"
4. WHEN a SHADOWS or GLITCH or INVERSION insanity event triggers THEN the Sound_System SHALL play a horror stinger via playSound with eventType "insanity_stinger"
5. WHEN an insanity event triggers THEN the Narrative_System SHALL generate an AI hallucination narrative matching the event type
6. WHEN an insanity event triggers THEN the UI_System SHALL apply a brief visual distortion effect matching the event type
7. WHEN AI insanity narrative generation fails THEN the Narrative_System SHALL display a fallback hallucination message

### Requirement 11: Cooldown Persistence

**User Story:** As a player, I want cooldowns to persist across page refreshes, so that I cannot exploit refreshing to bypass cooldowns.

#### Acceptance Criteria

1. WHEN game state is persisted to localStorage THEN the Persistence_System SHALL include lastPlacateTime in the persisted data
2. WHEN game state is rehydrated from localStorage THEN the Persistence_System SHALL restore lastPlacateTime and calculate remaining cooldown
3. WHEN lastHauntGameDay is set THEN the Persistence_System SHALL include lastHauntGameDay in the persisted data
