import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Odometer from './Odometer.jsx'
import AmbientGrid from './AmbientGrid.jsx'
import AuditTable from './AuditTable.jsx'
import AppealLetter from './AppealLetter.jsx'
import BeforeAfterCard from './BeforeAfterCard.jsx'
import { formatMoney } from '../lib/format.js'

function Stat({ label, value, tone = 'white' }) {
  const tones = {
    white: 'text-white',
    red: 'text-flag-red',
    green: 'text-flag-green',
    yellow: 'text-flag-yellow',
  }
  return (
    <div className="glass rounded-xl px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`font-mono text-lg font-bold ${tones[tone]}`}>{value}</p>
    </div>
  )
}

// Legend explaining the three grounding levels — the heart of the "how much to trust" story.
function GroundingLegend() {
  const items = [
    { label: 'Verified', cls: 'text-flag-green', desc: 'official fee schedule' },
    { label: 'Structural', cls: 'text-accent', desc: 'math / bill structure' },
    { label: 'AI estimate', cls: 'text-flag-yellow', desc: 'low confidence' },
  ]
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs font-semibold text-slate-300">How much to trust each flag</p>
      <div className="mt-3 space-y-2">
        {items.map((it) => (
          <div key={it.label} className="flex items-baseline gap-2 text-xs">
            <span className={`font-semibold ${it.cls}`}>{it.label}</span>
            <span className="text-slate-500">— {it.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard({ report, meta, onReset }) {
  const [showLetter, setShowLetter] = useState(false)

  if (!report) return null

  const unverified = report.status === 'unverified'
  const currency = report.currency
  const m = (n) => formatMoney(n, currency, { decimals: 0 })

  return (
    <div className="relative min-h-screen pb-20">
      <AmbientGrid variant="dashboard" glow />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
        <div className="section flex items-center justify-between py-4">
          <button onClick={onReset} className="group flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg glass transition group-hover:bg-white/10">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            New audit
          </button>
          <div className="flex items-center gap-3">
            <span
              className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 sm:inline-flex"
              title={`Benchmarked against ${report.scheduleName}`}
            >
              <span className="text-slate-400">{report.countryName}</span>
              <span className="text-slate-600">·</span>
              <span className="font-medium text-white">{report.benchmarkLabel}</span>
            </span>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M5 4h9l5 5v11H5z" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">Audit Report</span>
            </div>
          </div>
        </div>
      </header>

      <main className="section relative pt-10">
        {/* Money counter hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="card relative overflow-hidden p-8 sm:p-10"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-flag-red/10 blur-[110px]" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-slate-400">
                {meta?.providerName} · Account {meta?.accountNumber}
              </p>

              {unverified ? (
                <>
                  <p className="mt-3 text-sm uppercase tracking-widest text-flag-yellow">
                    Bill could not be verified
                  </p>
                  <p className="mt-1 font-mono text-4xl font-extrabold text-white sm:text-6xl">
                    No billing codes
                  </p>
                  <p className="mt-3 max-w-md text-sm text-slate-400">
                    This statement lists only summary categories — no {report.codeLabel} codes — so its
                    charges can’t be benchmarked against the{' '}
                    <span className="text-slate-300">{report.source}</span>, and nothing in its math or
                    structure was off. Summary bills like this should be fully itemized before you pay.
                  </p>

                  <div className="mt-6 max-w-sm">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">Verification coverage</span>
                      <span className="font-mono font-semibold text-flag-yellow">
                        {Math.round(report.coverage * 100)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(2, Math.round(report.coverage * 100))}%` }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                        className="h-full rounded-full bg-flag-yellow"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {report.unverifiedCount} of {report.lineItems.length} line items had no billing code.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm uppercase tracking-widest text-slate-500">
                    Potential billing errors found
                  </p>
                  <p className="mt-1 font-mono text-5xl font-extrabold text-flag-red sm:text-7xl">
                    <Odometer
                      value={report.totalDisputable}
                      prefix={currency.symbol}
                      decimals={0}
                      duration={820}
                      glow="rgba(255,92,114,0.45)"
                    />
                  </p>
                  <p className="mt-3 max-w-md text-sm text-slate-400">
                    {report.verifiedCount > 0 ? (
                      <>
                        Across {report.lineItems.length} line items, compared against the{' '}
                        <span className="text-slate-300">{report.source}</span>.
                      </>
                    ) : (
                      <>
                        Across {report.lineItems.length} line items, using universal structural &amp;
                        arithmetic checks (no <span className="text-slate-300">{report.benchmarkLabel}</span>{' '}
                        code matched).
                      </>
                    )}
                    {report.verifiedCount > 0 && report.unverifiedCount > 0 && (
                      <span className="text-slate-500">
                        {' '}({report.unverifiedCount} had no code and weren’t benchmarked.)
                      </span>
                    )}
                  </p>
                  {report.hasEstimates && report.totalPotential > 0 && (
                    <p className="mt-2 max-w-md text-xs text-flag-yellow/90">
                      + {m(report.totalPotential)} in potential outliers from AI market estimates
                      (low confidence — shown separately, not included above).
                    </p>
                  )}

                  {report.healthScore != null && (
                    <div className="mt-6 max-w-sm">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-300">Bill health score</span>
                        <span
                          className={`font-mono font-semibold ${
                            report.healthScore >= 70
                              ? 'text-flag-green'
                              : report.healthScore >= 40
                              ? 'text-flag-yellow'
                              : 'text-flag-red'
                          }`}
                        >
                          {report.healthScore}/100
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${report.healthScore}%` }}
                          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                          className={`h-full rounded-full ${
                            report.healthScore >= 70
                              ? 'bg-flag-green'
                              : report.healthScore >= 40
                              ? 'bg-flag-yellow'
                              : 'bg-flag-red'
                          }`}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Share of the bill priced within a fair-market range.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              <Stat label="Total billed" value={m(report.totalCharged)} />
              {unverified ? (
                <>
                  <Stat label="Line items" value={report.lineItems.length} />
                  <Stat label="Without code" value={report.unverifiedCount} tone="yellow" />
                  <Stat label="Verified" value={`${Math.round(report.coverage * 100)}%`} />
                </>
              ) : (
                <>
                  <Stat label="Fair-market est." value={m(report.totalFair)} tone="green" />
                  <Stat label="Red flags" value={report.counts.red} tone="red" />
                  <Stat label="Review" value={report.counts.yellow} tone="yellow" />
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bill-level structural findings (Layer 1: totals that don't reconcile) */}
        {report.billFindings?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6 rounded-2xl border border-flag-red/25 bg-flag-red/[0.06] p-5"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-flag-red/15 text-flag-red">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="text-sm font-semibold text-white">Bill-level math doesn’t add up</p>
              <span className="rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                Structural
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {report.billFindings.map((f, i) => (
                <li key={i} className="text-sm text-slate-300">
                  <span className="font-medium text-white">{f.title}.</span>{' '}
                  <span className="text-slate-400">{f.detail}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Workspace */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Itemized audit</h2>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-flag-red" /> Overcharge</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-flag-yellow" /> Review</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-flag-green" /> Fair</span>
              </div>
            </div>
            <AuditTable report={report} />
            <p className="mt-3 text-xs text-slate-500">
              Tap any row to see the benchmark comparison and the reason it was flagged.
            </p>
          </motion.div>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-5 lg:sticky lg:top-24 lg:self-start"
          >
            <div className="card p-6">
              <h3 className="text-base font-semibold text-white">Take action</h3>
              <p className="mt-1 text-sm text-slate-400">
                {unverified
                  ? `No codes to verify on this bill. Generate a letter demanding a fully itemized bill with ${report.codeLabel} codes — then re-run the audit.`
                  : 'Generate a formal appeal letter citing every flagged charge and the total disputed.'}
              </p>
              <button onClick={() => setShowLetter(true)} className="btn-primary mt-4 w-full">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M5 4h9l5 5v11H5z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M8 13h7M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                {unverified ? 'Request itemized bill' : 'Generate appeal letter'}
              </button>
            </div>

            {unverified ? (
              <div className="card p-6">
                <h3 className="text-base font-semibold text-white">Why itemize?</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  You have the right to a fully itemized bill on request. Summary categories like
                  “Pharmacy” or “Room rent” hide duplicate, unbundled, and inflated charges — getting
                  the line-item detail (with codes) is the first step to disputing them. Once you have
                  it, upload it here and we’ll benchmark every line.
                </p>
              </div>
            ) : (
              <BeforeAfterCard report={report} />
            )}

            <GroundingLegend />

            <div className="glass rounded-2xl p-5">
              <p className="text-xs leading-relaxed text-slate-400">
                <span className="font-semibold text-slate-300">How to read this:</span> benchmarks are
                the {report.benchmarkLabel} reference rate for each code. Charges well above the
                benchmark, duplicates, unbundled services, math errors, and stay mismatches are
                flagged — each tagged with how much to trust it. Informational, not legal advice.
              </p>
            </div>
          </motion.aside>
        </div>
      </main>

      <AnimatePresence>
        {showLetter && (
          <AppealLetter report={report} meta={meta} onClose={() => setShowLetter(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
