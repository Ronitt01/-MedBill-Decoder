// A realistic sample bill used for "View Sample Audit" and the live demo section.
// These raw items are exactly what the Gemini extractor returns for a real bill,
// so the same audit pipeline runs on them — nothing is faked downstream.

export const SAMPLE_BILL = {
  providerName: 'Riverside General Hospital',
  accountNumber: 'RGH-4471902',
  patientName: 'Jordan A. Patient',
  date: '2026-05-14',
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
}
