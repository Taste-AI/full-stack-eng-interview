// This file shows how to integrate tag filtering into your existing App.tsx
// Add this code to your current App.tsx

import { TagFilter, useTagFiltering } from './TagFilter';

// 1. Update the Website interface to include tags
interface Website {
  url: string;
  captureSuccess: boolean;
  descriptionSuccess: boolean;
  screenshotPath?: string;
  tags?: string[];  // <-- ADD THIS LINE
  metadata?: {
    title: string;
    h1s: string[];
    detectedFonts: string[];
  };
  description?: {
    pageDescription: string;
    style: string;
    audience: string;
    pageType: string;
    layoutStyle: string;
    intent: string;
    detectedFonts: string[];
  };
}

// 2. In your App component, add the tag filtering hook:
function App() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [filteredWebsites, setFilteredWebsites] = useState<Website[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // ADD THIS: Tag filtering hook
  const { 
    selectedTags, 
    allTags, 
    tagCounts, 
    toggleTag, 
    filterWebsitesByTags 
  } = useTagFiltering(websites);

  // ... existing code ...

  // 3. Update your search filter useEffect to include tag filtering:
  useEffect(() => {
    let filtered = websites;

    // First filter by tags
    if (selectedTags.length > 0) {
      filtered = filterWebsitesByTags(filtered);
    }

    // Then filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((website) => {
        const searchableText = [
          website.url,
          website.description?.pageDescription,
          website.description?.style,
          website.description?.audience,
          website.description?.pageType,
          website.description?.layoutStyle,
          website.description?.intent,
          ...(website.description?.detectedFonts || []),
          ...(website.tags || []), // <-- ADD THIS: Include tags in search
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    setFilteredWebsites(filtered);
  }, [searchQuery, websites, selectedTags, filterWebsitesByTags]);

  // 4. Add the TagFilter component to your JSX, before the grid:
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... existing header code ... */}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search bar - existing */}
        {/* ... your search UI ... */}

        {/* ADD THIS: Tag Filter Component */}
        <TagFilter
          allTags={allTags}
          selectedTags={selectedTags}
          onTagToggle={toggleTag}
          tagCounts={tagCounts}
        />

        {/* Results count - UPDATE THIS */}
        <div className="mb-6 text-gray-600">
          Showing {filteredWebsites.length} of {websites.length} sites
          {selectedTags.length > 0 && (
            <span className="ml-2 text-blue-600">
              (filtered by {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>

        {/* Grid - existing */}
        {/* ... your grid code ... */}
      </main>
    </div>
  );
}

// 5. OPTIONAL: Add tag display in each card
// In your website card component, add:
<div className="flex flex-wrap gap-1 mt-2">
  {website.tags?.slice(0, 4).map(tag => (
    <span 
      key={tag}
      className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
    >
      {tag}
    </span>
  ))}
  {(website.tags?.length || 0) > 4 && (
    <span className="px-2 py-0.5 text-xs text-gray-500">
      +{(website.tags?.length || 0) - 4} more
    </span>
  )}
</div>

