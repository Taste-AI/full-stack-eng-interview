import * as fs from 'fs';
import * as path from 'path';

/**
 * Rebuild results.json from captures directory
 */
function rebuildResults(capturesDir: string, outputFile: string) {
  const files = fs.readdirSync(capturesDir)
    .filter(f => f.endsWith('.png'))
    .sort();

  console.log(`Rebuilding results from ${files.length} captures...`);

  const results = files.map(pngFile => {
    const hostname = pngFile.replace('.png', '');
    const metadataPath = path.join(capturesDir, `${hostname}.json`);
    const descriptionPath = path.join(capturesDir, `${hostname}-description.json`);
    const screenshotPath = path.join(capturesDir, pngFile);

    const result: any = {
      url: `https://${hostname}`,
      captureSuccess: false,
      descriptionSuccess: false,
      screenshotPath,
    };

    // Load metadata
    if (fs.existsSync(metadataPath)) {
      try {
        result.metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        result.metadataPath = metadataPath;
        result.captureSuccess = true;
      } catch (error) {
        console.error(`Failed to load metadata for ${hostname}`);
      }
    }

    // Load description
    if (fs.existsSync(descriptionPath)) {
      try {
        result.description = JSON.parse(fs.readFileSync(descriptionPath, 'utf-8'));
        result.descriptionPath = descriptionPath;
        result.descriptionSuccess = true;
      } catch (error) {
        console.error(`Failed to load description for ${hostname}`);
      }
    }

    return result;
  });

  // Save results
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  
  const successful = results.filter(r => r.captureSuccess && r.descriptionSuccess).length;
  console.log(`✓ Results saved: ${successful}/${results.length} complete websites`);
  console.log(`✓ Saved to: ${outputFile}`);
}

// CLI
if (require.main === module) {
  const capturesDir = process.argv[2] || './captures';
  const outputFile = process.argv[3] || './output/results.json';
  
  rebuildResults(capturesDir, outputFile);
}

