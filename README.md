### Data Pipeline (One-time)
```bash
# 1. Capture all sites
npm run pipeline -- --file sample_urls.csv

# 2. Generate thumbnails
node dist/generate-thumbnails.js ./captures ./thumbnails

# 3. Generate embeddings
cd backend && python generate_embeddings.py

# 4. Assign tags
python assign-tags.py
```

### Development
```bash
# Backend (Terminal 1)
cd backend && source venv/bin/activate && python server.py

# Frontend (Terminal 2)
cd frontend && npm run dev
```

### Production Deployment
```bash
# Build frontend
cd frontend && npm run build

# Deploy static files → Vercel/Netlify
# Deploy backend → Fly.io/Railway

# Environment variables:
OPENROUTER_API_KEY=sk-or-v1-...
```
