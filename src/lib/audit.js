// Deterministic billing audit engine — now universal & tiered.
//
// This is the heart of the product and the reason it is NOT a ChatGPT wrapper:
// every flag and figure below is produced by explicit, explainable logic — not by a
// model guessing. The audit degrades gracefully and every line carries a GROUNDING
// badge so the user always knows how much to trust it:
//
//   verified   — checked against an official per-country fee schedule (Layer 2)
//   structural — caught by arithmetic / the bill's own internal structure (Layer 1)
//   estimate   — a labeled AI market estimate, low confidence (Layer 3)
//   none       — no code, no structural signal: could not be checked
//
// PRICING MODEL (Layer 2):
// Official schedule rates (Medicare / MBS / CGHS) are a FLOOR — almost nobody is
// billed at them, and charging a multiple over them is normal and legal. So we do
// NOT treat the gap above the schedule as "disputable". Instead each charge is held
// to a defensible FAIR-MARKET CEILING = schedule rate × a category multiple drawn
// from published price research. Disputable dollars are measured against that
// ceiling, so the total survives scrutiny. The headline multiplier (e.g. "8×") is
// the striking, citable anchor.

import { DEFAULT_PACK } from '../data/benchmarks/index.js'
import { applyStructuralChecks } from './structuralChecks.js'
import { formatMoney } from './format.js'

// A charge at/above 2× the (already generous) fair ceiling is a clear overcharge.
const RED_FAIR_RATIO = 2.0
const YELLOW_FAIR_RATIO = 1.25
// Layer 3: a charge this many times the AI "typical" price is a directional outlier.
const ESTIMATE_OUTLIER_RATIO = 3.0

function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

function fairMultipleFor(pack, rate) {
  return pack.fairMultiple[rate?.category] ?? pack.defaultFairMultiple
}

function normalizeItem(raw, index) {
  const qty = Number(raw.qty) > 0 ? Number(raw.qty) : 1
  const unitPrice = raw.unitPrice != null && Number(raw.unitPrice) >= 0 ? money(raw.unitPrice) : null
  const lineTotal = raw.lineTotal != null ? money(raw.lineTotal) : null
  // chargedAmount is the line total. Prefer an explicit lineTotal/chargedAmount;
  // fall back to unitPrice × qty when only a unit price was extracted.
  let charged = raw.chargedAmount != null ? money(raw.chargedAmount) : lineTotal
  if ((charged == null || charged === 0) && unitPrice != null) charged = money(unitPrice * qty)
  return {
    id: `${raw.code || 'NA'}-${index}`,
    code: raw.code ? String(raw.code).trim().toUpperCase() : '',
    description: raw.description ? String(raw.description).trim() : '',
    qty,
    unitPrice,
    chargedAmount: money(charged),
    date: raw.date ? String(raw.date).trim() : '',
  }
}

// Find the next-lower-tier code in the same E/M family (US upcoding analysis only).
function lowerTierEm(pack, rate) {
  if (!rate || rate.category !== 'em' || !rate.family || !rate.tier) return null
  let best = null
  for (const [code, r] of Object.entries(pack.rates)) {
    if (r.family === rate.family && r.tier === rate.tier - 1) {
      best = { code, ...r }
    }
  }
  return best
}

