# Requirements Document

## Introduction

Creepy Companion is a web-based horror pet simulator that subverts traditional virtual pet mechanics by evolving a digital creature from cute to terrifying based on player neglect and choices. The system combines real-time decay mechanics, mystery item scavenging, and AI-generated narrative horror to create an unsettling digital pet experience. Built with Vite (React + TypeScript), PixiJS for canvas rendering, Zustand for state management, Howler.js for audio, and Vercel AI SDK for dynamic narrative generation.

## Glossary

- **System**: The Creepy Companion web application
- **Pet**: The digital creature entity managed by the player
- **Player**: The human user interacting with the System
- **Corruption**: A hidden numeric metric (0-100) tracking the Pet's descent into horror
- **Sanity**: A visible stat (0-100) representing the Pet's mental stability
- **Hunger**: A visible stat (0-100) representing the Pet's need for sustenance
- **Offering**: A mystery item obtained through scavenging that can be fed to the Pet
- **Archetype**: The Pet's base personality type (GLOOM, SPARK, or ECHO)
- **Stage**: The Pet's evolutionary phase (EGG, BABY, TEEN, ABOMINATION)
- **Game Day**: A 24-hour period in game time (24 real-world minutes at 1 sec = 1 min)
- **Scavenge**: The action of searching for random Offerings
- **Feed**: The action of giving an Offering to the Pet
- **PURITY**: A beneficial Offering type that reduces Corruption
- **ROT**: A harmful Offering type that increases Corruption
- **AI Narrator**: The Vercel AI SDK integration that generates contextual horror descriptions
- **Serverless Proxy**: The Vercel function that securely handles AI API calls

## Requirements

### Requirement 1

**User Story:** As a player, I want to create and customize my digital pet, so that I can establish a unique companion with personal characteristics.

#### Acceptance Criteria

1. WHEN the System starts for the first time, THE System SHALL display a creation interface with name input, archetype selection, and color picker
2. WHEN a Player submits a name with at least one character, THE System SHALL accept the name and store it in the Pet identity
3. WHEN a Player selects an archetype (GLOOM, SPARK, or ECHO), THE System SHALL assign that archetype to the Pet
4. WHEN a Player chooses a color using the color picker, THE System SHALL store the hex color value for the Pet
5. WHEN all creation parameters are provided and the Player confirms, THE System SHALL initialize the Pet in EGG stage and transition to the main game interface

### Requirement 2

**User Story:** As a player, I want my pet to have real-time needs that decay over time, so that I experience the tension of maintaining its survival.

#### Acceptance Criteria

1. WHEN one real-world second elapses, THE System SHALL advance game time by one game minute
2. WHEN game time advances, THE System SHALL increase the Pet Hunger stat by 0.05 points per game minute
3. WHEN game time advances, THE System SHALL decrease the Pet Sanity stat by 0.02 points per game minute
4. WHEN Hunger reaches 100, THE System SHALL mark the Pet as starving and trigger critical state warnings
5. WHEN Sanity reaches 0, THE System SHALL mark the Pet as psychotic and apply visual distortion effects

### Requirement 3

**User Story:** As a player, I want my pet to evolve through distinct stages based on age and corruption, so that I witness its transformation over time.

#### Acceptance Criteria

1. WHEN the Pet age exceeds 5 game minutes, THE System SHALL evolve the Pet from EGG stage to BABY stage
2. WHEN the Pet age exceeds 24 game hours, THE System SHALL evolve the Pet from BABY stage to TEEN stage
3. WHEN the Pet Corruption stat exceeds 80, THE System SHALL evolve the Pet to ABOMINATION stage regardless of age
4. WHEN the Pet evolves to a new stage, THE System SHALL update the visual representation to reflect the new stage
5. WHEN the Pet evolves, THE System SHALL generate a narrative log entry describing the transformation

### Requirement 4

**User Story:** As a player, I want to scavenge for mystery items, so that I can obtain resources to feed my pet without knowing their effects.

#### Acceptance Criteria

1. WHEN a Player triggers the scavenge action, THE System SHALL generate a random Offering with 50% probability of PURITY type and 50% probability of ROT type
2. WHEN an Offering is generated, THE System SHALL send a prompt to the AI Narrator requesting a one-sentence abstract description
3. WHEN the AI Narrator returns a description, THE System SHALL create an Offering with the description and a generic icon
4. WHEN an Offering is created, THE System SHALL add it to the Player inventory if space is available
5. WHEN the inventory contains 3 Offerings, THE System SHALL prevent additional scavenging until an item is consumed

