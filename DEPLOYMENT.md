# Deploying InsightGen

This guide covers deploying the frontend to GitHub Pages and the Python backend to a cloud provider.

## Architecture Overview

```
┌─────────────────────┐     API Calls     ┌─────────────────────┐
│   GitHub Pages      │ ───────────────── │   Python Backend    │
│   (Static Frontend) │                   │   (Railway/Render)  │
└─────────────────────┘                   └─────────────────────┘
                                                    │
                                                    ▼
                                          ┌─────────────────────┐
                                          │     OpenAI API      │
                                          └─────────────────────┘
```

## Step 1: Deploy the Python Backend

### Option A: Deploy to Railway (Recommended)

1. **Push the `backend/` folder to a GitHub repo**

2. **Go to [Railway](https://railway.app)** and sign up/log in

3. **Create a new project** → "Deploy from GitHub repo"

4. **Select your repository** (or the backend folder)

5. **Add environment variable**:
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key

6. **Railway will auto-deploy**. Copy the generated URL (e.g., `https://your-app.railway.app`)

### Option B: Deploy to Render

1. **Go to [Render](https://render.com)** and sign up/log in

2. **Create a new Web Service** → Connect your GitHub repo

3. **Configure the service**:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Add environment variable**:
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key

5. **Deploy**. Copy the generated URL (e.g., `https://your-app.onrender.com`)

### Option C: Deploy to your own server

```bash
# SSH into your server
ssh user@your-server.com

# Clone your repo
git clone https://github.com/yourusername/insightgen.git
cd insightgen/backend

# Setup Python environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
echo "OPENAI_API_KEY=your_key_here" > .env

# Run with gunicorn for production
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

# Or use systemd service for auto-restart
```

## Step 2: Update Frontend API URL

After deploying your backend, update the frontend to use your backend URL:

1. **Edit `src/lib/api.ts`**:
```typescript
const API_BASE_URL = 'https://your-backend-url.railway.app'; // Your deployed backend URL
```

Or use environment variables:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.railway.app';
```

## Step 3: Build the Frontend for GitHub Pages

1. **Clone this repo locally**:
```bash
git clone https://github.com/yourusername/insightgen.git
cd insightgen
npm install
```

2. **Update vite.config.ts for GitHub Pages**:
```typescript
export default defineConfig({
  base: '/your-repo-name/', // Add this line with your repo name
  // ... rest of config
});
```

3. **Build the project**:
```bash
npm run build
```

4. **The build output will be in the `dist/` folder**

## Step 4: Deploy to GitHub Pages

### Method A: Manual Deployment

1. **Create a new GitHub repo** (e.g., `insightgen`)

2. **Push your code**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/insightgen.git
git push -u origin main
```

3. **Deploy the dist folder**:
```bash
# Install gh-pages if not installed
npm install -D gh-pages

# Add to package.json scripts:
# "deploy": "npm run build && gh-pages -d dist"

npm run deploy
```

4. **Enable GitHub Pages**:
   - Go to your repo → Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `gh-pages` / `/(root)`
   - Save

### Method B: GitHub Actions (Automatic)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Add your backend URL as a secret:
- Repo → Settings → Secrets → Actions → New repository secret
- Name: `VITE_API_URL`
- Value: `https://your-backend-url.railway.app`

## Step 5: Configure CORS on Backend

Update `backend/main.py` to allow your GitHub Pages domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourusername.github.io",
        "http://localhost:8080",  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Redeploy the backend after this change.

## Your App URLs

After deployment:
- **Frontend**: `https://yourusername.github.io/your-repo-name/`
- **Backend API**: `https://your-app.railway.app/` or `https://your-app.onrender.com/`

## Troubleshooting

### CORS Errors
- Make sure your GitHub Pages URL is in the backend's `allow_origins` list
- Check browser console for specific CORS error messages

### 404 on Page Refresh
GitHub Pages doesn't support client-side routing by default. Add a `404.html`:
```bash
cp dist/index.html dist/404.html
```

### API Connection Issues
- Verify your backend is running: visit `https://your-backend-url/health`
- Check that `VITE_API_URL` is set correctly
- Ensure HTTPS is used for both frontend and backend

## Local Development

To run both frontend and backend locally:

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
echo "OPENAI_API_KEY=your_key" > .env
python main.py
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

Frontend will be at `http://localhost:8080`, backend at `http://localhost:8000`
