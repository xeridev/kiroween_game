/**
 * Tests for narrative generator tone influence functionality
 */

import { describe, it, expect } from "vitest";
import { mapReactionsToToneKeywords, deduplicateToneKeywords } from "./narrativeGenerator";
import type { ReactionData } from "./types";

describe("Tone Influence Helper Functions", () => {
  describe("mapReactionsToToneKeywords", () => {
    it("should map COMFORT reaction to 'comforted' keyword", () => {
      const reactions: ReactionData[] = [
        {
          reactionType: "COMFORT",
          timestamp: Date.now(),
          statDelta: { sanity: 2 },
        },
      ];

      const keywords = mapReactionsToToneKeywords(reactions);
      expect(keywords).toEqual(["comforted"]);
    });

    it("should map FEAR reaction to 'terrified' keyword", () => {
      const reactions: ReactionData[] = [
        {
          reactionType: "FEAR",
          timestamp: Date.now(),
          statDelta: { sanity: -3, corruption: 1 },
        },
      ];

      const keywords = mapReactionsToToneKeywords(reactions);
      expect(keywords).toEqual(["terrified"]);
    });

    it("should map LOVE reaction to 'cherished' keyword", () => {
      const reactions: ReactionData[] = [
        {
          reactionType: "LOVE",
          timestamp: Date.now(),
          statDelta: { sanity: 3, corruption: -1 },
        },
      ];

      const keywords = mapReactionsToToneKeywords(reactions);
      expect(keywords).toEqual(["cherished"]);
    });

    it("should map DREAD reaction to 'haunted' keyword", () => {
      const reactions: ReactionData[] = [
        {
          reactionType: "DREAD",
          timestamp: Date.now(),
          statDelta: { sanity: -2, corruption: 2 },
        },
      ];

      const keywords = mapReactionsToToneKeywords(reactions);
      expect(keywords).toEqual(["haunted"]);
    });

    it("should map HOPE reaction to 'hopeful' keyword", () => {
      const reactions: ReactionData[] = [
        {
          reactionType: "HOPE",
          timestamp: Date.now(),
          statDelta: { sanity: 1 },
        },
      ];

      const keywords = mapReactionsToToneKeywords(reactions);
      expect(keywords).toEqual(["hopeful"]);
    });

    it("should map multiple reactions to their respective keywords", () => {
      const reactions: ReactionData[] = [
        {
          reactionType: "COMFORT",
          timestamp: Date.now(),
          statDelta: { sanity: 2 },
        },
        {
          reactionType: "FEAR",
          timestamp: Date.now(),
          statDelta: { sanity: -3, corruption: 1 },
        },
        {
          reactionType: "LOVE",
          timestamp: Date.now(),
          statDelta: { sanity: 3, corruption: -1 },
        },
      ];

      const keywords = mapReactionsToToneKeywords(reactions);
      expect(keywords).toEqual(["comforted", "terrified", "cherished"]);
    });

    it("should return empty array for empty reactions", () => {
      const reactions: ReactionData[] = [];
      const keywords = mapReactionsToToneKeywords(reactions);
      expect(keywords).toEqual([]);
    });
  });

  describe("deduplicateToneKeywords", () => {
    it("should remove duplicate keywords", () => {
      const keywords = ["comforted", "terrified", "comforted", "cherished", "terrified"];
      const deduplicated = deduplicateToneKeywords(keywords);
      expect(deduplicated).toEqual(["comforted", "terrified", "cherished"]);
    });

    it("should preserve order of first occurrence", () => {
      const keywords = ["haunted", "hopeful", "haunted", "comforted"];
      const deduplicated = deduplicateToneKeywords(keywords);
      expect(deduplicated).toEqual(["haunted", "hopeful", "comforted"]);
    });

    it("should handle empty array", () => {
      const keywords: string[] = [];
      const deduplicated = deduplicateToneKeywords(keywords);
      expect(deduplicated).toEqual([]);
    });

    it("should handle array with no duplicates", () => {
      const keywords = ["comforted", "terrified", "cherished"];
      const deduplicated = deduplicateToneKeywords(keywords);
      expect(deduplicated).toEqual(["comforted", "terrified", "cherished"]);
    });

    it("should handle array with all duplicates", () => {
      const keywords = ["comforted", "comforted", "comforted"];
      const deduplicated = deduplicateToneKeywords(keywords);
      expect(deduplicated).toEqual(["comforted"]);
    });
  });
});

