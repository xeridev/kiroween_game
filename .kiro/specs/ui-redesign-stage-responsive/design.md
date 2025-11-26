# Design Document

## Overview

This design transforms the Kiroween Game from a fixed-width, scrollable layout into a full-page, stage-responsive experience that dynamically adapts its visual aesthetic as the pet evolves through four stages (EGG → BABY → TEEN → ABOMINATION). The design leverages CSS custom properties, data attributes, and hardware-accelerated animations to create a seamless progression from cutesy to horror aesthetics while maintaining 60fps performance.

### Key Design Principles

1. **Stage-Driven Theming**: All visual properties (colors, fonts, shadows, animations) are controlled by CSS custom properties scoped to `data-stage` attributes
2. **Viewport-Based Layout**: Use CSS Grid with vh/vw units for full-page layouts on desktop, with mobile-responsive fallbacks
3. **Performance-First Animations**: All animations use only `transform` and `opacity` properties for hardware acceleration
4. **Progressive Enhancement**: Core functionality works without animations; visual effects enhance the experience
5. **Accessibility Preservation**: Maintain existing ARIA labels, roles, and keyboard navigation

## Architecture

### Component Hierarchy

```
App (root container with data-stage attribute)
├── Header (10vh)
│   ├── Pet Name
│   └── Current Stage
├── Main Layout (CSS Grid)
│   ├── Stats Panel (25vw, left)
│   │   ├── Hunger Bar (heart-shaped)
│   │   └── Sanity Bar (brain-shaped)
│   ├── GameCanvas (50vw × 70vh, center)
│   │   └── PixiJS Renderer (responsive)
│   └── Narrative Log (25vw, right)
│       └── Journal-style scrollable log
└── Inventory Panel (bottom, 25vw left)
    ├── Offering Cards (flexbox)
    └── Scavenge Button
```

### CSS Architecture

**File Structure:**

- `src/themes.css` - New file containing all CSS custom properties per stage
- `src/index.css` - Import themes.css, define base layout grid
- `src/App.css` - App container and header styles
- `src/GameCanvas.css` - Canvas container responsive styles
- `src/UIOverlay.css` - Stats panel and log styles with theme variables
- `src/InventoryPanel.css` - Card-based inventory with theme variables

**Theme System:**

```css
/* themes.css structure */
:root {
  /* Default/fallback values */
}

[data-stage="EGG"] {
  --font-primary: "Fredoka One", cursive;
  --bg-primary: linear-gradient(135deg, #fff5f7 0%, #ffe6f0 100%);
  /* ... all EGG theme variables */
}

[data-stage="BABY"] {
  /* ... */
}
[data-stage="TEEN"] {
  /* ... */
}
[data-stage="ABOMINATION"] {
  /* ... */
}

/* Sanity overrides */
[data-sanity="critical"] {
  /* Additional effects when sanity < 30 */
}
```

### State Management Integration

**Zustand Store Connection:**

- Read `stage` from `useGameStore((state) => state.stage)`
- Read `stats.sanity` from `useGameStore((state) => state.stats.sanity)`
- Apply `data-stage={stage}` to root App container
- Apply `data-sanity={stats.sanity < 30 ? "critical" : "normal"}` to root container

**No Store Modifications Required:**

- All existing store logic remains unchanged
- Theme system is purely presentational (CSS-driven)
- React components only need to pass data attributes down

## Components and Interfaces

### App Component Changes

**Current Structure:**

```tsx
<div className="app">
  <div style={{ width: "800px", height: "600px" }}>
    <GameCanvas />
  </div>
  <UIOverlay />
  <InventoryPanel />
</div>
```

**New Structure:**

```tsx
<div
  className="app"
  data-stage={stage}
  data-sanity={stats.sanity < 30 ? "critical" : "normal"}
>
  <header className="app-header">
    <h1>{traits.name}</h1>
    <div className="stage-indicator">{stage}</div>
  </header>

  <main className="app-main">
    <aside className="stats-panel">
      {/* Stats from UIOverlay moved here */}
    </aside>

    <section className="canvas-container">
      <GameCanvas />
    </section>

    <aside className="log-panel">
      {/* Narrative log from UIOverlay moved here */}
    </aside>
  </main>

  <aside className="inventory-panel">
    <InventoryPanel />
  </aside>
</div>
```

