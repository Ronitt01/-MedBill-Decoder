// Deterministic appeal-letter generator.
//
// Produces a professional, ready-to-send dispute letter that cites the SPECIFIC
// flagged codes, the charged amount, the Medicare benchmark, and the total
// disputed amount. Generated locally from the audit report (no API call) so it
// always works in a demo and never invents figures.

function fmt(n) {
  return `$${(Number(n) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function buildAppealLetter(report, meta = {}) {
  const {
    patientName = '[Your Name]',
    accountNumber = '[Account / Statement Number]',
    providerName = '[Provider / Hospital Name]',
    dateLabel = '[Date]',
  } = meta

  const flagged = report.lineItems.filter((l) => l.flag === 'red' || (l.disputable || 0) > 0)

  const lines = flagged.map((l, i) => {
    const parts = [`${i + 1}. CPT/HCPCS ${l.code || 'N/A'} — ${l.description || 'service'}`]
    parts.push(`   Charged: ${fmt(l.chargedAmount)}`)
    if (l.medicare != null) {
      parts.push(
        `   Medicare allowed: ${fmt(l.medicare)}${l.multiplier ? `  (charged ${l.multiplier}× the Medicare rate)` : ''}`
      )
    }
    if (l.fair != null) {
      parts.push(`   Fair-market estimate: ${fmt(l.fair)}  (≈${l.fairMultiple}× Medicare)`)
    }
    if (l.disputable > 0) {
      parts.push(`   Amount disputed on this line: ${fmt(l.disputable)}`)
    }
    if (l.checks && l.checks.length) {
      const labels = {
        overcharge: 'overcharge vs. benchmark',
        duplicate: 'duplicate charge',
        unbundling: 'unbundling',
        upcoding: 'possible upcoding',
        unverified: 'unverified code',
      }
      parts.push(`   Issue: ${l.checks.map((c) => labels[c] || c).join(', ')}`)
    }
    return parts.join('\n')
  })

  const body = `${dateLabel}

${providerName}
Attn: Billing / Patient Accounts Department

Re: Request for itemized review and correction of billing errors
Account / Statement Number: ${accountNumber}
Patient: ${patientName}

To Whom It May Concern:

I am writing to formally dispute charges on the above account. After reviewing the
itemized statement and comparing the charges to the published Centers for Medicare &
Medicaid Services (CMS) fee schedule, I have identified the following items that appear
to be billed in error or substantially above a reasonable, benchmarked rate:

${lines.join('\n\n')}

Based on the above, I am disputing a total of ${fmt(report.totalDisputable)} of the
${fmt(report.totalCharged)} billed. I respectfully request that you:

  1. Provide a fully itemized bill, including all CPT/HCPCS codes and unit charges.
  2. Review and correct the duplicate, unbundled, and/or excessive charges identified above.
  3. Re-bill the corrected amount, and confirm in writing the adjustments made.

Where applicable, I also request confirmation that the charges comply with the federal
No Surprises Act and any applicable state balance-billing protections.

Please treat this as a formal request and place any collection activity on hold pending
your review. I can be reached at the contact information below. I look forward to your
written response within 30 days.

Sincerely,

${patientName}
[Phone]  •  [Email]  •  [Mailing Address]

---
This letter was prepared with MedBill Decoder. Benchmark figures are derived from the
${report.source}. Figures are provided for dispute purposes and are not legal advice.`

  return body
}
