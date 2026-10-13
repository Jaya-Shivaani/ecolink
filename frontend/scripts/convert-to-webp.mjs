/**
 * Convert all PNG product images to optimized WebP format
 * This dramatically reduces file sizes (typically 60-80% smaller)
 */
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ASSETS_DIR = join(__dirname, '..', 'src', 'assets', 'products');
const MAX_WIDTH = 600; // Product card images are displayed at ~300px, 2x for retina

async function convertImages() {
  const files = await readdir(ASSETS_DIR);
  const pngFiles = files.filter(f => extname(f).toLowerCase() === '.png');
  
  console.log(`Found ${pngFiles.length} PNG files to convert...\n`);
  
  let totalOriginal = 0;
  let totalConverted = 0;
  
  for (const file of pngFiles) {
    const inputPath = join(ASSETS_DIR, file);
    const outputName = basename(file, '.png') + '.webp';
    const outputPath = join(ASSETS_DIR, outputName);
    
    try {
      const originalStat = await stat(inputPath);
      totalOriginal += originalStat.size;
      
      await sharp(inputPath)
        .resize(MAX_WIDTH, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ 
          quality: 80,
          effort: 6 // Higher effort = smaller file
        })
        .toFile(outputPath);
      
      const newStat = await stat(outputPath);
      totalConverted += newStat.size;
      
      const savings = ((1 - newStat.size / originalStat.size) * 100).toFixed(1);
      console.log(`✓ ${file} (${(originalStat.size/1024).toFixed(0)}KB) → ${outputName} (${(newStat.size/1024).toFixed(0)}KB) — ${savings}% smaller`);
    } catch (err) {
      console.error(`✗ Error converting ${file}:`, err.message);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total original: ${(totalOriginal/1024/1024).toFixed(2)} MB`);
  console.log(`Total converted: ${(totalConverted/1024/1024).toFixed(2)} MB`);
  console.log(`Total savings: ${((1 - totalConverted/totalOriginal) * 100).toFixed(1)}%`);
}

convertImages().catch(console.error);
