import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { PetStage, Archetype, ItemType, SoundCategory } from "../src/utils/types";

// ============================================================================
// Types
// ============================================================================

export interface SoundSelectionRequest {
  eventType: "feed" | "scavenge" | "evolution" | "sanity_change" | "ambient";
  context: {
    petName: string;
    stage: PetStage;
    archetype: Archetype;
    itemType?: ItemType;
    sanity: number;
    corruption: number;
    narrativeText?: string;
  };
}

export interface SoundSelectionResponse {
  primarySound: string;
  secondarySounds?: string[];
  ambientSound?: string;
  volume: number;
  cached: boolean;
}

// ============================================================================
// Cache Implementation (Requirements 8.1, 8.2, 8.3)
// ============================================================================

interface CacheEntry {
  response: SoundSelectionResponse;
  timestamp: number;
  hitCount: number;
}

const soundCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 100;

/**
 * Generate deterministic cache key by bucketing sanity/corruption
 */
export function getCacheKey(request: SoundSelectionRequest): string {
  return JSON.stringify({
    eventType: request.eventType,
    stage: request.context.stage,
    archetype: request.context.archetype,
    itemType: request.context.itemType,
    sanityBucket: Math.floor(request.context.sanity / 10) * 10,
    corruptionBucket: Math.floor(request.context.corruption / 20) * 20,
  });
}

function getCachedResponse(key: string): SoundSelectionResponse | null {
  const entry = soundCache.get(key);
  if (entry) {
    entry.hitCount++;
    return { ...entry.response, cached: true };
  }
  return null;
}

function setCachedResponse(key: string, response: SoundSelectionResponse): void {
  // Evict oldest entries if cache is full
  if (soundCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = soundCache.keys().next().value;
    if (oldestKey) {
      soundCache.delete(oldestKey);
    }
  }
  
  soundCache.set(key, {
    response: { ...response, cached: false },
    timestamp: Date.now(),
    hitCount: 0,
  });
}

// ============================================================================
// Fallback Sound Selection (Requirements 3.4, 3.5)
// ============================================================================

const FALLBACK_SOUNDS = {
  feed: {
    PURITY: ["cute_a", "cute_b", "cute_c", "cute_d", "cute_e"],
    ROT: ["liquid_liquid_slosh", "liquid_bubbles", "monster_gore_wet_4", "monster_gore_mushy"],
  },
  evolution: {
    EGG: ["stinger_harmonized_tone_pleasant_but_spooky"],
    BABY: ["cute_h", "stinger_harmonized_tone_pleasant_but_spooky"],
    TEEN: ["monster_monster_growl_1", "stinger_slow_stinger"],
    ABOMINATION: ["monster_monster_roar_4", "monster_abyssal_descent", "stinger_piano_stinger_dissonent"],
  },
  sanity: {
    low: ["ambient_creepy_ambience_3", "ambient_crying_moaning_ambience_2", "ambient_drone_doom"],
    normal: ["ambient_suburban_neighborhood_morning", "ambient_rain_medium_2"],
  },
  scavenge: ["character_bag_searching", "character_box_searching", "character_woosh"],
} as const;

/**
 * Rule-based fallback selection when AI is unavailable or times out
 */
export function selectWithFallback(request: SoundSelectionRequest): SoundSelectionResponse {
  const { eventType, context } = request;
  const { stage, itemType, sanity } = context;
  
  let primarySound: string;
  let secondarySounds: string[] | undefined;
  let ambientSound: string | undefined;
  let volume = 0.7;

  switch (eventType) {
    case "feed": {
      const feedSounds = itemType === "PURITY" 
        ? FALLBACK_SOUNDS.feed.PURITY 
        : FALLBACK_SOUNDS.feed.ROT;
      primarySound = feedSounds[Math.floor(Math.random() * feedSounds.length)];
      volume = itemType === "ROT" ? 0.6 : 0.8;
      break;
    }
    
    case "evolution": {
      const evolutionSounds = FALLBACK_SOUNDS.evolution[stage];
      primarySound = evolutionSounds[0];
      const secondSound = evolutionSounds[1];
      if (secondSound) {
        secondarySounds = [secondSound];
      }
      volume = stage === "ABOMINATION" ? 0.9 : 0.7;
      break;
    }
    
    case "scavenge": {
      primarySound = FALLBACK_SOUNDS.scavenge[Math.floor(Math.random() * FALLBACK_SOUNDS.scavenge.length)];
      volume = 0.6;
      break;
    }
    
    case "sanity_change":
    case "ambient": {
      const ambientSounds = sanity < 30 
        ? FALLBACK_SOUNDS.sanity.low 
        : FALLBACK_SOUNDS.sanity.normal;
      primarySound = ambientSounds[Math.floor(Math.random() * ambientSounds.length)];
      ambientSound = primarySound;
      volume = 0.5;
      break;
    }
    
    default:
      primarySound = "cute_a";
      volume = 0.5;
  }

  // Add horror ambient for low sanity regardless of event type
  if (sanity < 30 && eventType !== "ambient" && eventType !== "sanity_change") {
    ambientSound = FALLBACK_SOUNDS.sanity.low[Math.floor(Math.random() * FALLBACK_SOUNDS.sanity.low.length)];
  }

  return {
    primarySound,
    secondarySounds,
    ambientSound,
    volume,
    cached: false,
  };
}

// ============================================================================
// AI Sound Selection
// ============================================================================

