import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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
          content: "You are a creative horror writer for a dark pet simulator game. You will receive prompts about game events (feeding, scavenging, evolution). Respond with exactly 1-2 sentences of atmospheric horror narrative - cryptic, ominous, and unsettling. Use visceral imagery and psychological dread. Output ONLY the narrative text itself, no meta-commentary, no thinking process, no explanations. Example input: 'Generate description for creature consuming pure offering.' Example output: 'The creature's hollow eyes wept luminescent tears as it devoured the offering whole, its form briefly flickering with stolen light before collapsing back into shadow.'",
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

  // Poll for completion (max 30 seconds for text generation)
  const statusUrl = `https://api.runpod.ai/v2/qwen3-32b-awq/status/${jobId}`;
  const maxAttempts = 15; // 15 attempts * 2 seconds = 30 seconds max
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

      // Handle Qwen3-32B-AWQ output format: [{choices: [{tokens: ["text"]}]}]
      if (Array.isArray(output) && output.length > 0) {
        const firstOutput = output[0];

        // Standard format: {choices: [{tokens: ["text"]}]}
        if (firstOutput.choices && Array.isArray(firstOutput.choices) && firstOutput.choices.length > 0) {
          const firstChoice = firstOutput.choices[0];
          if (firstChoice.tokens && Array.isArray(firstChoice.tokens) && firstChoice.tokens.length > 0) {
            let text = firstChoice.tokens[0];

            // Remove <think> tags and content (Qwen3's internal reasoning)
            text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

            return text;
          }
        }

        // Fallback: if array of strings
        if (typeof firstOutput === "string") {
          return firstOutput;
        }
      }

      // Fallback for other formats
      if (typeof output === "string") {
        return output;
      } else if (output && output.text) {
        return output.text;
      } else if (output && output.output) {
        return typeof output.output === "string" ? output.output : JSON.stringify(output.output);
      }

      console.error("Unexpected Qwen3 output format:", JSON.stringify(output));
      throw new Error(`Unexpected output format from RunPod: ${JSON.stringify(output)}`);
    } else if (statusResult.status === "FAILED") {
      throw new Error(`RunPod job failed: ${statusResult.error}`);
    }

    attempts++;
  }

  throw new Error("RunPod generation timeout");
}

/**
 * Serverless function that proxies AI requests to multiple providers
 * This keeps the API key secure on the server side
 * Supports three providers (in priority order):
 * - RunPod Qwen3-32B-AWQ (fast, cheap, good quality)
 * - Anthropic Claude Haiku (premium quality)
 * - Featherless Llama 3.1-8B (free tier)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate request body
    const { prompt, temperature = 0.7, maxTokens = 150 } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Invalid request: prompt is required and must be a string",
      });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({
        error:
          "Invalid request: prompt exceeds maximum length of 1000 characters",
      });
    }

    // Check which API keys are available
    const runpodKey = process.env.RUNPOD_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const featherlessKey = process.env.FEATHERLESS_API_KEY;

    if (!runpodKey && !anthropicKey && !featherlessKey) {
      console.error("No AI provider API keys configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    let result;

    // Priority 1: RunPod Qwen3-32B-AWQ (fast, cheap, good quality)
    if (runpodKey) {
      try {
        const text = await generateWithRunPod(prompt, temperature, maxTokens, runpodKey);
        return res.status(200).json({ text });
      } catch (runpodError) {
        console.error("RunPod generation failed, trying fallback:", runpodError);
        // Continue to next provider
      }
    }

    // Priority 2: Anthropic Claude Haiku (premium quality)
    if (anthropicKey) {
      const anthropic = createAnthropic({
        apiKey: anthropicKey,
      });

      result = await generateText({
        model: anthropic("claude-3-haiku-20240307"),
        prompt: prompt,
        temperature: temperature,
      });
    }
    // Priority 3: Featherless (free tier)
    else if (featherlessKey) {
      const featherless = createOpenAI({
        apiKey: featherlessKey,
        baseURL: "https://api.featherless.ai/v1",
      });

      result = await generateText({
        model: featherless("meta-llama/Meta-Llama-3.1-8B-Instruct"),
        prompt: prompt,
        temperature: temperature,
      });
    } else {
      return res.status(500).json({ error: "No AI provider available" });
    }

    // Return the generated text
    return res.status(200).json({
      text: result.text,
    });
  } catch (error: any) {
    console.error("AI generation error:", error);

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
      error: "An error occurred while generating text",
    });
  }
}
