// Deterministic billing audit engine.
//
// This is the heart of the product and the reason it is NOT a ChatGPT wrapper:
// every flag and dollar figure below is produced by explicit, explainable logic
// comparing the bill against grounded reference data — not by a model guessing.
//
// PRICING MODEL (important):
// Medicare-allowed amounts are a FLOOR — almost nobody is billed at Medicare rates.
// Charging a multiple over Medicare is normal and legal. So we do NOT treat the gap
// above Medicare as "disputable". Instead we hold each charge to a defensible
// FAIR-MARKET CEILING = Medicare x a category multiple, derived from published price
// research (e.g. RAND Hospital Price Transparency studies: commercial prices average
// ~2.5x Medicare for hospital services; physician E/M services run lower; clinical
// labs are billed at very high multiples vs the rock-bottom Clinical Lab Fee Schedule).
//
// - Headline stat ("8x Medicare") is the striking, citable anchor.
// - Disputable DOLLARS are measured against the fair-market ceiling -> conservative,
//   so the total survives scrutiny.

import { lookupRate, BUNDLE_MAP, CMS_RATES, CMS_SOURCE } from '../data/cmsRates.js'

// Fair-market multiple over Medicare by service category (defensible upper bound of
// a reasonable price). Sources: RAND Corp hospital price studies; CMS Clinical Lab
// Fee Schedule comparisons. Conservative on purpose.
const FAIR_MULTIPLE = {
  imaging: 2.5,
  procedure: 2.5,
  cardiology: 2.0,
  em: 1.5,
  lab: 4.0, // Medicare lab rates are extremely low; fair cash prices commonly 3-5x
}
const DEFAULT_FAIR_MULTIPLE = 2.0

// A charge at/above 2x the (already generous) fair ceiling is a clear overcharge.
const RED_FAIR_RATIO = 2.0
const YELLOW_FAIR_RATIO = 1.25

function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

function fairMultipleFor(rate) {
  return FAIR_MULTIPLE[rate?.category] ?? DEFAULT_FAIR_MULTIPLE
}

function normalizeItem(raw, index) {
  return {
    id: `${raw.code || 'NA'}-${index}`,
    code: raw.code ? String(raw.code).trim().toUpperCase() : '',
    description: raw.description ? String(raw.description).trim() : '',
    qty: Number(raw.qty) > 0 ? Number(raw.qty) : 1,
    chargedAmount: money(raw.chargedAmount),
    date: raw.date ? String(raw.date).trim() : '',
  }
}

// Find the next-lower-tier code in the same E/M family (for upcoding analysis).
function lowerTierEm(rate) {
  if (!rate || rate.category !== 'em' || !rate.family || !rate.tier) return null
  let best = null
  for (const [code, r] of Object.entries(CMS_RATES)) {
    if (r.family === rate.family && r.tier === rate.tier - 1) {
      best = { code, ...r }
    }
  }
  return best
}

function auditLine(item) {
  const rate = lookupRate(item.code)
  const out = {
    ...item,
    medicareRate: null, // per-unit Medicare allowed
    medicare: null, // Medicare allowed x qty
    fairMultiple: null,
    fair: null, // fair-market ceiling x qty
    multiplier: null, // charged / medicare  (headline stat)
    fairRatio: null, // charged / fair
    overMedicare: null,
    flag: 'green',
    severity: 0, // 0 green, 1 yellow, 2 red
    disputable: 0,
    confidence: 'high',
    reason: '',
    source: null,
    checks: [],
  }

  if (!rate) {
    out.flag = 'yellow'
    out.severity = 1
    out.confidence = 'low'
    out.reason =
      'No Medicare benchmark on file for this code — price could not be verified. Manual review suggested. (Not counted toward disputable.)'
    out.checks.push('unverified')
    return out
  }

  const fairMultiple = fairMultipleFor(rate)
  const medicare = money(rate.benchmark * item.qty)
  const fair = money(medicare * fairMultiple)
  const multiplier = medicare > 0 ? Math.round((item.chargedAmount / medicare) * 100) / 100 : null
  const fairRatio = fair > 0 ? Math.round((item.chargedAmount / fair) * 100) / 100 : null

  out.medicareRate = rate.benchmark
  out.medicare = medicare
  out.fairMultiple = fairMultiple
  out.fair = fair
  out.multiplier = multiplier
  out.fairRatio = fairRatio
  out.overMedicare = money(item.chargedAmount - medicare)
  out.source = CMS_SOURCE

  if (fairRatio === null || fairRatio < YELLOW_FAIR_RATIO) {
    out.flag = 'green'
    out.severity = 0
    out.reason = `Charged $${item.chargedAmount.toFixed(2)} — at or below the fair-market estimate of $${fair.toFixed(
      2
    )} (~${fairMultiple}× the Medicare rate of $${medicare.toFixed(2)}). Reasonable.`
    return out
  }

  const overFair = money(item.chargedAmount - fair)
  if (fairRatio >= RED_FAIR_RATIO) {
    out.flag = 'red'
    out.severity = 2
    out.confidence = 'high'
    out.reason = `Charged $${item.chargedAmount.toFixed(2)} — ${multiplier}× the Medicare rate ($${medicare.toFixed(
      2
    )}) and ${fairRatio}× a fair-market estimate of $${fair.toFixed(
      2
    )} (~${fairMultiple}× Medicare). About $${overFair.toFixed(2)} above a reasonable price.`
  } else {
    out.flag = 'yellow'
    out.severity = 1
    out.confidence = 'medium'
    out.reason = `Charged $${item.chargedAmount.toFixed(2)} — ${fairRatio}× our fair-market estimate of $${fair.toFixed(
      2
    )} (~${fairMultiple}× Medicare). Above typical; worth questioning.`
  }
  out.disputable = overFair
  out.checks.push('overcharge')
  return out
}

