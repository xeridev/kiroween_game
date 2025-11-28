# AI Proxy API

This directory contains Vercel serverless functions for the Creepy Companion application.

## `/api/chat` - AI Text Generation Proxy

A serverless function that securely proxies AI text generation requests to the Featherless AI API.

### Purpose

This proxy keeps the Featherless API key secure on the server side, preventing exposure in client-side code.

**Requirements Satisfied:** 9.1, 9.2, 9.3, 9.4, 9.5

### Configuration

1. Set the `FEATHERLESS_API_KEY` environment variable in your Vercel project settings
2. The function automatically uses the Featherless base URL: `https://api.featherless.ai/v1`

### Request Format

**Method:** POST

**Body:**

```json
{
  "prompt": "Your prompt text here",
  "temperature": 0.7 // Optional, defaults to 0.7
}
```

### Response Format

**Success (200):**

```json
{
  "text": "Generated text response"
}
```

**Error (4xx/5xx):**

```json
{
  "error": "Error message",
  "retryAfter": 5 // Optional, seconds to wait before retry
}
```

### Error Handling

- **405**: Method not allowed (only POST is accepted)
- **400**: Invalid request (missing/invalid prompt)
- **500**: Server configuration error (missing API key)
- **502**: Upstream service error (Featherless API issue)
- **504**: Request timeout
- **429**: Rate limit exceeded

### Usage Example

```typescript
async function generateDescription(prompt: string): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate text");
  }

  const data = await response.json();
  return data.text;
}
```

### Local Development

For local testing, create a `.env` file in the project root:

```
FEATHERLESS_API_KEY=your_api_key_here
```

See `.env.example` for reference.

### Deployment

The function is automatically deployed when you push to Vercel. The `vercel.json` configuration sets:

- Maximum duration: 30 seconds
- Environment variable reference: `@featherless-api-key`

---

## `/api/generateArt` - AI Image Generation Proxy

A serverless function that securely proxies AI image generation requests to RunPod Stable Diffusion API, with automatic fallback to Pollinations.ai.

### Purpose

This proxy keeps the RunPod API key secure on the server side and provides a consistent interface for AI art generation.

### Configuration

1. Set the `RUNPOD_API_KEY` environment variable in your Vercel project settings
2. Set the `RUNPOD_ENDPOINT_ID` environment variable (your RunPod endpoint ID)
3. The function automatically constructs the RunPod API URL

### Request Format

**Method:** POST

**Body:**

```json
{
  "prompt": "Detailed image description",
  "negativePrompt": "Things to avoid in the image", // Optional
  "seed": 12345 // Optional, for deterministic generation
}
```

### Response Format

**Success (200):**

```json
{
  "imageUrl": "https://...",
  "seed": 12345
}
```

**Error (4xx/5xx):**

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

### Error Handling

- **405**: Method not allowed (only POST is accepted)
- **400**: Invalid request (missing prompt)
- **500**: Server configuration error (missing API key or endpoint ID)
- **502**: Upstream service error (RunPod API issue)

### RunPod Payload Structure

The function sends this payload to RunPod:

```json
{
  "input": {
    "prompt": "Your detailed prompt",
    "negative_prompt": "Things to avoid",
    "width": 512,
    "height": 512,
    "num_inference_steps": 25,
    "guidance_scale": 7.5,
    "seed": 12345,
    "scheduler": "DPMSolverMultistep"
  }
}
```

### Usage Example

```typescript
async function generatePetArt(prompt: string): Promise<string> {
  const response = await fetch("/api/generateArt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      negativePrompt: "blurry, low quality, text",
      seed: 12345,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate image");
  }

  const data = await response.json();
  return data.imageUrl;
}
```

### Local Development

For local testing, create a `.env` file in the project root:

```
RUNPOD_API_KEY=your_runpod_api_key_here
RUNPOD_ENDPOINT_ID=your_endpoint_id_here
```

See `.env.example` for reference.

### Deployment

The function is automatically deployed when you push to Vercel. Make sure to set the environment variables in your Vercel project settings.
