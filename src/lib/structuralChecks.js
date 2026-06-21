// Layer 1 — Universal structural & arithmetic checks.
//
// These detect errors from the bill's OWN internal structure and math: a line whose
// unit price × quantity doesn't equal its total, line items that don't sum to the
// subtotal, a subtotal + tax that doesn't reach the grand total, and room/bed days
// billed beyond the actual length of stay. None of this needs a price benchmark, so
// it works in ANY country/currency — the real "works on any bill" unlock.
//
// Findings here are high-confidence and grounded in arithmetic, so grounding =
// 'structural' and they count fully toward the disputable total.

function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

// Tolerance for floating/rounding noise: the larger of a small flat amount or 1%.
function tol(expected) {
  return Math.max(0.5, Math.abs(expected) * 0.01)
}

// Best-effort date parse for ISO (2026-05-14) and common D/M/Y or M/D/Y forms.
function parseDate(s) {
  if (!s) return null
  const str = String(s).trim()
  let m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/) // ISO
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  m = str.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})/) // D/M/Y (assume day-first)
  if (m) {
    let [, a, b, y] = m
    if (y.length === 2) y = '20' + y
    const day = Number(a)
    const mon = Number(b)
    // If the first field can't be a day, treat as M/D/Y.
    if (day > 12 && mon <= 12) return new Date(Number(y), mon - 1, day)
    return new Date(Number(y), day - 1, mon) // day-first default
  }
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function daySpan(from, to) {
  const a = parseDate(from)
  const b = parseDate(to)
  if (!a || !b) return null
  const ms = b.getTime() - a.getTime()
  if (ms < 0) return null
  return Math.round(ms / 86400000) + 1 // inclusive of both days
}

const ROOM_RE = /\b(room|bed|ward|icu|nursing|accommodation|stay charges?|daily charges?)\b/i

function bump(line, flag, severity) {
  const rank = { green: 0, yellow: 1, red: 2 }
  if (rank[flag] > rank[line.flag]) line.flag = flag
  if (severity > line.severity) line.severity = severity
}

// Mutates `lines` (adds structural flags) and returns bill-level findings.
export function applyStructuralChecks(lines, bill = {}) {
  // ---- Per-line arithmetic: unitPrice × qty must equal the line total ----
  for (const line of lines) {
    if (line.unitPrice == null) continue
    const qty = line.qty || 1
    const expected = money(line.unitPrice * qty)
    const actual = money(line.chargedAmount)
    if (expected <= 0) continue
    const diff = money(actual - expected)
    if (diff > tol(expected)) {
      bump(line, 'red', 2)
      line.confidence = 'high'
      line.grounding = 'structural'
      line.disputable = money(Math.max(line.disputable || 0, diff))
      line.reason =
        `Math error — unit price ${line.unitPrice} × quantity ${qty} = ${expected}, ` +
        `but this line is billed at ${actual}. The extra ${diff} appears to be an arithmetic overcharge.`
      if (!line.checks.includes('matherror')) line.checks.push('matherror')
    }
  }

  // ---- Stay / quantity sanity: room days can't exceed the length of stay ----
  const stayDays = daySpan(bill.admissionDate, bill.dischargeDate)
  if (stayDays) {
    for (const line of lines) {
      const isRoom = line.category === 'room' || ROOM_RE.test(line.description || '')
      if (!isRoom) continue
      const qty = line.qty || 1
      if (qty > stayDays) {
        const perDay = line.unitPrice != null ? line.unitPrice : money(line.chargedAmount / qty)
        const excessDays = qty - stayDays
        const excess = money(perDay * excessDays)
        bump(line, 'red', 2)
        line.confidence = 'high'
        line.grounding = 'structural'
        line.disputable = money(Math.max(line.disputable || 0, excess))
        line.reason =
          `Stay mismatch — billed ${qty} days, but admission to discharge spans only ${stayDays} days. ` +
          `${excessDays} extra day(s) ≈ ${excess} is disputable.`
        if (!line.checks.includes('stay')) line.checks.push('stay')
      }
    }
  }

  // ---- Bill-level reconciliation ----
  const findings = []
  const lineSum = money(lines.reduce((s, l) => s + (l.chargedAmount || 0), 0))

  if (bill.subtotal != null && bill.subtotal > 0) {
    const diff = money(lineSum - bill.subtotal)
    if (Math.abs(diff) > tol(bill.subtotal)) {
      findings.push({
        type: 'subtotal',
        severity: 2,
        title: 'Line items don’t match the subtotal',
        detail:
          `The listed line items add up to ${lineSum}, but the stated subtotal is ${bill.subtotal} ` +
          `(a ${money(Math.abs(diff))} ${diff > 0 ? 'shortfall' : 'gap'}). Ask for a corrected itemization.`,
        amount: money(Math.abs(diff)),
      })
    }
  }

  if (bill.grandTotal != null && bill.grandTotal > 0) {
    const base = (bill.subtotal != null ? bill.subtotal : lineSum) + (bill.tax || 0)
    const diff = money(base - bill.grandTotal)
    if (Math.abs(diff) > tol(bill.grandTotal)) {
      findings.push({
        type: 'grandtotal',
        severity: 2,
        title: 'Subtotal + tax doesn’t equal the grand total',
        detail:
          `Subtotal ${bill.subtotal != null ? bill.subtotal : lineSum}${bill.tax ? ` + tax ${bill.tax}` : ''} ` +
          `= ${money(base)}, but the grand total billed is ${bill.grandTotal} ` +
          `(off by ${money(Math.abs(diff))}).`,
        amount: money(Math.abs(diff)),
      })
    }
  }

  return findings
}
