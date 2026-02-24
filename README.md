# Insight Gen

Insight Gen is a persona-driven analytics app that preprocesses CSV/Excel datasets, generates insights, and builds structured visualizations directly in the browser. It is frontend-only and uses each user's own OpenAI API key.

## Features

- CSV and Excel upload with cleaning and preprocessing
- Built-in sample dataset button (to try the app without your own file)
- Persona-based analysis (common, accountant, engineer, policy, and more)
- Auto persona + KPI suggestions based on the dataset
- AI insights with structured dashboard suggestions
- Minimum 4 chart views with fallback chart generation (prefers at least one pie chart when data supports it)
- Local Sign In / Sign Up profile flow (browser-local)
- Per-user saved analyses history (local only)
- API key management: save, view/hide, edit, remove
- Model selection in profile (user-preferred OpenAI model)
- Strict Analysis Mode toggle (lower hallucinations via stricter rules + low temperature)
- Dataset-hash caching for:
  - analysis results per dataset + persona
  - auto persona + KPI recommendations per dataset
- Clear local cache / fresh-start option (also clears hash-based caches)

## Tech Stack

- Vite
- React + TypeScript
- Tailwind CSS + shadcn/ui
- OpenAI API (user-provided key)
- Recharts (charts)
- xlsx (Excel parsing)

## Project Structure

```text
/
├─ src/
├─ public/
├─ package.json
├─ vite.config.ts
└─ .gitignore
```

## Local Development

### Frontend

**PowerShell**
```powershell
npm install
npm run dev
```

**Bash/Zsh**
```bash
npm install
npm run dev
```

Open: `http://localhost:5173/` (or the URL shown in the Vite dev server)

## API Key and Model

- No backend `.env` is needed.
- Users add their OpenAI API key from `Profile`.
- Key and model are stored only in browser localStorage.
- Recommended model: `gpt-5-chat-latest`

## Local Storage Behavior

- User account/profile is local-only.
- Saved analyses are local-only and tied to signed-in user email.
- Clear Local Data removes local analyses + API key + model for that browser.
- Data is not synced across browsers/devices.

## GitHub Pages Deployment

```powershell
npm run deploy
```

Then enable GitHub Pages in repo settings using `gh-pages` branch.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run deploy
```

## License

MIT
