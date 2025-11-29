import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { NarrativeLog, PetStats } from "../src/utils/types";

// Mock fetch for internal API calls
global.fetch = vi.fn();

describe("Story Summary Serverless Function", () => {
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
      headers: {
        host: "localhost:3000",
      },
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
    
    // Reset fetch mock
    vi.mocked(fetch).mockReset();
  });

  it("should reject non-POST requests", async () => {
    mockReq.method = "GET";

    const handler = (await import("./storySummary")).default;
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusCode).toBe(405);
    expect(responseData).toEqual({ error: "Method not allowed" });
  });

  it("should reject requests without logs array", async () => {
    mockReq.body = {
      petName: "TestPet",
      finalStats: { hunger: 50, sanity: 50, corruption: 50 },
      totalAge: 100,
    };

    const handler = (await import("./storySummary")).default;
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusCode).toBe(400);
    expect(responseData.error).toContain("logs array is required");
  });

  it("should reject requests without petName", async () => {
    mockReq.body = {
      logs: [],
      finalStats: { hunger: 50, sanity: 50, corruption: 50 },
      totalAge: 100,
    };

    const handler = (await import("./storySummary")).default;
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusCode).toBe(400);
    expect(responseData.error).toContain("petName is required");
  });

  it("should reject requests without finalStats", async () => {
    mockReq.body = {
      logs: [],
      petName: "TestPet",
      totalAge: 100,
    };

    const handler = (await import("./storySummary")).default;
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusCode).toBe(400);
    expect(responseData.error).toContain("finalStats is required");
  });

  it("should reject requests without totalAge", async () => {
    mockReq.body = {
      logs: [],
      petName: "TestPet",
      finalStats: { hunger: 50, sanity: 50, corruption: 50 },
    };

    const handler = (await import("./storySummary")).default;
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusCode).toBe(400);
    expect(responseData.error).toContain("totalAge is required");
  });

  it("should generate story summary with valid request", async () => {
    const mockLogs: NarrativeLog[] = [
      {
        id: "1",
        text: "The creature hatched from its egg",
        source: "SYSTEM",
        timestamp: 0,
        eventType: "evolution",
      },
      {
        id: "2",
        text: "The creature consumed a pure offering",
        source: "PET",
        timestamp: 10,
        eventType: "feed",
      },
    ];

    const mockStats: PetStats = {
      hunger: 30,
      sanity: 70,
      corruption: 20,
    };

    mockReq.body = {
      logs: mockLogs,
      petName: "TestPet",
      finalStats: mockStats,
      totalAge: 100,
    };

    // Mock the chat API response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: "This is a generated story summary about TestPet's journey." }),
    } as Response);

    const handler = (await import("./storySummary")).default;
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusCode).toBe(200);
    expect(responseData).toHaveProperty("summaryText");
    expect(responseData).toHaveProperty("keyEvents");
    expect(Array.isArray(responseData.keyEvents)).toBe(true);
  });

  it("should extract key events from logs", async () => {
    const mockLogs: NarrativeLog[] = [
      {
        id: "1",
        text: "Evolution event",
        source: "SYSTEM",
        timestamp: 0,
        eventType: "evolution",
      },
      {
        id: "2",
        text: "Regular feed event",
        source: "PET",
        timestamp: 10,
        eventType: "feed",
      },
      {
        id: "3",
        text: "Death event",
        source: "SYSTEM",
        timestamp: 20,
        eventType: "death",
      },
    ];

    mockReq.body = {
      logs: mockLogs,
      petName: "TestPet",
      finalStats: { hunger: 100, sanity: 0, corruption: 50 },
      totalAge: 100,
    };

    // Mock the chat API response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: "Story summary" }),
    } as Response);

    const handler = (await import("./storySummary")).default;
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusCode).toBe(200);
    expect(responseData.keyEvents).toHaveLength(2); // Only evolution and death (feed is not a key event)
    expect(responseData.keyEvents).toContain("Evolution event");
    expect(responseData.keyEvents).toContain("Death event");
  });
});
