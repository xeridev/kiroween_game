/**
 * AI Narrative Generator
 * Generates contextual horror narrative text for game events
 */

import { logWarning } from "./errorLogger";
import type { Archetype, PetStage } from "./types";

import type { DeathCause } from "./types";

// Fallback messages when AI fails
const FALLBACK_MESSAGES = {
  feed_purity: [
    "consumes the offering with an unsettling gentleness.",
    "absorbs the purity, its form briefly luminescent.",
    "accepts the gift. Something shifts within.",
  ],
  feed_rot: [
    "devours the corruption eagerly, growing darker.",
    "writhes with pleasure as decay spreads through it.",
    "consumes the rot. Its eyes gleam with hunger.",
  ],
  overfeed: [
    "convulses violently. Too much, too soon.",
    "retches and shudders. Greed has consequences.",
    "spasms as its form rejects the excess.",
  ],
  evolution: [
    "transforms, shedding its former self like dead skin.",
    "writhes as new appendages emerge from within.",
    "screams silently as it becomes something else.",
  ],
  hatch: [
    "emerges from the egg, wet and trembling.",
    "breaks free, its first breath a rattling gasp.",
    "hatches into existence, already watching.",
  ],
  // Death narrative fallbacks (Requirement 2.5)
  death_starvation: [
    "succumbs to the gnawing emptiness within.",
    "fades away, consumed by hunger's final embrace.",
    "withers into silence, starved of sustenance.",
  ],
  death_insanity: [
    "loses itself to the void between thoughts.",
    "shatters into fragments of what once was.",
    "dissolves into the madness that claimed it.",
  ],
  // Placate narrative fallbacks (Requirement 6.8)
  placate: [
    "finds momentary peace in your presence.",
    "calms slightly, though darkness still lingers.",
    "settles into an uneasy stillness.",
  ],
  // Vomit narrative fallbacks (Requirement 9.5)
  vomit: [
    "convulses violently, expelling the excess in a grotesque display.",
    "retches and heaves, its form rejecting what it cannot contain.",
    "spasms uncontrollably as corruption seeps from every orifice.",
  ],
  // Insanity narrative fallbacks (Requirement 10.7)
  insanity_whispers: [
    "hears voices that aren't there, whispering secrets from the void.",
    "listens to whispers from beyond, its eyes darting to unseen speakers.",
    "catches fragments of impossible conversations echoing in its mind.",
  ],
  insanity_shadows: [
    "sees shapes moving in the corners, shadows that shouldn't exist.",
    "watches shadows that move against the light, reaching toward it.",
    "glimpses figures that vanish when observed, leaving only dread.",
  ],
  insanity_glitch: [
    "reality flickers and distorts around it, fragments of existence stuttering.",
    "the world stutters and skips, moments repeating in broken loops.",
    "existence momentarily fragments, pieces of reality sliding apart.",
  ],
  insanity_inversion: [
    "everything feels wrong, inverted, as if the world turned inside out.",
    "up becomes down, light becomes dark, nothing makes sense anymore.",
    "the world turns inside out, familiar things becoming alien and wrong.",
  ],
  // Haunt narrative fallbacks (Requirement 4.7)
  haunt: [
    "senses a familiar presence stirring in the shadows, watching from beyond.",
    "feels the air grow cold with memories of the departed.",
    "perceives something watching from beyond the veil, a spirit that lingers.",
  ],
};

type EventType = keyof typeof FALLBACK_MESSAGES;

/**
 * Get a random fallback message for an event type
 */
function getFallbackMessage(eventType: EventType, petName: string): string {
  const messages = FALLBACK_MESSAGES[eventType];
  const message = messages[Math.floor(Math.random() * messages.length)];
  return `${petName} ${message}`;
}

interface NarrativeContext {
  petName: string;
  stage: PetStage;
  archetype: Archetype;
  sanity: number;
  corruption: number;
}

interface FeedingContext extends NarrativeContext {
  itemName: string;
  itemType: "PURITY" | "ROT";
  isOverfed: boolean;
}

interface EvolutionContext extends NarrativeContext {
  fromStage: PetStage;
  toStage: PetStage;
}

/**
 * Generate AI narrative for feeding events
 */