function applyCrossChecks(lines) {
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
      // Keep the first; every additional identical line is a fully-disputable duplicate.
      group.slice(1).forEach((dup) => {
        dup.flag = 'red'
        dup.severity = 2
        dup.confidence = 'high'
        dup.disputable = dup.chargedAmount
        dup.reason = `Duplicate charge — code ${dup.code} is billed ${group.length}× on ${
          dup.date || 'the same date'
        }. The full $${dup.chargedAmount.toFixed(
          2
        )} of this repeat line is disputable.`
        if (!dup.checks.includes('duplicate')) dup.checks.push('duplicate')
      })
    }
  }

  // ---- Unbundling detection (component billed alongside its comprehensive code) ----
  const codeSet = new Set(lines.map((l) => l.code).filter(Boolean))
  for (const line of lines) {
    const parent = BUNDLE_MAP[line.code]
    if (parent && codeSet.has(parent)) {
      line.flag = 'red'
      line.severity = 2
      line.confidence = 'high'
      // When the comprehensive code is present, the component should not be billed at
      // all -> its entire charge is disputable.
      line.disputable = money(Math.max(line.disputable, line.chargedAmount))
      line.reason = `Unbundling — code ${line.code} is a component of ${parent}, which is also billed on this date. It should be included in ${parent}, so the full $${line.chargedAmount.toFixed(
        2
      )} is disputable.`
      if (!line.checks.includes('unbundling')) line.checks.push('unbundling')
    }
  }

  // ---- Upcoding signal on highest-tier E/M codes ----
  // Flagged for review (a documentation question, not a hard overcharge), with an
  // estimated downcoding exposure so the user knows what is at stake.
  for (const line of lines) {
    const rate = lookupRate(line.code)
    if (rate && rate.category === 'em' && rate.tier === 4 && line.severity === 0) {
      const lower = lowerTierEm(rate)
      let estimate = ''
      if (lower) {
        const lowerFair = money(lower.benchmark * line.qty * fairMultipleFor(lower))
        const exposure = money(Math.max(0, line.chargedAmount - lowerFair))
        if (exposure > 0) {
          estimate = ` If the visit only supported the next level down (${lower.code}), roughly $${exposure.toFixed(
            2
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

  return lines
}

export function auditBill(rawItems) {
  const items = (Array.isArray(rawItems) ? rawItems : []).map(normalizeItem)
  let lines = items.map(auditLine)
  lines = applyCrossChecks(lines)

  const totalCharged = money(lines.reduce((s, l) => s + l.chargedAmount, 0))
  // For unknown codes we fall back to the charged amount so we neither inflate
  // disputable nor understate the fair baseline.
  const totalMedicare = money(
    lines.reduce((s, l) => s + (l.medicare != null ? l.medicare : l.chargedAmount), 0)
  )
  const totalFair = money(
    lines.reduce((s, l) => s + (l.fair != null ? l.fair : l.chargedAmount), 0)
  )
  const totalDisputable = money(lines.reduce((s, l) => s + (l.disputable || 0), 0))

  // Bill health: share of the bill that is NOT flagged as excess. 100 = clean.
  const healthScore =
    totalCharged > 0
      ? Math.max(0, Math.min(100, Math.round((1 - totalDisputable / totalCharged) * 100)))
      : 100

  const counts = {
    red: lines.filter((l) => l.flag === 'red').length,
    yellow: lines.filter((l) => l.flag === 'yellow').length,
    green: lines.filter((l) => l.flag === 'green').length,
  }

  // Worst offenders first (by severity, then dollars disputable).
  lines.sort((a, b) => b.severity - a.severity || (b.disputable || 0) - (a.disputable || 0))

  return {
    lineItems: lines,
    totalCharged,
    totalMedicare,
    totalFair,
    totalDisputable,
    healthScore,
    counts,
    source: CMS_SOURCE,
  }
}
