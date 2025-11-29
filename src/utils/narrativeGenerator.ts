/**
 * AI Narrative Generator
 * Generates contextual horror narrative text for game events
 */

import { logWarning } from "./errorLogger";
import type { Archetype, PetStage, ReactionData, ToneInfluence, NarrativeLog, NarrativeContext, EventType } from "./types";
import { REACTION_TONE_KEYWORDS } from "./types";

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

type FallbackEventType = keyof typeof FALLBACK_MESSAGES;

/**
 * Get a random fallback message for an event type
 */
function getFallbackMessage(eventType: FallbackEventType, petName: string): string {
  const messages = FALLBACK_MESSAGES[eventType];
  const message = messages[Math.floor(Math.random() * messages.length)];
  return `${petName} ${message}`;
}

// ============================================
// Tone Influence Helper Functions (Requirements 3.2, 3.5)
// ============================================

/**
 * Map reaction data to tone keywords for AI context.
 * Requirements 3.2, 10.3
 */
export function mapReactionsToToneKeywords(reactions: ReactionData[]): ToneInfluence {
  try {
    return reactions.map(reaction => REACTION_TONE_KEYWORDS[reaction.reactionType]);
  } catch (error) {
    // Requirement 10.3: Graceful degradation - return empty array on failure
    logWarning("Failed to map reactions to tone keywords", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return [];
  }
}

/**
 * Deduplicate tone keywords to avoid repetition in AI prompts.
 * Requirements 3.5, 10.3
 */
export function deduplicateToneKeywords(keywords: ToneInfluence): ToneInfluence {
  try {
    return Array.from(new Set(keywords));
  } catch (error) {
    // Requirement 10.3: Graceful degradation - return original array on failure
    logWarning("Failed to deduplicate tone keywords", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return keywords; // Return original keywords if deduplication fails
  }
}

/**
 * Build tone context string for AI prompts.
 * Returns empty string if no tone influence.
 * Requirements 3.3, 3.4, 10.3
 */
function buildToneContext(toneInfluence?: ToneInfluence): string {
  try {
    if (!toneInfluence || toneInfluence.length === 0) {
      return "";
    }
    
    const uniqueKeywords = deduplicateToneKeywords(toneInfluence);
    const keywordList = uniqueKeywords.join(", ");
    return ` The player recently showed ${keywordList} reactions.`;
  } catch (error) {
    // Requirement 10.3: Graceful degradation - return empty string on failure
    logWarning("Failed to build tone context", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return ""; // Continue without tone influence
  }
}

// ============================================
// Memory System Helper Functions (Requirements 5.1, 5.2, 5.3, 5.4, 13.1, 13.2)
// ============================================

// Cache for narrative context (Requirement 13.3)
interface ContextCache {
  context: NarrativeContext;
  timestamp: number;
  logIds: string; // Hash of log IDs for cache invalidation
}

let narrativeContextCache: ContextCache | null = null;
const CONTEXT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for key events extraction (Requirement 13.3)
interface KeyEventsCache {
  events: Array<{ type: EventType; text: string; age: number }>;
  timestamp: number;
  logIds: string;
}

let keyEventsCache: KeyEventsCache | null = null;

/**
 * Generate a hash of log IDs for cache invalidation.
 * Uses shallow comparison of log array.
 */
function generateLogHash(logs: NarrativeLog[]): string {
  return logs.map(log => log.id).join(',');
}

/**
 * Extract key events from narrative logs with memoization.
 * Identifies significant events by eventType and formats them with age/timestamp.
 * 
 * Requirements 5.2, 13.3, 13.4
 */
export function extractKeyEvents(logs: NarrativeLog[]): Array<{ type: EventType; text: string; age: number }> {
  try {
    const logHash = generateLogHash(logs);
    const now = Date.now();
    
    // Check cache (Requirement 13.3)
    if (keyEventsCache && 
        keyEventsCache.logIds === logHash && 
        now - keyEventsCache.timestamp < CONTEXT_CACHE_DURATION) {
      return keyEventsCache.events;
    }
    
    const keyEventTypes: EventType[] = ["evolution", "death", "placate", "haunt", "insanity", "vomit"];
    
    const keyEvents = logs
      .filter(log => log.eventType && keyEventTypes.includes(log.eventType))
      .map(log => ({
        type: log.eventType as EventType,
        text: log.text,
        age: log.timestamp,
      }));
    
    // Update cache
    keyEventsCache = {
      events: keyEvents,
      timestamp: now,
      logIds: logHash,
    };
    
    return keyEvents;
  } catch (error) {
    logWarning("Failed to extract key events", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return [];
  }
}

/**
 * Build narrative context from recent logs for AI continuity with caching.
 * Retrieves last 5 log entries, extracts key events, and builds context string.
 * 
 * Requirements 5.1, 5.2, 5.3, 5.4, 13.1, 13.2, 13.3, 13.4
 */
export function buildNarrativeContext(
  logs: NarrativeLog[],
  currentStats: { sanity: number; corruption: number },
  previousStats?: { sanity: number; corruption: number }
): NarrativeContext {
  try {
    // Retrieve last 5 log entries (Requirement 5.1, 13.1)
    // For performance, only process recent entries if there are >100 logs (Requirement 13.4)
    const recentLogs = logs.length > 100 ? logs.slice(-5) : logs.slice(-5);
    
    const logHash = generateLogHash(recentLogs);
    const now = Date.now();
    
    // Check cache (Requirement 13.3)
    if (narrativeContextCache && 
        narrativeContextCache.logIds === logHash && 
        now - narrativeContextCache.timestamp < CONTEXT_CACHE_DURATION) {
      // Update stat changes even if using cached context
      const cachedContext = narrativeContextCache.context;
      const statChanges = previousStats
        ? {
            sanity: currentStats.sanity - previousStats.sanity,
            corruption: currentStats.corruption - previousStats.corruption,
          }
        : { sanity: 0, corruption: 0 };
      
      return {
        ...cachedContext,
        statChanges,
      };
    }
    
    // Extract key events (Requirement 5.2) - uses memoization
    const keyEvents = extractKeyEvents(recentLogs);
    
    // Calculate stat changes since last narrative (Requirement 5.4)
    const statChanges = previousStats
      ? {
          sanity: currentStats.sanity - previousStats.sanity,
          corruption: currentStats.corruption - previousStats.corruption,
        }
      : { sanity: 0, corruption: 0 };
    
    // Calculate time elapsed (Requirement 5.5)
    const timeElapsed = recentLogs.length > 0
      ? recentLogs[recentLogs.length - 1].timestamp - (recentLogs[0]?.timestamp || 0)
      : 0;
    
    const context: NarrativeContext = {
      recentLogs,
      keyEvents,
      statChanges,
      timeElapsed,
    };
    
    // Update cache
    narrativeContextCache = {
      context,
      timestamp: now,
      logIds: logHash,
    };
    
    return context;
  } catch (error) {
    logWarning("Failed to build narrative context", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    // Return empty context on failure
    return {
      recentLogs: [],
      keyEvents: [],
      statChanges: { sanity: 0, corruption: 0 },
      timeElapsed: 0,
    };
  }
}

/**
 * Format narrative context into a string for AI prompts.
 * Limits context to 2000 characters, truncating older entries first.
 * 
 * Requirements 5.1, 5.2, 5.3, 5.4, 13.1, 13.2
 */
export function formatNarrativeContextString(context: NarrativeContext): string {
  try {
    let contextString = "";
    
    // Add key events if present (Requirement 5.2)
    if (context.keyEvents.length > 0) {
      contextString += "Recent significant events:\n";
      for (const event of context.keyEvents) {
        contextString += `- At age ${event.age} minutes: ${event.text}\n`;
      }
      contextString += "\n";
    }
    
    // Add stat changes if significant (Requirement 5.4)
    if (Math.abs(context.statChanges.sanity) > 20) {
      contextString += `Sanity has changed significantly (${context.statChanges.sanity > 0 ? '+' : ''}${context.statChanges.sanity}).\n`;
    }
    if (Math.abs(context.statChanges.corruption) > 20) {
      contextString += `Corruption has changed significantly (${context.statChanges.corruption > 0 ? '+' : ''}${context.statChanges.corruption}).\n`;
    }
    
    // Add time passage if significant (Requirement 5.5)
    if (context.timeElapsed > 24 * 60) { // More than 24 game hours
      const hours = Math.floor(context.timeElapsed / 60);
      contextString += `${hours} hours have passed since the last event.\n`;
    }
    
    // Add recent narrative excerpts
    if (context.recentLogs.length > 0) {
      contextString += "\nRecent narrative:\n";
      for (const log of context.recentLogs) {
        // Truncate long narratives to save space
        const truncatedText = log.text.length > 100 
          ? log.text.substring(0, 100) + "..."
          : log.text;
        contextString += `- ${truncatedText}\n`;
      }
    }
    
    // Truncate if exceeds 2000 characters (Requirements 13.1, 13.2)
    if (contextString.length > 2000) {
      contextString = contextString.substring(0, 2000) + "...";
    }
    
    return contextString;
  } catch (error) {
    logWarning("Failed to format narrative context string", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return "";
  }
}

interface BaseNarrativeContext {
  petName: string;
  stage: PetStage;
  archetype: Archetype;
  sanity: number;
  corruption: number;
}

interface FeedingContext extends BaseNarrativeContext {
  itemName: string;
  itemType: "PURITY" | "ROT";
  isOverfed: boolean;
}

interface EvolutionContext extends BaseNarrativeContext {
  fromStage: PetStage;
  toStage: PetStage;
}

/**
 * Generate AI narrative for feeding events
 * Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
export async function generateFeedingNarrative(
  context: FeedingContext,
  toneInfluence?: ToneInfluence,
  memoryContext?: NarrativeContext
): Promise<string> {
  const { petName, stage, archetype, sanity, corruption, itemName, itemType, isOverfed } = context;

  // Handle overfeeding separately
  if (isOverfed) {
    return generateOverfeedNarrative(context, toneInfluence, memoryContext);
  }

  const toneContext = buildToneContext(toneInfluence);
  const memoryContextString = memoryContext ? formatNarrativeContextString(memoryContext) : "";
  
  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature consumes "${itemName}" (a ${itemType.toLowerCase()} offering). Current sanity: ${sanity}%, corruption: ${corruption}%.${toneContext}${memoryContextString ? `\n\nContext:\n${memoryContextString}` : ""} Generate 1-2 sentences of atmospheric horror narrative describing this feeding moment.`;

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
 * Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
async function generateOverfeedNarrative(
  context: BaseNarrativeContext,
  toneInfluence?: ToneInfluence,
  memoryContext?: NarrativeContext
): Promise<string> {
  const { petName, stage, archetype, sanity, corruption } = context;

  const toneContext = buildToneContext(toneInfluence);
  const memoryContextString = memoryContext ? formatNarrativeContextString(memoryContext) : "";
  
  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature has been overfed and is rejecting the excess. Sanity: ${sanity}%, corruption: ${corruption}%.${toneContext}${memoryContextString ? `\n\nContext:\n${memoryContextString}` : ""} Generate 1-2 sentences of visceral horror narrative about this rejection.`;

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
 * Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
export async function generateEvolutionNarrative(
  context: EvolutionContext,
  toneInfluence?: ToneInfluence,
  memoryContext?: NarrativeContext
): Promise<string> {
  const { petName, archetype, sanity, corruption, fromStage, toStage } = context;

  const isHatching = fromStage === "EGG";
  const toneContext = buildToneContext(toneInfluence);
  const memoryContextString = memoryContext ? formatNarrativeContextString(memoryContext) : "";
  
  const prompt = isHatching
    ? `${petName} the ${archetype.toLowerCase()} creature hatches from its egg, emerging as a ${toStage.toLowerCase()}.${toneContext}${memoryContextString ? `\n\nContext:\n${memoryContextString}` : ""} Generate 1-2 sentences of atmospheric horror narrative about this birth.`
    : `${petName} the ${archetype.toLowerCase()} creature evolves from ${fromStage.toLowerCase()} to ${toStage.toLowerCase()}. Sanity: ${sanity}%, corruption: ${corruption}%.${toneContext}${memoryContextString ? `\n\nContext:\n${memoryContextString}` : ""} Generate 1-2 sentences of body-horror narrative about this transformation.`;

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
export async function generateDeathNarrative(
  context: DeathContext,
  toneInfluence?: ToneInfluence
): Promise<string> {
  const { petName, archetype, stage, age, cause, sanity = 0, corruption = 0 } = context;

  const causeDescription = cause === "STARVATION" 
    ? "starved to death from neglect" 
    : "lost its mind to insanity";

  const toneContext = buildToneContext(toneInfluence);
  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature has ${causeDescription}. Age: ${age} minutes, final sanity: ${sanity}%, corruption: ${corruption}%.${toneContext} Generate 2-3 sentences of somber, atmospheric horror narrative describing this creature's final moments and passing.`;

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
    return getFallbackMessage(eventType as FallbackEventType, petName);
  }
}

/**
 * Generate AI epitaph summarizing the pet's life.
 * Returns fallback epitaph on failure.
 * 
 * Requirement 2.2
 */
export async function generateEpitaph(
  context: EpitaphContext,
  toneInfluence?: ToneInfluence
): Promise<string> {
  const { petName, archetype, stage, age, cause } = context;

  // Convert age to more readable format
  const hours = Math.floor(age / 60);
  const minutes = age % 60;
  const ageString = hours > 0 
    ? `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`
    : `${minutes} minute${minutes !== 1 ? 's' : ''}`;

  const toneContext = buildToneContext(toneInfluence);
  const prompt = `Write a brief, poetic epitaph (1-2 sentences) for ${petName}, a ${archetype.toLowerCase()} creature who reached the ${stage.toLowerCase()} stage and lived for ${ageString} before dying of ${cause.toLowerCase()}.${toneContext} Make it somber and memorable.`;

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
 * Requirements 6.5, 6.8, 5.1, 5.2, 5.3, 5.4, 5.5
 */
export async function generatePlacateNarrative(
  context: PlacateContext,
  toneInfluence?: ToneInfluence,
  memoryContext?: NarrativeContext
): Promise<string> {
  const { petName, archetype, stage, sanity, corruption } = context;

  // Archetype-specific comfort descriptions
  const archetypeDescriptions: Record<Archetype, string> = {
    GLOOM: "responds to the darkness within your comfort, finding solace in shared shadows",
    SPARK: "brightens momentarily at your touch, its inner light flickering with renewed hope",
    ECHO: "resonates with your presence, its form rippling with the echoes of your care",
  };

  const archetypeDesc = archetypeDescriptions[archetype];
  const toneContext = buildToneContext(toneInfluence);
  const memoryContextString = memoryContext ? formatNarrativeContextString(memoryContext) : "";

  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature ${archetypeDesc}. Current sanity: ${sanity}%, corruption: ${corruption}%.${toneContext}${memoryContextString ? `\n\nContext:\n${memoryContextString}` : ""} Generate 1-2 sentences of atmospheric narrative describing how this creature responds to being comforted. Match the ${archetype.toLowerCase()} archetype's personality.`;

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
 * Requirements 9.3, 9.5, 5.1, 5.2, 5.3, 5.4, 5.5
 */
export async function generateVomitNarrative(
  context: VomitContext,
  toneInfluence?: ToneInfluence,
  memoryContext?: NarrativeContext
): Promise<string> {
  const { petName, archetype, stage, sanity, corruption } = context;

  const toneContext = buildToneContext(toneInfluence);
  const memoryContextString = memoryContext ? formatNarrativeContextString(memoryContext) : "";
  
  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature has been overfed and is violently rejecting the excess. Sanity: ${sanity}%, corruption: ${corruption}%.${toneContext}${memoryContextString ? `\n\nContext:\n${memoryContextString}` : ""} Generate 1-2 sentences of visceral, grotesque horror narrative describing this creature vomiting and expelling what it cannot contain. Be disturbing but not gratuitous.`;

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
 * Requirements 10.5, 10.7, 5.1, 5.2, 5.3, 5.4, 5.5
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
 * Requirements 4.4, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5
 */
export async function generateHauntNarrative(
  context: HauntContext,
  toneInfluence?: ToneInfluence,
  memoryContext?: NarrativeContext
): Promise<string> {
  const { petName, archetype, stage, sanity, corruption, ghostName, ghostArchetype, ghostStage, ghostDeathCause } = context;

  const toneContext = buildToneContext(toneInfluence);
  const memoryContextString = memoryContext ? formatNarrativeContextString(memoryContext) : "";
  
  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature is being haunted by the ghost of ${ghostName}, a ${ghostArchetype.toLowerCase()} creature who died as a ${ghostStage.toLowerCase()} from ${ghostDeathCause.toLowerCase()}. Current sanity: ${sanity}%, corruption: ${corruption}%.${toneContext}${memoryContextString ? `\n\nContext:\n${memoryContextString}` : ""} Generate 1-2 sentences of atmospheric horror narrative describing this haunting encounter. Reference the ghost's presence and how it affects ${petName}.`;

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

export async function generateInsanityNarrative(
  context: InsanityContext,
  toneInfluence?: ToneInfluence,
  memoryContext?: NarrativeContext
): Promise<string> {
  const { petName, archetype, stage, sanity, corruption, eventType } = context;

  // Event type descriptions for the AI prompt
  const eventDescriptions: Record<InsanityEventType, string> = {
    WHISPERS: "hearing whispers and voices from nowhere, fragments of impossible conversations",
    SHADOWS: "seeing shadows moving on their own, dark shapes that shouldn't exist",
    GLITCH: "experiencing reality glitching and fragmenting, moments stuttering and repeating",
    INVERSION: "perceiving everything as inverted and wrong, the world turned inside out",
  };

  const eventDesc = eventDescriptions[eventType];
  const toneContext = buildToneContext(toneInfluence);
  const memoryContextString = memoryContext ? formatNarrativeContextString(memoryContext) : "";

  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature is experiencing a moment of insanity: ${eventDesc}. Sanity: ${sanity}%, corruption: ${corruption}%.${toneContext}${memoryContextString ? `\n\nContext:\n${memoryContextString}` : ""} Generate 1-2 sentences of atmospheric horror narrative describing this hallucination or disturbing perception. Match the ${eventType.toLowerCase()} theme.`;

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
    const fallbackKey = `insanity_${eventType.toLowerCase()}` as FallbackEventType;
    return getFallbackMessage(fallbackKey, petName);
  }
}

// ============================================
// Dialogue Choice Generation (Requirements 6.1, 6.2)
// ============================================

interface DialogueChoiceContext {
  petName: string;
  archetype: Archetype;
  stage: PetStage;
  sanity: number;
  corruption: number;
  eventType: EventType;
  narrativeText: string;
}

// Cache for dialogue choices (Requirement 6.1)
interface DialogueChoiceCache {
  choices: import("./types").DialogueChoice[];
  timestamp: number;
  contextHash: string;
}

let dialogueChoiceCache: DialogueChoiceCache | null = null;
const DIALOGUE_CACHE_DURATION = 60 * 1000; // 60 seconds

/**
 * Generate a hash for dialogue choice context to enable caching.
 */
function generateDialogueContextHash(context: DialogueChoiceContext): string {
  return `${context.petName}-${context.eventType}-${context.narrativeText.substring(0, 50)}`;
}

/**
 * Generate dialogue choices for a narrative event with caching.
 * Returns null if the 30% probability check fails.
 * Returns 2-3 dialogue options with emotional tones and stat deltas.
 * 
 * Requirements 6.1, 6.2
 * Performance: Caches choices for 60s (Requirement 6.1)
 */
export async function generateDialogueChoices(
  context: DialogueChoiceContext
): Promise<import("./types").DialogueChoice[] | null> {
  // 30% probability check (Requirement 6.1)
  if (Math.random() > 0.3) {
    return null;
  }

  const contextHash = generateDialogueContextHash(context);
  const now = Date.now();

  // Check cache (Requirement 6.1)
  if (dialogueChoiceCache && 
      dialogueChoiceCache.contextHash === contextHash && 
      now - dialogueChoiceCache.timestamp < DIALOGUE_CACHE_DURATION) {
    return dialogueChoiceCache.choices;
  }

  const { petName, archetype, stage, sanity, corruption, eventType, narrativeText } = context;

  const prompt = `${petName} the ${stage.toLowerCase()} ${archetype.toLowerCase()} creature just experienced: "${narrativeText}"

Current state: Sanity ${sanity}%, Corruption ${corruption}%

Generate 2-3 dialogue response options for the player. Each option should:
- Be brief (max 50 characters)
- Have a clear emotional tone: "comforting", "fearful", "loving", or "neutral"
- Suggest appropriate stat changes (sanity and/or corruption)

Format as JSON array:
[
  {
    "text": "response text",
    "emotionalTone": "comforting",
    "statDelta": { "sanity": 2 }
  },
  ...
]`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        temperature: 0.8,
        maxTokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.text || !data.text.trim()) {
      throw new Error("Empty response from AI");
    }

    // Parse JSON response
    const jsonMatch = data.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const choices = JSON.parse(jsonMatch[0]);
    
    // Validate and transform choices
    const validatedChoices: import("./types").DialogueChoice[] = choices
      .slice(0, 3) // Max 3 choices
      .map((choice: any, _index: number) => ({
        id: crypto.randomUUID(),
        text: choice.text?.substring(0, 50) || "...",
        emotionalTone: ["comforting", "fearful", "loving", "neutral"].includes(choice.emotionalTone)
          ? choice.emotionalTone
          : "neutral",
        statDelta: {
          sanity: typeof choice.statDelta?.sanity === "number" ? choice.statDelta.sanity : 0,
          corruption: typeof choice.statDelta?.corruption === "number" ? choice.statDelta.corruption : 0,
        },
      }));

    // Ensure we have at least 2 choices
    if (validatedChoices.length < 2) {
      throw new Error("Not enough valid choices generated");
    }

    // Update cache
    dialogueChoiceCache = {
      choices: validatedChoices,
      timestamp: now,
      contextHash,
    };

    return validatedChoices;
  } catch (error) {
    logWarning("AI dialogue choice generation failed, using fallback", {
      error: error instanceof Error ? error.message : "Unknown",
      eventType,
    });
    
    // Fallback: Generate default choices based on event type
    const fallbackChoices = generateFallbackDialogueChoices(petName, eventType);
    
    // Cache fallback choices too
    dialogueChoiceCache = {
      choices: fallbackChoices,
      timestamp: now,
      contextHash,
    };
    
    return fallbackChoices;
  }
}

/**
 * Generate fallback dialogue choices when AI generation fails.
 * Returns 2-3 default choices based on event type.
 */
function generateFallbackDialogueChoices(
  petName: string,
  _eventType: EventType
): import("./types").DialogueChoice[] {
  const baseChoices: import("./types").DialogueChoice[] = [
    {
      id: crypto.randomUUID(),
      text: `It's okay, ${petName}...`,
      emotionalTone: "comforting",
      statDelta: { sanity: 2 },
    },
    {
      id: crypto.randomUUID(),
      text: "What's happening?!",
      emotionalTone: "fearful",
      statDelta: { sanity: -2, corruption: 1 },
    },
    {
      id: crypto.randomUUID(),
      text: `I'm here for you, ${petName}`,
      emotionalTone: "loving",
      statDelta: { sanity: 3, corruption: -1 },
    },
  ];

  // Return 2-3 random choices
  const shuffled = baseChoices.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2 + Math.floor(Math.random() * 2)); // 2 or 3 choices
}
