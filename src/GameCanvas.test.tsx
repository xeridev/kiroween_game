import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { GameCanvas } from "./GameCanvas";
import type { PetTraits } from "./types";

// Mock PixiJS to avoid canvas rendering issues in test environment
vi.mock("pixi.js", () => {
  const mockTicker = {
    add: vi.fn(),
    remove: vi.fn(),
    deltaTime: 1,
  };

  const mockStage = {
    addChild: vi.fn(),
    removeChild: vi.fn(),
  };

  const mockRenderer = {
    resize: vi.fn(),
  };

  class MockGraphics {
    x = 0;
    y = 0;
    alpha = 1;
    clear = vi.fn();
    beginFill = vi.fn();
    endFill = vi.fn();
    drawEllipse = vi.fn();
    drawCircle = vi.fn();
    moveTo = vi.fn();
    lineTo = vi.fn();
    closePath = vi.fn();
  }

  class MockApplication {
    ticker = mockTicker;
    stage = mockStage;
    renderer = mockRenderer;
    screen = { width: 800, height: 600 };
    canvas = document.createElement("canvas");

    init = vi.fn().mockResolvedValue(undefined);
    destroy = vi.fn();
  }

  return {
    Application: MockApplication,
    Graphics: MockGraphics,
  };
});

describe("GameCanvas", () => {
  const mockTraits: PetTraits = {
    name: "TestPet",
    archetype: "GLOOM",
    color: 0x8b5cf6,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render without crashing", () => {
    const { container } = render(
      <GameCanvas traits={mockTraits} stage="EGG" sanity={100} corruption={0} />
    );
    expect(container).toBeTruthy();
  });

  it("should render with GLOOM archetype", () => {
    const { container } = render(
      <GameCanvas
        traits={{ ...mockTraits, archetype: "GLOOM" }}
        stage="BABY"
        sanity={80}
        corruption={10}
      />
    );
    expect(container).toBeTruthy();
  });

  it("should render with SPARK archetype", () => {
    const { container } = render(
      <GameCanvas
        traits={{ ...mockTraits, archetype: "SPARK" }}
        stage="TEEN"
        sanity={50}
        corruption={30}
      />
    );
    expect(container).toBeTruthy();
  });

  it("should render with ECHO archetype", () => {
    const { container } = render(
      <GameCanvas
        traits={{ ...mockTraits, archetype: "ECHO" }}
        stage="ABOMINATION"
        sanity={20}
        corruption={90}
      />
    );
    expect(container).toBeTruthy();
  });

  it("should handle low sanity (horror effects)", () => {
    const { container } = render(
      <GameCanvas
        traits={mockTraits}
        stage="TEEN"
        sanity={15}
        corruption={50}
      />
    );
    expect(container).toBeTruthy();
  });

  it("should handle different stages", () => {
    const stages: Array<"EGG" | "BABY" | "TEEN" | "ABOMINATION"> = [
      "EGG",
      "BABY",
      "TEEN",
      "ABOMINATION",
    ];

    stages.forEach((stage) => {
      const { container } = render(
        <GameCanvas
          traits={mockTraits}
          stage={stage}
          sanity={100}
          corruption={0}
        />
      );
      expect(container).toBeTruthy();
    });
  });
});