function auditLine(item, pack) {
  const m = (n) => formatMoney(n, pack.currency, { decimals: 2 })
  const rate = pack.lookupRate(item.code)
  const out = {
    ...item,
    category: rate?.category || null,
    benchmarkRate: null, // per-unit schedule rate
    benchmark: null, // schedule rate × qty
    fairMultiple: null,
    fair: null, // fair-market ceiling × qty
    multiplier: null, // charged / benchmark (headline stat)
    fairRatio: null, // charged / fair
    overBenchmark: null,
    flag: 'green',
    severity: 0, // 0 green, 1 yellow, 2 red
    disputable: 0,
    potential: 0, // Layer 3 estimate-only exposure, never added to disputable
    confidence: 'high',
    grounding: 'none',
    reason: '',
    source: null,
    checks: [],
  }

  if (!rate) {
    // No benchmark — leave it for structural checks / Layer 3. Not yet flagged.
    out.flag = 'green'
    out.severity = 0
    out.confidence = 'low'
    out.grounding = 'none'
    out.reason =
      `No ${pack.benchmarkLabel} benchmark on file for this code — price could not be verified against a fee schedule. ` +
      `Structural checks still apply.`
    out.checks.push('unverified')
    return out
  }

  const fairMultiple = fairMultipleFor(pack, rate)
  const benchmark = money(rate.benchmark * item.qty)
  const fair = money(benchmark * fairMultiple)
  const multiplier = benchmark > 0 ? Math.round((item.chargedAmount / benchmark) * 100) / 100 : null
  const fairRatio = fair > 0 ? Math.round((item.chargedAmount / fair) * 100) / 100 : null

  out.benchmarkRate = rate.benchmark
  out.benchmark = benchmark
  out.fairMultiple = fairMultiple
  out.fair = fair
  out.multiplier = multiplier
  out.fairRatio = fairRatio
  out.overBenchmark = money(item.chargedAmount - benchmark)
  out.grounding = 'verified'
  out.source = pack.source

  if (fairRatio === null || fairRatio < YELLOW_FAIR_RATIO) {
    out.flag = 'green'
    out.severity = 0
    out.reason = `Charged ${m(item.chargedAmount)} — at or below the fair-market estimate of ${m(
      fair
    )} (~${fairMultiple}× the ${pack.benchmarkLabel} rate of ${m(benchmark)}). Reasonable.`
    return out
  }

  const overFair = money(item.chargedAmount - fair)
  if (fairRatio >= RED_FAIR_RATIO) {
    out.flag = 'red'
    out.severity = 2
    out.confidence = 'high'
    out.reason = `Charged ${m(item.chargedAmount)} — ${multiplier}× the ${pack.benchmarkLabel} rate (${m(
      benchmark
    )}) and ${fairRatio}× a fair-market estimate of ${m(fair)} (~${fairMultiple}× ${
      pack.benchmarkLabel
    }). About ${m(overFair)} above a reasonable price.`
  } else {
    out.flag = 'yellow'
    out.severity = 1
    out.confidence = 'medium'
    out.reason = `Charged ${m(item.chargedAmount)} — ${fairRatio}× our fair-market estimate of ${m(
      fair
    )} (~${fairMultiple}× ${pack.benchmarkLabel}). Above typical; worth questioning.`
  }
  out.disputable = overFair
  out.checks.push('overcharge')
  return out
}