### GameCanvas Component Changes

**Responsive Sizing Logic:**

```tsx
const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

useEffect(() => {
  const updateSize = () => {
    const width =
      window.innerWidth > 768
        ? window.innerWidth * 0.5 // 50vw on desktop
        : window.innerWidth; // 100vw on mobile

    const height =
      window.innerWidth > 768
        ? window.innerHeight * 0.7 // 70vh on desktop
        : window.innerHeight * 0.5; // 50vh on mobile

    setCanvasSize({ width, height });

    if (appRef.current) {
      appRef.current.renderer.resize(width, height);

      // Recenter pet graphics
      if (petGraphicsRef.current) {
        petGraphicsRef.current.x = width / 2;
        petGraphicsRef.current.y = height / 2;
      }
    }
  };

  updateSize();
  window.addEventListener("resize", updateSize);
  return () => window.removeEventListener("resize", updateSize);
}, []);
```

### UIOverlay Component Refactoring

**Split into Two Sections:**

1. **Stats Panel** (left sidebar) - Hunger and Sanity bars with organic shapes
2. **Narrative Log** (right sidebar) - Journal-style scrollable log

**Stat Bar Organic Shapes:**

```css
/* Heart shape for hunger bar */
.hunger-bar-container {
  clip-path: path(
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.46.86-8.55 11.54L12 21.35z"
  );
  width: 100%;
  height: 60px;
}

/* Brain/oval shape for sanity bar */
.sanity-bar-container {
  clip-path: ellipse(45% 50% at 50% 50%);
  width: 100%;
  height: 60px;
}
```

### InventoryPanel Component Changes

**Card-Based Layout:**

```tsx
<div className="inventory-cards">
  {inventory.map((offering) => (
    <div
      key={offering.id}
      className="offering-card"
      onClick={() => onFeed(offering.id)}
      tabIndex={0}
      role="button"
    >
      <div className="card-icon">{offering.icon}</div>
      <div className="card-title">Mystery Item</div>
      <div className="card-description">{offering.description}</div>
    </div>
  ))}
</div>
```

```css
.inventory-cards {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.offering-card {
  width: 150px;
  height: 200px;
  background: var(--bg-secondary);
  border: var(--border-style);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 15px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.offering-card:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
}
```

## Data Models

### CSS Custom Properties Schema

**Theme Variables (per stage):**

```typescript
interface ThemeVariables {
  // Typography
  fontPrimary: string; // Main headings
  fontBody: string; // Body text
  fontLog: string; // Narrative log

  // Colors
  bgPrimary: string; // Main background (gradient)
  bgSecondary: string; // Secondary surfaces
  accentPrimary: string; // Primary accent color
  accentSafe: string; // Positive/safe color
  accentDanger?: string; // Danger color (ABOMINATION only)
  textPrimary: string; // Main text color
  textGlitch?: string; // Glitch effect color (TEEN/ABOMINATION)

  // Visual Effects
  borderStyle: string; // Border width and color
  borderRadius: string; // Corner rounding
  shadow: string; // Box shadow

  // Stat Bars
  statHungerGradient: string;
  statSanityGradient: string;

  // Decorations
  decoration: string; // Emoji/symbols for ::before/::after
}
```

**Stage-Specific Values:**

**EGG Stage:**

```css
--font-primary: "Fredoka One", cursive;
--font-body: "Quicksand", sans-serif;
--font-log: "Comic Neue", cursive;
--bg-primary: linear-gradient(135deg, #fff5f7 0%, #ffe6f0 100%);
--bg-secondary: #e8d5ff;
--accent-primary: #ffb3d9;
--accent-safe: #b8e0d2;
--text-primary: #4a4a68;
--border-style: 4px solid #d4a5d4;
--border-radius: 25px;
--shadow: 0 8px 24px rgba(255, 183, 217, 0.4);
--stat-hunger-gradient: linear-gradient(90deg, #b8e0d2 0%, #ffb3d9 100%);
--stat-sanity-gradient: linear-gradient(90deg, #d4a5d4 0%, #b8e0d2 100%);
--decoration: "✨🎀🌸";
```

**BABY Stage:**

