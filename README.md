# Upliance.ai – Recipe Builder + Cooking Session

React 18 + TypeScript + Redux Toolkit + React Router + MUI v5 implementation of the assignment.

## Features

- Recipes
  - Create/edit with validations, derived fields (total time, total ingredients, complexity score)
  - Ingredients list (name, quantity > 0, unit)
  - Steps (cooking: temperature 40–200, speed 1–5; instruction: ingredient references)
  - Reorder steps (Up/Down), add/remove
  - Favorite toggle
  - Persisted in localStorage under `recipes:v1`

- Cooking Session
  - Start, Pause/Resume (Space), STOP (ends current step only)
  - Auto-advance to next step when time hits 0s
  - Per-step circular progress (mm:ss)
  - Overall linear progress (time‑weighted) + remaining mm:ss
  - Timeline: Completed / Current / Upcoming (read-only)
  - Global mini player on all routes except active cook page
  - One active session enforced; toast if another is running

## Routes

- `/recipes` – list, difficulty multi-filter, sort by total time, favorite toggle, Create button
- `/create` – recipe builder
- `/cook/:id` – cooking session for a single recipe

## Getting Started

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

Lint:

```bash
npm run lint
```

## Deployment (Vercel)

1) Push this repo to GitHub.
2) Import the project in Vercel.
3) Framework Preset: Vite (auto-detected)
4) Build Command: `npm run build`
5) Output Directory: `dist`

The included `vercel.json` adds a rewrite to serve `index.html` for all routes, so deep links like `/cook/:id` work.

## Notes

- Session state is in-memory (as required). Reloading clears timers.
- Recipes are hydrated from localStorage on load; malformed entries are ignored.
- Accessibility: progress bars expose `aria-valuenow`; Space toggles Pause/Resume; minute announcements via `aria-live`.

## Tech

- React 18, TypeScript, Vite
- Redux Toolkit, React Redux
- React Router v6
- MUI v5 (+ Emotion)

