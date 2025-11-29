import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel serverless function to generate narrative images using RunPod Nano Banana Edit
 * Endpoint: /api/generateImage
 * 
 * This API accepts narrative context and source images (pet sprite, previous images)
 * and generates a composed horror scene using the RunPod image editing API.
 */

interface GenerateImageRequest {
  narrativeText: string;
  petName: string;
  archetype: "GLOOM" | "SPARK" | "ECHO";
  stage: "EGG" | "BABY" | "TEEN" | "ABOMINATION";
  sourceImages: string[]; // Array of base64 data URLs or HTTP URLs
  itemType?: "PURITY" | "ROT";
  eventType?: "evolution" | "death" | "placate" | "vomit" | "insanity" | "haunt" | "feed";
  insanityEventType?: "WHISPERS" | "SHADOWS" | "GLITCH" | "INVERSION";
  ghostName?: string;
}

/**
 * Event-specific prompt extensions for specialized image generation
 */
const EVENT_PROMPT_EXTENSIONS: Record<string, string> = {
  evolution: "dramatic transformation scene with morphing body horror elements, cosmic horror aesthetic, creature changing form",
  death: "somber memorial scene, creature fading into spectral form, melancholic atmosphere, ghost wisps, soft mourning light",
  vomit: "visceral expulsion scene, grotesque splatters, creature convulsing, body horror, disturbing biological details without gratuitousness",
  haunt: "spectral visitation, translucent apparition appearing, memories bleeding through, current pet sensing presence, ethereal horror",
  feed: "", // Regular feeding has no special extension
};

/**
 * Archetype-specific descriptions for placate events
 */
const PLACATE_ARCHETYPE_EXTENSIONS: Record<string, string> = {
  GLOOM: "intimate comforting moment, dark purple aura surrounding creature, gentle warmth amid horror",
  SPARK: "intimate comforting moment, electric sparkles dancing around creature, gentle warmth amid horror",
  ECHO: "intimate comforting moment, rippling echoes emanating from creature, gentle warmth amid horror",
};

/**
 * Insanity event type variations
 */
const INSANITY_EVENT_EXTENSIONS: Record<string, string> = {
  WHISPERS: "auditory hallucination visualized, soundwaves and whispers made visible, creature hearing voices",
  SHADOWS: "visual hallucination, impossible shadows defying light sources, creature seeing things that aren't there",
  GLITCH: "reality glitch, fragmented duplicates of creature, broken reality effect",
  INVERSION: "inverted reality, upside-down environment, creature experiencing warped perception",
};

/**
 * Build specialized prompt based on event type
 */
function buildEventImagePrompt(
  eventType: string,
  context: {
    narrativeText: string;
    petName: string;
    archetype: string;
    stage: string;
    fromStage?: string;
    toStage?: string;
    insanityEventType?: string;
    ghostName?: string;
  }
): string {
  const { narrativeText, petName, archetype, stage, fromStage, toStage, insanityEventType, ghostName } = context;

  const archetypeDescriptions: Record<string, string> = {
    GLOOM: "shadowy, melancholic creature with hollow eyes",
    SPARK: "electric, jittery creature with crackling energy",
    ECHO: "ethereal, translucent creature with fading echoes",
  };

  const stageDescriptions: Record<string, string> = {
    EGG: "mysterious egg form, pulsing with dark energy",
    BABY: "small, vulnerable creature just hatched",
    TEEN: "growing creature with developing features",
    ABOMINATION: "twisted, horrific form of pure corruption",
  };

  const archetypeDesc = archetypeDescriptions[archetype] || "mysterious creature";
  const stageDesc = stageDescriptions[stage] || "creature";

  let eventExtension = "";

  // Handle specialized event types
  if (eventType === "evolution" && fromStage && toStage) {
    eventExtension = `dramatic transformation scene with ${fromStage} morphing into ${toStage}, body horror elements, cosmic horror aesthetic`;
  } else if (eventType === "death") {
    eventExtension = `somber memorial scene, ${petName} fading into spectral form, melancholic atmosphere, ghost wisps, soft mourning light`;
  } else if (eventType === "placate") {
    eventExtension = PLACATE_ARCHETYPE_EXTENSIONS[archetype] || EVENT_PROMPT_EXTENSIONS.placate || "";
  } else if (eventType === "insanity" && insanityEventType) {
    eventExtension = INSANITY_EVENT_EXTENSIONS[insanityEventType] || "";
  } else if (eventType === "haunt" && ghostName) {
    eventExtension = `spectral visitation, ${ghostName} appearing as translucent apparition, memories bleeding through, current pet sensing presence, ethereal horror`;
  } else {
    eventExtension = EVENT_PROMPT_EXTENSIONS[eventType] || "";
  }

  return `Combine these images into a single realistic horror scene: use the first image (${petName} the ${archetype} pet sprite) as the main character. ${petName} is a ${archetypeDesc}, currently in ${stage} stage (${stageDesc}). ${eventExtension}

Scene description from narrative: "${narrativeText}"

Apply dark horror lighting with dramatic shadows, unsettling atmosphere, creepy companion pet aesthetic, digital horror art style. Keep the pet's exact appearance from the provided sprite. Maintain visual continuity with any previous images provided.`;
}

/**
 * Build a prompt for RunPod that emphasizes using the provided pet sprite
 */
