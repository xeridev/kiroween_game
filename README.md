# Kiroween Game (Creepy Companion)

A browser-based horror pet simulator that inverts traditional virtual pet mechanics through uncertainty, decay, and AI-generated narrative horror.

**Live Demo**: [Deploy your own →](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/kiroween_game)

---

## 🎮 Features

- **Real-time Evolution**: Watch your pet transform from EGG → BABY → TEEN → ABOMINATION
- **AI-Generated Pet Art**: Unique 512×512 pixel artwork for each archetype and stage
- **Mystery Feeding**: Scavenge for AI-generated offerings with hidden PURITY/ROT effects
- **Persistent State**: Your pet continues to exist (and decay) even when offline
- **Dynamic Narrative**: AI-generated horror descriptions create unique experiences
- **Zen Mode**: Fullscreen canvas view (press Z)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- RunPod API key (recommended) - Get one at https://runpod.io
- OR Anthropic/Featherless AI key for fallback

### Setup

```bash
# 1. Clone and install
git clone <your-repo>
cd kiroween_game
npm install

# 2. Configure environment
cp .env.example .env

# 3. Edit .env with your RunPod API key
# RUNPOD_API_KEY=rpa_YOUR_KEY_HERE
# RUNPOD_ENDPOINT_ID=seedream-v4-t2i

# 4. Run locally
npm run dev

# 5. Open http://localhost:5173
```

### Test the Game

1. **Create a pet**: Choose archetype (GLOOM/SPARK/ECHO), name it, pick a color
2. **Wait 5 seconds**: Pet hatches from EGG → BABY
3. **Feed it**: Click "Scavenge for Offerings" → Feed the offerings
4. **Watch evolution**: BABY (instant) → TEEN (24 game hours) → ABOMINATION (corruption > 80)

---

## 💰 Cost Estimates (RunPod)

### Single API Key Powers Everything!

**Your Configuration**:
- RunPod SeeDream V4 (images): ~$0.01 per image
- RunPod Qwen3-32B-AWQ (text): $0.01 per 1000 tokens

**Per User Session** (full playthrough):
- ~4 images (EGG, BABY, TEEN, ABOMINATION): ~$0.04
- ~15 narrative texts (feeding + evolution): ~$0.01
- **Total**: **~$0.05 per complete user session**

**At Scale**:
- 1,000 users: **~$40-50**
- 10,000 users: **~$400-500**

**Note**: Images cached in localStorage - each archetype+stage generated once per browser!

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2.0** with TypeScript 5.9.3
- **Vite 7.2.4** (build tool + dev server)
- **PixiJS 8.14.3** (2D graphics rendering)
- **Zustand 5.0.8** (state management + persistence)
- **Howler 2.2.4** (audio - imported but unused)

### Backend
- **Vercel Serverless Functions** (API endpoints)
- **RunPod Serverless** (AI image + text generation)
  - SeeDream V4 T2I (images)
  - Qwen3-32B-AWQ (narratives)

### Testing
- **Vitest 4.0.14** (unit testing)
- **Testing Library 16.3.0** (component testing)
- **fast-check 4.3.0** (property-based testing)

---

## 📁 Project Structure

```
/
├── api/                    # Vercel serverless functions
│   ├── chat.ts            # AI text generation (Qwen3/Anthropic/Featherless)
│   ├── generateArt.ts     # AI image generation (SeeDream V4)
│   └── README.md          # API documentation
├── src/
│   ├── components/        # React components (TSX + CSS pairs)
│   │   ├── App.tsx        # Root component
│   │   ├── CreationScreen.tsx
│   │   ├── GameCanvas.tsx # PixiJS rendering + AI art loading
│   │   ├── InventoryPanel.tsx
│   │   ├── NarrativeLog.tsx
│   │   └── ...
│   ├── utils/             # Utility modules
│   │   ├── types.ts       # TypeScript definitions
│   │   ├── aiClient.ts    # AI API client wrapper
│   │   ├── gameLoop.ts    # Game loop manager
│   │   ├── errorLogger.ts # Error logging
│   │   └── petArtGenerator.ts # AI art + placeholders
│   ├── test/              # Test configuration
│   ├── store.ts           # Zustand state management
│   ├── main.tsx           # React entry point
│   └── index.css          # Global styles
├── public/
│   └── placeholders/      # Optional: Pre-generated pet images (12 total)
├── .kiro/                 # Kiro IDE configuration (DO NOT MODIFY)
│   ├── steering/          # AI assistant guidance
│   └── specs/             # Feature specifications
├── .env.example           # Environment variable template
├── vercel.json            # Vercel deployment config
└── package.json           # Dependencies and scripts
```

---

## 🔐 Environment Variables

