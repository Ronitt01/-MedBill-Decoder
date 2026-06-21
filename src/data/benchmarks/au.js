// 🇦🇺 Australia benchmark pack — Medicare Benefits Schedule (MBS) Schedule Fee.
//
// Fees are the official MBS *Schedule Fee* (the 100% benchmark, not the 75%/85%
// benefit), read from the official MBS item pages and reflecting the 1 July 2025
// schedule. The Schedule Fee is itself a government benchmark; private/gap fees
// (e.g. the AMA list) commonly run ~2–3× for consults and ~3–5× for procedures,
// which informs the fair-market multiples below.
//
// Source: Australian MBS (Medicare Benefits Schedule), Schedule Fee, 1 July 2025
//         — Dept. of Health / MBS Online (mbsonline.gov.au)
//
// Note: Australian biochemistry bills under the 66500-series "ladder" (66500 = 1
// test … 66512 = 5+ tests). A lipid panel, EUC, and LFT share item 66512 — there
// are no separate item numbers for them.

import { CURRENCIES } from '../../lib/format.js'

const RATES = {
  // --- Consultations / attendances ---
  '23': { description: 'GP attendance, Level B (6–<20 min)', benchmark: 43.9, category: 'em' },
  '36': { description: 'GP attendance, Level C (≥20 min)', benchmark: 84.9, category: 'em' },
  '44': { description: 'GP attendance, Level D (≥40 min)', benchmark: 125.1, category: 'em' },
  '104': { description: 'Specialist, initial attendance', benchmark: 101.3, category: 'em' },
  '105': { description: 'Specialist, subsequent attendance', benchmark: 50.95, category: 'em' },
  '5020': { description: 'GP after-hours attendance (6–<20 min)', benchmark: 57.15, category: 'em' },

  // --- Pathology ---
  '65070': { description: 'Full blood count (FBC/FBE)', benchmark: 17.35, category: 'lab' },
  '66512': { description: 'Chemistry panel, 5+ tests (EUC / lipids / LFT)', benchmark: 17.7, category: 'lab' },
  '66503': { description: 'Chemistry, 2 tests', benchmark: 11.65, category: 'lab' },
  '66551': { description: 'HbA1c (established diabetes)', benchmark: 16.8, category: 'lab' },
  '66716': { description: 'Thyroid stimulating hormone (TSH)', benchmark: 25.05, category: 'lab' },

  // --- Diagnostic imaging ---
  '58503': { description: 'Chest X-ray (lung fields)', benchmark: 54.1, category: 'imaging' },
  '56001': { description: 'CT brain, without contrast', benchmark: 219.5, category: 'imaging' },
  '56507': { description: 'CT upper abdomen & pelvis, with contrast', benchmark: 540.2, category: 'imaging' },
  '63001': { description: 'MRI head/brain', benchmark: 452.05, category: 'imaging' },
  '11707': { description: 'Electrocardiogram (ECG), trace only', benchmark: 28.25, category: 'cardiology' },

  // --- Procedures ---
  '32222': { description: 'Colonoscopy (diagnostic / symptomatic)', benchmark: 390.05, category: 'procedure' },
  '32223': { description: 'Colonoscopy (surveillance)', benchmark: 390.05, category: 'procedure' },
  '30026': { description: 'Repair of wound ≤7 cm, superficial', benchmark: 60.95, category: 'procedure' },
}

// No clean component→comprehensive bundling pairs in this representative set.
const BUNDLE_MAP = {}

// Fair-market multiple over the MBS Schedule Fee by category. AMA private fees run
// ~2–3× for consults and ~3–5× for proceduralists; we hold to a conservative ceiling.
const FAIR_MULTIPLE = {
  em: 2.5,
  imaging: 2.0,
  lab: 3.0,
  procedure: 3.0,
  cardiology: 2.0,
}

export const AU_PACK = {
  country: 'AU',
  countryName: 'Australia',
  flag: '🇦🇺',
  currency: CURRENCIES.AUD,
  benchmarkLabel: 'MBS',
  scheduleName: 'Australian MBS Schedule Fee',
  source: 'Australian MBS (Medicare Benefits Schedule), Schedule Fee, 1 July 2025',
  codeLabel: 'MBS item',
  emUpcoding: false,
  rates: RATES,
  bundleMap: BUNDLE_MAP,
  fairMultiple: FAIR_MULTIPLE,
  defaultFairMultiple: 2.5,
  lookupRate(code) {
    if (!code) return null
    return RATES[String(code).trim().toUpperCase()] || null
  },
}
