# Website Analysis Pipeline

A pipeline for capturing websites (screenshots + metadata) and generating AI-powered descriptions for design inspiration.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up API Key

Create a `.env` file in the project root:

```bash
# .env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Get your OpenRouter API key from: https://openrouter.ai/keys

### 3. Run the Pipeline

```bash
# Process multiple URLs
npm run pipeline https://stripe.com https://linear.app

# Process URLs from a file
npm run pipeline -- --file sample-urls.txt

# Capture pages only (skip AI descriptions)
npm run pipeline -- --capture-only https://example.com

# Use a different model
npm run pipeline -- --model anthropic/claude-3-opus https://example.com
```

## Pipeline Stages

### Stage 1: Capture (Parallel)
- Captures full page screenshot with Playwright
- Extracts text content and metadata
- Detects fonts
- Saves to `./captures/`

**Output:**
- `hostname.png` - Full page screenshot
- `hostname.json` - Extracted metadata (text, headings, fonts, etc.)

### Stage 2: Describe (Parallel)
- Analyzes screenshot with AI vision model
- Extracts design metadata:
  - Description
  - Style (modern, brutalist, etc.)
  - Font characteristics
  - Target audience
  - Page type
  - Layout style
  - Intent

**Output:**
- `hostname-description.json` - AI analysis

### Stage 3: Aggregate
- Combines all results
- Saves to `./output/results.json`

## Architecture

```
URLs → Stage 1 (Capture) → Stage 2 (Describe) → Stage 3 (Aggregate)
         ↓ parallel             ↓ parallel           ↓
      captures/            descriptions/        results.json
    (png + json)
```

### Why This Design?

- **Separation of concerns**: Browser operations separate from AI calls
- **Resumable**: Can re-run descriptions without re-capturing
- **Scalable**: Both stages parallelize independently
- **Cost-effective**: Can capture first, then batch AI calls with rate limiting
- **Flexible**: Easy to switch models or add new analysis stages

## Individual Tools

### Capture Only

```bash
npm run capture https://example.com ./captures/example.png
```

### Description Only

```bash
node dist/describe.js ./captures/example.png https://example.com
```

## File Structure

```
captures/
  stripe.com.png              # Screenshot
  stripe.com.json             # Metadata (text, fonts, etc.)
  stripe.com-description.json # AI analysis

output/
  results.json                # Aggregated pipeline results
```

## Models

Default: `anthropic/claude-3.5-sonnet`

Other options (via OpenRouter):
- `anthropic/claude-3-opus` - More detailed
- `anthropic/claude-3-haiku` - Faster/cheaper
- `openai/gpt-4-vision-preview`
- `google/gemini-pro-vision`

See all models: https://openrouter.ai/models

## Development

```bash
# Build TypeScript
npm run build

# Process a test batch
npm run pipeline -- --file sample-urls.txt --capture-only
```

## Production Considerations

Current implementation handles hundreds to thousands of URLs. For larger scale:

- Add job queue (BullMQ/SQS)
- Add database for state tracking (Postgres)
- Store captures in S3/blob storage
- Separate capture and describe into independent workers
- Add rate limiting and retry strategies
- Implement browser pooling

See `CLAUDE.md` for full architecture discussion.

