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
