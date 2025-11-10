import * as fs from 'fs';
import * as path from 'path';

interface CSVExportOptions {
  resultsFile: string;
  outputFile: string;
}

/**
 * Export pipeline results to CSV format
 */
export function exportToCSV(options: CSVExportOptions): void {
  const { resultsFile, outputFile } = options;

  // Read results JSON
  const resultsContent = fs.readFileSync(resultsFile, 'utf-8');
  const results = JSON.parse(resultsContent);

  // CSV headers matching the required metadata
  const headers = [
    'URL',
    'Style',
    'Detected Fonts',
    'Audience',
    'Page Type',
    'Layout Style',
    'Page Description',
    'Intent',
    'Screenshot Path',
    'Capture Success',
    'Description Success',
    'Error',
  ];

  // Build CSV rows
  const rows = [headers];

  results.forEach((result: any) => {
    const desc = result.description || {};
    const meta = result.metadata || {};
    
    const row = [
      result.url || '',
      desc.style || '',
      (desc.detectedFonts || []).join('; ') || '',
      desc.audience || '',
      desc.pageType || '',
      desc.layoutStyle || '',
      (desc.pageDescription || '').replace(/\n/g, ' ') || '', // Remove newlines for CSV
      (desc.intent || '').replace(/\n/g, ' ') || '',
      result.screenshotPath || '',
      result.captureSuccess ? 'Yes' : 'No',
      result.descriptionSuccess ? 'Yes' : 'No',
      result.error || '',
    ];

    // Escape CSV fields
    const escapedRow = row.map(field => {
      const str = String(field);
      // If field contains comma, quote, or newline, wrap in quotes and escape quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });

    rows.push(escapedRow);
  });

  // Write CSV
  const csvContent = rows.map(row => row.join(',')).join('\n');
  
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputFile, csvContent);
  console.log(`✓ CSV exported to: ${outputFile}`);
  console.log(`  ${results.length} websites`);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
Usage:
  node dist/export-csv.js [results-json] [output-csv]

Example:
  node dist/export-csv.js ./output/results.json ./output/results.csv

Defaults:
  results-json: ./output/results.json
  output-csv: ./output/results.csv
`);
    process.exit(1);
  }

  const resultsFile = args[0] || './output/results.json';
  const outputFile = args[1] || './output/results.csv';

  exportToCSV({ resultsFile, outputFile });
}

