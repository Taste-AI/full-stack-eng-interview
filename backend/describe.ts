import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { PageMetadata } from './capture';

interface DescriptionOptions {
  imagePath: string;
  url: string;
  metadata?: PageMetadata; // Optional: extracted page metadata (fonts, text, etc.)
  model?: string; // OpenRouter model to use
  maxHeight?: number; // Max image height for API (default: 8000)
}

interface WebsiteDescription {
  url: string;
  pageDescription: string; // Granular description covering layout, sections, content, visuals, interactions
  style: string;
  detectedFonts: string[];
  audience: string;
  pageType: string;
  layoutStyle: string;
  intent: string;
  timestamp: Date;
}

function buildAnalysisPrompt(metadata?: PageMetadata): string {
  const fontInfo = metadata?.detectedFonts && metadata.detectedFonts.length > 0
    ? `\n\nDetected fonts on this page: ${metadata.detectedFonts.join(', ')}`
    : '';

  const headingsInfo = metadata?.h1s && metadata.h1s.length > 0
    ? `\n\nMain headings: ${metadata.h1s.join('; ')}`
    : '';

  return `Analyze this website screenshot and provide detailed design metadata in the following format:

**Page Description**: Provide a comprehensive, granular description of the page covering:
- Layout structure (grid system, columns, spacing, alignment, visual hierarchy, spatial organization)
- Sections (list and describe each distinct section from top to bottom)
- Content types (text blocks, images, videos, forms, CTAs, navigation, information architecture)
- Visual elements (colors, imagery, icons, illustrations, graphics, whitespace, shadows, borders, aesthetic details)
- Interactions (buttons, links, hover states, form inputs, menus, dropdowns, modals, animations)

Write this as a detailed, flowing description that captures the complete visual and functional design of the page.

**Style**: The overall design style and aesthetic (e.g., modern, brutalist, minimalist, maximalist, retro, futuristic, elegant, playful, corporate, glassmorphism, neumorphism)

**Audience**: Target audience based on design choices, language, and visual style (e.g., developers, Gen Z women, enterprise buyers, creative professionals, small business owners)

**Page Type**: Type of page (e.g., homepage, product page, landing page, pricing page, about page, blog, portfolio, documentation)

**Layout Style**: Layout approach (standard/conventional, trendy/modern, creative/unique/experimental)

**Intent**: What is this page trying to accomplish? What action should users take? What message is being conveyed?${fontInfo}${headingsInfo}

Be specific, detailed, and observant. Focus on design patterns and UX elements that make this website distinctive.`; 
}

export async function describeWebsite(options: DescriptionOptions): Promise<WebsiteDescription> {
  const { imagePath, url, metadata: pageMetadata, model = 'anthropic/claude-3.5-sonnet', maxHeight = 8000 } = options;
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }

  // Load image and check dimensions
  const image = sharp(imagePath);
  const imageMetadata = await image.metadata();
  
  let imageBuffer: Buffer;
  
  // Crop if height exceeds maxHeight
  if (imageMetadata.height && imageMetadata.height > maxHeight) {
    console.log(`Image height (${imageMetadata.height}px) exceeds max (${maxHeight}px), cropping...`);
    imageBuffer = await image
      .extract({ left: 0, top: 0, width: imageMetadata.width!, height: maxHeight })
      .png()
      .toBuffer();
  } else {
    imageBuffer = await image.png().toBuffer();
  }
  
  // Check file size and compress if over 3.5MB (accounting for base64 33% overhead = ~4.7MB)
  const maxBytes = 3.5 * 1024 * 1024;
  let mediaType = 'image/png';
  
  if (imageBuffer.length > maxBytes) {
    console.log(`Image size (${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB) exceeds limit, compressing...`);
    // Convert to JPEG with quality adjustment
    imageBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 85 })
      .toBuffer();
    mediaType = 'image/jpeg';
    console.log(`Compressed to ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    
    // If still too large after compression, try lower quality
    if (imageBuffer.length > maxBytes) {
      console.log(`Still too large, compressing more aggressively...`);
      imageBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 70 })
        .toBuffer();
      console.log(`Re-compressed to ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    }
  }
  
  const base64Image = imageBuffer.toString('base64');
  const base64SizeMB = (base64Image.length / 1024 / 1024).toFixed(2);
  console.log(`Base64 size: ${base64SizeMB}MB`);

  console.log(`Analyzing screenshot: ${imagePath} with ${model}`);
  
  // Build prompt with extracted metadata if available
  const prompt = buildAnalysisPrompt(pageMetadata);

  // Call OpenRouter API (OpenAI-compatible format)
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType};base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: `URL: ${url}\n\n${prompt}`,
            },
          ],
        },
      ],
      max_tokens: 2000,
    }),
  });

  const responseText = await response.text();
  
  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${responseText}`);
  }

  let data: any;
  try {
    data = JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse API response as JSON. Response:', responseText.substring(0, 500));
    throw new Error(`API returned invalid JSON: ${error}`);
  }
  
  // Validate response structure
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Unexpected API response structure:', JSON.stringify(data, null, 2));
    throw new Error('Invalid API response structure - missing choices or message');
  }
  
  const messageContent = data.choices[0].message.content || '';
  
  // Parse the structured response
  const parsed = parseAnalysisResponse(messageContent);

  console.log(`✓ Analysis complete for ${url}`);

  return {
    url,
    ...parsed,
    detectedFonts: pageMetadata?.detectedFonts || [],
    timestamp: new Date(),
  };
}

function parseAnalysisResponse(text: string): Omit<WebsiteDescription, 'url' | 'timestamp' | 'detectedFonts'> {
  const extract = (label: string): string => {
    const regex = new RegExp(`\\*\\*${label}\\*\\*:?\\s*(.+?)(?=\\n\\*\\*|$)`, 'is');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  return {
    pageDescription: extract('Page Description'),
    style: extract('Style'),
    audience: extract('Audience'),
    pageType: extract('Page Type'),
    layoutStyle: extract('Layout Style'),
    intent: extract('Intent'),
  };
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Usage:
  node dist/describe.js <image-path> <url>

Example:
  node dist/describe.js ./captures/stripe.com.png https://stripe.com
  
Note: Will automatically load metadata from .json file if available
`);
    process.exit(1);
  }

  const [imagePath, url] = args;

  // Try to load metadata JSON if it exists
  const metadataPath = imagePath.replace(/\.png$/, '.json');
  let metadata: PageMetadata | undefined;
  
  if (fs.existsSync(metadataPath)) {
    try {
      const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
      metadata = JSON.parse(metadataContent);
      console.log(`Loaded metadata from: ${metadataPath}`);
    } catch (error) {
      console.log(`Warning: Could not load metadata from ${metadataPath}`);
    }
  }

  describeWebsite({ imagePath, url, metadata })
    .then((result) => {
      console.log('\n--- Analysis Result ---');
      console.log(`URL: ${result.url}`);
      console.log(`\nPage Description:\n${result.pageDescription}`);
      console.log(`\n=== Design Metadata ===`);
      console.log(`\nStyle: ${result.style}`);
      console.log(`\nDetected Fonts: ${result.detectedFonts.join(', ') || 'None'}`);
      console.log(`\nAudience: ${result.audience}`);
      console.log(`\nPage Type: ${result.pageType}`);
      console.log(`\nLayout Style: ${result.layoutStyle}`);
      console.log(`\nIntent: ${result.intent}`);
    })
    .catch((error) => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}

