import json
import os

def main():
    # Load the tagged pages
    with open('/Users/owen/full-stack-eng-interview/output/tagged-pages.json', 'r') as f:
        tagged_pages = json.load(f)
    
    # Create a lookup dictionary by domain
    tags_by_domain = {page['domain']: page['tags'] for page in tagged_pages}
    
    # Load the existing results.json
    results_path = '/Users/owen/full-stack-eng-interview/frontend/public/results.json'
    with open(results_path, 'r') as f:
        results = json.load(f)
    
    # Merge tags into results
    updated_count = 0
    for result in results:
        # Extract domain from URL
        url = result.get('url', '')
        domain = url.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0].split('?')[0]
        
        # Also try to match from descriptionPath if available
        if 'descriptionPath' in result:
            desc_filename = os.path.basename(result['descriptionPath'])
            domain_from_path = desc_filename.replace('-description.json', '')
            
            # Use the path-based domain as it's more reliable
            if domain_from_path in tags_by_domain:
                domain = domain_from_path
        
        # Add tags if we have them
        if domain in tags_by_domain:
            result['tags'] = tags_by_domain[domain]
            updated_count += 1
        else:
            result['tags'] = []
            print(f"Warning: No tags found for {domain} ({url})")
    
    # Save the updated results
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✓ Successfully merged tags into results.json")
    print(f"✓ Updated {updated_count} out of {len(results)} pages")
    print(f"✓ Saved to {results_path}")
    
    # Show sample
    print("\n=== Sample Merged Results ===\n")
    for i, result in enumerate(results[:3]):
        print(f"{i+1}. {result.get('url', 'Unknown URL')}")
        print(f"   Tags: {', '.join(result['tags'][:5])}{'...' if len(result['tags']) > 5 else ''}")
        print(f"   Total tags: {len(result['tags'])}")
        print()

if __name__ == "__main__":
    main()

