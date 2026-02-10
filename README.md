# Insight Weaver

Insight Weaver is a modern, persona-driven analytics app that turns CSV data into clear insights, patterns, and dashboard-ready chart ideas. The frontend is built with React and Vite, and the backend is a FastAPI service that generates analysis using the OpenAI API.

## Features

- Upload a dataset and get cleaned, structured insights
- Persona-based analysis (common citizen, accountant, engineer, and more)
- Automated patterns, summaries, and dashboard view suggestions
- Clean, responsive UI built with shadcn/ui and Tailwind CSS

## Tech Stack

- Frontend: Vite, React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: FastAPI (Python)
- AI: OpenAI API

## Project Structure

```
/
├─ backend/          # FastAPI backend
├─ src/              # React frontend
├─ public/           # Static assets
├─ package.json      # Frontend dependencies and scripts
└─ DEPLOYMENT.md     # Deployment guide
```

## Local Development

### 1) Backend (FastAPI)

**Bash/Zsh**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
echo "OPENAI_API_KEY=your_key_here" > .env
python main.py
```

**PowerShell**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Set-Content -Path .env -Value "OPENAI_API_KEY=your_key_here"
python main.py
```

Backend runs at `http://localhost:8000`.

### 2) Frontend (Vite)

**Bash/Zsh**
```bash
npm install
npm run dev
```

**PowerShell**
```powershell
npm install
npm run dev
```

Frontend runs at `http://localhost:8080`.

## Environment Variables

- Backend: `OPENAI_API_KEY` in `backend/.env`
- Frontend: `VITE_API_URL` (optional)
  - Defaults to `http://localhost:8000`
  - For production, set to your deployed backend URL

## Deployment

The frontend can be deployed to GitHub Pages and the backend to any cloud provider (Railway/Render/etc.). For a complete walkthrough, see `DEPLOYMENT.md`.

Quick summary:
1. Deploy the Python backend and get the public URL.
2. Set `VITE_API_URL` to that URL for the frontend build.
3. Build and deploy the frontend to GitHub Pages.

## Scripts

**Bash/Zsh**
```bash
npm run dev
npm run build
npm run preview
npm run lint
```

**PowerShell**
```powershell
npm run dev
npm run build
npm run preview
npm run lint
```

## License

MIT
