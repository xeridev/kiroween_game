# Requirements Document

## Introduction

This document specifies requirements for enhanced narrative and image generation features in the Kiroween Game (Creepy Companion). These enhancements build upon the existing narrative-interactions system to provide richer visual storytelling, better AI-generated content consistency, player agency through dialogue choices, and comprehensive story archiving. The features include an image gallery for browsing generated artwork, real-time progress feedback during image generation, a memory system for narrative continuity, dialogue choices for player agency, story export functionality, and improved visual consistency through better prompt engineering and scene composition.

## Glossary

- **Image Gallery**: A dedicated UI view for browsing all generated images with filtering and timeline capabilities
- **Progress Indicator**: Real-time visual feedback showing image generation status during the 90-second polling window
- **Memory System**: AI context mechanism that references past narrative events to create story continuity
- **Dialogue Choice**: Player-selectable narrative response options that influence story direction and stats
- **Story Summary**: AI-generated narrative recap of the pet's complete life journey
- **Character Consistency**: Prompt engineering techniques to maintain stable pet appearance across generated images
- **Scene Composition**: Multi-panel image layouts for complex narrative events
- **Visual Traits**: Stored descriptors of pet appearance (colors, features, style) used for prompt consistency
- **Narrative Context Window**: The last N log entries used as context for AI narrative generation
- **Choice Point**: A narrative moment where the system presents dialogue options to the player

## Requirements

### Requirement 1: Image Gallery View

**User Story:** As a player, I want to browse all generated images in a dedicated gallery, so that I can revisit my pet's visual journey and appreciate the artwork.

#### Acceptance Criteria

1.1. WHEN a player opens the gallery view THEN the system SHALL display all narrative log images with completed status in a grid layout

1.2. WHEN the gallery is displayed THEN the system SHALL show images in chronological order with the most recent first

1.3. WHEN a player clicks an image in the gallery THEN the system SHALL open a full-screen modal with the image and associated narrative text

1.4. WHEN the gallery modal is open THEN the system SHALL allow navigation to previous/next images using arrow keys or swipe gestures

1.5. WHEN the gallery contains more than 20 images THEN the system SHALL implement pagination or infinite scroll

1.6. WHEN the viewport width is 768 pixels or less THEN the system SHALL display images in a single-column layout

### Requirement 2: Gallery Filtering

**User Story:** As a player, I want to filter gallery images by event type, so that I can focus on specific moments like evolutions or deaths.

#### Acceptance Criteria

2.1. WHEN the gallery view is displayed THEN the system SHALL show filter buttons for each event type (evolution, death, placate, vomit, insanity, haunt)

2.2. WHEN a player selects an event type filter THEN the system SHALL display only images associated with that event type

2.3. WHEN a player selects "All" filter THEN the system SHALL display all images regardless of event type

2.4. WHEN no images match the selected filter THEN the system SHALL display a message "No images for this event type"

2.5. WHEN a filter is active THEN the system SHALL visually highlight the selected filter button

### Requirement 3: Gallery Timeline View

**User Story:** As a player, I want to see my pet's visual journey as a timeline, so that I can understand the progression of events.

#### Acceptance Criteria

3.1. WHEN a player switches to timeline view THEN the system SHALL display images along a vertical timeline with timestamps

3.2. WHEN timeline view is active THEN the system SHALL show the pet's age at each image generation point

3.3. WHEN timeline view is active THEN the system SHALL display stage transitions (EGG → BABY → TEEN → ABOMINATION) as milestone markers

3.4. WHEN the pet has died THEN the system SHALL mark the death event with a distinct visual indicator on the timeline

3.5. WHEN timeline view is displayed on mobile THEN the system SHALL use a compact single-column layout

### Requirement 4: Image Generation Progress Indicator

**User Story:** As a player, I want to see real-time feedback during image generation, so that I know the system is working and how long to wait.

#### Acceptance Criteria

4.1. WHEN image generation starts THEN the system SHALL display a progress indicator on the associated log entry

4.2. WHEN the system is polling the RunPod API THEN the system SHALL update the progress indicator every 2 seconds

4.3. WHEN 30 seconds have elapsed THEN the system SHALL display "Generating... ~60s remaining"

4.4. WHEN 60 seconds have elapsed THEN the system SHALL display "Generating... ~30s remaining"

