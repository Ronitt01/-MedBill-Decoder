# PRD — MedBill Decoder (working title)

> **Purpose of this doc:** Single source of truth so build prompts stay short. When prompting, reference this file instead of re-explaining context. Keep this doc updated as decisions change.

---

## 1. One-liner
ChatGPT *talks* about your medical bill from memory. We *audit* it against real Medicare price data, run the same fraud checks a billing advocate runs, and hand you a ready-to-send appeal letter.

## 2. Problem statement
Patients receive medical bills full of opaque codes (CPT/HCPCS) and have no way to know if they're being overcharged, double-billed, or wrongly denied. Billions in billing errors go unchallenged every year because verifying a bill requires expert knowledge most people don't have.

## 3. Target user
Anyone who just received a confusing medical bill — primarily US patients (where CPT codes + Medicare benchmarks + the No Surprises Act apply). Non-expert; cannot prompt-engineer; wants an answer and an action, not a chat.

## 4. Why this beats a ChatGPT wrapper (the moat — protect this)
1. **Grounded verification, not generation:** every overcharge flag cites a real Medicare benchmark number, not a guessed price.
2. **Deterministic expert audit:** runs duplicate / upcoding / unbundling / overcharge checks every time, consistently.
3. **Outcome, not conversation:** outputs a structured report + money counter + ready-to-send appeal letter.
> **Build implication:** Feature #2 (real-data verification) is non-negotiable. If skipped, the whole differentiation collapses. At least one flag must be a verified, cited number.

---

## 5. Final feature scope

### Core (must ship)
| # | Feature | Definition of done |
|---|---------|--------------------|
| 1 | Bill capture & extraction | Upload photo/PDF → Gemini Vision returns normalized line items: `{code, description, qty, chargedAmount, date}` |
| 2 | Real-data price verification | Each code looked up in CMS Medicare rate table → returns `{benchmark, multiplier, verdict}` with citation |
| 3 | Billing-error audit | Deterministic checks: duplicates, upcoding, unbundling, overcharge vs benchmark → each line tagged red/yellow/green + reason |
| 4 | Money counter | Sum of disputable overcharges shown prominently as "$X in potential errors found" |
| 5 | Appeal letter generator | One click → letter citing specific codes, overcharge amounts, total disputed; copy/download ready |

### Demo-critical (ship if core solid)
| # | Feature | Definition of done |
|---|---------|--------------------|
| 6 | Results dashboard | Itemized table, severity colors, running total |
| 7 | Plain-English explainer | Per line: jargon decoded in one sentence |
| 8 | Before/after card | "Original $X · Fair $Y · Disputable $Z" shareable card |

### Stretch (only if time)
| # | Feature |
|---|---------|
| 9 | Insurance denial decoder (paste denial → explain + appeal) |
| 10 | "Is this legal here?" No Surprises Act flag |

### Explicitly OUT of scope (do not build)
- User accounts / auth / login
- Payments / billing
- Bill history & persistence (no DB needed for MVP)
- Multi-language
- Mobile native app
- Onboarding flows

---

## 6. Tech stack (all free tier)
| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | React + Vite + Tailwind | Single-page app |
| AI / Vision | Google Gemini API (free tier, multimodal) | OCR + extraction + letter generation |
| Price data | CMS Medicare reimbursement rates | Bundled as a local JSON/CSV lookup; no API call needed |
| Hosting | Vercel / Netlify / Cloudflare Pages | Static + serverless function for the Gemini key |
| State | In-memory (React state) | No DB for MVP |

> **Key handling:** Gemini API key must live in a serverless function / env var, never in client code.

---

## 7. Data model (in-memory, no DB)
```
LineItem {
  code: string          // e.g. "74160"
  description: string
  qty: number
  chargedAmount: number
  date: string
  benchmark?: number    // from CMS lookup
  multiplier?: number   // chargedAmount / benchmark
  flag: "red" | "yellow" | "green"
  reason: string        // plain-English explanation
}

BillReport {
  lineItems: LineItem[]
  totalCharged: number
  totalFairBenchmark: number
  totalDisputable: number
  appealLetter: string
}
```

---

## 8. Core pipeline (the flow to build)
1. User uploads bill image/PDF
2. Serverless fn → Gemini Vision → extract `LineItem[]`
3. For each item → lookup CMS benchmark → compute multiplier
4. Run deterministic audit (duplicates/upcoding/unbundling/overcharge) → set flag + reason
5. Compute totals → money counter
6. Generate appeal letter (Gemini, fed the flagged items)
7. Render dashboard + before/after card

## 9. Demo script (90 sec — optimize the build for this)
1. Upload a realistic-looking bill
2. Line items extract live
3. Red flags appear WITH cited Medicare benchmarks
4. Money counter lands on a big disputable number
5. Click → appeal letter appears → "just hit send"

## 10. Judge Q&A prep
- **"Isn't this a ChatGPT wrapper?"** → No: we verify against real CMS data + run a deterministic billing audit; ChatGPT guesses prices from memory.
- **"What's the moat?"** → The grounded price dataset + the audit logic + the action artifact (letter).
- **"Where's the data from?"** → CMS public Medicare rates (free, official). Next step: hospital price-transparency files.

---

## 11. Token-efficiency rules for the build (read before prompting)
- Reference this PRD by name in prompts; don't re-paste context.
- Build in this order: pipeline (steps 1→6) before polish (dashboard styling).
- Get ONE real cited benchmark working end-to-end before adding more checks.
- Use a small hardcoded CMS sample (10–20 common codes) first; expand later. Don't ingest the full dataset early.
- Mock the Gemini extraction with a sample JSON while wiring the UI, to avoid burning API calls on layout work.
- Don't gold-plate out-of-scope items.

## 12. Open decisions
- [ ] Final product name
- [ ] Exact CMS dataset slice to bundle (recommend: 15–20 most common outpatient codes)
- [ ] Hosting target (recommend: Vercel)
