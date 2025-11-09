import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';


type ViewportPreset = 'mobile' | 'desktop';

const VIEWPORT_PRESETS = {
  mobile: { width: 375, height: 812 },
  desktop: { width: 1920, height: 1080 },
};

interface CaptureOptions {
  url: string;
  outputPath: string;
  viewportPreset?: ViewportPreset; // Default: 'desktop'
  timeout?: number;
  maxRetries?: number;
}

export interface PageMetadata {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  h1s: string[];
  h2s: string[];
  textContent: string;
  links: number;
  images: number;
  detectedFonts: string[];
}

export interface CaptureResult {
  url: string;
  success: boolean;
  screenshotPath?: string;
  metadataPath?: string;
  metadata?: PageMetadata;
  error?: string;
  timestamp: Date;
  retryCount?: number;
}

/**
 * Extract text content and metadata from the page
 */
async function extractPageMetadata(page: Page): Promise<PageMetadata> {
  return await page.evaluate(() => {
    // Get meta tags
    const getMeta = (selector: string): string => {
      const element = document.querySelector(selector);
      return element?.getAttribute('content') || '';
    };

    // Get all text content (visible text only)
    // Use innerText but clean it up a bit
    const textContent = (document.body.innerText || '')
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double
      .trim();

    // Get headings - use innerText to preserve spacing
    const h1s = Array.from(document.querySelectorAll('h1')).map(h => {
      const text = h.innerText?.trim() || h.textContent?.trim() || '';
      return text.replace(/\s+/g, ' '); // Normalize whitespace
    });
    const h2s = Array.from(document.querySelectorAll('h2')).map(h => {
      const text = h.innerText?.trim() || h.textContent?.trim() || '';
      return text.replace(/\s+/g, ' ');
    });

    // Count elements
    const links = document.querySelectorAll('a[href]').length;
    const images = document.querySelectorAll('img').length;

    // Detect fonts (from computed styles of key elements)
    const fontFamilies = new Set<string>();
    const sampleElements = [
      document.body,
      ...Array.from(document.querySelectorAll('h1, h2, h3, p, button, a')).slice(0, 20)
    ];
    
    sampleElements.forEach(el => {
      if (el) {
        const fontFamily = window.getComputedStyle(el).fontFamily;
        if (fontFamily) {
          // Clean up font family string
          fontFamily.split(',').forEach(font => {
            const cleaned = font.trim().replace(/['"]/g, '');
            if (cleaned && cleaned !== 'serif' && cleaned !== 'sans-serif') {
              fontFamilies.add(cleaned);
            }
          });
        }
      }
    });

    return {
      title: document.title,
      description: getMeta('meta[name="description"]'),
      ogTitle: getMeta('meta[property="og:title"]'),
      ogDescription: getMeta('meta[property="og:description"]'),
      h1s: h1s.filter(h => h.length > 0),
      h2s: h2s.filter(h => h.length > 0).slice(0, 10), // Limit to first 10
      textContent: textContent.slice(0, 5000), // Limit to first 5000 chars
      links,
      images,
      detectedFonts: Array.from(fontFamilies).slice(0, 10), // Top 10 fonts
    };
  });
}

/**
 * Attempt to dismiss common cookie banners and overlays
 */
// async function dismissOverlays(page: Page): Promise<void> {
//   const dismissSelectors = [
//     // Common cookie banner accept buttons
//     '[id*="cookie" i] button:has-text("Accept")',
//     '[class*="cookie" i] button:has-text("Accept")',
//     '[id*="cookie" i] button:has-text("I accept")',
//     '[class*="cookie" i] button:has-text("I accept")',
//     'button:has-text("Accept all")',
//     'button:has-text("Accept All")',
//     'button:has-text("I accept")',
//     '[aria-label*="Accept" i]',
//     '[aria-label*="accept cookies" i]',
//     // GDPR common patterns
//     'button[id*="accept" i]',
//     'button[class*="accept" i]',
//   ];

//   for (const selector of dismissSelectors) {
//     try {
//       const button = page.locator(selector).first();
//       if (await button.isVisible({ timeout: 1000 })) {
//         await button.click({ timeout: 1000 });
//         await page.waitForTimeout(500);
//         console.log('Dismissed overlay');
//         break; // Only dismiss one overlay
//       }
//     } catch {
//       // Selector not found or not clickable, continue
//     }
//   }
// }

/**
 * Capture page data: screenshot + metadata (internal implementation)
 */
async function capturePageInternal(
  options: CaptureOptions
): Promise<CaptureResult> {
  const {
    url,
    outputPath,
    viewportPreset = 'desktop',
    timeout = 60000, // 60 seconds default
  } = options;

  // Get viewport dimensions from preset
  const viewport = VIEWPORT_PRESETS[viewportPreset];

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log(`Taking screenshot of: ${url} (${viewportPreset}: ${viewport.width}x${viewport.height})`);

    // Launch browser
    browser = await chromium.launch({
      headless: true,
    });

    // Create new page with viewport
    page = await browser.newPage({
      viewport,
    });

    // Set timeout for navigation
    page.setDefaultTimeout(timeout);

    // Navigate to URL with fallback strategy
    // Try networkidle first, fall back to load if it times out
    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: timeout,
      });
    } catch (error) {
      // If networkidle times out, try with less strict 'load' condition
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('Timeout') && errorMsg.includes('networkidle')) {
        console.log(`networkidle timeout, retrying with 'load' condition...`);
        await page.goto(url, {
          waitUntil: 'load',
          timeout: timeout,
        });
      } else {
        throw error;
      }
    }

    // Try to dismiss cookie banners and overlays
    // await dismissOverlays(page);

    // Scroll to bottom to trigger lazy-loaded images
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        // Use the larger of body or documentElement scrollHeight
        const scrollHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        );
        
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));

    // Wait for all images to load (including lazy-loaded ones)
    await page.evaluate(async () => {
      const selectors = ['img', 'picture', 'video', '[style*="background-image"]'];
      const elements = document.querySelectorAll(selectors.join(','));
      
      await Promise.all(
        Array.from(elements).map((element: Element) => {
          if (element.tagName === 'IMG') {
            const img = element as HTMLImageElement;
            if (img.complete && img.naturalHeight !== 0) {
              return Promise.resolve();
            }
            return new Promise((resolve) => {
              img.addEventListener('load', () => resolve(null));
              img.addEventListener('error', () => resolve(null));
              setTimeout(() => resolve(null), 10000);
            });
          }
          return Promise.resolve();
        })
      );
    });

    // Wait for fonts to load (important for design capture)
    await page.evaluate(() => document.fonts.ready);

    // Wait for network to be idle again after all scrolling/loading
    // Use a shorter timeout to avoid hanging on sites with continuous requests
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch (error) {
      console.log('Network still active, proceeding anyway...');
    }
    await page.waitForTimeout(2000);

    // Brief buffer for any final animations

    // Extract page metadata (text content, headings, fonts, etc.)
    console.log('Extracting page metadata...');
    const metadata = await extractPageMetadata(page);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save metadata to JSON file alongside screenshot
    const metadataPath = outputPath.replace(/\.(png|jpg|jpeg)$/, '.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`Metadata saved: ${metadataPath}`);

    // Take full-page screenshot
    await page.screenshot({
      path: outputPath,
      fullPage: true,
    });

    console.log(`Screenshot saved: ${outputPath}`);

    return {
      url,
      success: true,
      screenshotPath: outputPath,
      metadataPath,
      metadata,
      timestamp: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to screenshot ${url}: ${errorMessage}`);

    return {
      url,
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    };
  } finally {
    // Clean up
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

/**
 * Capture page data (screenshot + metadata) with automatic retry on failure
 */
export async function capturePage(
  options: CaptureOptions
): Promise<CaptureResult> {
  const maxRetries = options.maxRetries ?? 2;
  let lastResult: CaptureResult | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastResult = await capturePageInternal(options);
    
    if (lastResult.success) {
      if (attempt > 0) {
        lastResult.retryCount = attempt;
        console.log(`Succeeded after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`);
      }
      return lastResult;
    }
    
    if (attempt < maxRetries) {
      const delay = 2000 * (attempt + 1); // Exponential backoff: 2s, 4s
      console.log(`Retry ${attempt + 1}/${maxRetries} for ${options.url} in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries exhausted, return last failed result
  return lastResult!;
}

// Backward compatibility alias
export const takeScreenshot = capturePage;

// CLI usage for testing
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  npm run capture <url> [output-path]

Examples:
  npm run capture https://example.com
  npm run capture https://example.com ./captures/example.png
  
Captures both screenshot and metadata (saved as .json alongside screenshot)
`);
    process.exit(1);
  }

  const url = args[0];
  const outputPath = args[1] || `./captures/${new URL(url).hostname}.png`;

  capturePage({ url, outputPath })
    .then((result) => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}
