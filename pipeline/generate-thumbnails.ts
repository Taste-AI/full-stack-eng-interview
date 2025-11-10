import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

interface ThumbnailOptions {
  inputPath: string;
  outputPath: string;
  width?: number; // Default: 1280
}

/**
 * Generate a 16:9 thumbnail cropped from the top of the screenshot
 */
export async function generateThumbnail(options: ThumbnailOptions): Promise<void> {
  const { inputPath, outputPath, width = 1280 } = options;
  
  // Calculate 16:9 height
  const height = Math.round(width * (9 / 16));
  
  console.log(`Generating ${width}×${height} thumbnail from ${inputPath}`);
  
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error('Could not read image dimensions');
  }
  
  // Calculate crop area (from top, maintaining aspect ratio)
  const sourceWidth = metadata.width;
  const sourceHeight = Math.round(sourceWidth * (9 / 16));
  
  // Crop from top (y: 0) and resize to target dimensions
  await image
    .extract({
      left: 0,
      top: 0,
      width: sourceWidth,
      height: Math.min(sourceHeight, metadata.height), // Don't exceed image height
    })
    .resize(width, height, {
      fit: 'cover',
      position: 'top',
    })
    .webp({ quality: 90 })
    .toFile(outputPath);
  
  console.log(`✓ Thumbnail saved: ${outputPath}`);
}

/**
 * Batch generate thumbnails for all screenshots in a directory
 */
export async function generateThumbnailsFromDirectory(
  capturesDir: string,
  thumbnailsDir: string,
  width: number = 1280,
  limit?: number
): Promise<void> {
  // Ensure thumbnails directory exists
  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }
  
  // Find all PNG files
  let files = fs.readdirSync(capturesDir)
    .filter(f => f.endsWith('.png') && !f.includes('-description'))
    .sort(); // Sort for consistent ordering
  
  // Limit if specified
  if (limit) {
    files = files.slice(0, limit);
  }
  
  console.log(`\nGenerating thumbnails for ${files.length} screenshots...`);
  console.log(`Target size: ${width}×${Math.round(width * (9 / 16))} (16:9 aspect ratio, WebP format)\n`);
  
  let successful = 0;
  let failed = 0;
  
  for (const file of files) {
    const inputPath = path.join(capturesDir, file);
    const outputPath = path.join(thumbnailsDir, file.replace('.png', '-thumb.webp'));
    
    try {
      await generateThumbnail({ inputPath, outputPath, width });
      successful++;
    } catch (error) {
      console.error(`Failed to generate thumbnail for ${file}: ${error}`);
      failed++;
    }
  }
  
  console.log(`\n✓ Complete: ${successful} successful, ${failed} failed`);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  node dist/generate-thumbnails.js <captures-dir> [thumbnails-dir] [width] [limit]

Examples:
  node dist/generate-thumbnails.js ./captures
  node dist/generate-thumbnails.js ./captures ./thumbnails 640 5
  node dist/generate-thumbnails.js ./captures ./thumbnails 1280

Defaults:
  thumbnails-dir: ./thumbnails
  width: 640 (height auto-calculated for 16:9)
  limit: all files
`);
    process.exit(1);
  }

  const capturesDir = args[0];
  const thumbnailsDir = args[1] || './thumbnails';
  const width = args[2] ? parseInt(args[2]) : 1920;
  const limit = args[3] ? parseInt(args[3]) : undefined;

  generateThumbnailsFromDirectory(capturesDir, thumbnailsDir, width, limit)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

