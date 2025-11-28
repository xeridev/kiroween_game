/**
 * AI Narrative Generator
 * Generates contextual horror narrative text for game events
 */

import { logWarning } from "./errorLogger";
import type { Archetype, PetStage } from "./types";

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
  eventType: "feed" | "overfeed" | "evolution" | "hatch",
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
    default:
      return `${petName}...`;
  }
}