export async function generateFeedingNarrative(
  context: FeedingContext
): Promise<string> {
  const { petName, stage, archetype, sanity, corruption, itemName, itemType, isOverfed } = context;

  // Handle overfeeding separately
  if (isOverfed) {
    return generateOverfeedNarrative(context);
  }

  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature consumes "${itemName}" (a ${itemType.toLowerCase()} offering). Current sanity: ${sanity}%, corruption: ${corruption}%. Generate 1-2 sentences of atmospheric horror narrative describing this feeding moment.`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        temperature: 0.8,
        maxTokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.text && data.text.trim()) {
      return data.text.trim();
    }
    
    throw new Error("Empty response from AI");
  } catch (error) {
    logWarning("AI narrative generation failed, using fallback", {
      error: error instanceof Error ? error.message : "Unknown",
      eventType: `feed_${itemType.toLowerCase()}`,
    });
    
    const eventType = itemType === "PURITY" ? "feed_purity" : "feed_rot";
    return getFallbackMessage(eventType, petName);
  }
}

/**
 * Generate AI narrative for overfeeding events
 */
async function generateOverfeedNarrative(
  context: NarrativeContext
): Promise<string> {
  const { petName, stage, archetype, sanity, corruption } = context;

  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature has been overfed and is rejecting the excess. Sanity: ${sanity}%, corruption: ${corruption}%. Generate 1-2 sentences of visceral horror narrative about this rejection.`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        temperature: 0.8,
        maxTokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.text && data.text.trim()) {
      return data.text.trim();
    }
    
    throw new Error("Empty response from AI");
  } catch (error) {
    logWarning("AI narrative generation failed, using fallback", {
      error: error instanceof Error ? error.message : "Unknown",
      eventType: "overfeed",
    });
    
    return getFallbackMessage("overfeed", petName);
  }
}

/**
 * Generate AI narrative for evolution events
 */
export async function generateEvolutionNarrative(
  context: EvolutionContext
): Promise<string> {
  const { petName, archetype, sanity, corruption, fromStage, toStage } = context;

  const isHatching = fromStage === "EGG";
  
  const prompt = isHatching
    ? `${petName} the ${archetype.toLowerCase()} creature hatches from its egg, emerging as a ${toStage.toLowerCase()}. Generate 1-2 sentences of atmospheric horror narrative about this birth.`
    : `${petName} the ${archetype.toLowerCase()} creature evolves from ${fromStage.toLowerCase()} to ${toStage.toLowerCase()}. Sanity: ${sanity}%, corruption: ${corruption}%. Generate 1-2 sentences of body-horror narrative about this transformation.`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        temperature: 0.8,
        maxTokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.text && data.text.trim()) {
      return data.text.trim();
    }
    
    throw new Error("Empty response from AI");
  } catch (error) {
    logWarning("AI narrative generation failed, using fallback", {
      error: error instanceof Error ? error.message : "Unknown",
      eventType: isHatching ? "hatch" : "evolution",
    });
    
    const eventType = isHatching ? "hatch" : "evolution";
    return getFallbackMessage(eventType, petName);
  }
}

/**
 * Generate placeholder text shown while AI is loading
 */
export function getPlaceholderText(
  eventType: "feed" | "overfeed" | "evolution" | "hatch" | "placate" | "vomit" | "insanity",
  petName: string
): string {
  switch (eventType) {
    case "feed":
      return `${petName} consumes the offering...`;
    case "overfeed":
      return `${petName} struggles with the excess...`;
    case "evolution":
      return `${petName} begins to transform...`;
    case "hatch":
      return `${petName} stirs within the egg...`;
    case "placate":
      return `${petName} responds to your comfort...`;
    case "vomit":
      return `${petName} convulses violently...`;
    case "insanity":
      return `${petName} perceives something disturbing...`;
    default:
      return `${petName}...`;
  }
}

// ============================================
// Death Narrative Generation (Requirements 2.1, 2.2, 2.5)
// ============================================

interface DeathContext {
  petName: string;
  archetype: Archetype;
  stage: PetStage;
  age: number;
  cause: DeathCause;
  sanity?: number;
  corruption?: number;
}

interface EpitaphContext {
  petName: string;
  archetype: Archetype;
  stage: PetStage;
  age: number;
  cause: DeathCause;
}

/**
 * Generate AI death narrative describing the pet's final moments.
 * Returns fallback message on failure.
 * 
 * Requirement 2.1, 2.5
 */
