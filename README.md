# Insight Gen

Insight Gen is a persona-driven analytics app that preprocesses CSV datasets, generates insights, and builds structured visualizations directly in the browser. It is frontend-only and uses each user's own OpenAI API key.

## Features

- CSV upload with cleaning and preprocessing
- Persona-based analysis (common, accountant, engineer, policy, and more)
- AI insights with structured dashboard suggestions
- Minimum 4 chart views with fallback chart generation
- Local Sign In / Sign Up profile flow (browser-local)
- Per-user saved analyses history (local only)
- API key management: save, view/hide, edit, remove
- Model selection in profile (user-preferred OpenAI model)
- Clear local cache / fresh-start option

## Tech Stack

- Vite
- React + TypeScript
- Tailwind CSS + shadcn/ui
- OpenAI API (user-provided key)

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

Open: `http://localhost:8080`

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