function buildImagePrompt(
  narrativeText: string,
  petName: string,
  archetype: string,
  stage: string,
  itemType?: string
): string {
  const archetypeDescriptions: Record<string, string> = {
    GLOOM: "shadowy, melancholic creature with hollow eyes",
    SPARK: "electric, jittery creature with crackling energy",
    ECHO: "ethereal, translucent creature with fading echoes",
  };

  const stageDescriptions: Record<string, string> = {
    EGG: "mysterious egg form, pulsing with dark energy",
    BABY: "small, vulnerable creature just hatched",
    TEEN: "growing creature with developing features",
    ABOMINATION: "twisted, horrific form of pure corruption",
  };

  const archetypeDesc = archetypeDescriptions[archetype] || "mysterious creature";
  const stageDesc = stageDescriptions[stage] || "creature";

  const itemContext = itemType
    ? itemType === "PURITY"
      ? "consuming a glowing pure offering"
      : "devouring a rotting, corrupted offering"
    : "";

  return `Combine these images into a single realistic horror scene: use the first image (${petName} the ${archetype} pet sprite) as the main character. ${petName} is a ${archetypeDesc}, currently in ${stage} stage (${stageDesc}). ${itemContext}

Scene description from narrative: "${narrativeText}"

Apply dark horror lighting with dramatic shadows, unsettling atmosphere, creepy companion pet aesthetic, digital horror art style. Keep the pet's exact appearance from the provided sprite. Maintain visual continuity with any previous images provided.`;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    narrativeText,
    petName,
    archetype,
    stage,
    sourceImages,
    itemType,
    eventType,
    insanityEventType,
    ghostName,
  } = req.body as GenerateImageRequest;

  // Validate required fields
  if (!narrativeText || typeof narrativeText !== "string") {
    return res.status(400).json({ error: "narrativeText is required" });
  }

  if (!petName || typeof petName !== "string") {
    return res.status(400).json({ error: "petName is required" });
  }

  if (!archetype || !["GLOOM", "SPARK", "ECHO"].includes(archetype)) {
    return res.status(400).json({ error: "Valid archetype is required" });
  }

  if (!stage || !["EGG", "BABY", "TEEN", "ABOMINATION"].includes(stage)) {
    return res.status(400).json({ error: "Valid stage is required" });
  }

  if (!sourceImages || !Array.isArray(sourceImages) || sourceImages.length === 0) {
    return res.status(400).json({ error: "At least one source image is required" });
  }

  const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;

  if (!RUNPOD_API_KEY) {
    console.error("Missing RUNPOD_API_KEY");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    // Build the prompt for image generation
    let prompt: string;
    
    if (eventType) {
      // Use specialized prompt for event types
      prompt = buildEventImagePrompt(eventType, {
        narrativeText,
        petName,
        archetype,
        stage,
        insanityEventType,
        ghostName,
      });
    } else {
      // Use standard prompt
      prompt = buildImagePrompt(narrativeText, petName, archetype, stage, itemType);
    }

    // RunPod Nano Banana Edit endpoint
    const runpodUrl = "https://api.runpod.ai/v2/nano-banana-edit/run";

    const payload = {
      input: {
        prompt: prompt,
        images: sourceImages,
        enable_safety_checker: true,
      },
    };

    console.log("Submitting image generation job:", {
      promptLength: prompt.length,
      imageCount: sourceImages.length,
      archetype,
      stage,
    });

    // Submit job to RunPod
    const submitResponse = await fetch(runpodUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RUNPOD_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error("RunPod submit error:", submitResponse.status, errorText);
      return res.status(submitResponse.status).json({
        error: "Failed to submit image generation job",
        details: errorText,
      });
    }

    const submitResult = await submitResponse.json();
    const jobId = submitResult.id;

    if (!jobId) {
      console.error("No job ID in response:", submitResult);
      return res.status(500).json({ error: "Failed to get job ID" });
    }

    console.log("Job submitted:", jobId);

    // Poll for completion (max 90 seconds for image generation)
    const statusUrl = `https://api.runpod.ai/v2/nano-banana-edit/status/${jobId}`;
    const maxAttempts = 45; // 45 attempts * 2 seconds = 90 seconds max
    let attempts = 0;
    let backoffMs = 2000;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, backoffMs));

      const statusResponse = await fetch(statusUrl, {
        headers: {
          Authorization: `Bearer ${RUNPOD_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        console.error("Status check failed:", statusResponse.status);
        attempts++;
        backoffMs = Math.min(backoffMs * 1.5, 5000); // Exponential backoff, max 5s
        continue;
      }

      const statusResult = await statusResponse.json();
      console.log(`Job status (attempt ${attempts + 1}):`, statusResult.status);

      if (statusResult.status === "COMPLETED") {
        const output = statusResult.output;

        // Handle various output formats
        if (output && output.result) {
          return res.status(200).json({ imageUrl: output.result });
        } else if (output && output.image_url) {
          return res.status(200).json({ imageUrl: output.image_url });
        } else if (output && output.image) {
          // Base64 image data
          return res.status(200).json({ imageUrl: output.image });
        } else if (typeof output === "string" && (output.startsWith("http") || output.startsWith("data:"))) {
          return res.status(200).json({ imageUrl: output });
        } else {
          console.error("Unexpected output format:", output);
          return res.status(500).json({
            error: "Unexpected response format",
            details: JSON.stringify(output),
          });
        }
      } else if (statusResult.status === "FAILED") {
        console.error("Job failed:", statusResult.error);
        return res.status(500).json({
          error: "Image generation failed",
          details: statusResult.error,
        });
      }

      attempts++;
      backoffMs = Math.min(backoffMs * 1.2, 5000); // Gradual backoff
    }

    // Timeout
    return res.status(504).json({
      error: "Image generation timeout",
      details: "Job did not complete within 90 seconds",
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return res.status(500).json({
      error: "Failed to generate image",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
