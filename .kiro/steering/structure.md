# Project Structure

## Directory Layout

```
/
├── api/                    # Vercel serverless functions
│   ├── chat.ts            # AI text generation proxy endpoint
│   ├── chat.test.ts       # API endpoint tests
│   └── README.md          # API documentation
├── src/                   # Frontend source code
│   ├── components/        # React components (TSX + CSS pairs)
│   │   ├── App.tsx        # Root React component
│   │   ├── App.css        # App-level styles
│   │   ├── AIErrorFallback.tsx + .css
│   │   ├── CreationScreen.tsx + .css
│   │   ├── DebugPanel.tsx + .css
│   │   ├── ErrorBoundary.tsx + .css
│   │   ├── GameCanvas.tsx + .css
│   │   ├── InventoryPanel.tsx + .css
│   │   ├── NarrativeLog.tsx + .css
│   │   ├── StatsPanel.tsx + .css
│   │   └── UIOverlay.tsx + .css
│   ├── utils/             # Utility modules
│   │   ├── aiClient.ts    # AI API client wrapper
│   │   ├── errorLogger.ts # Error logging utility
│   │   ├── gameLoop.ts    # Game loop manager
│   │   └── types.ts       # TypeScript type definitions
│   ├── assets/            # Static assets (images, icons)
│   ├── test/              # Test configuration and setup
│   │   ├── setup.ts       # Vitest global setup
│   │   └── setup.test.ts  # Setup verification tests
│   ├── main.tsx           # React entry point
│   ├── index.css          # Global styles
│   ├── themes.css         # Theme variables
│   ├── store.ts           # Zustand state management
│   └── *.test.ts(x)       # Unit tests (co-located)
├── public/                # Static public assets
├── .kiro/                 # Kiro IDE configuration
│   ├── steering/          # AI assistant guidance documents
│   └── specs/             # Feature specifications
├── vercel.json            # Vercel deployment config
├── vite.config.ts         # Vite build configuration
├── tsconfig.json          # TypeScript project references
├── tsconfig.app.json      # App TypeScript config
├── tsconfig.node.json     # Node/build TypeScript config
└── eslint.config.js       # ESLint configuration
```

## Architecture Patterns

### State Management

- **Single Store**: All game state lives in `src/store.ts` using Zustand
- **Persistence**: State automatically persists to localStorage with the key `creepy-companion-storage`
- **Offline Decay**: On rehydration, calculate time elapsed and apply stat decay
- **Actions**: All state mutations happen through store actions (no direct state modification)

### Type System

- **Central Types**: All shared types defined in `src/utils/types.ts`
- **Type Safety**: Strict TypeScript with no implicit any
- **Enums as Literals**: Use string literal unions instead of enums (e.g., `type PetStage = "EGG" | "BABY"`)

### API Layer

- **Serverless Functions**: Backend logic in `/api` directory, deployed as Vercel functions
- **Client Wrapper**: `src/utils/aiClient.ts` provides typed interface to API endpoints
- **Security**: API keys never exposed to client, all AI requests proxied through `/api/chat`

### Testing Strategy

- **Unit Tests**: Co-located with source files (e.g., `store.test.ts` in `src/` root)
- **Test Setup**: Global test configuration in `src/test/setup.ts`
- **Property-Based**: Use `fast-check` for testing state transitions and game logic

## File Naming Conventions

- React components: PascalCase in `src/components/` (e.g., `App.tsx`, `GameCanvas.tsx`)
- Utilities/modules: camelCase in `src/utils/` (e.g., `aiClient.ts`, `gameLoop.ts`)
- Types: `src/utils/types.ts` with PascalCase interfaces (e.g., `GameState`)
- Tests: Same name as source with `.test.ts` suffix, co-located in `src/` root
- Config files: lowercase with dots (e.g., `vite.config.ts`)

## Component Organization

- **Components Directory**: All React components (TSX + CSS pairs) in `src/components/`
- **Utils Directory**: All utility modules, types, and helpers in `src/utils/`
- **Root Level**: Entry point (`main.tsx`), store (`store.ts`), global styles, and tests
- **Import Paths**:
  - Components import utils: `from "../utils/types"`
  - Components import store: `from "../store"`
  - Tests import components: `from "./components/App"`
  - Tests import utils: `from "./utils/types"`
