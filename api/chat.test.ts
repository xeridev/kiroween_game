import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Mock the AI SDK modules
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => vi.fn(() => "mocked-model")),
}));

vi.mock("ai", () => ({
  generateText: vi.fn(async () => ({
    text: "Generated test response",
  })),
}));

describe("AI Proxy Serverless Function", () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let statusCode: number;
  let responseData: any;

  beforeEach(() => {
    statusCode = 200;
    responseData = null;

    mockReq = {
      method: "POST",
      body: {},
    };

    mockRes = {
      status: vi.fn((code: number) => {
        statusCode = code;
        return mockRes as VercelResponse;
      }),
      json: vi.fn((data: any) => {
        responseData = data;
        return mockRes as VercelResponse;
      }),
    };

    // Set environment variable for tests
    process.env.FEATHERLESS_API_KEY = "test-api-key";
  });

  it("should reject non-POST requests", async () => {
    mockReq.method = "GET";

    const handler = (await import("./chat")).default;
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusCode).toBe(405);
    expect(responseData).toEqual({ error: "Method not allowed" });
  });

  it("should validate prompt is required", async () => {
    mockReq.body = {};

    const handler = (await import("./chat")).default;
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusCode).toBe(400);
    expect(responseData.error).toContain("prompt is required");
  });

  it("should validate prompt is a string", async () => {
    mockReq.body = { prompt: 123 };

    const handler = (await import("./chat")).default;
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusCode).toBe(400);
    expect(responseData.error).toContain("must be a string");
  });

  it("should validate prompt length", async () => {
    mockReq.body = { prompt: "a".repeat(1001) };

    const handler = (await import("./chat")).default;
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusCode).toBe(400);
    expect(responseData.error).toContain("exceeds maximum length");
  });

  it("should return 500 if API key is missing", async () => {
    delete process.env.FEATHERLESS_API_KEY;
    mockReq.body = { prompt: "test prompt" };

    const handler = (await import("./chat")).default;
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusCode).toBe(500);
    expect(responseData.error).toContain("Server configuration error");
  });

  it("should successfully process valid request", async () => {
    mockReq.body = { prompt: "test prompt" };
    process.env.FEATHERLESS_API_KEY = "test-api-key";

    const handler = (await import("./chat")).default;
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusCode).toBe(200);
    expect(responseData).toHaveProperty("text");
  });

  it("should accept optional temperature parameter", async () => {
    mockReq.body = { prompt: "test prompt", temperature: 0.9 };
    process.env.FEATHERLESS_API_KEY = "test-api-key";

    const handler = (await import("./chat")).default;
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusCode).toBe(200);
  });
});
