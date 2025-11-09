import { useState, useEffect } from "react";
import { Search, X, ArrowUpRight } from "lucide-react";

interface Website {
  url: string;
  captureSuccess: boolean;
  descriptionSuccess: boolean;
  screenshotPath?: string;
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

function App() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [filteredWebsites, setFilteredWebsites] = useState<Website[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    // Load results.json
    fetch("/results.json")
      .then((res) => res.json())
      .then((data) => {
        // Filter only successful captures
        const successful = data.filter(
          (w: Website) => w.captureSuccess && w.descriptionSuccess
        );
        setWebsites(successful);
        setFilteredWebsites(successful);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load data:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Real-time search filtering
    if (!searchQuery.trim()) {
      setFilteredWebsites(websites);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = websites.filter((website) => {
      const searchableText = [
        website.url,
        website.description?.pageDescription,
        website.description?.style,
        website.description?.audience,
        website.description?.pageType,
        website.description?.layoutStyle,
        website.description?.intent,
        ...(website.description?.detectedFonts || []),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });

    setFilteredWebsites(filtered);
  }, [searchQuery, websites]);

  // Escape key closes modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedWebsite(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const getThumbnailPath = (screenshotPath: string) => {
    const filename = screenshotPath
      .split("/")
      .pop()
      ?.replace(".png", "-thumb.webp");
    return `/thumbnails/${filename}`;
  };

  const getWebsiteName = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-neutral-600">
        <p className="text-lg">Loading websites...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white scrollbar-hide">
      {/* Fixed Header - e-flux style */}
      <div className="fixed top-0 left-0 right-0 bg-white z-50">
        <div className="border-b border-neutral-200 mx-8">
          <div className="flex items-center justify-between h-[68px]">
            {/* Logo - hidden when search is open */}
            {!searchOpen && (
              <img src="/taste-logo.svg" alt="taste.ai" className="h-6" />
            )}
            
            {/* Search Bar - expands when open */}
            {searchOpen ? (
              <div className="flex-1 relative flex items-center h-full">
                <input
                  type="text"
                  placeholder={`Search ${websites.length} websites`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent border-none outline-none text-black placeholder-neutral-300 pr-48"
                  style={{ 
                    fontFamily: 'Neue Haas Unica, Helvetica, sans-serif',
                    fontWeight: 400,
                    fontSize: '1.5rem',
                    lineHeight: '0.8',
                    letterSpacing: '-0.3px',
                    margin: 0,
                    padding: 0
                  }}
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-4">
                  <label className="cursor-pointer text-black hover:text-neutral-400 transition-colors text-sm">
                    add an image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // TODO: Implement image search
                          alert("Image search coming soon!");
                        }
                      }}
                    />
                  </label>
                  <button 
                    className="flex-shrink-0"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    {/* <img src="/svgs/EFL03_X.svg" className="w-5 h-5" alt="Close" /> */}
                    <X className="w-9 h-9 text-black" strokeWidth={1} />
                  </button>
                </div>
              </div>
            ) : (
              /* Closed state - just show search icon */
              <button 
                className="ml-auto h-full flex items-center"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-9 h-9 text-black" strokeWidth={1} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid - add top padding to account for fixed header */}
      <main className="max-w-7xl mx-auto px-6 py-8 pt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWebsites.map((website) => (
            <div
              key={website.url}
              className="group relative overflow-hidden  hover:-translate-y-1 transition-all duration-200 cursor-pointer w-full shadow-sm hover:shadow-xl"
              onClick={() => setSelectedWebsite(website)}
            >
              <div className="aspect-video w-full relative">
                <img
                  src={getThumbnailPath(website.screenshotPath!)}
                  alt={getWebsiteName(website.url)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-end justify-center pb-6">
                  <a 
                    href={website.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="whitespace-nowrap flex items-center gap-1 text-white font-medium text-lg opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 border-b border-transparent hover:border-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {getWebsiteName(website.url)}
                    <ArrowUpRight className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredWebsites.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-600 text-lg">
              No websites found matching "{searchQuery}"
            </p>
          </div>
        )}
      </main>

      {/* Modal */}
      {selectedWebsite && (
        <div
          className="fixed inset-0 z-50 flex flex-col lg:flex-row justify-between overflow-hidden"
          style={{ backgroundColor: '#f5f5f5' }}
        >
          {/* Close button - top left */}
          <button
            className="fixed top-3 left-3 z-[60] p-1.5 hover:opacity-60 transition-opacity"
            onClick={() => setSelectedWebsite(null)}
          >
            <img src="/svgs/EFL03_X.svg" className="w-4 h-4" alt="Close" />
          </button>

          {/* Left: Scrollable Image */}
          <div
            className="relative h-full w-full overflow-y-auto overflow-x-hidden lg:px-20 lg:py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-h-full w-full flex items-center justify-center">
              <img
                src={`/${selectedWebsite.screenshotPath}`}
                alt={getWebsiteName(selectedWebsite.url)}
                className="w-full object-contain"
              />
            </div>
          </div>

          {/* Right: Fixed Sidebar */}
          <div
            className="hidden lg:flex lg:w-[350px] lg:min-w-[18vw] shrink-0 flex-col gap-4 overflow-y-auto overflow-x-hidden bg-white px-6 pb-6 m-4 ml-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Website Name with link */}
            <div className="sticky top-0 bg-white pt-4 pb-0 -mx-6 px-6">
            <a
                  href={selectedWebsite.url}
                  target="_blank"
                  rel="noopener noreferrer" className="flex items-center  gap-2 mb-2">
                <h2 className="text-xl font-semibold text-black">
                  {getWebsiteName(selectedWebsite.url)}
                </h2>
                <ArrowUpRight className="w-5 h-5" />
              </a>
            </div>


            {/* Description */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Description
              </h3>
              <p className="text-sm text-neutral-700 leading-relaxed">
                {selectedWebsite.description?.pageDescription}
              </p>
            </div>

            <hr className="border-neutral-200" />

            {/* Style */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Style
              </h3>
              <p className="text-sm text-neutral-700">{selectedWebsite.description?.style}</p>
            </div>

            <hr className="border-neutral-200" />

            {/* Audience */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Audience
              </h3>
              <p className="text-sm text-neutral-700">{selectedWebsite.description?.audience}</p>
            </div>

            <hr className="border-neutral-200" />

            {/* Page Type */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Page Type
              </h3>
              <p className="text-sm text-neutral-700">{selectedWebsite.description?.pageType}</p>
            </div>

            <hr className="border-neutral-200" />

            {/* Layout Style */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Layout Style
              </h3>
              <p className="text-sm text-neutral-700">{selectedWebsite.description?.layoutStyle}</p>
            </div>

            {selectedWebsite.description?.detectedFonts && 
             selectedWebsite.description.detectedFonts.length > 0 && (
              <>
                <hr className="border-neutral-200" />
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    Fonts
                  </h3>
                  <p className="text-xs text-neutral-700">
                    {selectedWebsite.description.detectedFonts.join(", ")}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
