import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../store";
import type { VisualTraits } from "./types";

describe("Visual Traits System", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store
    useGameStore.getState().reset();
  });

  describe("storeVisualTraits", () => {
    it("should store visual traits in localStorage", () => {
      const traits: VisualTraits = {
        archetype: "GLOOM",
        stage: "BABY",
        colorPalette: ["#000000", "#333333"],
        keyFeatures: ["shadowy form", "hollow eyes"],
        styleKeywords: ["mysterious", "haunting"],
      };

      useGameStore.getState().storeVisualTraits("log-1", traits);

      // Verify traits are stored in localStorage
      const stored = localStorage.getItem("creepy-companion-visual-traits");
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].logId).toBe("log-1");
      expect(parsed[0].traits).toEqual(traits);
    });

    it("should implement LRU cache with max 10 traits", () => {
      // Store 15 traits
      for (let i = 0; i < 15; i++) {
        const traits: VisualTraits = {
          archetype: "GLOOM",
          stage: "BABY",
          colorPalette: ["#000000"],
          keyFeatures: [`feature-${i}`],
          styleKeywords: ["test"],
        };
        useGameStore.getState().storeVisualTraits(`log-${i}`, traits);
      }

      // Verify only last 10 are kept
      const stored = localStorage.getItem("creepy-companion-visual-traits");
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(10);

      // Verify it's the last 10 (indices 5-14)
      expect(parsed[0].logId).toBe("log-5");
      expect(parsed[9].logId).toBe("log-14");
    });

    it("should update currentVisualTraits in store", () => {
      const traits: VisualTraits = {
        archetype: "SPARK",
        stage: "TEEN",
        colorPalette: ["#ffff00"],
        keyFeatures: ["electric energy"],
        styleKeywords: ["crackling"],
      };

      useGameStore.getState().storeVisualTraits("log-1", traits);

      // Verify currentVisualTraits is updated
      const currentTraits = useGameStore.getState().currentVisualTraits;
      expect(currentTraits).toEqual(traits);
    });

    it("should handle storage errors gracefully", () => {
      // Mock localStorage.setItem to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error("Storage quota exceeded");
      };

      const traits: VisualTraits = {
        archetype: "ECHO",
        stage: "EGG",
        colorPalette: ["#0000ff"],
        keyFeatures: ["translucent"],
        styleKeywords: ["ethereal"],
      };

      // Should not throw
      expect(() => {
        useGameStore.getState().storeVisualTraits("log-1", traits);
      }).not.toThrow();

      // Restore original
      localStorage.setItem = originalSetItem;
    });
  });

  describe("getVisualTraits", () => {
    it("should return null when no traits are stored", () => {
      const traits = useGameStore.getState().getVisualTraits();
      expect(traits).toBeNull();
    });

    it("should return most recent traits from localStorage", () => {
      const traits1: VisualTraits = {
        archetype: "GLOOM",
        stage: "BABY",
        colorPalette: ["#000000"],
        keyFeatures: ["old"],
        styleKeywords: ["old"],
      };

      const traits2: VisualTraits = {
        archetype: "SPARK",
        stage: "TEEN",
        colorPalette: ["#ffff00"],
        keyFeatures: ["new"],
        styleKeywords: ["new"],
      };

      useGameStore.getState().storeVisualTraits("log-1", traits1);
      useGameStore.getState().storeVisualTraits("log-2", traits2);

      // Clear store state to force retrieval from localStorage
      useGameStore.setState({ currentVisualTraits: null });

      const retrieved = useGameStore.getState().getVisualTraits();
      expect(retrieved).toEqual(traits2);
    });

    it("should return traits from store if available", () => {
      const traits: VisualTraits = {
        archetype: "ECHO",
        stage: "ABOMINATION",
        colorPalette: ["#0000ff"],
        keyFeatures: ["corrupted"],
        styleKeywords: ["twisted"],
      };

      // Set directly in store
      useGameStore.setState({ currentVisualTraits: traits });

      const retrieved = useGameStore.getState().getVisualTraits();
      expect(retrieved).toEqual(traits);
    });

    it("should handle retrieval errors gracefully", () => {
      // Store valid traits first
      const traits: VisualTraits = {
        archetype: "GLOOM",
        stage: "BABY",
        colorPalette: ["#000000"],
        keyFeatures: ["test"],
        styleKeywords: ["test"],
      };
      useGameStore.getState().storeVisualTraits("log-1", traits);

      // Corrupt the localStorage data
      localStorage.setItem("creepy-companion-visual-traits", "invalid json");

      // Clear store state
      useGameStore.setState({ currentVisualTraits: null });

      // Should return null instead of throwing
      const retrieved = useGameStore.getState().getVisualTraits();
      expect(retrieved).toBeNull();
    });
  });

  describe("Integration with image generation", () => {
    it("should extract traits based on archetype and stage", () => {
      // Initialize a pet
      useGameStore.getState().initializePet("TestPet", "GLOOM", 0x000000);

      // Manually create traits as would happen in generateLogImage
      const state = useGameStore.getState();
      const traits: VisualTraits = {
        archetype: state.traits.archetype,
        stage: state.stage,
        colorPalette: [`#${state.traits.color.toString(16).padStart(6, "0")}`],
        keyFeatures: ["shadowy form", "hollow eyes", "melancholic aura"],
        styleKeywords: ["mysterious", "otherworldly", "haunting"],
      };

      useGameStore.getState().storeVisualTraits("log-1", traits);

      const retrieved = useGameStore.getState().getVisualTraits();
      expect(retrieved?.archetype).toBe("GLOOM");
      expect(retrieved?.stage).toBe("EGG");
      expect(retrieved?.keyFeatures).toContain("shadowy form");
    });
  });
});
