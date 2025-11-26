# Project Structure

## Directory Layout

```
/
├── api/                    # Vercel serverless functions
│   ├── chat.ts            # AI text generation proxy endpoint
│   ├── chat.test.ts       # API endpoint tests
│   └── README.md          # API documentation
├── src/                   # Frontend source code
│   ├── assets/            # Static assets (images, icons)
│   ├── test/              # Test configuration and setup
│   │   ├── setup.ts       # Vitest global setup
│   │   └── setup.test.ts  # Setup verification tests
│   ├── App.tsx            # Root React component
│   ├── App.css            # App-level styles
│   ├── main.tsx           # React entry point
│   ├── index.css          # Global styles
│   ├── store.ts           # Zustand state management
│   ├── store.test.ts      # Store unit tests
│   ├── types.ts           # TypeScript type definitions
│   └── aiClient.ts        # AI API client wrapper
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

- **Central Types**: All shared types defined in `src/types.ts`
- **Type Safety**: Strict TypeScript with no implicit any
- **Enums as Literals**: Use string literal unions instead of enums (e.g., `type PetStage = "EGG" | "BABY"`)

### API Layer

- **Serverless Functions**: Backend logic in `/api` directory, deployed as Vercel functions
- **Client Wrapper**: `src/aiClient.ts` provides typed interface to API endpoints
- **Security**: API keys never exposed to client, all AI requests proxied through `/api/chat`

### Testing Strategy

- **Unit Tests**: Co-located with source files (e.g., `store.test.ts` next to `store.ts`)
- **Test Setup**: Global test configuration in `src/test/setup.ts`
- **Property-Based**: Use `fast-check` for testing state transitions and game logic

## File Naming Conventions

- React components: PascalCase (e.g., `App.tsx`)
- Utilities/modules: camelCase (e.g., `aiClient.ts`, `store.ts`)
- Types: camelCase files, PascalCase interfaces (e.g., `types.ts` contains `GameState`)
- Tests: Same name as source with `.test.ts` suffix
- Config files: lowercase with dots (e.g., `vite.config.ts`)
