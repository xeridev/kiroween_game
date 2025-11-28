import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import handler after mocking
import handler from "./generateImage";

// Mock VercelRequest and VercelResponse
function createMockRequest(body: any, method = "POST") {
  return {
    method,
    body,
  } as any;
}

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    body: null,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockImplementation((data) => {
      res.body = data;
      return res;
    }),
  };
  return res;
}

describe("generateImage API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set up environment variable
    process.env.RUNPOD_API_KEY = "test-api-key";
  });

  afterEach(() => {
    delete process.env.RUNPOD_API_KEY;
  });

  describe("request validation", () => {
    it("rejects non-POST requests", async () => {
      const req = createMockRequest({}, "GET");
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
    });

    it("rejects missing narrativeText", async () => {
      const req = createMockRequest({
        petName: "Gloom",
        archetype: "GLOOM",
        stage: "BABY",
        sourceImages: ["data:image/png;base64,test"],
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.error).toContain("narrativeText");
    });

    it("rejects missing petName", async () => {
      const req = createMockRequest({
        narrativeText: "Test narrative",
        archetype: "GLOOM",
        stage: "BABY",
        sourceImages: ["data:image/png;base64,test"],
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.error).toContain("petName");
    });

    it("rejects invalid archetype", async () => {
      const req = createMockRequest({
        narrativeText: "Test narrative",
        petName: "Gloom",
        archetype: "INVALID",
        stage: "BABY",
        sourceImages: ["data:image/png;base64,test"],
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.error).toContain("archetype");
    });

    it("rejects invalid stage", async () => {
      const req = createMockRequest({
        narrativeText: "Test narrative",
        petName: "Gloom",
        archetype: "GLOOM",
        stage: "INVALID",
        sourceImages: ["data:image/png;base64,test"],
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.error).toContain("stage");
    });

    it("rejects empty sourceImages array", async () => {
      const req = createMockRequest({
        narrativeText: "Test narrative",
        petName: "Gloom",
        archetype: "GLOOM",
        stage: "BABY",
        sourceImages: [],
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.error).toContain("source image");
    });

    it("rejects missing RUNPOD_API_KEY", async () => {
      delete process.env.RUNPOD_API_KEY;

      const req = createMockRequest({
        narrativeText: "Test narrative",
        petName: "Gloom",
        archetype: "GLOOM",
        stage: "BABY",
        sourceImages: ["data:image/png;base64,test"],
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.body.error).toContain("configuration");
    });
  });

  describe("successful job submission and polling", () => {
    it("submits job and returns image URL on completion", async () => {
      const jobId = "test-job-123";
      const imageUrl = "https://example.com/generated-image.png";

      // Mock job submission
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: jobId }),
      });

      // Mock status polling - completed on first poll
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: "COMPLETED",
          output: { result: imageUrl },
        }),
      });

      const req = createMockRequest({
        narrativeText: "Gloom devours the offering hungrily",
        petName: "Gloom",
        archetype: "GLOOM",
        stage: "BABY",
        sourceImages: ["data:image/png;base64,testimage"],
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.body).toEqual({ imageUrl });

      // Verify job submission call
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.runpod.ai/v2/nano-banana-edit/run",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
          }),
        })
      );
    });

    it("handles image_url output format", async () => {
      const imageUrl = "https://example.com/image.png";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "job-123" }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: "COMPLETED",
          output: { image_url: imageUrl },
        }),
      });

      const req = createMockRequest({
        narrativeText: "Test",
        petName: "Spark",
        archetype: "SPARK",
        stage: "TEEN",
        sourceImages: ["data:image/png;base64,test"],
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.body).toEqual({ imageUrl });
    });

    it("handles base64 image output format", async () => {
      const base64Image = "data:image/png;base64,iVBORw0KGgo...";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "job-123" }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: "COMPLETED",
          output: { image: base64Image },
        }),
      });

      const req = createMockRequest({
        narrativeText: "Test",
        petName: "Echo",
        archetype: "ECHO",
        stage: "EGG",
        sourceImages: ["data:image/png;base64,test"],
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.body).toEqual({ imageUrl: base64Image });
    });
  });

  describe("error handling", () => {
    it("handles job submission failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal server error"),
      });

      const req = createMockRequest({
        narrativeText: "Test",
        petName: "Gloom",
        archetype: "GLOOM",
        stage: "BABY",
        sourceImages: ["data:image/png;base64,test"],
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.body.error).toContain("submit");
    });

    it("handles job failure status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "job-123" }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: "FAILED",
          error: "Safety checker triggered",
        }),
      });

      const req = createMockRequest({
        narrativeText: "Test",
        petName: "Gloom",
        archetype: "GLOOM",
        stage: "ABOMINATION",
        sourceImages: ["data:image/png;base64,test"],
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.body.error).toContain("failed");
    });

    it("handles network errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const req = createMockRequest({
        narrativeText: "Test",
        petName: "Gloom",
        archetype: "GLOOM",
        stage: "BABY",
        sourceImages: ["data:image/png;base64,test"],
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.body.error).toContain("Failed to generate");
    });
  });

  describe("prompt building", () => {
    it("includes archetype and stage in prompt", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "job-123" }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: "COMPLETED",
          output: { result: "https://example.com/image.png" },
        }),
      });

      const req = createMockRequest({
        narrativeText: "The creature awakens",
        petName: "Shadow",
        archetype: "GLOOM",
        stage: "ABOMINATION",
        sourceImages: ["data:image/png;base64,test"],
        itemType: "ROT",
      });
      const res = createMockResponse();

      await handler(req, res);

      // Verify the prompt includes key elements
      const submitCall = mockFetch.mock.calls[0];
      const body = JSON.parse(submitCall[1].body);
      
      expect(body.input.prompt).toContain("Shadow");
      expect(body.input.prompt).toContain("GLOOM");
      expect(body.input.prompt).toContain("ABOMINATION");
      expect(body.input.prompt).toContain("The creature awakens");
    });
  });
});
