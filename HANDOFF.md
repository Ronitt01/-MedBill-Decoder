# HANDOFF — MedBill Decoder

> **Start here.** Snapshot of where the project stands and what to do next. Companions: [PRD.md](PRD.md) (product spec), [ROADMAP.md](ROADMAP.md) (tomorrow's build).

## What it is
Upload a medical bill → audit it against official Medicare price data → find overcharges → generate a ready-to-send appeal letter. The moat: **grounded verification + a deterministic billing audit**, not a ChatGPT wrapper.

## Live
- **App:** https://med-bill-decoder.vercel.app
- **Repo:** https://github.com/Ronitt01/-MedBill-Decoder  (branch `main`)
- **Last feature:** Universal Tiered Audit (multi-country packs + Layers 1–3). `ROADMAP.md` + `HANDOFF.md` are now tracked.

## Status — ✅ working MVP + Universal Tiered Audit
- **Tiered, multi-country audit** (the new core): every flag carries a **grounding badge** — `verified` (official fee schedule) › `structural` (math/duplicate) › `estimate` (AI) — plus confidence.
  - **Layer 1 — universal structural/arithmetic checks** (`src/lib/structuralChecks.js`): unit×qty math errors, line-items↔subtotal & subtotal+tax↔grand-total reconciliation, room-days vs length-of-stay. Currency-agnostic, runs on any bill.
  - **Layer 2 — pluggable per-country benchmark packs** (`src/data/benchmarks/`): 🇺🇸 US CMS, 🇦🇺 Australia MBS, 🇮🇳 India CGHS — real published rates. Pack interface: `lookupRate`, `rates`, `bundleMap`, `fairMultiple`, `currency`, `source`, `benchmarkLabel`.
  - **Layer 3 — labeled AI market estimate** (`api/estimate.js`): low-confidence local price range for uncoded lines; shown as separate "potential", **never** folded into the hard disputable total.
- Fair-market model (not naive schedule gap) — `src/lib/audit.js` now takes a `benchmarkPack` + `bill` and emits `country`/`currency`/`grounding`.
- Deterministic checks: overcharge / duplicate / unbundling / upcoding (+ Layer 1 math & stay).
- **Manual country picker** (`src/components/CountrySelect.jsx`) drives the pack; **format-only currency** (`src/lib/format.js`) — never FX-converts across schedules.
- Gemini Vision extraction, server-side only — `api/analyze.js` now also pulls unitPrice/lineTotal/subtotal/tax/grandTotal/admission+discharge dates.
- Appeal-letter generator generalized to any pack (US-only No Surprises Act note gated) — `src/lib/appealLetter.js`
- **Three offline samples** (US/AU/IN) showcase all layers with zero API/quota — `src/lib/sampleBill.js`
- Premium UI intact: aurora cursor, 3D glass-bill hero, Triage Beam reveal, grid + grain, odometer; new grounding badges + legend + bill-level structural banner.
- Honest handling of unverifiable (no-code) bills — won't falsely show "healthy"
- Deployed on Vercel with live Gemini extraction confirmed working

## Run / deploy
```
npm install
npm run dev            # UI + sample audit (no key needed)
# live upload needs the serverless fn: `vercel dev`, or just use the deployed site
npm run build          # production build
```
- **Gemini key:** server-side only, Vercel env var `GEMINI_API_KEY`. Model defaults to `gemini-2.5-flash` (override via `GEMINI_MODEL`).
- **Deploy:** push to `main` → Vercel auto-deploys. Env var changes require a redeploy.

## Demo strategy
- **Lead with "View sample audit"** — runs the whole pipeline offline, zero key/quota. Bulletproof on stage.
- Use **one** live upload as the "reads a real bill" moment. Don't rapid-fire (free-tier per-minute cap).
- Use a **US itemized bill with CPT/HCPCS codes** for the live wow — that's where benchmarking shines.

## ✅ Universal Tiered Audit — SHIPPED (2026-06-21)
Full spec in **[ROADMAP.md](ROADMAP.md)**. Decisions taken: packs = **US + Australia MBS + India CGHS** (real researched rates); **manual country picker**; **format-only currency** (no FX). US CMS stays the demo hero; Layers 1 & 3 are graceful degradation. All three layers verified working on the offline samples (`npm run build` green).

### Next candidates (not yet built)
- 4th pack: **UK NHS** reference costs (pack interface is ready — drop in `src/data/benchmarks/uk.js` + register in `index.js`).
- Auto-detect country (currency hint is already extracted in `api/analyze.js` as `currencyHint`) to pre-select the picker.
- Layer 3 currently fires on **live uploads only** (needs the API); samples show Layers 1–2.

## Gotchas
- Free Gemini tier rate-limits fast — space out live uploads.
- Windows line-ending warnings on commit are harmless.
- `prefers-reduced-motion` / low-power devices skip the beam + 3D and get a static premium screen (by design).

## File map
```
api/analyze.js              Gemini extraction (server-side key; now pulls totals/dates/unit prices)
api/estimate.js             Layer 3 — labeled AI market estimate (server-side key)
src/lib/audit.js            Deterministic tiered audit engine (the moat); takes a pack + bill
src/lib/structuralChecks.js Layer 1 — universal math/structure/stay checks (currency-agnostic)
src/lib/format.js           Currency-aware money formatting (USD/AUD/INR)
src/lib/appealLetter.js     Appeal + itemization-request letters (pack-generalized)
src/lib/sampleBill.js       Three offline samples (US/AU/IN) exercising all layers
src/data/benchmarks/        Layer 2 packs: index.js + us.js + au.js + in.js
src/data/cmsRates.js        DEPRECATED shim → re-exports the US pack
src/components/CountrySelect.jsx  Manual country/benchmark picker
src/components/AuditTable.jsx     Triage Beam reveal + rows + grounding badges
src/components/Dashboard.jsx      Audit workspace (country chip, structural banner, grounding legend)
src/components/CursorAurora.jsx   Aurora cursor
src/components/AmbientGrid.jsx / Odometer.jsx  Atmosphere
```
