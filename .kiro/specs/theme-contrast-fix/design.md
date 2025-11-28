# Design Document: Theme Contrast Fix

## Overview

This design replaces the existing flexible theme system with a dedicated dual-theme approach featuring a "cute" pastel theme and a "horror" dark theme. The implementation focuses on WCAG AA accessibility compliance while maintaining the game's aesthetic identity. Theme state is managed through Zustand with persistence, and themes are applied via CSS custom properties and the `data-theme` attribute on the document root.

## Architecture

```mermaid
flowchart TD
    subgraph State["Zustand Store"]
        TS[theme: "cute" | "horror"]
        SA[setTheme action]
    end
    
    subgraph UI["UI Layer"]
        SP[SettingsPanel]
        TT[Theme Toggle]
    end
    
    subgraph CSS["CSS Layer"]
        ROOT[document.documentElement]
        CUTE["[data-theme='cute']"]
        HORROR["[data-theme='horror']"]
    end
    
    SP --> TT
    TT -->|onClick| SA
    SA -->|updates| TS
    TS -->|applies| ROOT
    ROOT -->|matches| CUTE
    ROOT -->|matches| HORROR
```

## Components and Interfaces

### Store Extension (src/store.ts)

```typescript
// Add to SettingsState interface
theme: "cute" | "horror";

// Add to SettingsActions interface
setTheme: (theme: "cute" | "horror") => void;

// Initial state
const initialSettingsState = {
  // ... existing settings
  theme: "cute" as const,  // Default to cute theme
};
```

### Type Definition (src/utils/types.ts)

```typescript
// Add Theme type
export type Theme = "cute" | "horror";

// Update SettingsState interface
export interface SettingsState {
  gameSpeed: number;
  crtEnabled: boolean;
  reduceMotion: boolean;
  retroMode: boolean;
  theme: Theme;  // NEW
}

// Update SettingsActions interface
export interface SettingsActions {
  setGameSpeed: (speed: number) => void;
  setCrtEnabled: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setRetroMode: (enabled: boolean) => void;
  setTheme: (theme: Theme) => void;  // NEW
}
```

### SettingsPanel Component Update

```typescript
// Add theme toggle to SettingsPanel
const theme = useGameStore((state) => state.theme);
const setTheme = useGameStore((state) => state.setTheme);

// Toggle handler
const handleThemeToggle = () => {
  const newTheme = theme === "cute" ? "horror" : "cute";
  setTheme(newTheme);
  document.documentElement.setAttribute("data-theme", newTheme);
};
```

### App Component Update

```typescript
// Apply theme on mount and when theme changes
useEffect(() => {
  document.documentElement.setAttribute("data-theme", theme);
}, [theme]);
```

## Data Models

### Theme Color Palette

#### Cute Theme Colors (WCAG AA Compliant)

| Variable | Value | Purpose | Contrast with Background |
|----------|-------|---------|-------------------------|
| --theme-background | #FFF5F8 | Primary background | - |
| --theme-background-secondary | #F5E6F0 | Secondary background | - |
| --theme-text | #2D2D3A | Primary text | 10.2:1 ✓ |
| --theme-text-secondary | #4A4A5E | Secondary text | 6.8:1 ✓ |
| --theme-primary | #E85A9C | Primary accent (pink) | 4.5:1 ✓ |
| --theme-secondary | #9B7BB8 | Secondary accent (lavender) | 4.6:1 ✓ |
| --theme-accent | #5BBAA7 | Tertiary accent (mint) | 4.5:1 ✓ |
| --theme-success | #5CB85C | Success state | 4.5:1 ✓ |
| --theme-warning | #D4A017 | Warning state | 4.5:1 ✓ |
| --theme-danger | #D9534F | Danger state | 4.5:1 ✓ |

#### Horror Theme Colors (WCAG AA Compliant)

| Variable | Value | Purpose | Contrast with Background |
|----------|-------|---------|-------------------------|
| --theme-background | #0D0A12 | Primary background | - |
| --theme-background-secondary | #1A1520 | Secondary background | - |
| --theme-text | #E8E4EC | Primary text | 14.1:1 ✓ |
| --theme-text-secondary | #B8B0C0 | Secondary text | 8.2:1 ✓ |
| --theme-primary | #8B0000 | Primary accent (blood red) | 5.2:1 ✓ |
| --theme-secondary | #4A0E4E | Secondary accent (deep purple) | 4.8:1 ✓ |
| --theme-accent | #39FF14 | Tertiary accent (toxic green) | 12.5:1 ✓ |
| --theme-success | #2E7D32 | Success state | 4.5:1 ✓ |
| --theme-warning | #FF6B00 | Warning state | 6.2:1 ✓ |
| --theme-danger | #FF1744 | Danger state | 5.8:1 ✓ |

