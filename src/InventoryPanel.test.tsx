import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InventoryPanel } from "./InventoryPanel";
import type { Offering } from "./types";

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
      <InventoryPanel
        inventory={[]}
        onFeed={onFeed}
        canScavenge={true}
        onScavenge={onScavenge}
      />
    );

    expect(screen.getByText("No offerings found")).toBeInTheDocument();
    expect(screen.getByText("0/3")).toBeInTheDocument();
  });

  it("renders inventory items with icons", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    render(
      <InventoryPanel
        inventory={mockOfferings}
        onFeed={onFeed}
        canScavenge={true}
        onScavenge={onScavenge}
      />
    );

    expect(screen.getByText("✨")).toBeInTheDocument();
    expect(screen.getByText("🦴")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
  });

  it("calls onFeed when item is clicked", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    render(
      <InventoryPanel
        inventory={mockOfferings}
        onFeed={onFeed}
        canScavenge={true}
        onScavenge={onScavenge}
      />
    );

    const firstItem = screen.getByText("✨").closest(".inventory-item");
    fireEvent.click(firstItem!);

    expect(onFeed).toHaveBeenCalledWith("1");
  });

  it("shows tooltip on hover", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    render(
      <InventoryPanel
        inventory={mockOfferings}
        onFeed={onFeed}
        canScavenge={true}
        onScavenge={onScavenge}
      />
    );

    const firstItem = screen.getByText("✨").closest(".inventory-item");
    fireEvent.mouseEnter(firstItem!);

    expect(
      screen.getByText("A glowing crystal that hums softly")
    ).toBeInTheDocument();
  });

  it("hides tooltip on mouse leave", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    render(
      <InventoryPanel
        inventory={mockOfferings}
        onFeed={onFeed}
        canScavenge={true}
        onScavenge={onScavenge}
      />
    );

    const firstItem = screen.getByText("✨").closest(".inventory-item");
    fireEvent.mouseEnter(firstItem!);
    expect(
      screen.getByText("A glowing crystal that hums softly")
    ).toBeInTheDocument();

    fireEvent.mouseLeave(firstItem!);
    expect(
      screen.queryByText("A glowing crystal that hums softly")
    ).not.toBeInTheDocument();
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
      <InventoryPanel
        inventory={fullInventory}
        onFeed={onFeed}
        canScavenge={false}
        onScavenge={onScavenge}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Inventory Full");
  });

  it("enables scavenge button when inventory has space", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    render(
      <InventoryPanel
        inventory={mockOfferings}
        onFeed={onFeed}
        canScavenge={true}
        onScavenge={onScavenge}
      />
    );

    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent("Scavenge for Offerings");
  });

  it("calls onScavenge when scavenge button is clicked", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    render(
      <InventoryPanel
        inventory={mockOfferings}
        onFeed={onFeed}
        canScavenge={true}
        onScavenge={onScavenge}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(onScavenge).toHaveBeenCalledTimes(1);
  });

  it("does not reveal item type in UI", () => {
    const onFeed = vi.fn();
    const onScavenge = vi.fn();

    const { container } = render(
      <InventoryPanel
        inventory={mockOfferings}
        onFeed={onFeed}
        canScavenge={true}
        onScavenge={onScavenge}
      />
    );

    // Check that "PURITY" and "ROT" text do not appear anywhere in the rendered output
    expect(container.textContent).not.toContain("PURITY");
    expect(container.textContent).not.toContain("ROT");
  });
});
