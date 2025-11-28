# Requirements Document

## Introduction

This document specifies the requirements for an AI-powered sound system for Kiroween Game (Creepy Companion). The system integrates Howler.js for audio playback with AI-driven sound selection via RunPod Qwen3-32B-AWQ to create an immersive, context-aware horror atmosphere. The sound system responds dynamically to game events (feeding, evolution, sanity changes) and selects appropriate sounds from a categorized sound library based on narrative context.

## Glossary

- **Sound_Manager**: The core audio utility module responsible for loading, playing, and managing all game sounds using Howler.js
- **Sound_Catalog**: A JSON file containing metadata about all available sounds, including file paths, tags, categories, and loop settings
- **Sound_Selector_API**: A Vercel serverless function that uses AI to intelligently select sounds based on game context
- **Audio_State**: The Zustand store slice containing audio preferences (volumes, mute state) that persists to localStorage
- **Ambient_Sound**: Background audio that loops continuously based on current game state (stage, sanity level)
- **SFX**: Short sound effects triggered by discrete game events (feeding, evolution, UI interactions)
- **Crossfade**: A smooth audio transition where one sound fades out while another fades in
- **Sound_Pool**: A pre-loaded collection of frequently used sounds to minimize playback latency
- **Autoplay_Policy**: Browser restrictions that prevent audio playback until user interaction occurs
- **Master_Volume**: The global volume multiplier applied to all audio output
- **SFX_Volume**: The volume multiplier applied specifically to sound effects
- **Ambient_Volume**: The volume multiplier applied specifically to ambient/background sounds

## Requirements

### Requirement 1: Sound Catalog Generation

**User Story:** As a developer, I want a comprehensive sound catalog that indexes all available sounds, so that the AI can intelligently select appropriate sounds for game events.

#### Acceptance Criteria

1. THE Sound_Catalog SHALL contain metadata for all sound files in the public/sounds/ directory including file path, category, tags array, loop boolean, and description
2. WHEN the Sound_Catalog is loaded THEN the Sound_Manager SHALL parse and index all entries for fast lookup by category and tags
3. THE Sound_Catalog SHALL organize sounds into game context categories: feeding, evolution, ambient, ui, sanity, monster, and stinger
4. THE Sound_Catalog SHALL include a pretty-printer that serializes the catalog to JSON format for persistence and debugging

### Requirement 2: Sound Manager Core Functionality

**User Story:** As a player, I want reliable audio playback that handles browser restrictions gracefully, so that I can enjoy the game's atmosphere without technical issues.

#### Acceptance Criteria

1. WHEN the Sound_Manager initializes THEN the Sound_Manager SHALL create Howler.js instances for all sounds in the Sound_Pool
2. WHEN a sound is requested THEN the Sound_Manager SHALL play the sound using Howler.js with the specified volume and loop settings
3. WHILE the browser has not received user interaction THEN the Sound_Manager SHALL remain muted to comply with autoplay policies
4. WHEN the first user interaction occurs THEN the Sound_Manager SHALL unmute audio if the user has not explicitly muted
5. THE Sound_Manager SHALL support independent volume controls for master, sfx, and ambient channels
6. WHEN ambient sounds change THEN the Sound_Manager SHALL crossfade between the old and new ambient sounds over 2 seconds

### Requirement 3: AI Sound Selection API

**User Story:** As a player, I want sounds that match the narrative context of game events, so that the audio enhances the horror atmosphere.

#### Acceptance Criteria

1. WHEN the Sound_Selector_API receives a request THEN the Sound_Selector_API SHALL accept eventType, petName, stage, archetype, itemType, sanity, corruption, and narrativeText as context parameters
2. WHEN the Sound_Selector_API processes a request THEN the Sound_Selector_API SHALL return a response containing primarySound path, optional secondarySounds array, optional ambientSound path, and volume recommendation
3. IF the AI selection takes longer than 500 milliseconds THEN the Sound_Selector_API SHALL fall back to rule-based selection
4. IF the AI service is unavailable THEN the Sound_Selector_API SHALL use rule-based fallback logic mapping PURITY items to gentle sounds and ROT items to disturbing sounds
5. WHEN sanity is below 30 THEN the Sound_Selector_API SHALL prioritize horror ambient sounds from the Monsters & Ghosts or Ambient categories

### Requirement 4: Audio State Persistence

**User Story:** As a player, I want my audio preferences saved between sessions, so that I don't have to reconfigure volume settings each time I play.

#### Acceptance Criteria

1. THE Audio_State SHALL persist masterVolume, sfxVolume, ambientVolume, and isMuted to localStorage via Zustand persist middleware
2. WHEN the game loads THEN the Audio_State SHALL restore previously saved audio preferences
3. WHEN a volume setting changes THEN the Audio_State SHALL immediately apply the new volume to the Sound_Manager
4. WHEN the mute toggle is activated THEN the Audio_State SHALL mute or unmute all audio channels simultaneously

### Requirement 5: Game Event Integration

**User Story:** As a player, I want sounds to play automatically during key game moments, so that the audio creates an immersive experience without manual intervention.

#### Acceptance Criteria

1. WHEN the feed action is called THEN the Sound_Manager SHALL request sound selection with feeding context and play the selected sounds
2. WHEN the scavenge action completes THEN the Sound_Manager SHALL play a discovery sound effect
3. WHEN the pet evolves to a new stage THEN the Sound_Manager SHALL play an evolution sound appropriate to the new stage
4. WHILE sanity is below 30 THEN the Sound_Manager SHALL play horror ambient sounds
5. WHEN sanity transitions above or below the 30 threshold THEN the Sound_Manager SHALL crossfade to the appropriate ambient sound

### Requirement 6: Volume Controls UI

**User Story:** As a player, I want accessible volume controls, so that I can adjust the audio to my preferences.

#### Acceptance Criteria

1. THE AudioControls component SHALL display sliders for master, sfx, and ambient volume
2. THE AudioControls component SHALL display a mute/unmute toggle button
3. THE AudioControls component SHALL include ARIA labels for all interactive elements
4. WHEN a volume slider is adjusted THEN the AudioControls component SHALL update the Audio_State immediately
5. THE AudioControls component SHALL visually indicate the current mute state

### Requirement 7: Error Handling and Fallbacks

**User Story:** As a player, I want the game to continue functioning even if audio fails, so that technical issues don't prevent me from playing.

#### Acceptance Criteria

1. IF a sound file fails to load THEN the Sound_Manager SHALL log the error using errorLogger and continue without crashing
2. IF the Sound_Selector_API fails THEN the Sound_Manager SHALL use cached or rule-based sound selection
3. IF all audio playback fails THEN the Sound_Manager SHALL disable audio gracefully and allow the game to continue
4. THE Sound_Manager SHALL preload critical sounds on game start to minimize playback delays

### Requirement 8: Deterministic Caching

**User Story:** As a player, I want consistent audio for similar game events, so that the soundscape feels coherent rather than random.

#### Acceptance Criteria

1. WHEN the same context parameters are provided THEN the Sound_Selector_API SHALL return the same sound selection
2. THE Sound_Manager SHALL cache AI sound selections for the duration of the game session
3. WHEN a cached selection exists for the current context THEN the Sound_Manager SHALL use the cached selection instead of calling the API
