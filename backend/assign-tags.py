import json
import os
import re

# Curated tag set based on ACTUAL extracted terms from the content
# Organized into logical categories
TAGS = {
    # Visual Style (most common aesthetic terms)
    'minimalist': ['minimalist', 'minimal', 'minimalism', 'stripped-back'],
    'modern': ['modern', 'contemporary'],
    'brutalist': ['brutalist', 'neo-brutalist', 'raw brutalist'],
    'sophisticated': ['sophisticated', 'refined', 'polished'],
    'clean': ['clean design', 'clean aesthetic', 'clean layout'],
    'bold': ['bold', 'strong visual', 'bold typography'],
    'premium': ['premium', 'luxury', 'high-end'],
    'tech-forward': ['tech-forward', 'tech-focused', 'technical'],
    
    # Visual Elements
    'dark-mode': ['dark mode', 'dark theme', 'dark-themed', 'dark background'],
    'high-contrast': ['high-contrast', 'high contrast'],
    'glassmorphism': ['glassmorphism', 'frosted glass', 'glass effect'],
    'gradient': ['gradient', 'gradients', 'gradient overlay'],
    'typography-focused': ['typography-focused', 'typographic', 'strong typography'],
    'geometric': ['geometric', 'geometric shapes'],
    
    # Layout Patterns
    'grid-layout': ['grid', 'grid layout', 'grid system', 'grid-based', 'modular grid'],
    'single-column': ['single-column', 'single column'],
    'asymmetric': ['asymmetric', 'asymmetrical'],
    'full-width': ['full-width', 'full width'],
    'masonry': ['masonry', 'masonry-style', 'masonry grid'],
    
    # Content Types
    'landing-page': ['landing page', 'product landing'],
    'portfolio': ['portfolio', 'portfolio page', 'portfolio grid'],
    'e-commerce': ['e-commerce', 'ecommerce', 'commerce'],
    'editorial': ['editorial', 'editorial-style'],
    
    # Interaction
    'interactive': ['interactive', 'interactive elements'],
    'animated': ['animated', 'animation', 'animations'],
    'scroll-based': ['scroll', 'scrolling', 'parallax'],
    
    # Design Approach
    'experimental': ['experimental', 'innovative', 'unconventional'],
    'ultra-modern': ['ultra-modern', 'cutting-edge'],
    'whitespace-heavy': ['whitespace', 'negative space', 'generous spacing'],
    'visual-heavy': ['visual', 'image-heavy', 'photography-focused'],
}

def extract_tags_for_page(data):
    """Extract tags for a single page based on its description"""
    # Combine relevant fields
    text_fields = [
        data.get('style', ''),
        data.get('layoutStyle', ''),
        data.get('pageDescription', ''),
        data.get('pageType', ''),
    ]
    combined_text = ' '.join(text_fields).lower()
    
    matched_tags = []
    
    # Check each tag against the combined text
    for tag_name, keywords in TAGS.items():
        for keyword in keywords:
            if keyword.lower() in combined_text:
                matched_tags.append(tag_name)
                break  # Only add each tag once
    
    return sorted(matched_tags)

def main():
    captures_dir = "/Users/owen/full-stack-eng-interview/captures"
    results = []
    
    # Process all description files
    filenames = sorted([f for f in os.listdir(captures_dir) if f.endswith("-description.json")])
    
    print(f"Processing {len(filenames)} pages...\n")
    
    for filename in filenames:
        filepath = os.path.join(captures_dir, filename)
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
                
                tags = extract_tags_for_page(data)
                domain = filename.replace('-description.json', '')
                
                result = {
                    'domain': domain,
                    'url': data.get('url', ''),
                    'tags': tags,
                    'style': data.get('style', ''),
                    'pageType': data.get('pageType', ''),
                    'layoutStyle': data.get('layoutStyle', '')
                }
                
                results.append(result)
                
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    # Save results
    output_path = "/Users/owen/full-stack-eng-interview/output/tagged-pages.json"
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"✓ Successfully tagged {len(results)} pages")
    print(f"✓ Saved to {output_path}\n")
    
    # Print statistics
    print("=== Tag Statistics ===\n")
    tag_counts = {}
    for result in results:
        for tag in result['tags']:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    print(f"Total unique tags: {len(TAGS)}")
    print(f"Tags actually used: {len(tag_counts)}")
    print(f"\nTag usage (sorted by frequency):")
    for tag, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(results)) * 100
        print(f"  {tag:25s} {count:3d} pages ({percentage:.1f}%)")
    
    # Show examples
    print("\n=== Sample Tagged Pages ===\n")
    for result in results[:8]:
        print(f"{result['domain']}")
        print(f"  URL: {result['url']}")
        print(f"  Tags: {', '.join(result['tags']) if result['tags'] else '(no tags)'}")
        print(f"  Style: {result['style'][:90]}...")
        print()

if __name__ == "__main__":
    main()
