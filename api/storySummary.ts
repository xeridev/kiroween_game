import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { NarrativeLog, PetStats, EventType } from "../src/utils/types";

/**
 * Extract key events from narrative logs for story summary.
 * Focuses on significant moments: evolution, death, placate, haunt, insanity, vomit.
 * 
 * Requirements: 7.2
 */
function extractKeyEvents(logs: NarrativeLog[]): Array<{ type: EventType; text: string; age: number }> {
  const keyEventTypes: EventType[] = ["evolution", "death", "placate", "haunt", "insanity", "vomit"];
  
  return logs
    .filter(log => log.eventType && keyEventTypes.includes(log.eventType))
    .map(log => ({
      type: log.eventType!,
      text: log.text,
      age: log.timestamp,
    }));
}

/**
 * Format age in minutes to human-readable string.
 */
function formatAge(ageInMinutes: number): string {
  const hours = Math.floor(ageInMinutes / 60);
  const minutes = Math.floor(ageInMinutes % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Serverless function that generates a cohesive story summary of the pet's life.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate request body (Requirements 7.1, 7.2, 7.3)
    const { logs, petName, finalStats, totalAge } = req.body;

    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({
        error: "Invalid request: logs array is required",
      });
    }

    if (!petName || typeof petName !== "string") {
      return res.status(400).json({
        error: "Invalid request: petName is required and must be a string",
      });
    }

    if (!finalStats || typeof finalStats !== "object") {
      return res.status(400).json({
        error: "Invalid request: finalStats is required",
      });
    }

    if (typeof totalAge !== "number") {
      return res.status(400).json({
        error: "Invalid request: totalAge is required and must be a number",
      });
    }

    // Extract key events from logs (Requirement 7.2)
    const keyEvents = extractKeyEvents(logs);

    // Sample key events if there are too many (Requirement 14.2)
    let sampledEvents = keyEvents;
    if (keyEvents.length > 20) {
      // Keep first event, last event, and sample from middle
      const first = keyEvents[0];
      const last = keyEvents[keyEvents.length - 1];
      const middle = keyEvents.slice(1, -1);
      
      // Sample ~18 events from middle
      const sampleSize = 18;
      const step = Math.floor(middle.length / sampleSize);
      const sampledMiddle = middle.filter((_, index) => index % step === 0).slice(0, sampleSize);
      
      sampledEvents = [first, ...sampledMiddle, last];
    }

    // Build AI prompt for cohesive narrative (Requirement 7.4)
    const eventDescriptions = sampledEvents
      .map(e => `- [${formatAge(e.age)}] ${e.type.toUpperCase()}: ${e.text}`)
      .join('\n');

    const prompt = `Write a cohesive narrative summary of ${petName}'s life journey. This is a dark pet simulator game where creatures evolve through mysterious stages.

Key events in ${petName}'s life:
${eventDescriptions}

Final state:
- Age: ${formatAge(totalAge)}
- Sanity: ${finalStats.sanity}%
- Corruption: ${finalStats.corruption}%
- Hunger: ${finalStats.hunger}%

Write a 300-500 word narrative that captures the essence of ${petName}'s journey. Focus on:
- The emotional arc of the relationship between player and pet
- How ${petName} changed over time
- The significant moments that defined their existence
- The atmosphere and tone of their story

Write in past tense, as if reflecting on a completed journey. Be atmospheric, poignant, and slightly unsettling. This should read like a memorial or eulogy.`;

    // Check which API keys are available
    const runpodKey = process.env.RUNPOD_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const featherlessKey = process.env.FEATHERLESS_API_KEY;

    if (!runpodKey && !anthropicKey && !featherlessKey) {
      console.error("No AI provider API keys configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    let summaryText = "";

    // Try RunPod first (fast, cheap, good quality)
    if (runpodKey) {
      try {
        summaryText = await generateWithRunPod(prompt, 0.7, 600, runpodKey);
      } catch (runpodError) {
        console.error("RunPod generation failed, trying fallback:", runpodError);
        // Continue to next provider
      }
    }

    // Fallback to other providers if RunPod failed
    if (!summaryText) {
      // Use the chat API endpoint as fallback
      const chatResponse = await fetch(`${req.headers.host}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          temperature: 0.7,
          maxTokens: 600,
        }),
      });

      if (!chatResponse.ok) {
        throw new Error(`Chat API error: ${chatResponse.status}`);
      }

      const chatData = await chatResponse.json();
      summaryText = chatData.text;
    }

    // Return summary with key events (Requirements 7.1, 7.2, 7.3, 7.4)
    return res.status(200).json({
      summaryText: summaryText.trim(),
      keyEvents: sampledEvents.map(e => e.text),
    });
  } catch (error: any) {
    console.error("Story summary generation error:", error);

    // Handle specific error types
    if (error.name === "AbortError" || error.code === "ETIMEDOUT") {
      return res.status(504).json({
        error: "Request timeout. Please try again.",
        retryAfter: 5,
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: 60,
      });
    }

    if (error.status >= 500) {
      return res.status(502).json({
        error: "Upstream service error. Please try again.",
        retryAfter: 10,
      });
    }

    // Generic error response (don't expose internal details)
    return res.status(500).json({
      error: "An error occurred while generating story summary",
    });
  }
}

/**
 * Helper function to generate text using RunPod Qwen3-32B-AWQ
 */
async function generateWithRunPod(
  prompt: string,
  temperature: number,
  maxTokens: number,
  apiKey: string
): Promise<string> {
  const runpodUrl = "https://api.runpod.ai/v2/qwen3-32b-awq/run";

  const payload = {
    input: {
      messages: [
        {
          role: "system",
          content: "You are a creative writer for a dark pet simulator game. You write atmospheric, poignant narratives that capture the emotional journey between player and pet. Your writing is reflective, slightly unsettling, and deeply evocative.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      sampling_params: {
        max_tokens: maxTokens,
        temperature: temperature,
        seed: -1,
        top_k: -1,
        top_p: 1,
      },
    },
  };

  // Submit job to RunPod
  const submitResponse = await fetch(runpodUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!submitResponse.ok) {
    throw new Error(`RunPod submit failed: ${submitResponse.status}`);
  }

  const submitResult = await submitResponse.json();
  const jobId = submitResult.id;

  if (!jobId) {
    throw new Error("No job ID returned from RunPod");
  }

  // Poll for completion (max 60 seconds for longer text generation)
  const statusUrl = `https://api.runpod.ai/v2/qwen3-32b-awq/status/${jobId}`;
  const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const statusResponse = await fetch(statusUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      attempts++;
      continue;
    }

    const statusResult = await statusResponse.json();

    if (statusResult.status === "COMPLETED") {
      const output = statusResult.output;

      // Handle Qwen3-32B-AWQ output format
      if (Array.isArray(output) && output.length > 0) {
        const firstOutput = output[0];

        if (firstOutput.choices && Array.isArray(firstOutput.choices) && firstOutput.choices.length > 0) {
          const firstChoice = firstOutput.choices[0];
          if (firstChoice.tokens && Array.isArray(firstChoice.tokens) && firstChoice.tokens.length > 0) {
            let text = firstChoice.tokens[0];

            // Remove <think> tags and content
            text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

            return text;
          }
        }

        if (typeof firstOutput === "string") {
          return firstOutput;
        }
      }

      if (typeof output === "string") {
        return output;
      } else if (output && output.text) {
        return output.text;
      } else if (output && output.output) {
        return typeof output.output === "string" ? output.output : JSON.stringify(output.output);
      }

      throw new Error(`Unexpected output format from RunPod: ${JSON.stringify(output)}`);
    } else if (statusResult.status === "FAILED") {
      throw new Error(`RunPod job failed: ${statusResult.error}`);
    }

    attempts++;
  }

  throw new Error("RunPod generation timeout");
}