### Required (Choose One Provider)

**Option 1: RunPod (Recommended)**
```env
RUNPOD_API_KEY=rpa_YOUR_KEY_HERE
RUNPOD_ENDPOINT_ID=seedream-v4-t2i
```
- Powers **both** image generation and narrative text
- Cost: ~$0.05 per user session
- Speed: 2-15 seconds per generation

**Option 2: Alternative Providers**
```env
# For narratives (priority order if RunPod fails):
ANTHROPIC_API_KEY=sk-ant-api03-...  # Premium quality
FEATHERLESS_API_KEY=...              # Free tier (1000/day)
```

### Get API Keys

- **RunPod**: https://runpod.io/console → Settings → API Keys
- **Anthropic**: https://console.anthropic.com → API Keys
- **Featherless**: https://featherless.ai → Sign Up

---

## 🎨 Optional: Add Placeholder Images

Generate 12 pre-made pet images for instant loading (512×512 PNG):

### File Naming

```
public/placeholders/
├── GLOOM_EGG.png
├── GLOOM_BABY.png
├── GLOOM_TEEN.png
├── GLOOM_ABOMINATION.png
├── SPARK_EGG.png
├── SPARK_BABY.png
├── SPARK_TEEN.png
├── SPARK_ABOMINATION.png
├── ECHO_EGG.png
├── ECHO_BABY.png
├── ECHO_TEEN.png
└── ECHO_ABOMINATION.png
```

### Example Prompts

**GLOOM_BABY.png**:
```
Small melancholic blob creature with oversized sad eyes, dark purple translucent body,
drooping features, shadowy wisps emanating, cute but unsettling, childlike innocent yet
eerie, centered on pure black background, digital art masterpiece, dark fantasy style,
creepy cute aesthetic
```

**SPARK_BABY.png**:
```
Small angular triangular creature with bright glowing eyes, cyan electric body, sharp cute
features, sparks flying off edges, energetic childlike appearance, unsettling geometry,
centered on pure black background, digital art masterpiece, dark fantasy style, creepy cute
aesthetic
```

**ECHO_BABY.png**:
```
Small translucent diamond spirit creature, hollow glowing eyes, pale blue ghostly body, cute
but otherworldly, echo trails following movement, childlike spectral appearance, unsettling
phase-shifting, centered on pure black background, digital art masterpiece, dark fantasy style,
creepy cute aesthetic
```

**Full prompts**: See `/public/placeholders/README.md` for all 12 prompts

**Generate with**:
- Leonardo.ai (free tier)
- Stable Diffusion (local or RunPod)
- Midjourney
- DALL-E 3

---

## 🎯 Game Mechanics

### Time System
- **Time Compression**: 1 real second = 1 game minute (60x speed)
- **Daily Cycle**: 24 game hours = 24 real minutes
- **Offline Decay**: Stats decay during offline periods (calculated on rehydration)

### Stats
- **Hunger**: Increases +0.05/minute
- **Sanity**: Decreases -0.02/minute
- **Corruption**: Increases with ROT items, decreases with PURITY items

### Evolution Triggers
1. **Age-based**:
   - EGG → BABY: 5 game minutes (5 real seconds)
   - BABY → TEEN: 1440 game minutes (24 real minutes)
2. **Corruption-based**:
   - Any stage → ABOMINATION: Corruption > 80

### Feeding Mechanics
- **Scavenge**: Generate random offering (50/50 PURITY/ROT)
- **Feed**: Apply stat changes + generate AI narrative
- **Daily Limit**: >3 feedings = vomit event (-20 sanity)

### Item Effects

| Item Type | Hunger | Sanity | Corruption |
|-----------|--------|--------|------------|
| PURITY    | -20    | +10    | -5         |
| ROT       | -20    | -15    | +10        |

---

## 📡 API Endpoints

### `/api/chat` - AI Narrative Text

**Request**:
```typescript
POST /api/chat
{
  "prompt": string,
  "temperature"?: number,  // default: 0.7
  "maxTokens"?: number     // default: 150
}
```

**Response**:
```typescript
{
  "text": string  // Generated narrative
}
```

**Provider Priority**:
1. RunPod Qwen3-32B-AWQ (if `RUNPOD_API_KEY` set)
2. Anthropic Claude Haiku (if `ANTHROPIC_API_KEY` set)
3. Featherless Llama 3.1-8B (if `FEATHERLESS_API_KEY` set)

---

### `/api/generateArt` - AI Pet Images

**Request**:
```typescript
POST /api/generateArt
{
  "prompt": string,
  "negativePrompt"?: string,
  "seed"?: number  // -1 for random
}
```

**Response**:
```typescript
{
  "imageUrl": string,  // Hosted on RunPod CDN
  "seed": number
}
```

