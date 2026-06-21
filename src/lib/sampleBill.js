// Realistic sample bills used for "View sample audit" and the live demo section.
// These raw items are exactly what the extractor returns for a real bill, so the
// same audit pipeline runs on them — nothing is faked downstream. Each sample is
// crafted to exercise the tiered audit:
//   US — Layer 2 overcharges + duplicate + unbundling (the demo hero)
//   AU — Layer 2 overcharges + duplicate + Layer 1 arithmetic (math) error
//   IN — Layer 1 stay-sanity + bill-level reconciliation + Layer 2 overcharges

export const SAMPLES = {
  US: {
    country: 'US',
    providerName: 'Riverside General Hospital',
    accountNumber: 'RGH-4471902',
    patientName: 'Jordan A. Patient',
    date: '2026-05-14',
    bill: {},
    rawItems: [
      { code: '70551', description: 'MRI brain without contrast', qty: 1, chargedAmount: 2100, date: '2026-05-14' },
      { code: '74176', description: 'CT abdomen & pelvis', qty: 1, chargedAmount: 1850, date: '2026-05-14' },
      { code: '85025', description: 'Complete blood count (CBC) w/ differential', qty: 1, chargedAmount: 95, date: '2026-05-14' },
      { code: '85025', description: 'Complete blood count (CBC) w/ differential', qty: 1, chargedAmount: 95, date: '2026-05-14' },
      { code: '80053', description: 'Comprehensive metabolic panel', qty: 1, chargedAmount: 120, date: '2026-05-14' },
      { code: '80048', description: 'Basic metabolic panel', qty: 1, chargedAmount: 85, date: '2026-05-14' },
      { code: '36415', description: 'Routine venipuncture (blood draw)', qty: 1, chargedAmount: 28, date: '2026-05-14' },
      { code: '99285', description: 'Emergency department visit, high severity', qty: 1, chargedAmount: 312, date: '2026-05-14' },
      { code: '93000', description: 'Electrocardiogram, complete', qty: 1, chargedAmount: 145, date: '2026-05-14' },
      { code: '71046', description: 'Chest X-ray, 2 views', qty: 1, chargedAmount: 38, date: '2026-05-14' },
    ],
  },

  AU: {
    country: 'AU',
    providerName: 'St. Vincent’s Private Hospital',
    accountNumber: 'SVP-2025-30817',
    patientName: 'Alex Q. Patient',
    date: '2026-04-09',
    bill: {},
    rawItems: [
      { code: '63001', description: 'MRI head/brain', qty: 1, chargedAmount: 2400, date: '2026-04-09' },
      { code: '56001', description: 'CT brain, without contrast', qty: 1, chargedAmount: 950, date: '2026-04-09' },
      { code: '65070', description: 'Full blood count (FBC)', qty: 1, chargedAmount: 120, date: '2026-04-09' },
      { code: '65070', description: 'Full blood count (FBC)', qty: 1, chargedAmount: 120, date: '2026-04-09' },
      { code: '66512', description: 'Chemistry panel (EUC/lipids/LFT)', qty: 1, chargedAmount: 38, date: '2026-04-09' },
      { code: '23', description: 'GP attendance, Level B', qty: 1, chargedAmount: 90, date: '2026-04-09' },
      { code: '11707', description: 'Electrocardiogram (ECG)', qty: 1, chargedAmount: 75, date: '2026-04-09' },
      { code: '', description: 'Pharmacy — IV antibiotics', qty: 2, unitPrice: 150, lineTotal: 450, chargedAmount: 450, date: '2026-04-09' },
      { code: '', description: 'Theatre consumables', qty: 1, chargedAmount: 820, date: '2026-04-09' },
    ],
  },

  IN: {
    country: 'IN',
    providerName: 'Apollo Multispecialty Hospital',
    accountNumber: 'AMH/IP/2026/55129',
    patientName: 'R. Kumar',
    date: '2026-05-13',
    bill: {
      admissionDate: '2026-05-10',
      dischargeDate: '2026-05-13', // 4-day stay
      grandTotal: 105700, // intentionally off vs. line sum + tax (bill-level check)
    },
    rawItems: [
      { code: 'ROOM-PV', description: 'Room rent — private ward', qty: 6, unitPrice: 12000, lineTotal: 72000, chargedAmount: 72000, date: '2026-05-10' },
      { code: '1680', description: 'MRI brain, plain', qty: 1, unitPrice: 18000, lineTotal: 18000, chargedAmount: 18000, date: '2026-05-11' },
      { code: '1', description: 'Specialist consultation', qty: 1, unitPrice: 1500, lineTotal: 1500, chargedAmount: 1500, date: '2026-05-10' },
      { code: 'LB012', description: 'Complete blood count (CBC)', qty: 1, unitPrice: 650, lineTotal: 650, chargedAmount: 650, date: '2026-05-11' },
      { code: 'LB012', description: 'Complete blood count (CBC)', qty: 1, unitPrice: 650, lineTotal: 650, chargedAmount: 650, date: '2026-05-11' },
      { code: 'LB125', description: 'Lipid profile', qty: 1, unitPrice: 1200, lineTotal: 1200, chargedAmount: 1200, date: '2026-05-11' },
      { code: '627', description: 'X-ray chest, PA view', qty: 1, unitPrice: 900, lineTotal: 900, chargedAmount: 900, date: '2026-05-11' },
      { code: '', description: 'Surgical gloves (consumable)', qty: 10, unitPrice: 50, lineTotal: 800, chargedAmount: 800, date: '2026-05-11' },
      { code: '', description: 'Miscellaneous hospital charges', qty: 1, lineTotal: 5000, chargedAmount: 5000, date: '2026-05-12' },
    ],
  },
}

export const SAMPLE_LIST = [SAMPLES.US, SAMPLES.AU, SAMPLES.IN]

// Backward-compatible default (the US hero bill).
export const SAMPLE_BILL = SAMPLES.US
