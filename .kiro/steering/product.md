# Product Overview

**Kiroween Game** (Creepy Companion) is a virtual pet game with a dark, unsettling aesthetic. Players nurture a mysterious creature through different life stages (EGG → BABY → TEEN → ABOMINATION) by scavenging for offerings and managing three core stats: hunger, sanity, and corruption.

## Core Mechanics

- **Time System**: 1 real second = 1 game minute. The pet evolves and decays in real-time, even when offline.
- **Feeding System**: Players scavenge for AI-generated offerings (PURITY or ROT items) that affect stats differently. Overfeeding (>3 times/day) causes negative effects.
- **Evolution**: The pet evolves based on age and corruption level. High corruption (>80) triggers transformation into an ABOMINATION.
- **Narrative Logs**: System and pet-generated messages create an atmospheric story as the game progresses.

## Technical Approach

The game uses AI (Featherless API with Llama 3.1) to generate cryptic item descriptions, creating unique experiences for each playthrough. State persists in localStorage with offline decay calculations on rehydration.
