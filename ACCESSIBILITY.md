# Accessibility Features

This document outlines the accessibility features implemented in the Creepy Companion game to ensure it's usable by people with disabilities.

## Overview

The game follows WCAG 2.1 Level AA guidelines and implements comprehensive accessibility features including:

- Semantic HTML and ARIA labels
- Full keyboard navigation support
- Live regions for dynamic content updates
- Screen reader compatibility
- Focus indicators for all interactive elements

## Implemented Features

### 1. ARIA Labels and Roles

#### CreationScreen

- **Form**: `role="main"` with `aria-label="Pet creation form"`
- **Name Input**: Properly labeled with `<label for="pet-name">`
- **Archetype Buttons**:
  - `aria-pressed` attribute to indicate selection state
  - `aria-label` with full description for screen readers
  - Visual content marked with `aria-hidden="true"` to avoid duplication
- **Error Messages**: `role="alert"` with `aria-live="polite"` for validation errors
- **Submit Button**: `aria-label="Begin game with selected pet"`

#### GameCanvas

- **Canvas Container**: `role="img"` with descriptive `aria-label` including pet name, archetype, stage, and sanity level
- Updates dynamically as pet state changes

#### InventoryPanel

- **Container**: `role="region"` with `aria-label="Inventory"`
- **Inventory Grid**: `role="list"` with `aria-label="Inventory items"`
- **Inventory Items**:
  - Implemented as `<button>` elements for keyboard accessibility
  - `role="listitem"` for semantic structure
  - `aria-label` with full description: "Feed offering: [description]"
  - `title` attribute for native tooltip support
- **Empty State**: `role="status"` for screen reader announcement
- **Scavenge Button**: Dynamic `aria-label` based on state:
  - Available: "Scavenge for new offerings"
  - Full: "Cannot scavenge, inventory is full"

#### UIOverlay

- **Container**: `role="complementary"` with `aria-label="Game status"`
- **Stats Section**: `role="region"` with `aria-label="Pet statistics"`
- **Progress Bars**:
  - `role="progressbar"` with proper ARIA attributes
  - `aria-labelledby` linking to stat labels
  - `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for current values
  - `aria-live="polite"` for dynamic updates
- **Pet Info**: `role="region"` with `aria-label="Pet information"`
- **Stage Updates**: `aria-live="polite"` on stage display
- **Daily Feeds**: `aria-live="polite"` on feed counter
- **Narrative Log**:
  - `role="log"` with `aria-live="polite"` and `aria-atomic="false"`
  - `tabIndex="0"` for keyboard scrolling
  - `aria-label="Scrollable narrative log of game events"`
  - Individual entries marked with `role="article"`

### 2. Keyboard Navigation

All interactive elements are fully keyboard accessible:

#### Tab Order

1. Creation Screen: Name input → Archetype buttons → Color picker → Submit button
2. Game Interface: Inventory items → Scavenge button → Log container (scrollable)

#### Focus Indicators

- **Visible Focus Rings**: 2px solid outline with offset for all interactive elements
- **Color**: Purple (#6b4c9a) matching the game's theme
- **Hover States**: Maintained for both mouse and keyboard focus
- **Focus-Visible**: Uses `:focus-visible` to show focus only for keyboard navigation

#### Keyboard Shortcuts

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons
- **Arrow Keys**: Scroll through narrative log when focused

### 3. Live Regions

Dynamic content updates are announced to screen readers:

#### Polite Updates (non-interrupting)

- Hunger and sanity stat changes
- Pet stage evolution
- Daily feed counter updates
- Narrative log entries

#### Status Updates

- Empty inventory state
- Inventory capacity changes
- Error messages during pet creation

### 4. Screen Reader Support

#### Semantic Structure

- Proper heading hierarchy (h1 → h3)
- Landmark regions (main, complementary, region)
- List structures for inventory items
- Article elements for log entries

#### Hidden Content

- Visual-only elements marked with `aria-hidden="true"`
- Decorative icons excluded from screen reader flow
- Duplicate information (like stat values shown visually) marked as `aria-hidden`

#### Descriptive Labels

- All interactive elements have clear, descriptive labels
- Context provided for all actions (e.g., "Feed offering: [description]")
- State information included in labels (e.g., "Cannot scavenge, inventory is full")

## Testing

### Automated Tests

Run accessibility tests with:

```bash
npm test src/accessibility.test.tsx
```

Tests verify:

- ARIA labels are present and correct
- Interactive elements are keyboard accessible
- Live regions are properly configured
- Progress bars have correct ARIA attributes

### Manual Testing Checklist

#### Keyboard Navigation

- [ ] Can tab through all interactive elements
- [ ] Focus indicators are clearly visible
- [ ] Can activate all buttons with Enter/Space
- [ ] Can scroll log container with arrow keys when focused
- [ ] No keyboard traps

#### Screen Reader Testing

- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] Test with VoiceOver (macOS/iOS)
- [ ] Test with TalkBack (Android)

#### Screen Reader Verification Points

- [ ] Pet creation form is announced correctly
- [ ] Archetype selection state is announced
- [ ] Validation errors are announced
- [ ] Stat changes are announced (hunger, sanity)
- [ ] Stage evolution is announced
- [ ] Inventory items are announced with descriptions
- [ ] Scavenge button state is announced
- [ ] Narrative log entries are announced as they appear

### Browser Testing

Tested and verified in:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Known Limitations

1. **Canvas Rendering**: The PixiJS canvas is not directly accessible. We provide:

   - Descriptive `aria-label` with pet state information
   - Text-based fallback UI if canvas fails to render
   - All game state visible in the UIOverlay component

2. **Real-time Updates**: Rapid stat changes may cause frequent screen reader announcements. We use `aria-live="polite"` to minimize interruptions.

3. **Visual Effects**: Horror effects (screen shake, glitching) are purely visual and don't affect accessibility.

## Future Improvements

Potential enhancements for future versions:

1. **Reduced Motion**: Respect `prefers-reduced-motion` media query
2. **High Contrast Mode**: Support for high contrast themes
3. **Text Scaling**: Ensure UI works at 200% text zoom
4. **Audio Descriptions**: Add audio cues for visual events
5. **Customizable Focus Indicators**: Allow users to adjust focus ring appearance
6. **Keyboard Shortcuts**: Add configurable keyboard shortcuts for common actions

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

## Feedback

If you encounter accessibility issues, please report them with:

- Browser and version
- Assistive technology used (if applicable)
- Steps to reproduce
- Expected vs. actual behavior
