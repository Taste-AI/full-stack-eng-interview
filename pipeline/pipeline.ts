import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { capturePage, CaptureResult } from './capture';
import { describeWebsite } from './describe';
import { exportToCSV } from './export-csv';

interface PipelineOptions {
  urls: string[];
  capturesDir?: string;
  outputFile?: string;
  model?: string;
  captureOnly?: boolean; // If true, skip description stage
}

interface PipelineResult {
  url: string;
  captureSuccess: boolean;
  descriptionSuccess: boolean;
  // File paths
  screenshotPath?: string;
  metadataPath?: string;
  descriptionPath?: string;
  // Actual data (aggregated)
  metadata?: any;
  description?: any;
  error?: string;
}

/**
 * Main pipeline: Screenshot → Extract → Describe → Save
 */
export async function runPipeline(options: PipelineOptions): Promise<PipelineResult[]> {
  const {
    urls,
    capturesDir = './captures',
    outputFile = './output/results.json',
    model = 'anthropic/claude-3.5-sonnet',
    captureOnly = false,
  } = options;

  console.log('\n=== Website Analysis Pipeline ===\n');
  console.log(`Processing ${urls.length} URLs`);
  console.log(`Captures directory: ${capturesDir}`);
  console.log(`Model: ${model}\n`);

  // Stage 1: Capture (screenshot + metadata) in parallel
  console.log('Stage 1: Capturing pages (screenshots + metadata)...');
  const capturePromises = urls.map((url) => {
    const hostname = new URL(url).hostname.replace('www.', '');
    const outputPath = path.join(capturesDir, `${hostname}.png`);
    return capturePage({ url, outputPath });
  });

  const captureResults = await Promise.allSettled(capturePromises);
  
  const successful = captureResults.filter(
    r => r.status === 'fulfilled' && r.value.success
  ).length;
  console.log(`✓ Stage 1 complete: ${successful}/${urls.length} captures successful\n`);

  // If capture-only mode, return early
  if (captureOnly) {
    return captureResults.map((result, index) => ({
      url: urls[index],
      captureSuccess: result.status === 'fulfilled' && result.value.success,
      descriptionSuccess: false,
      screenshotPath: result.status === 'fulfilled' ? result.value.screenshotPath : undefined,
      metadataPath: result.status === 'fulfilled' ? result.value.metadataPath : undefined,
      error: result.status === 'rejected' ? String(result.reason) : undefined,
    }));
  }

  // Stage 2: Describe (AI analysis) in parallel
  console.log('Stage 2: Generating descriptions with AI...');
  
  const descriptionPromises = captureResults.map(async (captureResult, index) => {
    if (captureResult.status === 'rejected' || !captureResult.value.success) {
      return null; // Skip failed captures
    }

    const capture = captureResult.value;
    const url = urls[index];
    
    try {
      const description = await describeWebsite({
        imagePath: capture.screenshotPath!,
        url,
        metadata: capture.metadata, // Pass extracted metadata
        model,
      });

      // Save description to JSON
      const descriptionPath = capture.screenshotPath!.replace('.png', '-description.json');
      fs.writeFileSync(descriptionPath, JSON.stringify(description, null, 2));
      
      return { description, descriptionPath, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to describe ${url}: ${errorMessage}`);
      return { description: null, descriptionPath: null, error: errorMessage };
    }
  });

  const descriptionResults = await Promise.allSettled(descriptionPromises);
  
  const successfulDescriptions = descriptionResults.filter(
    r => r.status === 'fulfilled' && r.value !== null && r.value.description !== null
  ).length;
  console.log(`✓ Stage 2 complete: ${successfulDescriptions}/${successful} descriptions successful\n`);

  // Stage 3: Aggregate results with full data
  console.log('Stage 3: Aggregating results...');
  
  const results: PipelineResult[] = urls.map((url, index) => {
    const captureResult = captureResults[index];
    const descriptionResult = descriptionResults[index];

    const captureSuccess = captureResult.status === 'fulfilled' && captureResult.value.success;
    const descriptionSuccess = descriptionResult.status === 'fulfilled' 
      && descriptionResult.value !== null 
      && descriptionResult.value.description !== null;

    // Determine error message
    let errorMessage: string | undefined;
    if (captureResult.status === 'rejected') {
      errorMessage = `Capture failed: ${String(captureResult.reason)}`;
    } else if (!captureSuccess && captureResult.status === 'fulfilled') {
      errorMessage = `Capture failed: ${captureResult.value.error}`;
    } else if (descriptionResult.status === 'rejected') {
      errorMessage = `Description failed: ${String(descriptionResult.reason)}`;
    } else if (descriptionResult.status === 'fulfilled' && descriptionResult.value?.error) {
      errorMessage = `Description failed: ${descriptionResult.value.error}`;
    }

    return {
      url,
      captureSuccess,
      descriptionSuccess,
      // File paths
      screenshotPath: captureResult.status === 'fulfilled' ? captureResult.value.screenshotPath : undefined,
      metadataPath: captureResult.status === 'fulfilled' ? captureResult.value.metadataPath : undefined,
      descriptionPath: descriptionResult.status === 'fulfilled' && descriptionResult.value?.descriptionPath
        ? descriptionResult.value.descriptionPath 
        : undefined,
      // Actual data
      metadata: captureResult.status === 'fulfilled' ? captureResult.value.metadata : undefined,
      description: descriptionResult.status === 'fulfilled' && descriptionResult.value?.description
        ? descriptionResult.value.description 
        : undefined,
      error: errorMessage,
    };
  });

  // Save aggregated results
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`✓ Results saved to: ${outputFile}`);
  
  // Export to CSV
  const csvFile = outputFile.replace('.json', '.csv');
  exportToCSV({ resultsFile: outputFile, outputFile: csvFile });
  console.log('');

  // Summary
  const totalSuccess = results.filter(r => r.captureSuccess && r.descriptionSuccess).length;
  const failures = results.filter(r => r.error);
  
  console.log('=== Pipeline Complete ===');
  console.log(`Total successful: ${totalSuccess}/${urls.length}`);
  console.log(`Captures: ${results.filter(r => r.captureSuccess).length}/${urls.length}`);
  console.log(`Descriptions: ${results.filter(r => r.descriptionSuccess).length}/${urls.length}`);
  
  if (failures.length > 0) {
    console.log(`\n=== Failures (${failures.length}) ===`);
    failures.forEach(f => {
      console.log(`❌ ${f.url}`);
      console.log(`   ${f.error}\n`);
    });
  }
  
  console.log('');

  return results;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  node dist/pipeline.js <url1> [url2] [url3] ...
  node dist/pipeline.js --file <path-to-urls.txt>
  node dist/pipeline.js --capture-only <url1> [url2] ...

Options:
  --file <path>        Read URLs from file (one per line)
  --capture-only       Only capture pages, skip AI descriptions
  --model <model>      Specify OpenRouter model (default: anthropic/claude-3.5-sonnet)

Examples:
  node dist/pipeline.js https://stripe.com https://linear.app
  node dist/pipeline.js --file sample-urls.txt
  node dist/pipeline.js --capture-only https://example.com
`);
    process.exit(1);
  }

  let urls: string[] = [];
  let captureOnly = false;
  let model = 'anthropic/claude-3.5-sonnet';

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--file') {
      const filePath = args[++i];
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      urls = fileContent.split('\n')
        .map(line => {
          // If it's a CSV, take only the first column
          const firstColumn = line.split(',')[0].trim();
          return firstColumn;
        })
        .filter(line => line && !line.startsWith('#') && line.startsWith('http'));
    } else if (arg === '--capture-only') {
      captureOnly = true;
    } else if (arg === '--model') {
      model = args[++i];
    } else if (arg.startsWith('http')) {
      urls.push(arg);
    }
  }

  if (urls.length === 0) {
    console.error('Error: No valid URLs provided');
    process.exit(1);
  }

  runPipeline({ urls, captureOnly, model })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Pipeline error:', error);
      process.exit(1);
    });
}

