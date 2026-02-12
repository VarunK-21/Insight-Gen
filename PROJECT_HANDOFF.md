# Insight Gen - Project Handoff (Manager Ready)

This document is your technical briefing for presenting **Insight Gen** confidently.

---

## 1) Project Summary

**Insight Gen** is a frontend-only, persona-driven dataset analysis application.

Users:
- upload CSV data
- pick a persona (for lens/context)
- run AI-powered analysis
- get structured insights + visualizations
- save analyses locally by user profile

There is **no backend server** in the current architecture.

---

## 2) Final Architecture (Current)

```text
Browser (React + Vite App)
  -> Local preprocessing + data cleaning
  -> Direct OpenAI API call (user-provided API key)
  -> Local profile/auth storage (browser localStorage)
  -> Local saved analyses storage (per user)
```

### Important implication
- API key is entered by the user and stored in localStorage (browser only).
- Data and accounts are local to that browser/device (not shared cross-device).

---

## 3) Tech Stack and Why Each Was Used

## Frontend Core
- **React 18**: component architecture and state-driven UI.
- **TypeScript**: type safety for analysis payloads, chart config, and profile data.
- **Vite**: fast local dev + optimized static build for GitHub Pages.
- **React Router**: page routing (`/dashboard`, `/history`, `/login`, `/profile`, etc.).

## UI / Design System
- **Tailwind CSS**: utility-first styling and responsive layout.
- **shadcn/ui + Radix primitives**: accessible, composable UI components.
- **Lucide React**: clean icon set.
- **Sonner + Toaster**: status/feedback notifications.

## Data / Analysis / Visualization
- **Custom preprocessing engine (`src/lib/dataCleaning.ts`)**:
  - type detection
  - cleaning
  - deduping
  - outlier detection
  - summary statistics
- **OpenAI Chat Completions API**:
  - persona-aware interpretation and insight generation
- **Recharts**:
  - rendering interactive charts with controlled aggregation logic
  - fallback chart generation to ensure minimum visual output

## Tooling / Quality
- **ESLint**: code quality and static checks.
- **Vitest**: test runner setup.

---

## 4) Folder and File Map (What Matters)

## Root
- `package.json` - scripts, dependencies, deploy hooks.
- `vite.config.ts` - Vite config + GitHub Pages base path.
- `index.html` - metadata + favicon.
- `.gitignore` - excludes build/local artifacts.
- `README.md` - public project docs.
- `PROJECT_HANDOFF.md` - this internal briefing.

## `public/`
- `favicon.svg` - current app favicon/logo in browser tab.

## `src/`
- `App.tsx` - route registry + app shell wrappers.
- `main.tsx` - React entrypoint.
- `components/Layout.tsx` - navbar/footer + profile dropdown.
- `lib/api.ts` - OpenAI integration + model/key storage + response normalization.
- `lib/dataCleaning.ts` - deterministic preprocessing/statistics engine.
- `lib/auth.ts` - local sign up/sign in/current user/password update.
- `pages/Login.tsx` - sign in / sign up UI.
- `pages/Profile.tsx` - user info, API key management, model selection, clear cache.
- `pages/Dashboard.tsx` - upload -> analyze -> render result dashboard, save logic.
- `pages/History.tsx` - per-user saved analyses list + view/delete.
- `components/dashboard/tabs/ChartsTab.tsx` - chart generation and visual rendering logic.

---

## 5) Key Implementation Methods Used

## Method A: Deterministic + AI Hybrid
1. Clean data and compute stats deterministically in code.
2. Send structured context to OpenAI for persona interpretation.
3. Normalize and validate returned chart types.
4. Add fallback chart views if AI returns too few.

This combines reliability (code-driven facts) with flexible persona framing (AI).

## Method B: Frontend-only auth/profile
- Local signup/login in localStorage.
- Current user session stored locally.
- Saved analyses key-scoped by user email.

## Method C: Local-first API key ownership
- User uploads their own OpenAI key.
- Key never committed to codebase.
- Stored only in local browser storage.

---

## 6) Important Code Snippets (Main Ones)

