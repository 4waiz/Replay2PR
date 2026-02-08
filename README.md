# Replay2PR (Gemini 3 Hackathon)

Replay2PR turns short bug replays into reproducible Playwright tests, patch attempts, and a shareable Evidence Pack. It ships with a built-in demo target (intentional bug) and a demo video so the full pipeline works locally without paid services.

## Setup (Windows)

1. Install Node.js 18+ (or 20+ recommended).
2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` from `.env.example`:

```bash
copy .env.example .env.local
```

Set:
- `GEMINI_API_KEY` (optional if you use `USE_MOCK_GEMINI=true`)
- `GEMINI_MODEL_FLASH` and `GEMINI_MODEL_PRO` (defaults target Gemini 3)
- `MAX_CONCURRENT_JOBS` (default 1 to avoid Playwright collisions)

4. Install Playwright browsers (once):

```bash
npm run playwright:install
```

## Setup (macOS / Linux)

1. Install Node.js 18+ (or 20+ recommended).
2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

4. Install Playwright browsers (once):

```bash
npm run playwright:install
```

## Run (Dev)

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo Mode

Demo Mode is on by default. It uses:
- Built-in demo video (decoded from `assets/demo-video.b64`)
- Built-in demo target at `/demo`
- Mock Gemini responses if `GEMINI_API_KEY` is missing or `USE_MOCK_GEMINI=true`

Click **Run Replay** and watch Mission Control progress. When complete, open the Evidence Pack link.

## Run Playwright Directly

```bash
npm run test:e2e
```

## Judge Script (3 Minutes)

1. Open the landing page.
2. Click **Judge Mode** (forces demo mode and starts a run immediately).
3. While it runs, open `/demo` to show the bug (success banner never appears).
4. Return to the landing page; when complete, click **Open Evidence Pack**.
5. Walk through: repro steps, generated test, patch diff, verification logs, artifacts.
6. Click **Download Evidence JSON** to show shareable proof.

## Troubleshooting

- Playwright browsers missing: run `npm run playwright:install`.
- Base URL unreachable: ensure `npm run dev` is running and `BASE_URL` matches (default `http://localhost:3000`).
- Node version mismatch: use Node 18+ (20+ recommended).
- Gemini errors: set `GEMINI_API_KEY` or enable `USE_MOCK_GEMINI=true`.

## Overview of What You Built

Replay2PR is a Next.js 14 app with an in-process job runner, Gemini prompts, and Playwright execution. It persists artifacts to `/artifacts`, renders a Mission Control timeline on the main page, and generates an Evidence Pack share page. The demo target is a local page with a deterministic UI bug that the patch step fixes by updating `app/demo/buggy-form.tsx`.
