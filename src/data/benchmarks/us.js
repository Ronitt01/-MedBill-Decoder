// 🇺🇸 United States benchmark pack — CMS Medicare fee schedule.
//
// Illustrative national averages of the Medicare-allowed amount for each CPT/HCPCS
// code, derived from the public CMS Physician Fee Schedule / Clinical Lab Fee
// Schedule. Deliberately conservative so flags stay defensible. This is the demo
// hero pack and the most complete one.
//
// Source: https://www.cms.gov/medicare/payment/fee-schedules

import { CURRENCIES } from '../../lib/format.js'

const RATES = {
  // --- Evaluation & Management (office / ER visits) ---
  '99203': { description: 'Office visit, new patient, low–moderate', benchmark: 113.75, category: 'em', tier: 2, family: 'em-new' },
  '99204': { description: 'Office visit, new patient, moderate', benchmark: 169.93, category: 'em', tier: 3, family: 'em-new' },
  '99205': { description: 'Office visit, new patient, high complexity', benchmark: 224.36, category: 'em', tier: 4, family: 'em-new' },
  '99212': { description: 'Office visit, established patient, low', benchmark: 57.34, category: 'em', tier: 1, family: 'em-est' },
  '99213': { description: 'Office visit, established patient, low–moderate', benchmark: 91.84, category: 'em', tier: 2, family: 'em-est' },
  '99214': { description: 'Office visit, established patient, moderate', benchmark: 130.55, category: 'em', tier: 3, family: 'em-est' },
  '99215': { description: 'Office visit, established patient, high complexity', benchmark: 184.49, category: 'em', tier: 4, family: 'em-est' },
  '99283': { description: 'Emergency dept visit, moderate severity', benchmark: 92.0, category: 'em', tier: 2, family: 'em-er' },
  '99284': { description: 'Emergency dept visit, high severity', benchmark: 174.0, category: 'em', tier: 3, family: 'em-er' },
  '99285': { description: 'Emergency dept visit, high severity / urgent', benchmark: 256.0, category: 'em', tier: 4, family: 'em-er' },

  // --- Laboratory ---
  '36415': { description: 'Routine venipuncture (blood draw)', benchmark: 3.0, category: 'lab' },
  '80048': { description: 'Basic metabolic panel (BMP)', benchmark: 8.46, category: 'lab' },
  '80053': { description: 'Comprehensive metabolic panel (CMP)', benchmark: 10.58, category: 'lab' },
  '80061': { description: 'Lipid panel', benchmark: 13.39, category: 'lab' },
  '81001': { description: 'Urinalysis, automated with microscopy', benchmark: 4.43, category: 'lab' },
  '83036': { description: 'Hemoglobin A1c', benchmark: 9.66, category: 'lab' },
  '84443': { description: 'Thyroid stimulating hormone (TSH)', benchmark: 16.79, category: 'lab' },
  '85025': { description: 'Complete blood count (CBC) w/ differential', benchmark: 8.93, category: 'lab' },

  // --- Imaging ---
  '71046': { description: 'Chest X-ray, 2 views', benchmark: 29.85, category: 'imaging' },
  '73610': { description: 'X-ray, ankle, 3+ views', benchmark: 27.4, category: 'imaging' },
  '70450': { description: 'CT head/brain, without contrast', benchmark: 130.6, category: 'imaging' },
  '74176': { description: 'CT abdomen & pelvis, without contrast', benchmark: 240.5, category: 'imaging' },
  '70551': { description: 'MRI brain, without contrast', benchmark: 248.97, category: 'imaging' },
  '72148': { description: 'MRI lumbar spine, without contrast', benchmark: 241.36, category: 'imaging' },
  '73721': { description: 'MRI lower extremity joint, without contrast', benchmark: 238.4, category: 'imaging' },
  '93000': { description: 'Electrocardiogram (ECG), complete', benchmark: 16.74, category: 'cardiology' },

  // --- Procedures ---
  '12001': { description: 'Simple repair of superficial wound, ≤2.5 cm', benchmark: 118.6, category: 'procedure' },
  '45378': { description: 'Diagnostic colonoscopy', benchmark: 371.13, category: 'procedure' },
  '29881': { description: 'Knee arthroscopy with meniscectomy', benchmark: 689.5, category: 'procedure' },
}

// Unbundling map: subset code -> the comprehensive code it should be billed under.
const BUNDLE_MAP = {
  '80048': '80053', // BMP is a subset of the comprehensive metabolic panel
}

// Fair-market multiple over Medicare by service category (defensible upper bound).
// Sources: RAND Corp hospital price studies; CMS Clinical Lab Fee Schedule.
const FAIR_MULTIPLE = {
  imaging: 2.5,
  procedure: 2.5,
  cardiology: 2.0,
  em: 1.5,
  lab: 4.0, // Medicare lab rates are extremely low; fair cash prices commonly 3–5×
}

export const US_PACK = {
  country: 'US',
  countryName: 'United States',
  flag: '🇺🇸',
  currency: CURRENCIES.USD,
  benchmarkLabel: 'Medicare',
  scheduleName: 'CMS Medicare fee schedule',
  source: 'CMS Medicare Physician & Clinical Lab Fee Schedule (national average)',
  codeLabel: 'CPT/HCPCS',
  emUpcoding: true, // E/M tier upcoding analysis is US-specific
  rates: RATES,
  bundleMap: BUNDLE_MAP,
  fairMultiple: FAIR_MULTIPLE,
  defaultFairMultiple: 2.0,
  lookupRate(code) {
    if (!code) return null
    return RATES[String(code).trim().toUpperCase()] || null
  },
}
