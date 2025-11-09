"""
FastAPI server for CLIP-based image similarity search
"""

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from sentence_transformers import SentenceTransformer
import numpy as np
import json
from pathlib import Path
import io

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load CLIP model
print("Loading CLIP model...")
model = SentenceTransformer('clip-ViT-B-32')
print("✓ Model loaded")

# Load pre-computed embeddings
embeddings_path = Path(__file__).parent / "embeddings.json"
with open(embeddings_path, 'r') as f:
    embeddings_data = json.load(f)

print(f"✓ Loaded {len(embeddings_data)} embeddings\n")

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Calculate cosine similarity between two vectors"""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

@app.get("/")
async def root():
    return {"message": "CLIP Image Search API", "embeddings": len(embeddings_data)}

@app.post("/search-similar")
async def search_similar(
    image: UploadFile = File(...),
    k: int = 12
):
    """
    Find top-k most visually similar websites to uploaded image
    """
    try:
        # Read uploaded image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Generate embedding for uploaded image
        print(f"Generating embedding for uploaded image...")
        query_embedding = model.encode(pil_image)
        
        # Calculate similarities
        results = []
        for item in embeddings_data:
            similarity = cosine_similarity(
                query_embedding, 
                np.array(item['embedding'])
            )
            results.append({
                "url": item['url'],
                "filename": item['filename'],
                "thumbnailPath": item['thumbnailPath'],
                "similarity": float(similarity)
            })
        
        # Sort by similarity (descending) and get top-k
        results.sort(key=lambda x: x['similarity'], reverse=True)
        top_k = results[:k]
        
        print(f"✓ Found top {k} matches (best: {top_k[0]['similarity']:.3f})")
        
        return {
            "success": True,
            "results": top_k,
            "total": len(embeddings_data)
        }
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