const SOUND_SELECTION_SYSTEM_PROMPT = `You are a sound designer for a dark horror pet simulator game called "Creepy Companion".
Your task is to select appropriate sounds from the game's sound catalog based on game events.

The game has these sound categories:
- ambient: Background atmosphere loops (creepy ambience, rain, mechanical sounds)
- monster: Creature sounds (growls, roars, gore, ghosts)
- cute: Positive/gentle sounds (for pure/innocent moments)
- stinger: Jump scares and dramatic transitions
- character: Player action sounds (searching, breathing, footsteps)
- household: Environmental sounds (doors, kitchen, office)
- liquid: Wet/fluid sounds (bubbles, splashing, pouring)

Sound ID format: category_descriptive_name (e.g., "monster_deepone_growl", "cute_a", "ambient_creepy_ambience_3")

Consider these factors when selecting sounds:
- eventType: What triggered the sound need (feed, evolution, scavenge, sanity_change, ambient)
- stage: Pet's life stage (EGG, BABY, TEEN, ABOMINATION) - later stages are more horrific
- archetype: Pet personality (GLOOM=dark/sad, SPARK=energetic/chaotic, ECHO=mysterious/ethereal)
- itemType: For feeding - PURITY items are wholesome, ROT items are disturbing
- sanity: 0-100 scale, below 30 triggers horror mode
- corruption: 0-100 scale, higher = more monstrous

Respond with ONLY valid JSON matching this format:
{
  "primarySound": "sound_id",
  "secondarySounds": ["optional_sound_id"],
  "ambientSound": "optional_ambient_id",
  "volume": 0.7
}`;

async function selectWithAI(
  request: SoundSelectionRequest,
  apiKey: string,
  signal: AbortSignal
): Promise<SoundSelectionResponse> {
  const runpodUrl = "https://api.runpod.ai/v2/qwen3-32b-awq/run";

  const userPrompt = `Select sounds for this game event:
Event Type: ${request.eventType}
Pet Name: ${request.context.petName}
Stage: ${request.context.stage}
Archetype: ${request.context.archetype}
${request.context.itemType ? `Item Type: ${request.context.itemType}` : ""}
Sanity: ${request.context.sanity}
Corruption: ${request.context.corruption}
${request.context.narrativeText ? `Recent Narrative: ${request.context.narrativeText}` : ""}

Respond with JSON only.`;

  const payload = {
    input: {
      messages: [
        { role: "system", content: SOUND_SELECTION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      sampling_params: {
        max_tokens: 200,
        temperature: 0.3,
        seed: -1,
        top_k: -1,
        top_p: 1,
      },
    },
  };

  // Submit job
  const submitResponse = await fetch(runpodUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!submitResponse.ok) {
    throw new Error(`RunPod submit failed: ${submitResponse.status}`);
  }

  const submitResult = await submitResponse.json();
  const jobId = submitResult.id;

  if (!jobId) {
    throw new Error("No job ID returned from RunPod");
  }

  // Poll for completion with abort support
  const statusUrl = `https://api.runpod.ai/v2/qwen3-32b-awq/status/${jobId}`;
  const pollInterval = 100; // 100ms between polls for faster response
  const maxPolls = 5; // 500ms total max wait
  
  for (let i = 0; i < maxPolls; i++) {
    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    const statusResponse = await fetch(statusUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal,
    });

    if (!statusResponse.ok) continue;

    const statusResult = await statusResponse.json();

    if (statusResult.status === "COMPLETED") {
      const output = statusResult.output;
      let text = "";

      // Parse RunPod output format
      if (Array.isArray(output) && output.length > 0) {
        const firstOutput = output[0];
        if (firstOutput.choices?.[0]?.tokens?.[0]) {
          text = firstOutput.choices[0].tokens[0];
          text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        }
      }

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        primarySound: parsed.primarySound || "cute_a",
        secondarySounds: parsed.secondarySounds,
        ambientSound: parsed.ambientSound,
        volume: typeof parsed.volume === "number" ? Math.min(1, Math.max(0, parsed.volume)) : 0.7,
        cached: false,
      };
    } else if (statusResult.status === "FAILED") {
      throw new Error(`RunPod job failed: ${statusResult.error}`);
    }
  }

  throw new DOMException("Timeout waiting for AI response", "AbortError");
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Serverless function for AI-powered sound selection
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.2, 8.3
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const request = req.body as SoundSelectionRequest;

    // Validate request
    if (!request.eventType || !request.context) {
      return res.status(400).json({ error: "Invalid request: eventType and context are required" });
    }

    if (!["feed", "scavenge", "evolution", "sanity_change", "ambient"].includes(request.eventType)) {
      return res.status(400).json({ error: "Invalid eventType" });
    }

    // Check cache first (Requirements 8.1, 8.2, 8.3)
    const cacheKey = getCacheKey(request);
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }

    const runpodKey = process.env.RUNPOD_API_KEY;
    let response: SoundSelectionResponse;

    if (runpodKey) {
      // Try AI selection with 500ms timeout (Requirement 3.3)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500);

      try {
        response = await selectWithAI(request, runpodKey, controller.signal);
        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error && error.name === "AbortError") {
          console.warn("AI sound selection timeout, using fallback");
        } else {
          console.error("AI sound selection failed:", error);
        }
        
        // Fall back to rule-based selection (Requirements 3.3, 3.4)
        response = selectWithFallback(request);
      }
    } else {
      // No API key, use fallback directly
      response = selectWithFallback(request);
    }

    // Cache the response
    setCachedResponse(cacheKey, response);

    return res.status(200).json(response);
  } catch (error) {
    console.error("Sound selection error:", error);
    
    // Return fallback on any error (Requirement 7.2)
    const fallbackResponse = selectWithFallback(req.body as SoundSelectionRequest);
    return res.status(200).json(fallbackResponse);
  }
}