describe("Memory System Functions", () => {
  describe("extractKeyEvents", () => {
    it("should extract key events from logs", async () => {
      const { extractKeyEvents } = await import("./narrativeGenerator");
      const logs = [
        {
          id: "1",
          text: "Pet evolved to BABY",
          source: "SYSTEM" as const,
          timestamp: 10,
          eventType: "evolution" as const,
        },
        {
          id: "2",
          text: "Pet was fed",
          source: "PET" as const,
          timestamp: 20,
        },
        {
          id: "3",
          text: "Pet was placated",
          source: "PET" as const,
          timestamp: 30,
          eventType: "placate" as const,
        },
      ];

      const keyEvents = extractKeyEvents(logs);
      expect(keyEvents).toHaveLength(2);
      expect(keyEvents[0]).toEqual({
        type: "evolution",
        text: "Pet evolved to BABY",
        age: 10,
      });
      expect(keyEvents[1]).toEqual({
        type: "placate",
        text: "Pet was placated",
        age: 30,
      });
    });

    it("should return empty array for logs without key events", async () => {
      const { extractKeyEvents } = await import("./narrativeGenerator");
      const logs = [
        {
          id: "1",
          text: "Pet was fed",
          source: "PET" as const,
          timestamp: 10,
        },
      ];

      const keyEvents = extractKeyEvents(logs);
      expect(keyEvents).toEqual([]);
    });
  });

  describe("buildNarrativeContext", () => {
    it("should build context from last 5 logs", async () => {
      const { buildNarrativeContext } = await import("./narrativeGenerator");
      const logs = [
        { id: "1", text: "Log 1", source: "SYSTEM" as const, timestamp: 10 },
        { id: "2", text: "Log 2", source: "SYSTEM" as const, timestamp: 20 },
        { id: "3", text: "Log 3", source: "SYSTEM" as const, timestamp: 30 },
        { id: "4", text: "Log 4", source: "SYSTEM" as const, timestamp: 40 },
        { id: "5", text: "Log 5", source: "SYSTEM" as const, timestamp: 50 },
        { id: "6", text: "Log 6", source: "SYSTEM" as const, timestamp: 60 },
        { id: "7", text: "Log 7", source: "SYSTEM" as const, timestamp: 70 },
      ];

      const context = buildNarrativeContext(
        logs,
        { sanity: 50, corruption: 30 }
      );

      expect(context.recentLogs).toHaveLength(5);
      expect(context.recentLogs[0].id).toBe("3");
      expect(context.recentLogs[4].id).toBe("7");
    });

    it("should calculate stat changes", async () => {
      const { buildNarrativeContext } = await import("./narrativeGenerator");
      const logs = [
        { id: "1", text: "Log 1", source: "SYSTEM" as const, timestamp: 10 },
      ];

      const context = buildNarrativeContext(
        logs,
        { sanity: 50, corruption: 30 },
        { sanity: 70, corruption: 20 }
      );

      expect(context.statChanges).toEqual({
        sanity: -20,
        corruption: 10,
      });
    });

    it("should calculate time elapsed", async () => {
      const { buildNarrativeContext } = await import("./narrativeGenerator");
      const logs = [
        { id: "1", text: "Log 1", source: "SYSTEM" as const, timestamp: 10 },
        { id: "2", text: "Log 2", source: "SYSTEM" as const, timestamp: 100 },
      ];

      const context = buildNarrativeContext(
        logs,
        { sanity: 50, corruption: 30 }
      );

      expect(context.timeElapsed).toBe(90);
    });
  });

  describe("formatNarrativeContextString", () => {
    it("should format context with key events", async () => {
      const { formatNarrativeContextString } = await import("./narrativeGenerator");
      const context = {
        recentLogs: [],
        keyEvents: [
          { type: "evolution" as const, text: "Pet evolved", age: 10 },
          { type: "placate" as const, text: "Pet was comforted", age: 20 },
        ],
        statChanges: { sanity: 0, corruption: 0 },
        timeElapsed: 0,
      };

      const formatted = formatNarrativeContextString(context);
      expect(formatted).toContain("Recent significant events:");
      expect(formatted).toContain("At age 10 minutes: Pet evolved");
      expect(formatted).toContain("At age 20 minutes: Pet was comforted");
    });

    it("should format context with significant stat changes", async () => {
      const { formatNarrativeContextString } = await import("./narrativeGenerator");
      const context = {
        recentLogs: [],
        keyEvents: [],
        statChanges: { sanity: -25, corruption: 30 },
        timeElapsed: 0,
      };

      const formatted = formatNarrativeContextString(context);
      expect(formatted).toContain("Sanity has changed significantly (-25)");
      expect(formatted).toContain("Corruption has changed significantly (+30)");
    });

    it("should format context with time passage", async () => {
      const { formatNarrativeContextString } = await import("./narrativeGenerator");
      const context = {
        recentLogs: [],
        keyEvents: [],
        statChanges: { sanity: 0, corruption: 0 },
        timeElapsed: 25 * 60, // 25 hours
      };

      const formatted = formatNarrativeContextString(context);
      expect(formatted).toContain("25 hours have passed");
    });

    it("should truncate context to 2000 characters", async () => {
      const { formatNarrativeContextString } = await import("./narrativeGenerator");
      const longText = "A".repeat(500);
      const context = {
        recentLogs: [
          { id: "1", text: longText, source: "SYSTEM" as const, timestamp: 10 },
          { id: "2", text: longText, source: "SYSTEM" as const, timestamp: 20 },
          { id: "3", text: longText, source: "SYSTEM" as const, timestamp: 30 },
          { id: "4", text: longText, source: "SYSTEM" as const, timestamp: 40 },
          { id: "5", text: longText, source: "SYSTEM" as const, timestamp: 50 },
        ],
        keyEvents: [],
        statChanges: { sanity: 0, corruption: 0 },
        timeElapsed: 0,
      };

      const formatted = formatNarrativeContextString(context);
      expect(formatted.length).toBeLessThanOrEqual(2003); // 2000 + "..."
    });
  });
});
