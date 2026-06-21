// Vercel serverless function: Layer 3 — labeled AI market estimate.
//
// For uncoded line items in a country with no usable fee schedule, this returns a
// TYPICAL LOCAL PRICE RANGE per item. This is the ONLY place AI estimates a price,
// and it is heavily guarded: low confidence, range-only, and the client never folds
// it into the hard "disputable" total — it is shown as a separate "potential" signal.
// Pricing/audit logic everywhere else stays deterministic.

import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

function buildPrompt(countryName, currencyCode, items) {
  const list = items
    .map((it) => `- id="${it.id}" | "${it.description}"${it.qty > 1 ? ` x${it.qty}` : ''}`)
    .join('\n')
  return `You are a healthcare pricing analyst. For each medical bill line below, give a
TYPICAL local cash price RANGE in ${countryName} (${currencyCode}). These are rough
market estimates, not exact figures.

Items:
${list}

Return ONLY strict JSON:
{ "estimates": [ { "id": string, "low": number, "high": number, "typical": number } ] }

Rules:
- Amounts are numbers in ${currencyCode}, no symbols or commas.
- "typical" is your best central estimate; "low"/"high" bound a plausible range.
- Estimate the total for the line (account for quantity if given).
- If you genuinely cannot estimate an item, omit it from the array.
- Output JSON only. No markdown, no commentary.`
}

function extractJson(text) {
  if (!text) return null
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    return JSON.parse(t.slice(start, end + 1))
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: 'Server is missing GEMINI_API_KEY.' })
    return
  }

  try {
    const { items, countryName, currencyCode } = req.body || {}
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'No items to estimate.' })
      return
    }
    const safeItems = items
      .filter((it) => it && it.id && it.description)
      .slice(0, 40)
      .map((it) => ({
        id: String(it.id).slice(0, 40),
        description: String(it.description).slice(0, 160),
        qty: Number(it.qty) > 0 ? Number(it.qty) : 1,
      }))
    if (safeItems.length === 0) {
      res.status(200).json({ estimates: [] })
      return
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    })

    const result = await model.generateContent([
      { text: buildPrompt(countryName || 'the local market', currencyCode || 'local currency', safeItems) },
    ])
    const parsed = extractJson(result.response.text())
    const num = (v) => {
      const n = Number(v)
      return Number.isFinite(n) && n >= 0 ? n : null
    }
    const estimates = Array.isArray(parsed?.estimates)
      ? parsed.estimates
          .map((e) => ({
            id: String(e.id || '').slice(0, 40),
            low: num(e.low),
            high: num(e.high),
            typical: num(e.typical),
          }))
          .filter((e) => e.id && e.typical != null)
      : []

    res.status(200).json({ estimates })
  } catch (err) {
    console.error('estimate error', err)
    // Layer 3 is best-effort; a failure should never break the audit.
    res.status(200).json({ estimates: [] })
  }
}
