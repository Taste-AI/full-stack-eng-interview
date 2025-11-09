import { useState, useEffect } from 'react';

interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  tagCounts: Record<string, number>;
}

export function TagFilter({ allTags, selectedTags, onTagToggle, tagCounts }: TagFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group tags by category based on our taxonomy
  const tagCategories = {
    'Visual Style': ['minimalist', 'modern', 'sophisticated', 'bold', 'premium', 'tech-forward', 'brutalist', 'ultra-modern'],
    'Visual Elements': ['visual-heavy', 'whitespace-heavy', 'gradient', 'high-contrast', 'geometric', 'dark-mode'],
    'Layout': ['grid-layout', 'asymmetric', 'single-column', 'full-width', 'masonry'],
    'Content Type': ['landing-page', 'portfolio', 'editorial', 'e-commerce'],
    'Interaction': ['interactive', 'experimental', 'scroll-based', 'animated'],
    'Special': ['typography-focused', 'glassmorphism', 'clean'],
  };

  const getTagClass = (tag: string) => {
    const baseClasses = "px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer border";
    if (selectedTags.includes(tag)) {
      return `${baseClasses} bg-blue-500 text-white border-blue-500 hover:bg-blue-600`;
    }
    return `${baseClasses} bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50`;
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Filter by Tags</h3>
          {selectedTags.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {isExpanded ? 'Show Less' : 'Show All Tags'}
        </button>
      </div>

      {/* Show selected tags first */}
      {selectedTags.length > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <button
                key={tag}
                onClick={() => onTagToggle(tag)}
                className={getTagClass(tag)}
              >
                {tag}
                <span className="ml-1.5 text-xs opacity-80">({tagCounts[tag] || 0})</span>
                <span className="ml-1.5">×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular tags (always visible) */}
      {!isExpanded && (
        <div>
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 12).map(tag => {
              if (selectedTags.includes(tag)) return null;
              return (
                <button
                  key={tag}
                  onClick={() => onTagToggle(tag)}
                  className={getTagClass(tag)}
                >
                  {tag}
                  <span className="ml-1.5 text-xs text-gray-500">({tagCounts[tag] || 0})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* All tags organized by category */}
      {isExpanded && (
        <div className="space-y-6">
          {Object.entries(tagCategories).map(([category, categoryTags]) => {
            const visibleTags = categoryTags.filter(tag => allTags.includes(tag) && !selectedTags.includes(tag));
            if (visibleTags.length === 0) return null;

            return (
              <div key={category}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {visibleTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => onTagToggle(tag)}
                      className={getTagClass(tag)}
                    >
                      {tag}
                      <span className="ml-1.5 text-xs text-gray-500">({tagCounts[tag] || 0})</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTags.length > 0 && (
        <button
          onClick={() => selectedTags.forEach(tag => onTagToggle(tag))}
          className="mt-4 text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

// Hook to manage tag filtering
export function useTagFiltering(websites: any[]) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});

  // Extract all unique tags and counts
  useEffect(() => {
    const counts: Record<string, number> = {};
    const uniqueTags = new Set<string>();

    websites.forEach(website => {
      if (website.tags && Array.isArray(website.tags)) {
        website.tags.forEach((tag: string) => {
          uniqueTags.add(tag);
          counts[tag] = (counts[tag] || 0) + 1;
        });
      }
    });

    // Sort tags by frequency
    const sortedTags = Array.from(uniqueTags).sort((a, b) => 
      (counts[b] || 0) - (counts[a] || 0)
    );

    setAllTags(sortedTags);
    setTagCounts(counts);
  }, [websites]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const filterWebsitesByTags = (websites: any[]) => {
    if (selectedTags.length === 0) return websites;

    return websites.filter(website =>
      selectedTags.every(tag => 
        website.tags && website.tags.includes(tag)
      )
    );
  };

  return {
    selectedTags,
    allTags,
    tagCounts,
    toggleTag,
    filterWebsitesByTags,
  };
}