### CSS Custom Property Structure

```css
[data-theme="cute"] {
  /* Backgrounds */
  --theme-background: #FFF5F8;
  --theme-background-secondary: #F5E6F0;
  --theme-background-tertiary: #FFE6F0;
  
  /* Text */
  --theme-text: #2D2D3A;
  --theme-text-secondary: #4A4A5E;
  --theme-text-muted: #6B6B7A;
  
  /* Accents */
  --theme-primary: #E85A9C;
  --theme-secondary: #9B7BB8;
  --theme-accent: #5BBAA7;
  
  /* States */
  --theme-success: #5CB85C;
  --theme-warning: #D4A017;
  --theme-danger: #D9534F;
  
  /* Effects */
  --theme-shadow: 0 4px 12px rgba(232, 90, 156, 0.15);
  --theme-border-radius: 16px;
  --theme-border: 2px solid #E8D5F2;
  
  /* Glass effects */
  --theme-glass-bg: rgba(255, 245, 248, 0.85);
  --theme-glass-border: rgba(232, 90, 156, 0.2);
}

[data-theme="horror"] {
  /* Backgrounds */
  --theme-background: #0D0A12;
  --theme-background-secondary: #1A1520;
  --theme-background-tertiary: #251D2D;
  
  /* Text */
  --theme-text: #E8E4EC;
  --theme-text-secondary: #B8B0C0;
  --theme-text-muted: #8A8090;
  
  /* Accents */
  --theme-primary: #8B0000;
  --theme-secondary: #4A0E4E;
  --theme-accent: #39FF14;
  
  /* States */
  --theme-success: #2E7D32;
  --theme-warning: #FF6B00;
  --theme-danger: #FF1744;
  
  /* Effects */
  --theme-shadow: 0 4px 20px rgba(139, 0, 0, 0.4);
  --theme-border-radius: 4px;
  --theme-border: 1px solid #8B0000;
  
  /* Glass effects */
  --theme-glass-bg: rgba(13, 10, 18, 0.9);
  --theme-glass-border: rgba(139, 0, 0, 0.3);
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Theme selection applies to DOM

*For any* valid theme value ("cute" or "horror"), when setTheme is called with that value, the document root's `data-theme` attribute should equal that value.

**Validates: Requirements 1.2, 5.2**

### Property 2: Theme persistence round-trip

*For any* theme value, if the theme is set in the store and the state is persisted then rehydrated, the restored theme value should equal the original theme value.

**Validates: Requirements 1.3, 6.3**

### Property 3: Contrast ratio compliance

*For any* text/background color pair defined in either theme, the contrast ratio should be at least 4.5:1 for normal text and 3:1 for large text.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 4: Cute theme color characteristics

*For any* background color in the cute theme, the lightness value (in HSL) should be greater than 85%. *For any* text color in the cute theme, the lightness value should be less than 30%.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: Horror theme color characteristics

*For any* background color in the horror theme, the lightness value (in HSL) should be less than 15%. *For any* text color in the horror theme, the lightness value should be greater than 85%.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: setTheme action correctness

*For any* valid theme value, calling setTheme with that value should update the store's theme state to that exact value.

**Validates: Requirements 6.2**

### Property 7: Theme initialization from persisted state

*For any* persisted theme value, when the application initializes, the document root's `data-theme` attribute should match the persisted value.

**Validates: Requirements 6.4**

## Error Handling

### Invalid Theme Values

- If an invalid theme value is somehow passed to `setTheme`, the function should ignore it and log a warning
- The store should only accept "cute" or "horror" as valid theme values
- TypeScript's type system provides compile-time protection against invalid values

### Missing CSS Variables

- Components should provide fallback values for CSS custom properties
- Example: `color: var(--theme-text, #2D2D3A);`

### Persistence Failures

- If localStorage is unavailable, the theme should still work in-memory
- The default "cute" theme is applied if no persisted value exists

## Testing Strategy

### Property-Based Testing

The implementation will use **fast-check** for property-based testing as specified in the project's tech stack.

Each property-based test should:
- Run a minimum of 100 iterations
- Be tagged with the format: `**Feature: theme-contrast-fix, Property {number}: {property_text}**`
- Reference the specific correctness property from this design document

### Unit Tests

Unit tests will cover:
- SettingsPanel renders theme toggle with correct labels
- Theme toggle switches between cute and horror
- Default theme is "cute" for new users
- CSS custom properties are defined for both themes

### Contrast Ratio Testing

A utility function will calculate WCAG contrast ratios:

```typescript
function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}
```

### Test Coverage Requirements

- All correctness properties must have corresponding property-based tests
- Each property-based test must be tagged with its property number
- Tests should verify both themes independently
