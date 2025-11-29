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
