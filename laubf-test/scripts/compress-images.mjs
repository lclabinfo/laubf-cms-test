import sharp from 'sharp';
import { readdir, mkdir, stat } from 'fs/promises';
import path from 'path';

const IMAGES_DIR = path.resolve('public/images');
const OUTPUT_DIR = path.resolve('public/images/compressed');

// Quality settings - high enough to preserve quality
const QUALITY = {
  jpg: 80,
  png: 80,
  webp: 80,
};

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function getAllImages(dir, baseDir = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip the compressed output directory itself
    if (fullPath === OUTPUT_DIR) continue;

    if (entry.isDirectory()) {
      files.push(...(await getAllImages(fullPath, baseDir)));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.has(ext)) {
        files.push({
          fullPath,
          relativePath: path.relative(baseDir, fullPath),
          ext,
          name: entry.name,
        });
      }
    }
  }

  return files;
}

async function compressImage(file) {
  const dir = path.dirname(file.relativePath);
  const ext = file.ext.toLowerCase();
  // Strip the ORIGINAL extension (case-sensitive) from the filename
  const originalExt = path.extname(file.name);
  const baseName = path.basename(file.name, originalExt);

  // Output: compressed/[subdir]/compressed-[name].[ext]
  // Always lowercase extension
  const outputExt = ext === '.jpeg' ? '.jpg' : ext;
  const outputName = `compressed-${baseName}${outputExt}`;
  const outputDir = path.join(OUTPUT_DIR, dir === '.' ? '' : dir);
  const outputPath = path.join(outputDir, outputName);

  // Create output directory
  await mkdir(outputDir, { recursive: true });

  const originalStats = await stat(file.fullPath);
  const originalSize = originalStats.size;

  let pipeline = sharp(file.fullPath).rotate(); // auto-rotate based on EXIF

  if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({ quality: QUALITY.jpg, mozjpeg: true });
  } else if (ext === '.png') {
    pipeline = pipeline.png({ quality: QUALITY.png, compressionLevel: 8 });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality: QUALITY.webp });
  }

  await pipeline.toFile(outputPath);

  const compressedStats = await stat(outputPath);
  const compressedSize = compressedStats.size;
  const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);

  return {
    file: file.relativePath,
    output: path.relative(IMAGES_DIR, outputPath),
    originalKB: (originalSize / 1024).toFixed(0),
    compressedKB: (compressedSize / 1024).toFixed(0),
    savings: `${savings}%`,
  };
}

async function main() {
  console.log('Finding images...');
  const images = await getAllImages(IMAGES_DIR);
  console.log(`Found ${images.length} images to compress.\n`);

  let totalOriginal = 0;
  let totalCompressed = 0;
  let processed = 0;
  let errors = 0;

  for (const file of images) {
    try {
      const result = await compressImage(file);
      totalOriginal += parseInt(result.originalKB);
      totalCompressed += parseInt(result.compressedKB);
      processed++;
      console.log(
        `[${processed}/${images.length}] ${result.file} — ${result.originalKB}KB → ${result.compressedKB}KB (${result.savings} saved)`
      );
    } catch (err) {
      errors++;
      console.error(`[ERROR] ${file.relativePath}: ${err.message}`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Processed: ${processed} images`);
  console.log(`Errors: ${errors}`);
  console.log(
    `Total: ${(totalOriginal / 1024).toFixed(1)}MB → ${(totalCompressed / 1024).toFixed(1)}MB`
  );
  console.log(
    `Savings: ${(((totalOriginal - totalCompressed) / totalOriginal) * 100).toFixed(1)}%`
  );
}

main().catch(console.error);
