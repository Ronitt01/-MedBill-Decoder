// Vercel serverless function: extract line items from a medical bill image/PDF.
//
// This is the ONLY place the Gemini key is used, and it is read exclusively from
// a server-side environment variable. Gemini does one job here: read a messy bill
// into structured line items. All pricing/audit logic lives client-side and is
// deterministic — Gemini never decides whether something is an overcharge.

import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const MAX_BASE64 = 6 * 1024 * 1024 // ~6MB of base64 payload guard

const EXTRACTION_PROMPT = `You are a medical-billing OCR extractor. Read the attached medical bill
(image or PDF) and return ONLY the structured data as strict JSON.

Return a JSON object of the shape:
{
  "providerName": string | null,
  "accountNumber": string | null,
  "date": string | null,
  "currencyHint": string | null,
  "admissionDate": string | null,
  "dischargeDate": string | null,
  "subtotal": number | null,
  "tax": number | null,
  "grandTotal": number | null,
  "rawItems": [
    { "code": string, "description": string, "qty": number, "unitPrice": number | null, "lineTotal": number | null, "chargedAmount": number, "date": string | null }
  ]
}

Rules:
- "code" is the billing code shown on the line (CPT/HCPCS in the US, MBS item number in Australia, CGHS code in India, etc.). If a line has no visible code, use "".
- "unitPrice" is the per-unit price for the line if shown; otherwise null.
- "lineTotal" / "chargedAmount" is the total amount billed for that line as a number (no currency symbol or commas). If only one total is shown, set both to the same value.
- "qty" defaults to 1 if not shown. For room/bed charges, qty is the number of days.
- "subtotal", "tax", "grandTotal" are the bill-level totals if printed; otherwise null.
- "admissionDate" / "dischargeDate" only for inpatient stays, otherwise null.
- "currencyHint" is the ISO currency code if you can tell (e.g. "USD", "AUD", "INR"), else null.
- Include EVERY billable line item you can see. Do not invent codes, amounts, or totals — use null when not present.
- Output JSON only. No markdown fences, no commentary.`

function extractJson(text) {
  if (!text) return null
  let t = text.trim()
  // Strip markdown code fences if present.
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  // Grab the first {...} block.
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
    res.status(500).json({
      error:
        'Server is missing GEMINI_API_KEY. Add it in Vercel → Project Settings → Environment Variables.',
    })
    return
  }

  try {
    const { imageBase64, mimeType } = req.body || {}
    if (!imageBase64 || !mimeType) {
      res.status(400).json({ error: 'Missing imageBase64 or mimeType.' })
      return
    }
    if (imageBase64.length > MAX_BASE64) {
      res.status(413).json({ error: 'File too large. Please upload a bill under ~4MB.' })
      return
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    })

    const result = await model.generateContent([
      { text: EXTRACTION_PROMPT },
      { inlineData: { mimeType, data: imageBase64 } },
    ])

    const text = result.response.text()
    const parsed = extractJson(text)

    if (!parsed || !Array.isArray(parsed.rawItems)) {
      res.status(422).json({
        error: 'Could not read line items from this document. Try a clearer photo or PDF.',
      })
      return
    }

    // Light server-side sanitation.
    const num = (v) => {
      if (v == null) return null
      const n = Number(String(v).replace(/[^0-9.\-]/g, ''))
      return Number.isFinite(n) ? n : null
    }
    const rawItems = parsed.rawItems
      .filter((it) => it && (it.code || it.description))
      .slice(0, 60)
      .map((it) => ({
        code: String(it.code || '').slice(0, 10),
        description: String(it.description || '').slice(0, 160),
        qty: Number(it.qty) > 0 ? Number(it.qty) : 1,
        unitPrice: num(it.unitPrice),
        lineTotal: num(it.lineTotal),
        chargedAmount: num(it.chargedAmount) ?? num(it.lineTotal) ?? 0,
        date: it.date ? String(it.date).slice(0, 40) : parsed.date || '',
      }))

    res.status(200).json({
      providerName: parsed.providerName || null,
      accountNumber: parsed.accountNumber || null,
      date: parsed.date || null,
      currencyHint: parsed.currencyHint || null,
      bill: {
        admissionDate: parsed.admissionDate || null,
        dischargeDate: parsed.dischargeDate || null,
        subtotal: num(parsed.subtotal),
        tax: num(parsed.tax),
        grandTotal: num(parsed.grandTotal),
      },
      rawItems,
    })
  } catch (err) {
    console.error('analyze error', err)
    const msg = String(err?.message || '')
    // Surface the common, actionable failures with a friendly message.
    let friendly = 'Extraction failed. Please try again in a moment.'
    if (/quota|rate limit|429/i.test(msg)) {
      friendly = 'The free AI quota is busy right now. Please wait a minute and try again.'
    } else if (/API key not valid|API_KEY_INVALID/i.test(msg)) {
      friendly = 'The server API key is invalid. Please check the GEMINI_API_KEY configuration.'
    }
    res.status(500).json({ error: friendly })
  }
}
