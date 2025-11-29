import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock global fetch for API calls
globalThis.fetch = vi.fn((url) => {
  // Mock /api/chat endpoint
  if (url.toString().includes('/api/chat')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ text: "Test narrative text" }),
    } as Response);
  }

  // Mock /api/selectSound endpoint
  if (url.toString().includes('/api/selectSound')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        primarySound: "test_sound",
        volume: 0.7,
        secondarySounds: [],
        ambientSound: null,
      }),
    } as Response);
  }

  // Default mock response
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as Response);
}) as typeof fetch;

// Mock IntersectionObserver for tests
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as any;
