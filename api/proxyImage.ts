import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Proxy endpoint to fetch images from external sources (bypasses CORS)
 * Endpoint: /api/proxyImage?url=<encoded_url>
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  // Validate URL is from allowed domains
  const allowedDomains = [
    "image.runpod.ai",
    "runpod.ai",
  ];

  try {
    const parsedUrl = new URL(url);
    const isAllowed = allowedDomains.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return res.status(403).json({ error: "Domain not allowed" });
    }

    // Fetch the image
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: "Failed to fetch image",
        status: response.status 
      });
    }

    // Get content type and body
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    // Set cache headers (cache for 1 hour)
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Content-Type", contentType);
    
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).json({ 
      error: "Failed to proxy image",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
