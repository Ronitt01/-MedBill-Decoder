# ROADMAP — Universal Tiered Audit

> **Build target: 2026-06-22.** Goal: make MedBill Decoder usable on a bill from *any* country, honestly, by layering the audit so it degrades gracefully and always shows how much to trust each flag. Reference this doc when building so prompts stay short. Companion to [PRD.md](PRD.md).

## Core principle
There is **no global price table**, so "universal" ≠ one benchmark. Instead: a **tiered audit** where every flag carries a **grounding badge + confidence**:

`Verified (official)` › `Structural (math/duplicate)` › `Estimate (AI)`

That transparency is the moat — the opposite of a chatbot that confidently guesses.

---

## Layer 1 — Universal structural & arithmetic checks (NO price data) ⭐ build first
Detect errors from the bill's own internal structure + math. Deterministic, currency-agnostic, works in every country. Highest bang-for-effort.

Checks:
- **Math errors** — `unitPrice × qty ≠ lineTotal`; line items don't sum to subtotal; `subtotal + tax ≠ grandTotal`. (Needs unit price + qty + totals from extraction.)
- **Duplicates** — same item/date billed twice *(already implemented)*.
- **Unbundling** — a "package/bundle" line PLUS its components billed separately (generalize the current BUNDLE_MAP to a name/heuristic match).
- **Stay/quantity sanity** — room/bed billed for more days than admission span; charges dated outside the stay.

Implementation notes:
- Extraction (`api/analyze.js`) must also pull: `unitPrice`, `lineTotal`, `subtotal`, `tax`, `grandTotal`, admission/discharge dates, currency.
- New module `src/lib/structuralChecks.js`; runs in `auditBill` regardless of country.
- These flags are **high confidence, grounding = "structural"**, fully count toward disputable.

## Layer 2 — Per-country benchmark packs (pluggable)
Keep the CMS approach but make the price source swappable by country.
- Detect country/currency from the bill (Gemini) or let user pick.
- `src/data/benchmarks/<country>.js` packs, each exposing `lookupRate(code)` + `CMS_SOURCE`-style label + fair-multiple table.
- Packs to add (priority): 🇺🇸 US CMS *(done)* → 🇦🇺 Australia MBS (cleanest public data) → 🇮🇳 India CGHS / PMJAY package rates → 🇬🇧 UK NHS reference costs.
- Refactor `audit.js` to take a `benchmarkPack` arg instead of importing CMS directly.
- Flags here are **highest confidence, grounding = "verified"**.

## Layer 3 — AI market estimate (labeled, low confidence)
For uncoded lines in countries with no fee schedule: one Gemini call returns a *typical local price range* per line (by country/city + description).
- ⚠️ ONLY for directional outliers (e.g. "~10× typical"); **never a precise dispute figure**.
- Grounding = "estimate", confidence = low; visually distinct; excluded from the hard disputable total (shown as "potential" separately).
- This is the only place AI estimates price — guarded by heavy labeling so the moat ("not guessing") holds.

---

## Cross-cutting work
- **Country/currency detection + formatting** — stop hardcoding `$`/`toLocaleString('en-US')`; format by detected currency. Pass currency through the report.
- **Data model** — add to each line: `grounding: 'verified'|'structural'|'estimate'|'none'`, keep `confidence`. Add `report.country`, `report.currency`.
- **UI** — confidence/grounding badge per row; currency-aware money counter + cards; a country indicator on the dashboard; legend explains the three grounding levels.
- **`status` logic** — extend current `audited|partial|unverified` to account for structural-only audits (a no-code bill can still be "audited" via Layer 1).

## Build order (by ROI)
1. Layer 1 (structural/arithmetic) + currency formatting — the real "works on any bill" unlock, low effort, fully grounded.
2. One more benchmark pack (Australia MBS, or India CGHS if targeting India).
3. Layer 3 AI estimate — last, with heavy labeling.

## Open decisions (resolve at start)
- [ ] Which 2nd country pack first: **Australia MBS** (cleanest data) or **India CGHS/PMJAY** (most relevant if demoing in India)?
- [ ] Currency handling: detect-and-format only, or also FX-normalize for cross-country benchmarks? (Recommend: format only; never FX-convert a charge against a different country's schedule.)
- [ ] Keep US CMS as the demo hero; universal layers are graceful degradation, not the headline.