```css
--font-primary: "Baloo 2", cursive;
--font-body: "Nunito", sans-serif;
--font-log: "Patrick Hand", cursive;
--bg-primary: linear-gradient(135deg, #e8d5ff 0%, #d4b8e0 100%);
--bg-secondary: #c8a8d8;
--accent-primary: #ff9ec7;
--accent-safe: #a0d8c0;
--text-primary: #3a3a58;
--border-style: 4px solid #b8a0c8;
--border-radius: 20px;
--shadow: 0 10px 30px rgba(212, 165, 212, 0.5);
--stat-hunger-gradient: linear-gradient(
  90deg,
  #a0d8c0 0%,
  #ff9ec7 50%,
  #ffb380 100%
);
--stat-sanity-gradient: linear-gradient(90deg, #b8a0c8 0%, #a0d8c0 100%);
--decoration: "✨🌙💫";
```

**TEEN Stage:**

```css
--font-primary: "Creepster", cursive;
--font-body: "Special Elite", monospace;
--font-log: "Courier Prime", monospace;
--bg-primary: linear-gradient(135deg, #3a2a4a 0%, #2a1a3a 100%);
--bg-secondary: #1a0f2a;
--accent-primary: #ff6b9d;
--accent-safe: #6ba080;
--text-primary: #e0d0e0;
--text-glitch: #00ffff;
--border-style: 3px solid #8b4a7a;
--border-radius: 12px;
--shadow: 0 12px 40px rgba(139, 0, 0, 0.6);
--stat-hunger-gradient: linear-gradient(
  90deg,
  #6ba080 0%,
  #ffa07a 50%,
  #ff6b6b 100%
);
--stat-sanity-gradient: linear-gradient(
  90deg,
  #8b0000 0%,
  #ffa07a 50%,
  #d4a5d4 100%
);
--decoration: "🕷️💀🩸";
```

**ABOMINATION Stage:**

```css
--font-primary: "Nosifer", cursive;
--font-body: "Creepster", cursive;
--font-log: "Special Elite", monospace;
--bg-primary: linear-gradient(135deg, #1a0f1f 0%, #0a0010 100%);
--bg-secondary: #000000;
--accent-primary: #8b0000;
--accent-danger: #39ff14;
--text-primary: #ff00ff;
--text-glitch: #00ffff;
--border-style: 2px solid #8b0000;
--border-radius: 4px;
--shadow: 0 0 60px rgba(139, 0, 0, 1), 0 0 100px rgba(57, 255, 20, 0.5);
--stat-hunger-gradient: linear-gradient(90deg, #8b0000 0%, #ff0000 100%);
--stat-sanity-gradient: linear-gradient(90deg, #8b0000 0%, #39ff14 100%);
--decoration: "👁️🩸💀";
```

### Layout Grid Model

**Desktop Layout (>768px):**

```css
body {
  display: grid;
  grid-template-rows: 10vh 1fr;
  grid-template-columns: 1fr;
  height: 100vh;
  overflow: hidden;
}

.app-main {
  display: grid;
  grid-template-columns: 25vw 50vw 25vw;
  grid-template-rows: 1fr;
  height: 90vh;
}

.stats-panel {
  grid-column: 1;
}
.canvas-container {
  grid-column: 2;
}
.log-panel {
  grid-column: 3;
}
```

**Mobile Layout (≤768px):**

