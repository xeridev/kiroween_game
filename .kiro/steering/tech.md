# Tech Stack

## Frontend

- **React 19** with TypeScript
- **Vite** for build tooling and dev server
- **PixiJS 8** for 2D graphics rendering
- **Zustand** for state management with persistence middleware
- **Howler.js** for audio

## Backend

- **Vercel Serverless Functions** for API endpoints
- **Vercel AI SDK** with OpenAI provider
- **Featherless AI** (Llama 3.1-8B-Instruct) for text generation

## Testing

- **Vitest** for unit testing
- **Testing Library** (React + Jest DOM) for component testing
- **fast-check** for property-based testing
- **jsdom** for DOM simulation

## Code Quality

- **ESLint** with TypeScript, React Hooks, and React Refresh plugins
- **TypeScript 5.9** with strict project references

## Common Commands

```bash
# Development
npm run dev              # Start Vite dev server

# Building
npm run build            # TypeScript compile + Vite build

# Testing
npm test                 # Run all tests once
npm test <file>          # Run specific test file (e.g., npm test api/chat.test.ts)
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Open Vitest UI

# Code Quality
npm run lint             # Run ESLint
npm run preview          # Preview production build
```

## Environment Variables

Required for production:

- `FEATHERLESS_API_KEY` - API key for Featherless AI service

See `.env.example` for local development setup.
