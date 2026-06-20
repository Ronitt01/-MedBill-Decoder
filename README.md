# MedBill Decoder

**Audit any medical bill against official Medicare benchmarks, find overcharges, and generate a ready-to-send appeal letter — in seconds.**

> ChatGPT *talks* about your bill from memory. MedBill Decoder *verifies* it against real CMS Medicare data, runs the same deterministic audit a billing advocate runs, and hands you the appeal letter.

---

## Why it's not a ChatGPT wrapper

| | ChatGPT | MedBill Decoder |
|---|---|---|
| Price check | Guesses from memory | Compares against the **CMS Medicare fee schedule** |
| Error detection | Only if you ask | **Deterministic checks** every time: duplicates, unbundling, upcoding, overcharge |
| Dollar claims | Vague | Measured against a **conservative fair-market ceiling** (not raw Medicare) so they hold up |
| Output | A chat reply | **Structured report + money counter + appeal letter** |

Gemini is used for exactly one thing — reading a messy bill into structured line items. **All pricing and audit logic is deterministic and runs client-side.** Gemini never decides whether something is an overcharge.

---

## The pricing model (the important part)

Medicare-allowed amounts are a **floor** — nobody is billed at Medicare rates, and charging a multiple over Medicare is legal. So we do **not** treat the gap above Medicare as "disputable." Each charge is held to a **fair-market ceiling = Medicare × a category multiple**, grounded in published price research (RAND hospital price studies ≈ 2.5× Medicare for hospital services; labs higher because Medicare lab rates are rock-bottom; physician E/M lower).

- **Headline stat** — "8× Medicare" — the striking, citable anchor.
- **Disputable dollars** — `charged − fair-market ceiling` — conservative, so the total survives scrutiny.

See [`src/lib/audit.js`](src/lib/audit.js) and [`src/data/cmsRates.js`](src/data/cmsRates.js).

---

## Tech stack (100% free tier)

- **React + Vite + Tailwind** — single-page app
- **Three.js / React Three Fiber / drei** — the glass-bill 3D hero (with CSS fallback for low-power devices)
- **Framer Motion** — transitions
- **Google Gemini** (`gemini-2.0-flash`) — bill extraction, server-side only
- **Vercel** — static hosting + one serverless function for the Gemini key

---

## Run locally

```bash
npm install

# Front-end only (sample audit + full UI work; live upload needs the API below)
npm run dev

# Full experience incl. live bill upload — runs the serverless /api function too:
npm i -g vercel
vercel dev          # then add GEMINI_API_KEY when prompted, or via .env
```

Create a free Gemini key at https://aistudio.google.com/apikey and put it in `.env`:

```
GEMINI_API_KEY=your_key_here
```

> Even without a key, **"View sample audit"** runs the full pipeline on a built-in bill — perfect for offline demos.

---

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel: **New Project → import the repo** (framework auto-detected as Vite).
3. **Project Settings → Environment Variables → add `GEMINI_API_KEY`**.
4. Deploy. The `api/analyze.js` function is picked up automatically.

---

## Project structure

```
api/analyze.js            Serverless Gemini extraction (server-side key only)
src/data/cmsRates.js      CMS Medicare benchmark table + bundling map
src/lib/audit.js          Deterministic audit engine (the moat)
src/lib/appealLetter.js   Appeal-letter generator
src/lib/api.js            Client: downscale image -> call /api/analyze
src/components/Hero3D.jsx 3D glass-bill hero + CSS fallback
src/components/Dashboard.jsx   Audit workspace
src/components/...        Landing, audit table, appeal letter, savings card
```

---

## Disclaimer

Benchmarks are illustrative national averages derived from public CMS data and are **for informational purposes only — not medical, legal, or financial advice.**
