import { readFile, writeFile } from 'fs/promises';
import { glob } from 'fs/promises';
import path from 'path';

const SRC_DIR = path.resolve('src');

// Match image paths like /images/path/to/file.jpg or /images/path/to/file.JPG
// Works with both regular paths and URL-encoded paths (%20 for spaces)
// Captures: full path after /images/, filename, extension
const IMAGE_PATH_REGEX =
  /\/images\/((?:[^"'\)`,\s]*?\/)?)([^"'\)`,\s\/]+)\.(jpg|JPG|jpeg|JPEG|png|PNG|webp|WEBP)/g;

function replaceImagePaths(content) {
  return content.replace(IMAGE_PATH_REGEX, (match, dirPath, filename, ext) => {
    // Normalize extension to lowercase
    const normalizedExt = ext.toLowerCase() === 'jpeg' ? 'jpg' : ext.toLowerCase();
    // Insert /compressed after /images and prefix filename with compressed-
    return `/images/compressed/${dirPath}compressed-${filename}.${normalizedExt}`;
  });
}

async function main() {
  // Find all source files
  const files = [];
  for await (const entry of glob(path.join(SRC_DIR, '**/*.{tsx,ts,jsx,js,css}'))) {
    files.push(entry);
  }

  console.log(`Found ${files.length} source files to scan.\n`);

  let totalChanges = 0;

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf-8');
    const updated = replaceImagePaths(content);

    if (content !== updated) {
      await writeFile(filePath, updated, 'utf-8');

      // Count changes
      const origMatches = content.match(IMAGE_PATH_REGEX) || [];
      totalChanges += origMatches.length;

      const relPath = path.relative(process.cwd(), filePath);
      console.log(`Updated: ${relPath} (${origMatches.length} references)`);
    }
  }

  console.log(`\nDone! Updated ${totalChanges} image references total.`);
}

main().catch(console.error);