```css
@media (max-width: 768px) {
  body {
    overflow-y: auto;
    height: auto;
  }

  .app-main {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    height: auto;
  }

  .canvas-container {
    width: 100vw;
    height: 50vh;
  }

  .stats-panel,
  .log-panel,
  .inventory-panel {
    width: 100%;
    padding: 15px;
  }
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Acceptance Criteria Testing Prework

**Requirement 1 - Full-Page Desktop Layout:**
1.1 WHEN the System renders on a desktop viewport (width > 768px), THE System SHALL display all UI components within the viewport boundaries without vertical or horizontal scrolling
Thoughts: This is testable by checking that the document body has no scrollbars when viewport > 768px. We can generate random viewport sizes > 768px and verify overflow is hidden.
Testable: yes - property

1.2 WHEN the viewport is resized on desktop, THE System SHALL maintain full-page layout without introducing scrollbars
Thoughts: This is about resize behavior. We can test by simulating resize events and checking overflow state.
Testable: yes - property

1.3 THE System SHALL use CSS Grid with viewport units (vh/vw) for layout dimensions on desktop viewports
Thoughts: This is about implementation approach, not a functional behavior we can test at runtime.
Testable: no

1.4 WHEN the System renders the main layout, THE System SHALL allocate 10vh for the header, 25vw for the left panel, 50vw for the canvas, and 25vw for the right panel
Thoughts: We can test that computed styles match expected viewport-relative values for any viewport size.
Testable: yes - property

**Requirement 2 - Mobile Layout:**
2.1 WHEN the System renders on a mobile viewport (width ≤ 768px), THE System SHALL enable vertical scrolling
Thoughts: We can test that overflow-y is auto/scroll when viewport ≤ 768px.
Testable: yes - property

2.2-2.5 Mobile layout specifics
Thoughts: These are specific layout behaviors on mobile. Can be tested by checking computed styles at mobile breakpoint.
Testable: yes - property (combined)

**Requirement 3 - Stage Theme Application:**
3.1-3.4 Stage-specific theme application
Thoughts: For any PetStage value, we can verify that the correct CSS custom properties are applied. This is a property that should hold for all 4 stages.
Testable: yes - property

3.5 THE System SHALL implement theme switching using CSS custom properties scoped to data-stage attributes
Thoughts: This is about implementation approach.
Testable: no

**Requirement 4 - Theme Transitions:**
4.1-4.2 Theme transition smoothness
Thoughts: Testing CSS transition timing is difficult to verify programmatically without visual inspection.
Testable: no

4.3 THE System SHALL apply the data-stage attribute to the root container element based on the current PetStage value from the Zustand store
Thoughts: For any PetStage value in the store, the root element's data-stage attribute should match. This is testable as a property.
Testable: yes - property

**Requirement 5 - Canvas Responsiveness:**
5.1-5.4 Canvas resize behavior
Thoughts: For any viewport size, the canvas dimensions should be calculated correctly (50vw × 70vh on desktop, 100vw × 50vh on mobile). This is a property.
Testable: yes - property

**Requirements 6-9 - Stage Animations:**
6.1-9.5 Animation specifications
Thoughts: These are CSS animation specifications. Testing that specific keyframe animations are applied is possible by checking computed animation properties, but verifying the visual effect requires visual testing.
Testable: yes - property (animation class/name presence)

**Requirement 10 - Sanity Overrides:**
10.1-10.3 Sanity-based effects
Thoughts: For any sanity value < 30, additional CSS classes/effects should be applied. This is testable.
Testable: yes - property

10.4 THE System SHALL apply a data-sanity attribute with value "critical" when sanity is below 30, and "normal" otherwise
Thoughts: For any sanity value, the data-sanity attribute should be "critical" if sanity < 30, "normal" otherwise. This is a clear property.
Testable: yes - property

**Requirement 11 - Organic Stat Bars:**
11.1-11.3 Clip-path shapes
Thoughts: We can verify that clip-path CSS property is applied to stat bar containers.
Testable: yes - example

**Requirement 12 - Inventory Cards:**
12.1-12.4 Card layout and interactions
Thoughts: We can test that inventory items render as cards with correct dimensions and hover effects.
Testable: yes - property

**Requirement 13 - Journal Log:**
13.1-13.4 Log styling
Thoughts: We can verify that log container has appropriate background styling per stage.
Testable: yes - property

**Requirement 14 - Font Loading:**
14.1-14.3 Google Fonts
Thoughts: We can verify that font-family CSS properties reference the expected fonts per stage.
Testable: yes - property

**Requirements 15-16 - Performance:**
15.1-16.3 Animation performance
Thoughts: These are implementation constraints, not runtime behaviors.
Testable: no

**Requirement 17 - Header:**
17.1-17.4 Header content
Thoughts: We can verify header displays pet name and stage from store.
Testable: yes - property

**Requirement 18 - CSS Organization:**
18.1-18.4 File structure
Thoughts: This is about code organization, not runtime behavior.
Testable: no

### Property Reflection

After reviewing the prework, the following properties can be consolidated:

1. **Layout properties (1.1, 1.2, 1.4, 2.1-2.5)** can be combined into a single "viewport-responsive layout" property
2. **Stage theme properties (3.1-3.4, 4.3)** can be combined into a single "stage-theme consistency" property
3. **Animation presence properties (6.x-9.x)** can be combined into "stage-animation application" property
4. **Sanity properties (10.1-10.4)** can be combined into "sanity-state consistency" property

### Correctness Properties

**Property 1: Data Attribute Stage Consistency**
_For any_ PetStage value in the Zustand store, the root container element's `data-stage` attribute SHALL equal that PetStage value
**Validates: Requirements 4.3**

**Property 2: Data Attribute Sanity Consistency**
_For any_ sanity value in the Zustand store, the root container element's `data-sanity` attribute SHALL equal "critical" when sanity < 30, and "normal" otherwise
**Validates: Requirements 10.4**

**Property 3: Stage Theme Variable Application**
_For any_ PetStage value, when that stage is active, the computed CSS custom properties (--font-primary, --bg-primary, --accent-primary) SHALL match the defined theme values for that stage
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

**Property 4: Canvas Responsive Sizing**
_For any_ viewport dimensions, the PixiJS canvas width and height SHALL be calculated as: desktop (>768px): 50vw × 70vh, mobile (≤768px): 100vw × 50vh
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

**Property 5: Desktop No-Scroll Layout**
_For any_ viewport width > 768px, the document body SHALL have overflow hidden (no scrollbars visible)
**Validates: Requirements 1.1, 1.2**

**Property 6: Mobile Scroll Enabled**
_For any_ viewport width ≤ 768px, the document body SHALL allow vertical scrolling
**Validates: Requirements 2.1**

**Property 7: Header Content Consistency**
_For any_ game state with initialized pet, the header SHALL display the pet name from store.traits.name and the current stage from store.stage
**Validates: Requirements 17.1, 17.2**

**Property 8: Inventory Card Rendering**
_For any_ inventory array in the store, each offering SHALL render as a card element with icon, title, and description visible
**Validates: Requirements 12.1, 12.2**

## Error Handling

### Font Loading Failures

- **Fallback Strategy**: Each custom font has a fallback stack (e.g., `'Fredoka One', 'Comic Sans MS', cursive, sans-serif`)
- **Detection**: Use `document.fonts.ready` to detect when fonts are loaded
- **Graceful Degradation**: UI remains functional with system fonts if Google Fonts fail to load

### Canvas Resize Errors

- **Debouncing**: Resize handler is debounced to prevent rapid successive calls
- **Bounds Checking**: Minimum canvas size enforced (320px × 240px)
- **Error Recovery**: If resize fails, maintain previous dimensions and log error

### Theme Application Errors

- **Default Theme**: If data-stage attribute is missing or invalid, fall back to EGG theme
- **CSS Variable Fallbacks**: All `var()` calls include fallback values: `var(--bg-primary, #242424)`

### Animation Performance Issues

- **Reduced Motion**: Respect `prefers-reduced-motion` media query
- **Mobile Optimization**: Disable intensive animations on mobile via media queries
- **Frame Drop Detection**: If animations cause frame drops, reduce animation complexity

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

**Unit Tests** verify specific examples:

- Theme CSS variables are correctly defined for each stage
- Canvas resize calculations produce expected values for specific viewport sizes
- Data attributes are correctly applied for specific store states

**Property-Based Tests** verify universal properties:

- For ALL valid PetStage values, theme is correctly applied
- For ALL viewport sizes, layout responds appropriately
- For ALL sanity values, data-sanity attribute is correct

### Property-Based Testing Framework

**Library**: fast-check (already in project dependencies)

**Configuration**:

```typescript
import fc from "fast-check";

// Run minimum 100 iterations per property
const testConfig = { numRuns: 100 };
```

### Test File Organization

```
src/
├── App.test.tsx              # Existing - add data attribute tests
├── themes.test.ts            # New - theme variable tests
├── layout.test.ts            # New - responsive layout tests
├── GameCanvas.test.tsx       # Existing - add resize tests
├── UIOverlay.test.tsx        # New - stat bar and log tests
└── InventoryPanel.test.tsx   # Existing - add card layout tests
```

### Property Test Specifications

**Test 1: Stage Data Attribute Property**

```typescript
// **Feature: ui-redesign-stage-responsive, Property 1: Data Attribute Stage Consistency**
// **Validates: Requirements 4.3**
fc.assert(
  fc.property(
    fc.constantFrom("EGG", "BABY", "TEEN", "ABOMINATION"),
    (stage) => {
      // Set store stage
      // Render App
      // Assert data-stage attribute equals stage
    }
  ),
  testConfig
);
```

**Test 2: Sanity Data Attribute Property**

```typescript
// **Feature: ui-redesign-stage-responsive, Property 2: Data Attribute Sanity Consistency**
// **Validates: Requirements 10.4**
fc.assert(
  fc.property(fc.integer({ min: 0, max: 100 }), (sanity) => {
    // Set store sanity
    // Render App
    // Assert data-sanity equals "critical" if sanity < 30, else "normal"
  }),
  testConfig
);
```

**Test 3: Theme Variable Property**

```typescript
// **Feature: ui-redesign-stage-responsive, Property 3: Stage Theme Variable Application**
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
fc.assert(
  fc.property(
    fc.constantFrom("EGG", "BABY", "TEEN", "ABOMINATION"),
    (stage) => {
      // Apply data-stage to element
      // Get computed style for --font-primary
      // Assert matches expected font for stage
    }
  ),
  testConfig
);
```

**Test 4: Canvas Sizing Property**

```typescript
// **Feature: ui-redesign-stage-responsive, Property 4: Canvas Responsive Sizing**
// **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
fc.assert(
  fc.property(
    fc.integer({ min: 320, max: 2560 }),
    fc.integer({ min: 480, max: 1440 }),
    (width, height) => {
      // Set viewport size
      // Calculate expected canvas dimensions
      // Assert canvas matches expected
    }
  ),
  testConfig
);
```

**Test 5: Desktop No-Scroll Property**

```typescript
// **Feature: ui-redesign-stage-responsive, Property 5: Desktop No-Scroll Layout**
// **Validates: Requirements 1.1, 1.2**
fc.assert(
  fc.property(fc.integer({ min: 769, max: 2560 }), (width) => {
    // Set viewport width
    // Render App
    // Assert body overflow is hidden
  }),
  testConfig
);
```

**Test 6: Mobile Scroll Property**

```typescript
// **Feature: ui-redesign-stage-responsive, Property 6: Mobile Scroll Enabled**
// **Validates: Requirements 2.1**
fc.assert(
  fc.property(fc.integer({ min: 320, max: 768 }), (width) => {
    // Set viewport width
    // Render App
    // Assert body overflow-y is auto or scroll
  }),
  testConfig
);
```

**Test 7: Header Content Property**

```typescript
// **Feature: ui-redesign-stage-responsive, Property 7: Header Content Consistency**
// **Validates: Requirements 17.1, 17.2**
fc.assert(
  fc.property(
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.constantFrom("EGG", "BABY", "TEEN", "ABOMINATION"),
    (name, stage) => {
      // Set store traits.name and stage
      // Render App
      // Assert header contains name and stage text
    }
  ),
  testConfig
);
```

**Test 8: Inventory Card Property**

```typescript
// **Feature: ui-redesign-stage-responsive, Property 8: Inventory Card Rendering**
// **Validates: Requirements 12.1, 12.2**
fc.assert(
  fc.property(
    fc.array(
      fc.record({
        id: fc.uuid(),
        type: fc.constantFrom("PURITY", "ROT"),
        description: fc.string({ minLength: 1, maxLength: 100 }),
        icon: fc.constantFrom("✨", "🦴"),
      }),
      { minLength: 0, maxLength: 3 }
    ),
    (inventory) => {
      // Set store inventory
      // Render InventoryPanel
      // Assert each item renders as card with icon and description
    }
  ),
  testConfig
);
```

### Unit Test Examples

```typescript
// themes.test.ts
describe("Theme CSS Variables", () => {
  it("EGG theme has pastel pink background", () => {
    // Apply data-stage="EGG"
    // Assert --bg-primary contains #FFF5F7
  });

  it("ABOMINATION theme has dark background", () => {
    // Apply data-stage="ABOMINATION"
    // Assert --bg-primary contains #1A0F1F
  });
});
```

### Performance Testing

- Use Chrome DevTools Performance panel to verify 60fps during animations
- Test on throttled CPU (4x slowdown) to simulate mobile devices
- Verify no layout thrashing during resize events