### Requirement 5

**User Story:** As a player, I want to feed offerings to my pet with hidden consequences, so that I experience risk and uncertainty in my choices.

#### Acceptance Criteria

1. WHEN a Player feeds a PURITY Offering to the Pet, THE System SHALL decrease Hunger by 20, increase Sanity by 10, and decrease Corruption by 5
2. WHEN a Player feeds a ROT Offering to the Pet, THE System SHALL decrease Hunger by 20, decrease Sanity by 15, and increase Corruption by 10
3. WHEN a Player feeds any Offering, THE System SHALL remove the Offering from inventory and increment the daily feed counter
4. WHEN a Player attempts to feed more than 3 Offerings in a single game day, THE System SHALL trigger a vomit event that decreases Sanity by 20
5. WHEN a game day completes (24 game hours), THE System SHALL reset the daily feed counter to zero

### Requirement 6

**User Story:** As a player, I want to see my pet rendered visually based on its archetype and current state, so that I can perceive its condition and personality.

#### Acceptance Criteria

1. WHEN the Pet has GLOOM archetype, THE System SHALL render the Pet as a circle with squash-and-stretch animation
2. WHEN the Pet has SPARK archetype, THE System SHALL render the Pet as a triangle with jitter-and-glitch animation
3. WHEN the Pet has ECHO archetype, THE System SHALL render the Pet as a diamond with opacity pulse animation
4. WHEN the Pet Sanity drops below 30, THE System SHALL apply visual distortion effects including noise filter or position shake
5. WHEN the Pet stage changes, THE System SHALL modify the visual representation to reflect the new evolutionary stage

### Requirement 7

**User Story:** As a player, I want to view my inventory and interact with offerings, so that I can make informed decisions about feeding my pet.

#### Acceptance Criteria

1. WHEN the inventory panel is displayed, THE System SHALL show all Offerings as generic icons without revealing their type
2. WHEN a Player hovers over an Offering icon, THE System SHALL display the AI-generated description in a tooltip
3. WHEN a Player clicks an Offering icon, THE System SHALL trigger the feed action with that Offering
4. WHEN the inventory is empty, THE System SHALL display an empty state message
5. WHEN an Offering is consumed, THE System SHALL remove it from the inventory display immediately

### Requirement 8

**User Story:** As a player, I want to receive narrative feedback about my pet's reactions, so that I understand the consequences of my actions through storytelling.

#### Acceptance Criteria

1. WHEN a Player feeds a PURITY Offering, THE System SHALL generate a positive narrative response such as "The creature purrs"
2. WHEN a Player feeds a ROT Offering, THE System SHALL generate a disturbing narrative response such as "The creature glitches violently"
3. WHEN the Pet evolves to a new stage, THE System SHALL generate a narrative log entry describing the transformation
4. WHEN a critical event occurs (starvation, psychosis, vomit), THE System SHALL generate a contextual narrative warning
5. WHEN narrative logs are generated, THE System SHALL display them in a scrollable log panel with timestamps

### Requirement 9

**User Story:** As a system administrator, I want the AI API key to be secured server-side, so that sensitive credentials are never exposed to the client.

#### Acceptance Criteria

1. WHEN the System needs to call the AI Narrator, THE System SHALL send requests to a Vercel serverless function proxy
2. WHEN the serverless proxy receives a request, THE System SHALL authenticate using the API key from environment variables
3. WHEN the serverless proxy calls the Featherless API, THE System SHALL use the base URL 'https://api.featherless.ai/v1'
4. WHEN the AI API returns a response, THE System SHALL forward the result to the client without exposing credentials
5. WHEN the client attempts to access the API key directly, THE System SHALL prevent access through environment variable isolation

### Requirement 10

**User Story:** As a player, I want the game state to persist across sessions, so that my pet continues to exist even when I close the browser.

#### Acceptance Criteria

1. WHEN the game state changes, THE System SHALL serialize the state to browser local storage
2. WHEN the Player returns to the System, THE System SHALL restore the game state from local storage if available
3. WHEN the restored state indicates time has passed, THE System SHALL calculate and apply decay for the elapsed real-world time
4. WHEN no saved state exists, THE System SHALL initialize a new game with the creation screen
5. WHEN the Pet dies, THE System SHALL preserve the final state and prevent further gameplay until reset
