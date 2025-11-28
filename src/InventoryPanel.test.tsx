import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { InventoryPanel } from "./components/InventoryPanel";
import type { Offering } from "./utils/types";

// Wrapper component to provide DndContext for tests
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <DndContext>{children}</DndContext>;
}

describe("InventoryPanel", () => {
  const mockOfferings: Offering[] = [
    {
      id: "1",
      type: "PURITY",
      description: "A glowing crystal that hums softly",
      icon: "✨",
    },
    {
      id: "2",
      type: "ROT",
      description: "A decaying bone that whispers secrets",
      icon: "🦴",
    },
  ];

  it("renders empty inventory state", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    render(
      <TestWrapper>
        <InventoryPanel
          inventory={[]}
          onFeed={onFeed}
          canScavenge={true}
          onScavenge={onScavenge}
        />
      </TestWrapper>
    );

    expect(screen.getByText("No offerings found")).toBeInTheDocument();
    expect(screen.getByText("0/3")).toBeInTheDocument();
  });

  it("renders inventory items with icons", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    render(
      <TestWrapper>
        <InventoryPanel
          inventory={mockOfferings}
          onFeed={onFeed}
          canScavenge={true}
          onScavenge={onScavenge}
        />
      </TestWrapper>
    );

    expect(screen.getByText("✨")).toBeInTheDocument();
    expect(screen.getByText("🦴")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
  });


  it("displays description in card", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    render(
      <TestWrapper>
        <InventoryPanel
          inventory={mockOfferings}
          onFeed={onFeed}
          canScavenge={true}
          onScavenge={onScavenge}
        />
      </TestWrapper>
    );

    // Descriptions are now always visible in cards (no tooltip)
    expect(
      screen.getByText("A glowing crystal that hums softly")
    ).toBeInTheDocument();
    expect(
      screen.getByText("A decaying bone that whispers secrets")
    ).toBeInTheDocument();
  });

  it("displays Mystery Item title on cards", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    render(
      <TestWrapper>
        <InventoryPanel
          inventory={mockOfferings}
          onFeed={onFeed}
          canScavenge={true}
          onScavenge={onScavenge}
        />
      </TestWrapper>
    );

    // Each card should have "Mystery Item" title
    const mysteryTitles = screen.getAllByText("Mystery Item");
    expect(mysteryTitles).toHaveLength(2);
  });

  it("disables scavenge button when inventory is full", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    const fullInventory: Offering[] = [
      ...mockOfferings,
      {
        id: "3",
        type: "PURITY",
        description: "Another offering",
        icon: "✨",
      },
    ];

    render(
      <TestWrapper>
        <InventoryPanel
          inventory={fullInventory}
          onFeed={onFeed}
          canScavenge={false}
          onScavenge={onScavenge}
        />
      </TestWrapper>
    );

    const scavengeButton = screen.getByRole("button", {
      name: /scavenge|inventory full/i,
    });
    expect(scavengeButton).toBeDisabled();
    expect(scavengeButton).toHaveTextContent("Inventory Full");
  });

  it("enables scavenge button when inventory has space", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    render(
      <TestWrapper>
        <InventoryPanel
          inventory={mockOfferings}
          onFeed={onFeed}
          canScavenge={true}
          onScavenge={onScavenge}
        />
      </TestWrapper>
    );

    const scavengeButton = screen.getByRole("button", { name: /scavenge/i });
    expect(scavengeButton).not.toBeDisabled();
    expect(scavengeButton).toHaveTextContent("Scavenge for Offerings");
  });

  it("calls onScavenge when scavenge button is clicked", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    render(
      <TestWrapper>
        <InventoryPanel
          inventory={mockOfferings}
          onFeed={onFeed}
          canScavenge={true}
          onScavenge={onScavenge}
        />
      </TestWrapper>
    );

    const scavengeButton = screen.getByRole("button", { name: /scavenge/i });
    fireEvent.click(scavengeButton);

    expect(onScavenge).toHaveBeenCalledTimes(1);
  });

  it("does not reveal item type in UI", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    const { container } = render(
      <TestWrapper>
        <InventoryPanel
          inventory={mockOfferings}
          onFeed={onFeed}
          canScavenge={true}
          onScavenge={onScavenge}
        />
      </TestWrapper>
    );

    // Check that "PURITY" and "ROT" text do not appear anywhere in the rendered output
    expect(container.textContent).not.toContain("PURITY");
    expect(container.textContent).not.toContain("ROT");
  });
});
