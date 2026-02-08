# Replay2PR (Gemini 3 Hackathon)

Replay2PR turns short bug replays into reproducible Playwright tests, patch attempts, and a shareable Evidence Pack. It ships with a built-in demo target (intentional bug) and a demo video so the full pipeline works locally without paid services.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and set your key:

```bash
copy .env.example .env.local
```

Set:
- `GEMINI_API_KEY` (optional if you use `USE_MOCK_GEMINI=true`)
- `GEMINI_MODEL_FLASH` and `GEMINI_MODEL_PRO` (defaults target Gemini 3)

3. Install Playwright browsers (once):

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

## 3-Minute Demo Script

1. Open the landing page. Call out the single CTA, demo mode toggle, and upload zone.
2. Click **Run Replay**. Watch Mission Control step through Extract -> Reproduce -> Patch -> Verify -> Ship.
3. Open `/demo` to show the bug (success banner never appears).
4. When the run finishes, click **Open Evidence Pack**.
5. Walk through the Evidence Pack: repro steps, generated test, patch diff, verification logs, and artifacts.

## Overview of What You Built

Replay2PR is a Next.js 14 app with an in-process job runner, Gemini prompts, and Playwright execution. It persists artifacts to `/artifacts`, renders a Mission Control timeline on the main page, and generates an Evidence Pack share page. The demo target is a local page with a deterministic UI bug that the patch step fixes by updating `app/demo/buggy-form.tsx`.
