import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Serverless function that proxies AI requests to Featherless API
 * This keeps the API key secure on the server side
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate request body
    const { prompt, temperature = 0.7 } = req.body;

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

    // Validate API key from environment
    const apiKey = process.env.FEATHERLESS_API_KEY;
    if (!apiKey) {
      console.error("FEATHERLESS_API_KEY environment variable is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Configure OpenAI provider with Featherless base URL
    const featherless = createOpenAI({
      apiKey: apiKey,
      baseURL: "https://api.featherless.ai/v1",
    });

    // Generate text using the AI SDK
    const result = await generateText({
      model: featherless("meta-llama/Meta-Llama-3.1-8B-Instruct"),
      prompt: prompt,
      temperature: temperature,
    });

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
