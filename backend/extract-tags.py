import json
import os
from collections import Counter
import re

def extract_descriptive_phrases(text):
    """Extract descriptive adjectives and noun phrases from the text"""
    text = text.lower()
    
    # Common design-related terms to extract (patterns)
    phrases = []
    
    # Extract hyphenated terms (common in design language)
    hyphenated = re.findall(r'\b[\w]+-[\w]+(?:-[\w]+)*\b', text)
    phrases.extend(hyphenated)
    
    # Extract quoted terms
    quoted = re.findall(r'"([^"]+)"', text)
    phrases.extend(quoted)
    
    # Extract adjective + noun patterns (simplified)
    # Common design nouns
    design_nouns = [
        'design', 'layout', 'aesthetic', 'style', 'approach', 'theme',
        'grid', 'typography', 'spacing', 'page', 'interface', 'experience',
        'elements', 'mode', 'palette', 'system', 'structure', 'feel',
        'look', 'vibe', 'pattern', 'navigation', 'section'
    ]
    
    for noun in design_nouns:
        # Find words before the noun (adjectives)
        pattern = r'\b(\w+)\s+' + noun + r'\b'
        matches = re.findall(pattern, text)
        for match in matches:
            if len(match) > 3:  # Skip short words
                phrases.append(f"{match} {noun}")
    
    return phrases

def main():
    captures_dir = "/Users/owen/full-stack-eng-interview/captures"
    
    # Read all description files
    all_styles = []
    all_layouts = []
    all_descriptions = []
    all_extracted_phrases = []
    
    filenames = [f for f in os.listdir(captures_dir) if f.endswith("-description.json")]
    
    for filename in filenames:
        filepath = os.path.join(captures_dir, filename)
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
                
                style = data.get('style', '')
                layout = data.get('layoutStyle', '')
                desc = data.get('pageDescription', '')
                page_type = data.get('pageType', '')
                
                all_styles.append(style)
                all_layouts.append(layout)
                all_descriptions.append(desc)
                
                # Extract phrases
                combined = f"{style} {layout} {desc} {page_type}"
                phrases = extract_descriptive_phrases(combined)
                all_extracted_phrases.extend(phrases)
                
        except Exception as e:
            print(f"Error reading {filename}: {e}")
    
    # Count phrase frequency
    phrase_counter = Counter(all_extracted_phrases)
    
    print("=== Most Common Descriptive Phrases (Extracted from Content) ===\n")
    for phrase, count in phrase_counter.most_common(50):
        if count >= 3:  # Only show phrases that appear in 3+ pages
            print(f"{count:3d}x  {phrase}")
    
    # Also extract single key terms
    print("\n\n=== Analyzing Style Descriptions ===\n")
    
    # Split all style descriptions into individual descriptive terms
    all_terms = []
    for style in all_styles:
        # Remove common words and split on punctuation
        terms = re.findall(r'\b[a-z][\w-]+\b', style.lower())
        all_terms.extend(terms)
    
    term_counter = Counter(all_terms)
    
    # Filter out common words
    stopwords = {'with', 'and', 'the', 'a', 'an', 'of', 'to', 'in', 'for', 'on', 'by', 'from', 'that', 'this', 'is', 'are', 'while', 'creating', 'using', 'features', 'through', 'into', 'combines', 'combining'}
    
    print("Top descriptive terms from 'style' field:")
    for term, count in term_counter.most_common(60):
        if term not in stopwords and len(term) > 3 and count >= 5:
            print(f"{count:3d}x  {term}")
    
    # Save raw data for further analysis
    output = {
        'phrase_frequency': dict(phrase_counter.most_common(100)),
        'term_frequency': dict(term_counter.most_common(100)),
        'total_pages': len(filenames)
    }
    
    with open('/Users/owen/full-stack-eng-interview/output/extracted-terms.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n✓ Analyzed {len(filenames)} pages")
    print(f"✓ Extracted {len(phrase_counter)} unique phrases")
    print(f"✓ Saved to output/extracted-terms.json")

if __name__ == "__main__":
    main()
