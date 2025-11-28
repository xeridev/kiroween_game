/**
 * Sound Catalog Generator
 * Scans public/sounds/ directories and generates a JSON catalog
 * for the AI sound selection system.
 */

import * as fs from "fs";
import * as path from "path";

// Types (duplicated here for script independence)
type SoundCategory =
  | "ambient"
  | "monster"
  | "cute"
  | "stinger"
  | "character"
  | "household"
  | "liquid"
  | "ui";

interface SoundEntry {
  id: string;
  path: string;
  category: SoundCategory;
  tags: string[];
  loop: boolean;
  description: string;
  duration?: number;
}

interface SoundCatalog {
  version: string;
  generatedAt: string;
  categories: {
    [category: string]: SoundEntry[];
  };
  sounds: SoundEntry[];
}

// Directory name to category mapping
const DIRECTORY_TO_CATEGORY: Record<string, SoundCategory> = {
  "Abyssal Horror": "monster",
  "Ambient": "ambient",
  "Character": "character",
  "Cute": "cute",
  "House & Office": "household",
  "Liquids": "liquid",
  "Monsters & Ghosts": "monster",
  "Stingers and Spooky Triggers": "stinger",
};

// Default tags per category for AI context
const CATEGORY_DEFAULT_TAGS: Record<SoundCategory, string[]> = {
  ambient: ["atmosphere", "background"],
  monster: ["horror", "creature"],
  cute: ["gentle", "positive", "happy"],
  stinger: ["jumpscare", "transition", "tension"],
  character: ["action", "player"],
  household: ["environment", "mundane"],
  liquid: ["wet", "fluid"],
  ui: ["interface", "feedback"],
};


/**
 * Generate a unique ID from filename
 * e.g., "Creepy_ambience_3.wav" -> "ambient_creepy_ambience_3"
 */
function generateId(filename: string, category: SoundCategory): string {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  const sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return `${category}_${sanitized}`;
}

/**
 * Generate tags from filename by splitting on underscores and spaces
 */
function generateTags(filename: string, category: SoundCategory): string[] {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  const parts = nameWithoutExt
    .toLowerCase()
    .split(/[_\s]+/)
    .filter((part) => part.length > 1 && !/^\d+$/.test(part));

  // Combine with category default tags, deduplicate
  const allTags = [...CATEGORY_DEFAULT_TAGS[category], ...parts];
  return [...new Set(allTags)];
}

/**
 * Generate human-readable description from filename
 */
function generateDescription(filename: string, dirName: string): string {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  const readable = nameWithoutExt
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${readable} (${dirName})`;
}

/**
 * Scan a directory for sound files
 */
function scanDirectory(dirPath: string, dirName: string): SoundEntry[] {
  const entries: SoundEntry[] = [];
  const category = DIRECTORY_TO_CATEGORY[dirName];

  if (!category) {
    console.warn(`Unknown directory: ${dirName}, skipping...`);
    return entries;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && /\.(mp3|wav|ogg)$/i.test(file)) {
      const relativePath = `sounds/${dirName}/${file}`;
      const entry: SoundEntry = {
        id: generateId(file, category),
        path: relativePath,
        category,
        tags: generateTags(file, category),
        loop: category === "ambient",
        description: generateDescription(file, dirName),
      };
      entries.push(entry);
    }
  }

  return entries;
}


/**
 * Main function to generate the sound catalog
 */
function generateCatalog(): SoundCatalog {
  const soundsDir = path.join(process.cwd(), "public", "sounds");
  const allSounds: SoundEntry[] = [];
  const categorizedSounds: Record<string, SoundEntry[]> = {};

  // Initialize category arrays
  for (const category of Object.values(DIRECTORY_TO_CATEGORY)) {
    if (!categorizedSounds[category]) {
      categorizedSounds[category] = [];
    }
  }

  // Scan each directory
  const directories = fs.readdirSync(soundsDir);

  for (const dirName of directories) {
    const dirPath = path.join(soundsDir, dirName);
    const stat = fs.statSync(dirPath);

    if (stat.isDirectory()) {
      const entries = scanDirectory(dirPath, dirName);
      allSounds.push(...entries);

      for (const entry of entries) {
        categorizedSounds[entry.category].push(entry);
      }
    }
  }

  // Sort sounds by ID for consistent output
  allSounds.sort((a, b) => a.id.localeCompare(b.id));
  for (const category of Object.keys(categorizedSounds)) {
    categorizedSounds[category].sort((a, b) => a.id.localeCompare(b.id));
  }

  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    categories: categorizedSounds,
    sounds: allSounds,
  };
}

/**
 * Pretty-print catalog to JSON
 */
function serializeCatalog(catalog: SoundCatalog): string {
  return JSON.stringify(catalog, null, 2);
}

// Main execution
const catalog = generateCatalog();
const outputPath = path.join(process.cwd(), "public", "sounds-catalog.json");
const json = serializeCatalog(catalog);

fs.writeFileSync(outputPath, json, "utf-8");

console.log(`✓ Generated sound catalog with ${catalog.sounds.length} sounds`);
console.log(`  Categories:`);
for (const [category, sounds] of Object.entries(catalog.categories)) {
  if (sounds.length > 0) {
    console.log(`    - ${category}: ${sounds.length} sounds`);
  }
}
console.log(`  Output: ${outputPath}`);
