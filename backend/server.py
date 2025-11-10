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

# Load CLIP model with GPU support
print("Loading CLIP model...")
import torch
device = 'mps' if torch.backends.mps.is_available() else 'cpu'
model = SentenceTransformer('clip-ViT-B-32', device=device)
print(f"✓ Model loaded on device: {device}")

# Load pre-computed embeddings
embeddings_path = Path(__file__).parent / "embeddings.json"
with open(embeddings_path, 'r') as f:
    embeddings_data = json.load(f)

print(f"✓ Loaded {len(embeddings_data)} embeddings\n")

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Calculate cosine similarity between two vectors"""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def find_similar(query_embedding: np.ndarray, k: int = 12):
    """Find top-k similar embeddings"""
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
    return results[:k]

@app.get("/")
async def root():
    return {"message": "CLIP Search API", "embeddings": len(embeddings_data)}

@app.post("/search-text")
async def search_text(query: dict, k: int = 12):
    """
    Find top-k most semantically similar websites to text query
    """
    try:
        text_query = query.get('query', '')
        if not text_query:
            return {"success": False, "error": "No query provided"}
        
        print(f"Text search: '{text_query}'")
        
        # Generate text embedding
        query_embedding = model.encode(text_query)
        top_k = find_similar(query_embedding, k)
        
        print(f"✓ Found top {k} matches (best: {top_k[0]['similarity']:.3f})")
        
        return {
            "success": True,
            "results": top_k,
            "total": len(embeddings_data),
            "query": text_query
        }
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return {"success": False, "error": str(e)}

@app.post("/search-image")
async def search_image(
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
        
        # Resize to CLIP's expected size for faster encoding
        pil_image = pil_image.resize((224, 224), Image.Resampling.LANCZOS)
        
        print(f"Image search: {image.filename}")
        
        # Generate image embedding
        query_embedding = model.encode(pil_image)
        top_k = find_similar(query_embedding, k)
        
        print(f"✓ Found top {k} matches (best: {top_k[0]['similarity']:.3f})")
        
        return {
            "success": True,
            "results": top_k,
            "total": len(embeddings_data)
        }
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return {"success": False, "error": str(e)}

@app.post("/search-combined")
async def search_combined(
    image: UploadFile = File(...),
    text_query: str = "",
    k: int = 12
):
    """
    Search using both image and text (combines embeddings)
    """
    try:
        # Read uploaded image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Resize for faster encoding
        pil_image = pil_image.resize((224, 224), Image.Resampling.LANCZOS)
        
        print(f"Combined search: image={image.filename}, text='{text_query}'")
        
        # Generate embeddings
        image_embedding = model.encode(pil_image)
        
        if text_query:
            text_embedding = model.encode(text_query)
            # Average the embeddings (equal weight)
            query_embedding = (image_embedding + text_embedding) / 2
        else:
            query_embedding = image_embedding
        
        top_k = find_similar(query_embedding, k)
        
        print(f"✓ Found top {k} matches (best: {top_k[0]['similarity']:.3f})")
        
        return {
            "success": True,
            "results": top_k,
            "total": len(embeddings_data),
            "used_text": bool(text_query)
        }
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

