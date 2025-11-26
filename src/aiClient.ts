import { logError, logWarning } from "./errorLogger";

export interface AIRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  text: string;
  error?: string;
}

/**
 * Fallback descriptions for when AI generation fails
 * Requirements: 4.2, 9.4
 */
const FALLBACK_DESCRIPTIONS = [
  "A mysterious artifact",
  "Something strange and unknowable",
  "An object that defies description",
  "A thing that shouldn't exist",
  "An offering from the void",
];

/**
 * Get a random fallback description
 */
function getFallbackDescription(): string {
  return FALLBACK_DESCRIPTIONS[
    Math.floor(Math.random() * FALLBACK_DESCRIPTIONS.length)
  ];
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate text using the AI proxy with retry logic and fallback
 * Requirements: 4.2, 9.1, 9.4
 *
 * @param request - The AI request parameters
 * @param retryCount - Number of retries attempted (internal use)
 * @returns AI response with generated text or fallback
 */
export async function generateText(
  request: AIRequest,
  retryCount = 0
): Promise<AIResponse> {
  const MAX_RETRIES = 1;
  const TIMEOUT_MS = 10000; // 10 second timeout

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: request.prompt,
        temperature: request.temperature ?? 0.8,
        maxTokens: request.maxTokens ?? 100,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle timeout/gateway errors with retry
      if (response.status === 504 || response.status === 502) {
        if (retryCount < MAX_RETRIES) {
          logWarning(
            `AI request timeout/gateway error, retrying... (attempt ${
              retryCount + 1
            })`,
            { status: response.status }
          );
          await sleep(1000); // Wait 1 second before retry
          return generateText(request, retryCount + 1);
        }
        throw new Error("Request timeout. Please try again.");
      }

      // Handle rate limiting
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      throw new Error(
        errorData.error || `API request failed: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Validate response has text
    if (!data.text || typeof data.text !== "string") {
      throw new Error("Invalid response format from API");
    }

    return { text: data.text };
  } catch (error) {
    // Handle abort/timeout errors with retry
    if (error instanceof Error && error.name === "AbortError") {
      if (retryCount < MAX_RETRIES) {
        logWarning(
          `AI request aborted (timeout), retrying... (attempt ${
            retryCount + 1
          })`
        );
        await sleep(1000);
        return generateText(request, retryCount + 1);
      }
      logError("AI generation timeout after retries", error, {
        prompt: request.prompt,
        retryCount,
      });
      return {
        text: getFallbackDescription(),
        error: "Request timeout. Using fallback description.",
      };
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      logError("AI generation network error", error, {
        prompt: request.prompt,
      });
      return {
        text: getFallbackDescription(),
        error: "Network error. Unable to generate description.",
      };
    }

    // Handle all other errors with fallback
    logError(
      "AI generation error",
      error instanceof Error ? error : undefined,
      { prompt: request.prompt }
    );
    return {
      text: getFallbackDescription(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