**Provider Priority**:
1. RunPod SeeDream V4 (if `RUNPOD_API_KEY` set)
2. Pollinations.ai (free fallback)
3. Geometric shapes (always works)

---

## 🚢 Deployment (Vercel)

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/kiroween_game)

After deployment:
1. Go to **Settings** → **Environment Variables**
2. Add `RUNPOD_API_KEY` and `RUNPOD_ENDPOINT_ID`
3. Redeploy

### Option 2: Manual Deploy

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Add environment variables in dashboard
# Settings → Environment Variables
RUNPOD_API_KEY=rpa_YOUR_KEY_HERE
RUNPOD_ENDPOINT_ID=seedream-v4-t2i

# 5. Redeploy
vercel --prod
```

### Option 3: Git Integration

1. Push code to GitHub
2. Import repository in Vercel dashboard
3. Add environment variables
4. Auto-deploys on every push to main

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# Run specific test
npm test store.test.ts

# Lint code
npm run lint
```

### Test Coverage

- **100+ test cases** across all modules
- **Property-based testing** with fast-check
- **Component testing** with Testing Library
- **State management testing** with Vitest

---

## 🐛 Troubleshooting

### "Server configuration error"

**Cause**: Missing environment variables

**Fix**: Add `RUNPOD_API_KEY` to `.env` (local) or Vercel dashboard (production)

### "Image generation timeout"

**Cause**: RunPod cold start (first request after idle)

**Fix**: Normal behavior. Try again - subsequent requests faster (5-8s)

### "RunPod generation failed, trying fallback"

**Cause**: RunPod API error or insufficient credits

**Fix**:
1. Check RunPod account has credits
2. Verify API key is correct
3. System auto-falls back to Pollinations.ai

### Pet not visible

**Cause**: AI art loading or rendering issue

**Fix**:
1. Check browser console for errors
2. Add placeholder images to `/public/placeholders/`
3. Game falls back to geometric shapes if all AI fails

### No AI narrative text

**Cause**: No AI provider keys configured

**Fix**: Add at least one: `RUNPOD_API_KEY`, `ANTHROPIC_API_KEY`, or `FEATHERLESS_API_KEY`

---

## 🎮 Keyboard Shortcuts

- **Z**: Toggle zen mode (fullscreen canvas)
- **Escape**: Exit zen mode or close debug panel
- **D**: Toggle debug panel (dev mode only)

---

## 📊 Architecture Diagrams

### Image Generation Flow

```
User creates pet → Pet stage changes
         ↓
[1] Load placeholder image (instant - 0ms)
         ↓
[2] Check localStorage cache (if previously generated)
         ↓
[3] Generate with RunPod SeeDream V4 (~5-15s)
     - Submit job to /run endpoint
     - Poll /status every 2 seconds (max 60s)
     - Get image URL from RunPod CDN
         ↓ (on failure)
[4] Fallback to Pollinations.ai (~3-5s)
         ↓ (on failure)
[5] Use geometric shapes (always works)
```

### Chat API Flow

```
User feeds pet / pet evolves
         ↓
[1] Try RunPod Qwen3-32B-AWQ (~2-5s)
     - Submit job to /run endpoint
     - Poll /status every 2 seconds (max 30s)
     - Get generated text
         ↓ (on failure)
[2] Try Anthropic Claude Haiku (~1-2s)
         ↓ (on failure)
[3] Try Featherless Llama 3.1-8B (~2-4s)
         ↓ (on failure)
[4] Return error "No AI provider available"
```

---

## 🔧 Development Scripts

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # TypeScript compile + Vite build
npm test          # Run tests once
npm run lint      # ESLint check
npm run preview   # Preview production build
```

---

## 📚 Additional Documentation

- **API Reference**: [api/README.md](api/README.md)
- **Accessibility**: [ACCESSIBILITY.md](ACCESSIBILITY.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Placeholder Prompts**: [public/placeholders/README.md](public/placeholders/README.md)

**Kiro IDE Docs** (for developers):
- Architecture: [.kiro/steering/structure.md](.kiro/steering/structure.md)
- Tech Stack: [.kiro/steering/tech.md](.kiro/steering/tech.md)
- AI Assistant Config: [CLAUDE.md](CLAUDE.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

---

## 📄 License

MIT

---

## 🙏 Credits

- **Game Engine**: React + PixiJS + Zustand
- **AI Services**: RunPod (SeeDream V4 + Qwen3-32B-AWQ)
- **Hosting**: Vercel
- **Testing**: Vitest + Testing Library

---

**Last Updated**: 2025-11-28

**Status**: Production Ready ✅

**Build**: Passing ✅

**Cost**: ~$0.05 per user session
