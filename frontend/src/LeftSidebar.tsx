import { useState, useEffect } from 'react';

interface Website {
  tags?: string[];
}

interface LeftSidebarProps {
  websites: Website[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

const TAG_CATEGORIES = {
  'Visual Style': ['minimalist', 'modern', 'sophisticated', 'bold', 'premium', 'tech-forward', 'brutalist', 'ultra-modern'],
  'Visual Elements': ['visual-heavy', 'whitespace-heavy', 'gradient', 'high-contrast', 'geometric', 'dark-mode'],
  'Layout': ['grid-layout', 'asymmetric', 'single-column', 'full-width', 'masonry'],
  'Content Type': ['landing-page', 'portfolio', 'editorial', 'e-commerce'],
  'Interaction': ['interactive', 'experimental', 'scroll-based', 'animated'],
  'Special': ['typography-focused', 'glassmorphism', 'clean'],
};

export function LeftSidebar({ websites, selectedTags, onTagToggle }: LeftSidebarProps) {
  const [openCategories, setOpenCategories] = useState<string[]>(['Visual Style', 'Visual Elements']);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});

  // Calculate tag counts
  useEffect(() => {
    const counts: Record<string, number> = {};
    websites.forEach(site => {
      if (site.tags && Array.isArray(site.tags)) {
        site.tags.forEach((tag: string) => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      }
    });
    setTagCounts(counts);
  }, [websites]);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getFilteredTags = (tags: string[]) => {
    return tags.filter(tag => tagCounts[tag] > 0);
  };

  const getSelectedTagsInCategory = (categoryTags: string[]) => {
    return selectedTags.filter(tag => categoryTags.includes(tag));
  };

  return (
    <div className="filter ml-11">
      <div className="filter__inner">
        {/* Category Filters */}
        {Object.entries(TAG_CATEGORIES).map(([category, tags]) => {
          const isOpen = openCategories.includes(category);
          const filteredTags = getFilteredTags(tags);
          const selectedInCategory = getSelectedTagsInCategory(tags);
          
          return (
            <div
              key={category}
              className={`filter-category ${isOpen ? 'filter-category--open' : ''} ${selectedInCategory.length > 0 ? 'filter-category--fix-selected' : ''}`}
            >
              <div
                className="filter-category__title js-filter-category-toggle"
                onClick={() => toggleCategory(category)}
              >
                {category}
              </div>
              
              <div
                className="filter-category__dropdown"
                style={{ display: isOpen ? 'block' : 'none' }}
              >
                {/* Tag list */}
                <div className="filter-items-wrap">
                  <ul className="filter-items" style={{ marginBottom: '10px' }}>
                    {filteredTags.map((tag, index) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <li
                          key={tag}
                          className="filter-item"
                          style={{ display: 'block' }}
                        >
                          <span
                            data-filter={tag}
                            data-id={index}
                            className="filter-item-clickable"
                            onClick={() => onTagToggle(tag)}
                            style={{
                              color: isSelected ? '#000' : undefined,
                              fontWeight: isSelected ? 600 : 400,
                            }}
                          >
                            <span className="filter-item__title">
                              {tag}
                            </span>
                            {/* Could get fancy and have this update */}
                            {/* <span className="filter-item__size" style={{ marginLeft: '4px' }}>
                              ({tagCounts[tag] || 0})
                            </span> */}
                          </span>
                        </li>
                      );
                    })}
                    {filteredTags.length === 0 && (
                      <li className="filter-item" style={{ color: '#999', fontStyle: 'italic' }}>
                        No tags found
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Selected tags for this category - always visible */}
              {selectedInCategory.length > 0 && (
                <div className="filter-category__selected filter-category__selected--visible">
                  {selectedInCategory.map(tag => (
                    <div
                      key={tag}
                      className="filter-category__selected-item manual"
                      onClick={() => onTagToggle(tag)}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .filter {
          font-family: 'Neue Haas Unica', Helvetica, sans-serif;
          font-size: 0.875rem;
          line-height: 1.3;
          position: relative;
          left: 0;
        }

        .filter__inner {
          border-top: 1px solid #e6e6e6;
          position: relative;
          width: 23.1527093596%;
          overflow-x: hidden;
        }

        .filter-category {
          border-bottom: 1px solid #e6e6e6;
          position: relative;
        }

        .filter-category--open .filter-category__title:after {
          transform: translateY(-50%) scale(-1);
        }

        .filter-category__title {
          user-select: none;
          cursor: pointer;
          position: relative;
          padding: 0.65rem 0;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .filter-category__title:after {
          content: "";
          transition: transform 0.2s;
          transform: translateY(-50%) scale(1);
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E");
          background-position: 50%;
          background-repeat: no-repeat;
          background-size: contain;
          display: block;
          width: 0.85rem;
          height: 0.85rem;
          position: absolute;
          right: 0;
          top: 50%;
        }

        .filter-category__dropdown {
          background-color: #fff;
          position: relative;
          display: none;
          margin-left: -0.2rem;
          width: calc(100% + 0.4rem);
          z-index: 1;
        }

        .filter-items-wrap {
          overflow: hidden;
          padding-left: 0.2rem;
          padding-right: 0.2rem;
          width: 100%;
        }

        .filter-items {
          max-height: 9.6rem;
          padding-top: 0.25rem;
          padding-bottom: 0.5rem;
          overflow-y: scroll;
          padding-right: 20px;
          width: calc(100% + 20px);
        }

        .filter-items::-webkit-scrollbar {
          width: 6px;
        }

        .filter-items::-webkit-scrollbar-track {
          background: transparent;
        }

        .filter-items::-webkit-scrollbar-thumb {
          background: #e6e6e6;
          border-radius: 3px;
        }

        .filter-category__selected {
          margin-left: 0;
          padding-bottom: 0.65rem;
          width: 100%;
          overflow: hidden;
        }

        .filter-category__selected--visible {
          display: block;
        }

        .filter-category__selected-item {
          transition: background-color 0.2s;
          user-select: none;
          cursor: pointer;
          background-color: #fff;
          border: 1px solid #e6e6e6;
          display: inline-block;
          float: left;
          padding: 0.25rem 1.5rem 0.25rem 0.4rem;
          position: relative;
          margin-bottom: 0.4rem;
          margin-right: 0.4rem;
          font-size: 0.875rem;
        }

        .filter-category__selected-item:after {
          content: "×";
          font-size: 1.1rem;
          transition: opacity 0.2s;
          transform: translateY(-50%);
          position: absolute;
          right: 0.5rem;
          top: 50%;
          opacity: 0.35;
        }

        .filter-category__selected-item:hover {
          background-color: #e6e6e6;
        }

        .filter-category__selected-item:hover:after {
          opacity: 1;
        }

        .filter-item {
          text-indent: -0.5rem;
          margin-left: 0.5rem;
          margin-bottom: 0.35rem;
        }

        .filter-item-clickable {
          user-select: none;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .filter-item__title {
          transition: color 0.2s;
        }

        .filter-item__title:hover {
          color: #999;
        }

        .filter-item__size {
          color: #999;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