export async function generateDeathNarrative(context: DeathContext): Promise<string> {
  const { petName, archetype, stage, age, cause, sanity = 0, corruption = 0 } = context;

  const causeDescription = cause === "STARVATION" 
    ? "starved to death from neglect" 
    : "lost its mind to insanity";

  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature has ${causeDescription}. Age: ${age} minutes, final sanity: ${sanity}%, corruption: ${corruption}%. Generate 2-3 sentences of somber, atmospheric horror narrative describing this creature's final moments and passing.`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        temperature: 0.7,
        maxTokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.text && data.text.trim()) {
      return data.text.trim();
    }
    
    throw new Error("Empty response from AI");
  } catch (error) {
    logWarning("AI death narrative generation failed, using fallback", {
      error: error instanceof Error ? error.message : "Unknown",
      cause,
    });
    
    const eventType = cause === "STARVATION" ? "death_starvation" : "death_insanity";
    return getFallbackMessage(eventType as EventType, petName);
  }
}

/**
 * Generate AI epitaph summarizing the pet's life.
 * Returns fallback epitaph on failure.
 * 
 * Requirement 2.2
 */
export async function generateEpitaph(context: EpitaphContext): Promise<string> {
  const { petName, archetype, stage, age, cause } = context;

  // Convert age to more readable format
  const hours = Math.floor(age / 60);
  const minutes = age % 60;
  const ageString = hours > 0 
    ? `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`
    : `${minutes} minute${minutes !== 1 ? 's' : ''}`;

  const prompt = `Write a brief, poetic epitaph (1-2 sentences) for ${petName}, a ${archetype.toLowerCase()} creature who reached the ${stage.toLowerCase()} stage and lived for ${ageString} before dying of ${cause.toLowerCase()}. Make it somber and memorable.`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        temperature: 0.7,
        maxTokens: 80,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.text && data.text.trim()) {
      return data.text.trim();
    }
    
    throw new Error("Empty response from AI");
  } catch (error) {
    logWarning("AI epitaph generation failed, using fallback", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    
    // Fallback epitaph
    return `Here lies ${petName}, a ${archetype.toLowerCase()} soul who reached ${stage.toLowerCase()} stage. Gone but not forgotten.`;
  }
}

// ============================================
// Placate Narrative Generation (Requirements 6.5, 6.8)
// ============================================

interface PlacateContext {
  petName: string;
  archetype: Archetype;
  stage: PetStage;
  sanity: number;
  corruption: number;
}

/**
 * Generate AI placate narrative based on pet archetype.
 * Returns fallback message on failure.
 * 
 * Requirement 6.5, 6.8
 */
export async function generatePlacateNarrative(context: PlacateContext): Promise<string> {
  const { petName, archetype, stage, sanity, corruption } = context;

  // Archetype-specific comfort descriptions
  const archetypeDescriptions: Record<Archetype, string> = {
    GLOOM: "responds to the darkness within your comfort, finding solace in shared shadows",
    SPARK: "brightens momentarily at your touch, its inner light flickering with renewed hope",
    ECHO: "resonates with your presence, its form rippling with the echoes of your care",
  };

  const archetypeDesc = archetypeDescriptions[archetype];

  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature ${archetypeDesc}. Current sanity: ${sanity}%, corruption: ${corruption}%. Generate 1-2 sentences of atmospheric narrative describing how this creature responds to being comforted. Match the ${archetype.toLowerCase()} archetype's personality.`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        temperature: 0.8,
        maxTokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.text && data.text.trim()) {
      return data.text.trim();
    }
    
    throw new Error("Empty response from AI");
  } catch (error) {
    logWarning("AI placate narrative generation failed, using fallback", {
      error: error instanceof Error ? error.message : "Unknown",
      archetype,
    });
    
    return getFallbackMessage("placate", petName);
  }
}

// ============================================
// Vomit Narrative Generation (Requirements 9.3, 9.5)
// ============================================

interface VomitContext {
  petName: string;
  archetype: Archetype;
  stage: PetStage;
  sanity: number;
  corruption: number;
}

/**
 * Generate AI vomit narrative for overfeeding events.
 * Returns fallback message on failure.
 * 
 * Requirement 9.3, 9.5
 */
