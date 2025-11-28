import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CreationScreen from "./components/CreationScreen";
import { InventoryPanel } from "./components/InventoryPanel";
import { UIOverlay } from "./components/UIOverlay";
import type { Offering, PetStats, NarrativeLog } from "./utils/types";

describe("Accessibility Features", () => {
  describe("CreationScreen", () => {
    it("should have proper ARIA labels on form elements", () => {
      const mockOnComplete = vi.fn();
      render(<CreationScreen onComplete={mockOnComplete} />);

      // Check form has aria-label
      const form = screen.getByRole("form");
      expect(form).toHaveAttribute("aria-label", "Pet creation form");

      // Check name input has label
      const nameInput = screen.getByLabelText("Name");
      expect(nameInput).toBeInTheDocument();

      // Check archetype buttons have aria-pressed
      const gloomButton = screen.getByRole("button", { name: /GLOOM/i });
      expect(gloomButton).toHaveAttribute("aria-pressed");
    });

    it("should have keyboard navigable archetype buttons", () => {
      const mockOnComplete = vi.fn();
      render(<CreationScreen onComplete={mockOnComplete} />);

      const buttons = screen.getAllByRole("button");
      // Should have 3 archetype buttons + 1 submit button
      expect(buttons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("InventoryPanel", () => {
    it("should have proper ARIA labels on inventory region", () => {
      const mockOfferings: Offering[] = [
        {
          id: "1",
          type: "PURITY",
          description: "A glowing orb",
          icon: "✨",
        },
      ];

      render(
        <InventoryPanel
          inventory={mockOfferings}
          onFeed={vi.fn()}
          canScavenge={true}
          onScavenge={vi.fn()}
        />
      );

      // Check region has aria-label
      const region = screen.getByRole("region", { name: "Inventory" });
      expect(region).toBeInTheDocument();

      // Check inventory cards are keyboard accessible buttons
      const itemButton = screen.getByRole("button", {
        name: /Feed offering: A glowing orb/i,
      });
      expect(itemButton).toBeInTheDocument();
      expect(itemButton).toHaveAttribute("tabindex", "0");
    });

    it("should have accessible scavenge button", () => {
      render(
        <InventoryPanel
          inventory={[]}
          onFeed={vi.fn()}
          canScavenge={true}
          onScavenge={vi.fn()}
        />
      );

      const scavengeButton = screen.getByRole("button", {
        name: /Scavenge for new offerings/i,
      });
      expect(scavengeButton).toBeInTheDocument();
      expect(scavengeButton).not.toBeDisabled();
    });

    it("should indicate when inventory is full", () => {
      const fullInventory: Offering[] = [
        { id: "1", type: "PURITY", description: "Item 1", icon: "✨" },
        { id: "2", type: "ROT", description: "Item 2", icon: "💀" },
        { id: "3", type: "PURITY", description: "Item 3", icon: "🌟" },
      ];

      render(
        <InventoryPanel
          inventory={fullInventory}
          onFeed={vi.fn()}
          canScavenge={false}
          onScavenge={vi.fn()}
        />
      );

      const scavengeButton = screen.getByRole("button", {
        name: /Cannot scavenge, inventory is full/i,
      });
      expect(scavengeButton).toBeDisabled();
    });
  });

  describe("UIOverlay", () => {
    const mockStats: PetStats = {
      hunger: 50,
      sanity: 75,
      corruption: 20,
    };

    const mockLogs: NarrativeLog[] = [
      {
        id: "1",
        text: "The creature stirs",
        source: "SYSTEM",
        timestamp: 10,
      },
    ];

    it("should have proper ARIA labels on stat bars", () => {
      render(
        <UIOverlay
          stats={mockStats}
          stage="BABY"
          age={100}
          logs={mockLogs}
          gameDay={1}
          dailyFeeds={2}
        />
      );

      // Check progress bars have proper ARIA attributes
      const hungerBar = screen.getByRole("progressbar", {
        name: /Hunger/i,
      });
      expect(hungerBar).toHaveAttribute("aria-valuenow", "50");
      expect(hungerBar).toHaveAttribute("aria-valuemin", "0");
      expect(hungerBar).toHaveAttribute("aria-valuemax", "100");

      const sanityBar = screen.getByRole("progressbar", {
        name: /Sanity/i,
      });
      expect(sanityBar).toHaveAttribute("aria-valuenow", "75");
    });

    it("should have live regions for dynamic content", () => {
      render(
        <UIOverlay
          stats={mockStats}
          stage="BABY"
          age={100}
          logs={mockLogs}
          gameDay={1}
          dailyFeeds={2}
        />
      );

      // Check for live regions
      const hungerBar = screen.getByRole("progressbar", {
        name: /Hunger/i,
      });
      expect(hungerBar).toHaveAttribute("aria-live", "polite");

      const logContainer = screen.getByRole("log");
      expect(logContainer).toHaveAttribute("aria-live", "polite");
    });

    it("should have keyboard accessible log container", () => {
      render(
        <UIOverlay
          stats={mockStats}
          stage="BABY"
          age={100}
          logs={mockLogs}
          gameDay={1}
          dailyFeeds={2}
        />
      );

      const logContainer = screen.getByRole("log");
      expect(logContainer).toHaveAttribute("tabIndex", "0");
    });
  });
});