4.5. WHEN 90 seconds have elapsed without completion THEN the system SHALL display "Taking longer than expected..."

4.6. WHEN image generation completes successfully THEN the system SHALL replace the progress indicator with the generated image

4.7. WHEN image generation fails THEN the system SHALL display an error message with a retry button

### Requirement 5: Narrative Memory System

**User Story:** As a player, I want the pet's narratives to reference past events, so that the story feels cohesive and continuous.

#### Acceptance Criteria

5.1. WHEN generating a new narrative THEN the system SHALL include the last 5 narrative log entries as context in the AI prompt

5.2. WHEN the narrative context includes significant events (evolution, death of previous pet, placate) THEN the system SHALL explicitly reference these in the prompt

5.3. WHEN the pet has experienced multiple feedings of the same item type THEN the system SHALL allow the AI to reference developing preferences

5.4. WHEN the pet's sanity has changed significantly (>20 points) since the last narrative THEN the system SHALL include this context in the prompt

5.5. WHEN the pet has been alive for more than 24 game hours THEN the system SHALL allow the AI to reference the passage of time

### Requirement 6: Dialogue Choice System

**User Story:** As a player, I want to occasionally choose how to respond to narrative events, so that I have agency in shaping the story.

#### Acceptance Criteria

6.1. WHEN a significant narrative event occurs (evolution, insanity event, haunt) THEN the system SHALL have a 30% chance to present dialogue choices

6.2. WHEN dialogue choices are presented THEN the system SHALL display 2-3 options with clear emotional tones (comforting, fearful, loving)

6.3. WHEN a player selects a dialogue choice THEN the system SHALL generate a follow-up narrative reflecting that choice

6.4. WHEN a dialogue choice is selected THEN the system SHALL apply stat changes based on the choice's emotional tone (similar to reaction system)

6.5. WHEN dialogue choices are presented THEN the system SHALL disable them after 60 seconds and auto-select a neutral option

6.6. WHEN the viewport width is 768 pixels or less THEN the system SHALL display dialogue choices in a stacked vertical layout

6.7. WHEN a dialogue choice is made THEN the system SHALL store the choice in the log entry for future narrative context

### Requirement 7: Story Summary Generation

**User Story:** As a player, I want to generate a summary of my pet's life story, so that I can reflect on the journey and share it.

#### Acceptance Criteria

7.1. WHEN a player requests a story summary THEN the system SHALL generate an AI narrative covering the pet's entire life from egg to current state

7.2. WHEN generating a story summary THEN the system SHALL include key events (birth, evolutions, significant stat changes, death if applicable)

7.3. WHEN a story summary is generated THEN the system SHALL include the pet's final stats and age

7.4. WHEN a story summary is generated THEN the system SHALL format it as a cohesive narrative (not a list of events)

7.5. WHEN the pet has died THEN the system SHALL automatically generate a memorial story summary

7.6. WHEN a story summary is displayed THEN the system SHALL provide a "Copy to Clipboard" button

7.7. WHEN a story summary is displayed THEN the system SHALL provide a "Download as Text" button

### Requirement 8: Character Consistency in Image Generation

**User Story:** As a developer, I want generated images to maintain consistent pet appearance, so that the visual narrative feels cohesive.

#### Acceptance Criteria

8.1. WHEN generating an image THEN the system SHALL include explicit visual trait descriptors in the prompt (archetype-specific features, color palette, stage-specific size)

8.2. WHEN generating an image THEN the system SHALL reference the previous image URL in the prompt with instructions to "maintain the same character appearance"

8.3. WHEN the pet evolves to a new stage THEN the system SHALL include both the previous stage appearance and new stage characteristics in the prompt

8.4. WHEN generating an image THEN the system SHALL store visual trait keywords (e.g., "glowing purple eyes", "translucent body") for future reference

8.5. WHEN generating subsequent images THEN the system SHALL include stored visual trait keywords in the prompt

### Requirement 9: Scene Composition for Complex Events

**User Story:** As a player, I want complex events to be visualized with multi-panel layouts, so that the narrative is clearer and more dramatic.

#### Acceptance Criteria

9.1. WHEN generating an image for an evolution event THEN the system SHALL request a two-panel composition showing before and after