export async function generateVomitNarrative(context: VomitContext): Promise<string> {
  const { petName, archetype, stage, sanity, corruption } = context;

  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature has been overfed and is violently rejecting the excess. Sanity: ${sanity}%, corruption: ${corruption}%. Generate 1-2 sentences of visceral, grotesque horror narrative describing this creature vomiting and expelling what it cannot contain. Be disturbing but not gratuitous.`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        temperature: 0.8,
        maxTokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.text && data.text.trim()) {
      return data.text.trim();
    }
    
    throw new Error("Empty response from AI");
  } catch (error) {
    logWarning("AI vomit narrative generation failed, using fallback", {
      error: error instanceof Error ? error.message : "Unknown",
      archetype,
    });
    
    return getFallbackMessage("vomit", petName);
  }
}

// ============================================
// Insanity Narrative Generation (Requirements 10.5, 10.7)
// ============================================

import type { InsanityEventType } from "./types";

interface InsanityContext {
  petName: string;
  archetype: Archetype;
  stage: PetStage;
  sanity: number;
  corruption: number;
  eventType: InsanityEventType;
}

/**
 * Generate AI insanity narrative for hallucination events.
 * Returns fallback message on failure.
 * 
 * Requirement 10.5, 10.7
 */
// ============================================
// Haunt Narrative Generation (Requirements 4.4, 4.7)
// ============================================

interface HauntContext {
  petName: string;
  archetype: Archetype;
  stage: PetStage;
  sanity: number;
  corruption: number;
  ghostName: string;
  ghostArchetype: Archetype;
  ghostStage: PetStage;
  ghostDeathCause: string;
}

/**
 * Generate AI haunt narrative referencing the ghost's name and traits.
 * Returns fallback message on failure.
 * 
 * Requirement 4.4, 4.7
 */
export async function generateHauntNarrative(context: HauntContext): Promise<string> {
  const { petName, archetype, stage, sanity, corruption, ghostName, ghostArchetype, ghostStage, ghostDeathCause } = context;

  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature is being haunted by the ghost of ${ghostName}, a ${ghostArchetype.toLowerCase()} creature who died as a ${ghostStage.toLowerCase()} from ${ghostDeathCause.toLowerCase()}. Current sanity: ${sanity}%, corruption: ${corruption}%. Generate 1-2 sentences of atmospheric horror narrative describing this haunting encounter. Reference the ghost's presence and how it affects ${petName}.`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        temperature: 0.8,
        maxTokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.text && data.text.trim()) {
      return data.text.trim();
    }
    
    throw new Error("Empty response from AI");
  } catch (error) {
    logWarning("AI haunt narrative generation failed, using fallback", {
      error: error instanceof Error ? error.message : "Unknown",
      ghostName,
    });
    
    // Fallback message referencing the ghost's name (Requirement 4.7)
    return getHauntFallbackMessage(petName, ghostName);
  }
}

/**
 * Get a haunt fallback message that references the ghost's name
 * Requirement 4.7
 */
function getHauntFallbackMessage(petName: string, ghostName: string): string {
  const messages = FALLBACK_MESSAGES.haunt;
  const baseMessage = messages[Math.floor(Math.random() * messages.length)];
  // Append ghost reference to the fallback message
  return `${petName} ${baseMessage} The spirit of ${ghostName} draws near.`;
}

export async function generateInsanityNarrative(context: InsanityContext): Promise<string> {
  const { petName, archetype, stage, sanity, corruption, eventType } = context;

  // Event type descriptions for the AI prompt
  const eventDescriptions: Record<InsanityEventType, string> = {
    WHISPERS: "hearing whispers and voices from nowhere, fragments of impossible conversations",
    SHADOWS: "seeing shadows moving on their own, dark shapes that shouldn't exist",
    GLITCH: "experiencing reality glitching and fragmenting, moments stuttering and repeating",
    INVERSION: "perceiving everything as inverted and wrong, the world turned inside out",
  };

  const eventDesc = eventDescriptions[eventType];

  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature is experiencing a moment of insanity: ${eventDesc}. Sanity: ${sanity}%, corruption: ${corruption}%. Generate 1-2 sentences of atmospheric horror narrative describing this hallucination or disturbing perception. Match the ${eventType.toLowerCase()} theme.`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        temperature: 0.9,
        maxTokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.text && data.text.trim()) {
      return data.text.trim();
    }
    
    throw new Error("Empty response from AI");
  } catch (error) {
    logWarning("AI insanity narrative generation failed, using fallback", {
      error: error instanceof Error ? error.message : "Unknown",
      eventType,
    });
    
    // Select fallback based on event type
    const fallbackKey = `insanity_${eventType.toLowerCase()}` as EventType;
    return getFallbackMessage(fallbackKey, petName);
  }
}
