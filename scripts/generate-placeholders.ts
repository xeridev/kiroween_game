#!/usr/bin/env tsx
/**
 * Generate all 12 placeholder pet images using RunPod SeeDream V4
 *
 * Usage:
 *   npm run generate:placeholders
 *
 * Requirements:
 *   - RUNPOD_API_KEY environment variable set
 *   - RUNPOD_ENDPOINT_ID environment variable set (default: seedream-v4-t2i)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Types
type Archetype = 'GLOOM' | 'SPARK' | 'ECHO';
type PetStage = 'EGG' | 'BABY' | 'TEEN' | 'ABOMINATION';

interface ImagePrompt {
  archetype: Archetype;
  stage: PetStage;
  filename: string;
  prompt: string;
}

// Load environment variables
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID || 'seedream-v4-t2i';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'placeholders');

// Negative prompt for all images
const NEGATIVE_PROMPT = 'blurry, low quality, text, watermark, signature, frame, border, multiple creatures, background elements, photorealistic';

// All 12 image prompts
const IMAGE_PROMPTS: ImagePrompt[] = [
  // GLOOM Archetype
  {
    archetype: 'GLOOM',
    stage: 'EGG',
    filename: 'GLOOM_EGG.png',
    prompt: 'Dark purple obsidian egg floating in void, glowing cracks revealing inner sadness, melancholic aura, swirling shadows, mystical runes, centered on pure black background, digital art masterpiece, dark fantasy horror style, eerie atmosphere, high detail',
  },
  {
    archetype: 'GLOOM',
    stage: 'BABY',
    filename: 'GLOOM_BABY.png',
    prompt: 'Small melancholic blob creature with oversized sad eyes, dark purple translucent body, drooping features, shadowy wisps emanating, cute but unsettling, childlike innocent yet eerie, centered on pure black background, digital art masterpiece, dark fantasy style, creepy cute aesthetic',
  },
  {
    archetype: 'GLOOM',
    stage: 'TEEN',
    filename: 'GLOOM_TEEN.png',
    prompt: 'Medium-sized shadowy blob creature, deep purple ethereal form, large melancholic eyes with tears, defined sad features, ghostly tendrils flowing, slightly menacing presence, centered on pure black background, digital art masterpiece, dark fantasy horror style, liminal space atmosphere',
  },
  {
    archetype: 'GLOOM',
    stage: 'ABOMINATION',
    filename: 'GLOOM_ABOMINATION.png',
    prompt: 'Massive grotesque blob horror, multiple weeping eyes covering surface, dark purple corrupted flesh, twisted melancholic features, dripping shadows, nightmarish form, body horror, disturbing eldritch creature, centered on pure black background, digital art masterpiece, extreme detail, terrifying',
  },

  // SPARK Archetype
  {
    archetype: 'SPARK',
    stage: 'EGG',
    filename: 'SPARK_EGG.png',
    prompt: 'Crystalline triangular egg crackling with electric energy, sharp geometric facets, bright cyan lightning veins, glowing from within, energy discharge, angular mysterious form, centered on pure black background, digital art masterpiece, dark fantasy style, electric atmosphere',
  },
  {
    archetype: 'SPARK',
    stage: 'BABY',
    filename: 'SPARK_BABY.png',
    prompt: 'Small angular triangular creature with bright glowing eyes, cyan electric body, sharp cute features, sparks flying off edges, energetic childlike appearance, unsettling geometry, centered on pure black background, digital art masterpiece, dark fantasy style, creepy cute aesthetic',
  },
  {
    archetype: 'SPARK',
    stage: 'TEEN',
    filename: 'SPARK_TEEN.png',
    prompt: 'Medium-sized electric triangular creature, sharp angular features, bright cyan energy outline, crackling lightning bolts, defined geometric form, menacing electric presence, glowing sharp eyes, centered on pure black background, digital art masterpiece, dark fantasy horror style',
  },
  {
    archetype: 'SPARK',
    stage: 'ABOMINATION',
    filename: 'SPARK_ABOMINATION.png',
    prompt: 'Enormous terrifying geometric horror, multiple electric eyes on fractured triangular body, cyan lightning storm, twisted angular nightmare, sharp jagged edges, crackling energy chaos, body horror, disturbing eldritch geometry, centered on pure black background, digital art masterpiece, extreme detail, horrifying',
  },

  // ECHO Archetype
  {
    archetype: 'ECHO',
    stage: 'EGG',
    filename: 'ECHO_EGG.png',
    prompt: 'Translucent diamond-shaped egg phasing between dimensions, pale blue ghostly glow, ethereal mist trails, reality distortion, spectral aura, mysterious spirit form, centered on pure black background, digital art masterpiece, dark fantasy style, liminal space atmosphere',
  },
  {
    archetype: 'ECHO',
    stage: 'BABY',
    filename: 'ECHO_BABY.png',
    prompt: 'Small translucent diamond spirit creature, hollow glowing eyes, pale blue ghostly body, cute but otherworldly, echo trails following movement, childlike spectral appearance, unsettling phase-shifting, centered on pure black background, digital art masterpiece, dark fantasy style, creepy cute aesthetic',
  },
  {
    archetype: 'ECHO',
    stage: 'TEEN',
    filename: 'ECHO_TEEN.png',
    prompt: 'Medium-sized ghostly diamond creature, defined spectral features, pale blue translucent form, hollow glowing eyes, echo particles orbiting, menacing spirit presence, dimensional distortion, centered on pure black background, digital art masterpiece, dark fantasy horror style, ethereal atmosphere',
  },
  {
    archetype: 'ECHO',
    stage: 'ABOMINATION',
    filename: 'ECHO_ABOMINATION.png',
    prompt: 'Massive horrifying spectral horror, multiple hollow eyes on fractured diamond body, pale blue corrupted spirit energy, twisted ghostly nightmare, reality-breaking form, dimensional tears, body horror, disturbing eldritch spirit, centered on pure black background, digital art masterpiece, extreme detail, terrifying',
  },
];

// Helper: Submit job to RunPod
async function submitRunPodJob(prompt: string): Promise<string> {
  const url = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/run`;

  const payload = {
    input: {
      prompt,
      negative_prompt: NEGATIVE_PROMPT,
      size: '1024*1024',
      seed: -1,
      enable_safety_checker: true,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RUNPOD_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RunPod submit failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (!result.id) {
    throw new Error('No job ID returned from RunPod');
  }

  return result.id;
}

// Helper: Poll job status
async function pollJobStatus(jobId: string): Promise<string> {
  const url = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/status/${jobId}`;
  const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
      },
    });

    if (!response.ok) {
      attempts++;
      continue;
    }

    const result = await response.json();

    if (result.status === 'COMPLETED') {
      const output = result.output;

      // Handle different output formats from SeeDream V4
      if (output && output.result) {
        return output.result; // SeeDream V4 format: {result: "url", cost: number}
      } else if (output && output.image_url) {
        return output.image_url;
      } else if (typeof output === 'string' && output.startsWith('http')) {
        return output;
      } else {
        throw new Error(`Unexpected output format: ${JSON.stringify(output)}`);
      }
    } else if (result.status === 'FAILED') {
      throw new Error(`Job failed: ${result.error}`);
    }

    // Still IN_QUEUE or IN_PROGRESS
    process.stdout.write('.');
    attempts++;
  }

  throw new Error('Job timeout after 2 minutes');
}

// Helper: Download image
async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => { }); // Delete partial file
      reject(err);
    });
  });
}

// Helper: Generate single image
async function generateImage(imagePrompt: ImagePrompt): Promise<void> {
  const outputPath = path.join(OUTPUT_DIR, imagePrompt.filename);

  // Skip if already exists
  if (fs.existsSync(outputPath)) {
    console.log(`✓ ${imagePrompt.filename} already exists, skipping`);
    return;
  }

  console.log(`\n📸 Generating ${imagePrompt.filename}...`);
  console.log(`   Archetype: ${imagePrompt.archetype}, Stage: ${imagePrompt.stage}`);

  try {
    // Submit job
    const jobId = await submitRunPodJob(imagePrompt.prompt);
    console.log(`   Job submitted: ${jobId}`);
    console.log(`   Waiting for completion`);
    process.stdout.write('   ');

    // Poll for completion
    const imageUrl = await pollJobStatus(jobId);
    console.log(`\n   Image generated: ${imageUrl}`);

    // Download image
    console.log(`   Downloading...`);
    await downloadImage(imageUrl, outputPath);
    console.log(`   ✓ Saved to ${imagePrompt.filename}`);
  } catch (error) {
    console.error(`   ✗ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

// Main function
async function main() {
  console.log('🎨 Kiroween Game - Placeholder Image Generator\n');

  // Validate environment variables
  if (!RUNPOD_API_KEY) {
    console.error('❌ Error: RUNPOD_API_KEY environment variable not set');
    console.error('   Set it in .env file or export it:');
    console.error('   export RUNPOD_API_KEY=rpa_YOUR_KEY_HERE\n');
    process.exit(1);
  }

  console.log(`✓ RunPod API Key: ${RUNPOD_API_KEY.slice(0, 10)}...`);
  console.log(`✓ Endpoint: ${RUNPOD_ENDPOINT_ID}`);
  console.log(`✓ Output Directory: ${OUTPUT_DIR}\n`);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✓ Created output directory\n`);
  }

  console.log(`📋 Images to generate: ${IMAGE_PROMPTS.length}\n`);
  console.log('='.repeat(60));

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  // Generate each image sequentially
  for (let i = 0; i < IMAGE_PROMPTS.length; i++) {
    const imagePrompt = IMAGE_PROMPTS[i];
    console.log(`\n[${i + 1}/${IMAGE_PROMPTS.length}]`);

    try {
      const outputPath = path.join(OUTPUT_DIR, imagePrompt.filename);

      if (fs.existsSync(outputPath)) {
        skipCount++;
      } else {
        await generateImage(imagePrompt);
        successCount++;
      }
    } catch (error) {
      failCount++;
      console.error(`\n❌ Failed to generate ${imagePrompt.filename}`);

      // Ask user if they want to continue
      if (i < IMAGE_PROMPTS.length - 1) {
        console.log('\nContinue with next image? (yes/no)');
        // For now, continue automatically
        // In production, you might want to add readline for user input
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Generation Summary:\n');
  console.log(`   ✓ Successfully generated: ${successCount}`);
  console.log(`   ⊘ Skipped (already exist): ${skipCount}`);
  console.log(`   ✗ Failed: ${failCount}`);
  console.log(`   📁 Total files in ${OUTPUT_DIR}: ${fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png')).length}`);

  if (failCount === 0) {
    console.log('\n✅ All placeholder images generated successfully!\n');
  } else {
    console.log('\n⚠️  Some images failed to generate. Check errors above.\n');
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