9.2. WHEN generating an image for a haunt event THEN the system SHALL request a split-screen composition showing the ghost and current pet

9.3. WHEN generating an image for a vomit event THEN the system SHALL request a sequence composition showing buildup and aftermath

9.4. WHEN generating an image for an insanity event THEN the system SHALL request a fragmented composition reflecting the pet's mental state

9.5. WHEN scene composition is requested THEN the system SHALL include explicit layout instructions in the prompt (e.g., "split vertically", "comic panel style")

### Requirement 10: Gallery Accessibility

**User Story:** As a player using assistive technology, I want the gallery to be fully accessible, so that I can enjoy the visual content.

#### Acceptance Criteria

10.1. WHEN the gallery is displayed THEN the system SHALL provide alt text for each image describing the event and pet state

10.2. WHEN navigating the gallery with keyboard THEN the system SHALL support arrow keys for image navigation

10.3. WHEN the gallery modal is open THEN the system SHALL trap focus within the modal

10.4. WHEN the gallery is displayed THEN the system SHALL announce filter changes to screen readers

10.5. WHEN images are loading THEN the system SHALL provide loading state announcements for screen readers

### Requirement 11: Progress Indicator Accessibility

**User Story:** As a player using assistive technology, I want to be informed about image generation progress, so that I understand what's happening.

#### Acceptance Criteria

11.1. WHEN image generation starts THEN the system SHALL announce "Generating image" to screen readers

11.2. WHEN progress updates occur THEN the system SHALL use aria-live regions to announce time remaining

11.3. WHEN image generation completes THEN the system SHALL announce "Image generated successfully" to screen readers

11.4. WHEN image generation fails THEN the system SHALL announce the error and retry option to screen readers

### Requirement 12: Dialogue Choice Accessibility

**User Story:** As a player using assistive technology, I want to interact with dialogue choices using my keyboard, so that I can participate in the narrative.

#### Acceptance Criteria

12.1. WHEN dialogue choices are presented THEN the system SHALL make them keyboard-focusable with tabindex="0"

12.2. WHEN a dialogue choice has keyboard focus AND the player presses Enter or Space THEN the system SHALL select that choice

12.3. WHEN dialogue choices are presented THEN the system SHALL announce the number of options and their emotional tones to screen readers

12.4. WHEN a dialogue choice is selected THEN the system SHALL announce the selection to screen readers

12.5. WHEN dialogue choices time out THEN the system SHALL announce the auto-selection to screen readers

### Requirement 13: Memory System Performance

**User Story:** As a developer, I want the memory system to be performant, so that narrative generation doesn't slow down the game.

#### Acceptance Criteria

13.1. WHEN building narrative context THEN the system SHALL limit context to the last 5 log entries (maximum 2000 characters)

13.2. WHEN narrative context exceeds 2000 characters THEN the system SHALL truncate older entries first

13.3. WHEN generating a narrative THEN the system SHALL cache the context window to avoid redundant processing

13.4. WHEN the pet has more than 100 log entries THEN the system SHALL only process recent entries for context

### Requirement 14: Story Summary Performance

**User Story:** As a developer, I want story summary generation to be efficient, so that players don't wait too long.

#### Acceptance Criteria

14.1. WHEN generating a story summary THEN the system SHALL limit the summary to 500 words maximum

14.2. WHEN the pet has more than 50 log entries THEN the system SHALL sample key events rather than including all entries

14.3. WHEN generating a story summary THEN the system SHALL use a separate API call with higher token limits

14.4. WHEN a story summary is requested multiple times THEN the system SHALL cache the result for 5 minutes

### Requirement 15: Error Handling and Graceful Degradation

**User Story:** As a developer, I want these features to fail gracefully, so that errors don't disrupt the core game experience.

#### Acceptance Criteria

15.1. WHEN the gallery fails to load THEN the system SHALL display an error message and allow retry

15.2. WHEN dialogue choice generation fails THEN the system SHALL fall back to standard narrative generation

15.3. WHEN story summary generation fails THEN the system SHALL display a fallback summary using log entry text

15.4. WHEN visual trait storage fails THEN the system SHALL continue image generation without consistency features

15.5. WHEN scene composition is not supported by the API THEN the system SHALL fall back to single-panel composition

