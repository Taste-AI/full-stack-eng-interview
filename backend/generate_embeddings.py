"""
Generate CLIP embeddings for all website screenshots
Run once to create embeddings.json
"""

import json
import os
from pathlib import Path
from PIL import Image
from sentence_transformers import SentenceTransformer
import numpy as np

def generate_embeddings(screenshots_dir: str = "../thumbnails", output_file: str = "embeddings.json"):
    """Generate CLIP embeddings for all thumbnails"""
    
    print("Loading CLIP model...")
    model = SentenceTransformer('clip-ViT-B-32')
    print("✓ Model loaded\n")
    
    # Find all thumbnail files
    thumbnails = list(Path(screenshots_dir).glob("*-thumb.webp"))
    print(f"Found {len(thumbnails)} thumbnails\n")
    
    embeddings_data = []
    
    for i, thumb_path in enumerate(sorted(thumbnails), 1):
        # Extract hostname from filename
        filename = thumb_path.stem.replace('-thumb', '')
        url = f"https://{filename}"
        
        print(f"[{i}/{len(thumbnails)}] Processing {filename}...")
        
        try:
            # Load and encode image
            image = Image.open(thumb_path)
            embedding = model.encode(image)
            
            embeddings_data.append({
                "url": url,
                "filename": filename,
                "thumbnailPath": f"thumbnails/{thumb_path.name}",
                "embedding": embedding.tolist()  # Convert numpy to list for JSON
            })
            
        except Exception as e:
            print(f"  ✗ Failed: {e}")
            continue
    
    # Save embeddings
    output_path = Path(output_file)
    output_path.parent.mkdir(exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(embeddings_data, f)
    
    print(f"\n✓ Saved {len(embeddings_data)} embeddings to {output_file}")
    print(f"  File size: {output_path.stat().st_size / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    generate_embeddings()

