import { logError, logWarning } from "./errorLogger";
import type { Archetype, PetStage } from "./types";

/**
 * Get placeholder image path for a given archetype and stage
 * Placeholders are shown immediately while AI art is being generated
 */
export function getPlaceholderPath(archetype: Archetype, stage: PetStage): string {
  return `/placeholders/${archetype}_${stage}.png`;
}

/**
 * Check if a placeholder image exists
 */
export async function placeholderExists(archetype: Archetype, stage: PetStage): Promise<boolean> {
  try {
    const path = getPlaceholderPath(archetype, stage);
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate a text prompt for AI art generation based on pet traits
 */
export function generatePetPrompt(
  archetype: Archetype,
  stage: PetStage,
  color: string
): string {
  const archetypeDescriptions = {
    GLOOM: "melancholic, shadowy, ethereal blob creature with large sad eyes",
    SPARK: "electric, angular, energetic triangular creature with glowing sharp features",
    ECHO: "translucent, ghostly, diamond-shaped spirit creature with hollow glowing eyes",
  };

  const stageDescriptions = {
    EGG: "unhatched egg form, glowing from within, mysterious aura",
    BABY: "small cute but unsettling creature, childlike innocent appearance",
    TEEN: "medium-sized creature with defined features, slightly menacing presence",
    ABOMINATION: "large terrifying grotesque creature, multiple eyes, twisted horrifying form, nightmare fuel",
  };

  // Enhanced prompt for better SD results
  const prompt = `${stageDescriptions[stage]}, ${archetypeDescriptions[archetype]},
    color scheme ${color}, masterpiece digital art, dark fantasy horror style,
    centered composition on pure black background, creepy cute aesthetic,
    liminal space atmosphere, high detail, professional concept art,
    ${stage === "ABOMINATION" ? "body horror, disturbing, eldritch" : "eerie unsettling"}`;

  return prompt;
}

export function getNegativePrompt(): string {
  return "blurry, low quality, low resolution, text, watermark, signature, artist name, frame, border, multiple subjects, busy background, photorealistic";
}

/**
 * Generate pet art using RunPod Stable Diffusion (primary)
 * Falls back to Pollinations.ai if RunPod fails
 */
export async function generatePetArt(
  archetype: Archetype,
  stage: PetStage,
  color: string,
  petName: string
): Promise<string> {
  try {
    const prompt = generatePetPrompt(archetype, stage, color);
    const negativePrompt = getNegativePrompt();

    // Try RunPod first
    try {
      const imageUrl = await generatePetArtRunPod(
        prompt,
        negativePrompt,
        archetype,
        stage
      );
      return imageUrl;
    } catch (runpodError) {
      logWarning(
        "RunPod art generation failed, falling back to Pollinations.ai",
        {
          archetype,
          stage,
          petName,
          error: runpodError instanceof Error ? runpodError.message : "Unknown",
        }
      );

      // Fallback to Pollinations.ai
      return await generatePetArtPollinations(prompt, archetype, stage, petName);
    }
  } catch (error) {
    logError(
      "Failed to generate pet art",
      error instanceof Error ? error : undefined,
      { archetype, stage, petName }
    );
    throw error;
  }
}

/**
 * Generate pet art using RunPod serverless Stable Diffusion
 */
async function generatePetArtRunPod(
  prompt: string,
  negativePrompt: string,
  archetype: Archetype,
  stage: PetStage
): Promise<string> {
  try {
    // Generate deterministic seed based on archetype and stage
    const seed = hashString(`${archetype}-${stage}`);

    const response = await fetch("/api/generateArt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        negativePrompt,
        seed,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `RunPod API error: ${response.status} - ${
          errorData.error || "Unknown error"
        }`
      );
    }

    const result = await response.json();

    if (!result.imageUrl) {
      throw new Error("No image URL in RunPod response");
    }

    // Proxy RunPod images to avoid CORS issues
    const proxyUrl = `/api/proxyImage?url=${encodeURIComponent(result.imageUrl)}`;

    // Pre-load the image to ensure it's ready
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(proxyUrl);
      img.onerror = () => {
        reject(new Error("Failed to load RunPod-generated image"));
      };
      img.src = proxyUrl;
    });
  } catch (error) {
    logError(
      "RunPod art generation failed",
      error instanceof Error ? error : undefined,
      { archetype, stage }
    );
    throw error;
  }
}

/**
 * Generate pet art using Pollinations.ai (fallback, free, no API key needed)
 */
async function generatePetArtPollinations(
  prompt: string,
  archetype: Archetype,
  stage: PetStage,
  petName: string
): Promise<string> {
  try {
    // Pollinations.ai - free AI image generation
    // URL format: https://image.pollinations.ai/prompt/{encoded_prompt}
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&model=turbo`;

    // Pre-load the image to ensure it's ready
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(imageUrl);
      img.onerror = () => {
        logError("Failed to load Pollinations.ai image", undefined, {
          archetype,
          stage,
          petName,
        });
        reject(new Error("Pollinations.ai image load failed"));
      };
      img.src = imageUrl;
    });
  } catch (error) {
    logError(
      "Pollinations.ai art generation failed",
      error instanceof Error ? error : undefined,
      { archetype, stage, petName }
    );
    throw error;
  }
}

/**
 * Simple string hash function for deterministic seed generation
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Alternative: Generate art using a different free service
 * This can be used as a fallback
 */
export async function generatePetArtFallback(
  archetype: Archetype,
  stage: PetStage,
  color: string
): Promise<string> {
  try {
    const prompt = generatePetPrompt(archetype, stage, color);
    const encodedPrompt = encodeURIComponent(prompt);

    // Alternative: Replicate's free tier or other services
    // For now, we'll use a different Pollinations endpoint
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${Date.now()}`;

    return imageUrl;
  } catch (error) {
    logError(
      "Fallback art generation failed",
      error instanceof Error ? error : undefined
    );
    throw error;
  }
}

/**
 * Cache key for storing generated art URLs
 */
export function getArtCacheKey(
  petName: string,
  archetype: Archetype,
  stage: PetStage
): string {
  return `pet-art-${petName}-${archetype}-${stage}`;
}

/**
 * Load cached art URL from localStorage
 */
export function loadCachedArt(
  petName: string,
  archetype: Archetype,
  stage: PetStage
): string | null {
  try {
    const key = getArtCacheKey(petName, archetype, stage);
    return localStorage.getItem(key);
  } catch (error) {
    logError("Failed to load cached art", error instanceof Error ? error : undefined);
    return null;
  }
}

/**
 * Save art URL to localStorage cache
 */
export function saveCachedArt(
  petName: string,
  archetype: Archetype,
  stage: PetStage,
  imageUrl: string
): void {
  try {
    const key = getArtCacheKey(petName, archetype, stage);
    localStorage.setItem(key, imageUrl);
  } catch (error) {
    logError("Failed to save cached art", error instanceof Error ? error : undefined);
  }
}