## A) App routing and shell
```tsx
<BrowserRouter basename={import.meta.env.BASE_URL}>
  <Layout>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/history" element={<History />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
</BrowserRouter>
```

## B) OpenAI key/model local handling
```ts
const API_KEY_STORAGE = "insight_weaver_openai_key";
const MODEL_STORAGE = "insight_weaver_openai_model";

export function setStoredApiKey(value: string): void {
  localStorage.setItem(API_KEY_STORAGE, value.trim());
}

export function getStoredModel(): string {
  return localStorage.getItem(MODEL_STORAGE) || "gpt-5-chat-latest";
}
```

## C) Deterministic preprocessing pipeline
```ts
const { cleanedData, report, columnStats } = cleanAndPrepareData(request.data);
```
This computes cleaning report + column stats before AI response generation.

## D) Robust save analysis flow
```ts
const saved = saveAnalysis(payload, user.email);
if (!saved) {
  toast.error("Could not save analysis locally. Please clear local cache and try again.");
  return;
}
```

## E) Chart fallback guarantee (minimum visual output)
```ts
if (combined.length < 4) {
  fallbackViews.forEach((view) => { ... });
}
```

---

## 7) Optimization Techniques Already Applied

- Data sampling in chart preprocessing to avoid heavy rendering for huge datasets.
- Defensive fallback logic for chart views (minimum 4).
- Safe local save strategy with reduced payload fallback if localStorage is near limits.
- Typed interfaces for analysis output to reduce runtime shape errors.
- Chart aggregation normalization (`sum`, `avg`, `count`) to avoid inconsistent labels/metrics.
- Clean axis labeling and display formatting for large numbers (`K`, `M`).

---

## 8) Known Limitations (Be Honest in Review)

- Local auth is not production-grade authentication (browser-local only).
- Data and profile are not cross-device synced.
- OpenAI key is client-side by design (user-owned key model).
- Hallucinations can be reduced but not fully eliminated in LLM-generated narrative.

---

## 9) Manager Q&A Cheat Sheet

## Q: Why no backend?
**A:** Intentional architecture choice for GitHub Pages compatibility and zero server maintenance. Users bring their own API key.

## Q: How is user data secured?
**A:** Data is local to browser storage; no backend transmission except OpenAI request payload. No central DB currently.

## Q: How do you control hallucination risk?
**A:** Deterministic preprocessing/stats are computed in code first; AI is guided with strict prompts and structured output checks.

## Q: Why are some charts fallback-generated?
**A:** To guarantee a consistent minimum visualization experience when AI response is sparse or low-quality.

## Q: What if local storage is full?
**A:** Save flow retries with reduced dataset payload and gives explicit user error if still blocked.

## Q: Is this deployable now?
**A:** Yes. Static frontend deploys to GitHub Pages using `npm run deploy`.

## Q: Can this scale enterprise-level?
**A:** For enterprise, next step is backend auth, encrypted secrets handling, shared storage, and governed analytics pipeline.

---

## 10) Future Feature Roadmap

Short-term:
- Stronger fact-to-insight traceability (evidence IDs per insight).
- Smarter chart semantic mapping (date/time/category/metric typing).
- Profile-level export/import of local analyses.
- Model compatibility pre-check before analysis call.

Mid-term:
- Optional backend mode (secure auth + cloud history sync).
- Team workspaces and role-based sharing.
- Cached semantic summaries for huge files.
- Prompt versioning and insight reproducibility controls.

Advanced:
- Automated data quality scoring and confidence metrics.
- Explainability panel ("why this chart / why this insight").
- BI-grade chart templates and custom report export (PDF/PPT).

---

## 11) How to Run and Deploy

## Run locally
```powershell
npm install
npm run dev
```
Open `http://localhost:8080`

## Deploy to GitHub Pages
```powershell
npm run deploy
```
Then enable Pages from `gh-pages` branch in GitHub settings.

---

## 12) One-line Pitch for Manager

**Insight Gen is a frontend-only, persona-driven analytics platform that preprocesses CSV data deterministically, generates AI-assisted insights using user-owned OpenAI keys, and delivers structured, fallback-safe visual analytics with local profile/history management.**