function applyCrossChecks(lines, pack) {
  const m = (n) => formatMoney(n, pack.currency, { decimals: 2 })

  // ---- Duplicate detection (same code + same date billed more than once) ----
  const groups = new Map()
  for (const line of lines) {
    if (!line.code) continue
    const key = `${line.code}|${line.date}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(line)
  }
  for (const group of groups.values()) {
    if (group.length > 1) {
      group.slice(1).forEach((dup) => {
        dup.flag = 'red'
        dup.severity = 2
        dup.confidence = 'high'
        dup.grounding = 'structural'
        dup.disputable = money(Math.max(dup.disputable || 0, dup.chargedAmount))
        dup.reason = `Duplicate charge — code ${dup.code} is billed ${group.length}× on ${
          dup.date || 'the same date'
        }. The full ${m(dup.chargedAmount)} of this repeat line is disputable.`
        if (!dup.checks.includes('duplicate')) dup.checks.push('duplicate')
      })
    }
  }

  // ---- Unbundling detection (component billed alongside its comprehensive code) ----
  const codeSet = new Set(lines.map((l) => l.code).filter(Boolean))
  for (const line of lines) {
    const parent = pack.bundleMap[line.code]
    if (parent && codeSet.has(parent)) {
      line.flag = 'red'
      line.severity = 2
      line.confidence = 'high'
      line.grounding = 'structural'
      line.disputable = money(Math.max(line.disputable, line.chargedAmount))
      line.reason = `Unbundling — code ${line.code} is a component of ${parent}, which is also billed on this date. It should be included in ${parent}, so the full ${m(
        line.chargedAmount
      )} is disputable.`
      if (!line.checks.includes('unbundling')) line.checks.push('unbundling')
    }
  }

  // ---- Upcoding signal on highest-tier E/M codes (US only) ----
  if (pack.emUpcoding) {
    for (const line of lines) {
      const rate = pack.lookupRate(line.code)
      if (rate && rate.category === 'em' && rate.tier === 4 && line.severity === 0) {
        const lower = lowerTierEm(pack, rate)
        let estimate = ''
        if (lower) {
          const lowerFair = money(lower.benchmark * line.qty * fairMultipleFor(pack, lower))
          const exposure = money(Math.max(0, line.chargedAmount - lowerFair))
          if (exposure > 0) {
            estimate = ` If the visit only supported the next level down (${lower.code}), roughly ${m(
              exposure
            )} would be excess.`
          }
        }
        line.flag = 'yellow'
        line.severity = 1
        line.confidence = 'medium'
        line.reason = `Highest-complexity visit code (${line.code}) billed — the tier most often upcoded. Confirm the documentation supports this level of service.${estimate} (Not added to disputable without records.)`
        if (!line.checks.includes('upcoding')) line.checks.push('upcoding')
      }
    }
  }

  return lines
}

function summarize(lines, pack, billFindings) {
  const totalCharged = money(lines.reduce((s, l) => s + l.chargedAmount, 0))
  const totalBenchmark = money(
    lines.reduce((s, l) => s + (l.benchmark != null ? l.benchmark : l.chargedAmount), 0)
  )
  const totalFair = money(lines.reduce((s, l) => s + (l.fair != null ? l.fair : l.chargedAmount), 0))
  const totalDisputable = money(
    lines.reduce((s, l) => s + (l.disputable || 0), 0) +
      billFindings.reduce((s, f) => s + (f.amount || 0), 0)
  )
  const totalPotential = money(lines.reduce((s, l) => s + (l.potential || 0), 0))

  const verifiedCount = lines.filter((l) => l.benchmark != null).length
  const unverifiedCount = lines.length - verifiedCount
  const verifiedCharged = money(
    lines.reduce((s, l) => s + (l.benchmark != null ? l.chargedAmount : 0), 0)
  )
  const coverage = totalCharged > 0 ? verifiedCharged / totalCharged : 0
  const hasStructuralSignal =
    lines.some((l) => l.grounding === 'structural') || billFindings.length > 0

  // status:
  //   'audited'    — enough of the bill was benchmarked to trust the result
  //   'partial'    — some codes benchmarked, but most value unbenchmarked
  //   'structural' — no benchmarks, but Layer 1 structural checks found something
  //   'unverified' — nothing could be checked (no codes, no structural signal)
  let status
  if (verifiedCount === 0) {
    status = hasStructuralSignal ? 'structural' : 'unverified'
  } else {
    status = coverage < 0.5 ? 'partial' : 'audited'
  }

  const healthScore =
    status === 'unverified'
      ? null
      : totalCharged > 0
      ? Math.max(0, Math.min(100, Math.round((1 - totalDisputable / totalCharged) * 100)))
      : 100

  const counts = {
    red: lines.filter((l) => l.flag === 'red').length,
    yellow: lines.filter((l) => l.flag === 'yellow').length,
    green: lines.filter((l) => l.flag === 'green').length,
  }

  return {
    totalCharged,
    totalBenchmark,
    totalFair,
    totalDisputable,
    totalPotential,
    verifiedCount,
    unverifiedCount,
    coverage,
    status,
    healthScore,
    counts,
  }
}

// options: { pack, bill } where bill = { subtotal, tax, grandTotal, admissionDate, dischargeDate }
export function auditBill(rawItems, options = {}) {
  const pack = options.pack || DEFAULT_PACK
  const bill = options.bill || {}

  const items = (Array.isArray(rawItems) ? rawItems : []).map(normalizeItem)
  let lines = items.map((it) => auditLine(it, pack))
  lines = applyCrossChecks(lines, pack)
  const billFindings = applyStructuralChecks(lines, bill)

  const summary = summarize(lines, pack, billFindings)

  // Worst offenders first (by severity, then dollars disputable).
  lines.sort((a, b) => b.severity - a.severity || (b.disputable || 0) - (a.disputable || 0))

  return {
    lineItems: lines,
    billFindings,
    country: pack.country,
    countryName: pack.countryName,
    currency: pack.currency,
    benchmarkLabel: pack.benchmarkLabel,
    codeLabel: pack.codeLabel,
    scheduleName: pack.scheduleName,
    source: pack.source,
    hasEstimates: false,
    ...summary,
  }
}

// Layer 3 — merge labeled AI market estimates into uncoded lines. Estimates NEVER
// touch the hard disputable total; they surface a separate "potential" figure and
// only flag a line when the charge is a gross directional outlier (≥3× typical).
// Returns a new report object (caller swaps it into state).
export function applyEstimates(report, estimates) {
  if (!report || !Array.isArray(estimates) || estimates.length === 0) return report
  const byId = new Map(estimates.map((e) => [e.id, e]))
  const currency = report.currency
  const m = (n) => formatMoney(n, currency, { decimals: 2 })

  const lines = report.lineItems.map((line) => {
    const est = byId.get(line.id)
    // Only annotate lines we couldn't otherwise verify or flag.
    if (!est || line.grounding === 'verified' || line.grounding === 'structural' || est.typical == null) {
      return line
    }
    const typical = money(est.typical)
    const ratio = typical > 0 ? Math.round((line.chargedAmount / typical) * 100) / 100 : null
    const next = {
      ...line,
      grounding: 'estimate',
      confidence: 'low',
      estTypical: typical,
      estLow: est.low != null ? money(est.low) : null,
      estHigh: est.high != null ? money(est.high) : null,
      estRatio: ratio,
    }
    const rangeStr =
      est.low != null && est.high != null ? `${m(est.low)}–${m(est.high)}` : `~${m(typical)}`
    if (ratio != null && ratio >= ESTIMATE_OUTLIER_RATIO) {
      next.flag = 'yellow'
      next.severity = Math.max(next.severity, 1)
      next.potential = money(Math.max(0, line.chargedAmount - typical))
      next.reason = `AI market estimate (low confidence): a typical local price for this is around ${rangeStr}. Charged ${m(
        line.chargedAmount
      )} — roughly ${ratio}× typical, a directional outlier worth questioning. Not an exact figure; excluded from the disputable total.`
      if (!next.checks.includes('estimate')) next.checks.push('estimate')
    } else {
      next.reason = `AI market estimate (low confidence): a typical local price for this is around ${rangeStr}. Charged ${m(
        line.chargedAmount
      )} — within a plausible range. Estimate only, not benchmarked.`
      if (!next.checks.includes('estimate')) next.checks.push('estimate')
    }
    return next
  })

  const totalPotential = money(lines.reduce((s, l) => s + (l.potential || 0), 0))
  const counts = {
    red: lines.filter((l) => l.flag === 'red').length,
    yellow: lines.filter((l) => l.flag === 'yellow').length,
    green: lines.filter((l) => l.flag === 'green').length,
  }
  lines.sort((a, b) => b.severity - a.severity || (b.disputable || 0) - (a.disputable || 0))

  return { ...report, lineItems: lines, totalPotential, counts, hasEstimates: true }
}
