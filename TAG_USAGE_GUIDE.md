# Design Tags Usage Guide

## ✅ Complete!

Successfully analyzed 76 pages and added design tags to your `results.json` file.

## What Was Done

1. **Extracted Terms**: Analyzed all `-description.json` files in the `captures` folder
2. **Identified Patterns**: Found the most common design descriptors across all pages
3. **Created Tag Set**: Curated 30 tags organized into 5 categories
4. **Assigned Tags**: Each page now has relevant tags based on its style description
5. **Merged Data**: Tags added to `frontend/public/results.json`

## Tag Categories

### Visual Style (8 tags)
`minimalist`, `modern`, `sophisticated`, `bold`, `premium`, `tech-forward`, `brutalist`, `ultra-modern`

### Visual Elements (6 tags)
`visual-heavy`, `whitespace-heavy`, `gradient`, `high-contrast`, `geometric`, `dark-mode`

### Layout Patterns (5 tags)
`grid-layout`, `asymmetric`, `single-column`, `full-width`, `masonry`

### Content Types (4 tags)
`landing-page`, `portfolio`, `editorial`, `e-commerce`

### Interaction (4 tags)
`interactive`, `experimental`, `scroll-based`, `animated`

### Special Styles (3 tags)
`typography-focused`, `glassmorphism`, `clean`

## Data Structure

Each page in `results.json` now includes a `tags` array:

```json
{
  "url": "https://099.supply",
  "tags": [
    "brutalist",
    "dark-mode",
    "e-commerce",
    "experimental",
    "grid-layout",
    "high-contrast",
    "minimalist",
    "modern",
    "sophisticated",
    "visual-heavy",
    "whitespace-heavy"
  ],
  "description": { ... },
  ...
}
```

## Frontend Usage Examples

### 1. Filter by Single Tag

```typescript
import results from './public/results.json';

// Filter by tag
const minimalistPages = results.filter(page => 
  page.tags.includes('minimalist')
);

console.log(`Found ${minimalistPages.length} minimalist pages`);
```

### 2. Filter by Multiple Tags (AND)

```typescript
// Find pages that match ALL specified tags
function filterByAllTags(pages: any[], tags: string[]) {
  return pages.filter(page =>
    tags.every(tag => page.tags.includes(tag))
  );
}

// Example: Find dark-mode e-commerce sites
const darkEcommerce = filterByAllTags(results, ['dark-mode', 'e-commerce']);
```

### 3. Filter by Multiple Tags (OR)

```typescript
// Find pages that match ANY of the specified tags
function filterByAnyTag(pages: any[], tags: string[]) {
  return pages.filter(page =>
    tags.some(tag => page.tags.includes(tag))
  );
}

// Example: Find pages with special visual effects
const specialEffects = filterByAnyTag(results, ['glassmorphism', 'gradient', 'animated']);
```

### 4. Find Similar Pages

```typescript
function findSimilarPages(targetPage: any, allPages: any[], minSharedTags = 5) {
  return allPages
    .map(page => ({
      page,
      sharedTags: page.tags.filter((tag: string) => targetPage.tags.includes(tag)),
    }))
    .filter(({ sharedTags }) => sharedTags.length >= minSharedTags)
    .sort((a, b) => b.sharedTags.length - a.sharedTags.length)
    .map(({ page, sharedTags }) => ({
      ...page,
      similarity: sharedTags.length,
      sharedTags,
    }));
}

// Usage
const currentPage = results[0];
const similar = findSimilarPages(currentPage, results);
console.log(`Found ${similar.length} similar pages`);
```

### 5. Tag Faceted Search UI

```typescript
// Get all unique tags with counts
function getTagCounts(pages: any[]) {
  const tagCounts: Record<string, number> = {};
  
  pages.forEach(page => {
    page.tags.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
}

// Use in a filter UI component
const tagCounts = getTagCounts(results);
```

### 6. React Component Example

```typescript
import { useState } from 'react';
import results from './public/results.json';

function DesignGallery() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const filteredPages = results.filter(page =>
    selectedTags.length === 0 || 
    selectedTags.every(tag => page.tags.includes(tag))
  );
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  return (
    <div>
      <div className="filters">
        {['minimalist', 'dark-mode', 'brutalist', 'e-commerce'].map(tag => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={selectedTags.includes(tag) ? 'active' : ''}
          >
            {tag}
          </button>
        ))}
      </div>
      
      <div className="gallery">
        {filteredPages.map(page => (
          <div key={page.url} className="card">
            <img src={page.screenshotPath} alt={page.description?.style} />
            <div className="tags">
              {page.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <p>{filteredPages.length} pages found</p>
    </div>
  );
}
```

## Tag Statistics

- **Most Common**: `minimalist` (96.1%), `modern` (96.1%), `visual-heavy` (92.1%)
- **Least Common**: `clean` (2.6%), `masonry` (7.9%), `e-commerce` (9.2%)
- **Average tags per page**: ~9.5 tags
- **Most tagged page**: blynchq.com (15 tags)

## Files Generated

1. `/output/tagged-pages.json` - Standalone tagged pages data
2. `/output/extracted-terms.json` - Raw term frequency analysis
3. `/output/tags-summary.md` - Detailed tag statistics
4. `/frontend/public/results.json` - Updated with tags (your main data file)
5. `/TAG_USAGE_GUIDE.md` - This guide

## Next Steps

You can now:
- Add tag filtering to your frontend UI
- Create a tag cloud or tag navigation
- Build a "Similar Pages" feature
- Enable multi-tag search
- Create tag-based collections or categories

