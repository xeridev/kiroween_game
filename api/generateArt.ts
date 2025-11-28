import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel serverless function to generate pet art using RunPod Stable Diffusion
 * Endpoint: /api/generateArt
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, negativePrompt, seed } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
  const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID;

  if (!RUNPOD_API_KEY || !RUNPOD_ENDPOINT_ID) {
    console.error("Missing RunPod configuration");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    // RunPod serverless endpoint URL - using /run for async execution
    const runpodUrl = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/run`;

    // Request payload for SeeDream V4 (matches your curl command structure)
    const payload = {
      input: {
        prompt: prompt,
        negative_prompt: negativePrompt || "",
        size: "1024*1024", // SeeDream uses format: WIDTHxHEIGHT (e.g., "512x512", "1024x1024")
        seed: seed || -1, // -1 for random seed in SeeDream
        enable_safety_checker: true,
      },
    };

    console.log("Sending request to RunPod:", {
      endpoint: RUNPOD_ENDPOINT_ID,
      promptLength: prompt.length,
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
      console.error("RunPod API error:", submitResponse.status, errorText);
      return res.status(submitResponse.status).json({
        error: "Failed to submit image generation job",
        details: errorText,
      });
    }

    const submitResult = await submitResponse.json();
    const jobId = submitResult.id;

    if (!jobId) {
      console.error("No job ID in RunPod response:", submitResult);
      return res.status(500).json({
        error: "Failed to get job ID from RunPod",
      });
    }

    console.log("RunPod job submitted:", jobId);

    // Poll for job completion (max 60 seconds)
    const statusUrl = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/status/${jobId}`;
    const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls

      const statusResponse = await fetch(statusUrl, {
        headers: {
          Authorization: `Bearer ${RUNPOD_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        console.error("Failed to check job status:", statusResponse.status);
        attempts++;
        continue;
      }

      const statusResult = await statusResponse.json();
      console.log(`Job status (attempt ${attempts + 1}):`, statusResult.status);

      if (statusResult.status === "COMPLETED") {
        // Extract image URL from output
        const output = statusResult.output;

        // Handle different output formats from SeeDream V4
        if (output && output.result) {
          // SeeDream V4 format: {result: "url", cost: number}
          return res.status(200).json({
            imageUrl: output.result,
            seed: seed,
          });
        } else if (output && output.image_url) {
          return res.status(200).json({
            imageUrl: output.image_url,
            seed: output.seed || seed,
          });
        } else if (output && typeof output === 'string' && output.startsWith('http')) {
          // Sometimes output is just the URL string
          return res.status(200).json({
            imageUrl: output,
            seed: seed,
          });
        } else {
          console.error("Unexpected output format:", output);
          return res.status(500).json({
            error: "Unexpected response format from image generation service",
            details: JSON.stringify(output),
          });
        }
      } else if (statusResult.status === "FAILED") {
        console.error("Job failed:", statusResult.error);
        return res.status(500).json({
          error: "Image generation job failed",
          details: statusResult.error,
        });
      }

      // Status is still IN_QUEUE or IN_PROGRESS, continue polling
      attempts++;
    }

    // Timeout - job took too long
    return res.status(504).json({
      error: "Image generation timeout",
      details: "Job did not complete within 60 seconds",
    });
  } catch (error) {
    console.error("Error generating art:", error);
    return res.status(500).json({
      error: "Failed to generate image",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
