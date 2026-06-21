// 🇮🇳 India benchmark pack — CGHS (Central Government Health Scheme) rates.
//
// NABH/NABL-accredited rates from the CGHS 2023 revision (consultation/room rent
// OM 12.04.2023; radiology OM 19.06.2023; procedure packages from the Delhi/NCR
// list). A few package NABH values are computed from the verified non-NABH base via
// CGHS's own published rule (NABH = non-NABH + 15%) where the source PDF column was
// corrupted on extraction.
//
// CGHS is an administered government tariff and runs well below market. Private /
// corporate hospitals commonly charge ~2–4× for tests, ~3–6× for room/ICU, and
// ~2–5× for surgery, which informs the fair-market multiples below.
//
// Source: India CGHS (Central Government Health Scheme) rate list, NABH-accredited
//         rates, 2023 revision (Ministry of Health & Family Welfare, Govt. of India)
//
// Room codes (ROOM-*, ICU) are synthetic identifiers for benchmarking — real bills
// list room charges by description, which the structural stay-sanity check handles.

import { CURRENCIES } from '../../lib/format.js'

const RATES = {
  // --- Consultation & room/day ---
  '1': { description: 'Specialist consultation (OPD)', benchmark: 350, category: 'em' },
  '2': { description: 'Consultation (inpatient)', benchmark: 350, category: 'em' },
  'ROOM-GW': { description: 'Room rent — general ward / day', benchmark: 1500, category: 'room' },
  'ROOM-SP': { description: 'Room rent — semi-private / day', benchmark: 3000, category: 'room' },
  'ROOM-PV': { description: 'Room rent — private ward / day', benchmark: 4500, category: 'room' },
  ICU: { description: 'ICU charges / day (incl. room)', benchmark: 5400, category: 'room' },

  // --- Pathology / Lab ---
  LB012: { description: 'Complete blood count (CBC) / haemogram', benchmark: 300, category: 'lab' },
  LB125: { description: 'Lipid profile', benchmark: 490, category: 'lab' },
  LB055: { description: 'Blood glucose, fasting', benchmark: 40, category: 'lab' },
  LB124: { description: 'Liver function test (LFT)', benchmark: 500, category: 'lab' },
  LB123: { description: 'Kidney / renal function test (KFT)', benchmark: 500, category: 'lab' },
  LB122: { description: 'HbA1c (glycosylated haemoglobin)', benchmark: 300, category: 'lab' },
  LB161: { description: 'Thyroid stimulating hormone (TSH)', benchmark: 200, category: 'lab' },
  LB001: { description: 'Urine routine (R/E)', benchmark: 100, category: 'lab' },

  // --- Imaging ---
  '590': { description: 'Electrocardiogram (ECG)', benchmark: 175, category: 'cardiology' },
  '627': { description: 'X-ray chest, PA view', benchmark: 230, category: 'imaging' },
  '1591': { description: 'Ultrasound whole abdomen / KUB', benchmark: 800, category: 'imaging' },
  '1675': { description: 'CT head / brain, plain (NCCT)', benchmark: 1035, category: 'imaging' },
  '1643': { description: 'CT whole abdomen, with contrast', benchmark: 5175, category: 'imaging' },
  '1680': { description: 'MRI brain, plain (without contrast)', benchmark: 2500, category: 'imaging' },

  // --- Procedure packages ---
  '838': { description: 'Haemodialysis / session', benchmark: 1610, category: 'procedure' },
  '611': { description: 'Normal delivery (±episiotomy)', benchmark: 9200, category: 'procedure' },
  '449': { description: 'Appendicectomy (package)', benchmark: 18573, category: 'procedure' },
}

const BUNDLE_MAP = {}

// Fair-market multiple over CGHS by category. CGHS is well below market; private
// hospitals routinely run several times higher, so ceilings are wider than the US.
const FAIR_MULTIPLE = {
  em: 3.0,
  lab: 3.0,
  imaging: 3.0,
  cardiology: 3.0,
  procedure: 4.0,
  room: 4.0,
}

export const IN_PACK = {
  country: 'IN',
  countryName: 'India',
  flag: '🇮🇳',
  currency: CURRENCIES.INR,
  benchmarkLabel: 'CGHS',
  scheduleName: 'CGHS reference rates',
  source: 'India CGHS (Central Government Health Scheme) rate list, NABH rates, 2023 revision',
  codeLabel: 'CGHS code',
  emUpcoding: false,
  rates: RATES,
  bundleMap: BUNDLE_MAP,
  fairMultiple: FAIR_MULTIPLE,
  defaultFairMultiple: 3.0,
  lookupRate(code) {
    if (!code) return null
    return RATES[String(code).trim().toUpperCase()] || null
  },
}
