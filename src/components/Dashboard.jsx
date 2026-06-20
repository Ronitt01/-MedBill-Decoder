import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AnimatedNumber from './AnimatedNumber.jsx'
import AuditTable from './AuditTable.jsx'
import AppealLetter from './AppealLetter.jsx'
import BeforeAfterCard from './BeforeAfterCard.jsx'

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

export default function Dashboard({ report, meta, onReset }) {
  const [showLetter, setShowLetter] = useState(false)

  if (!report) return null

  return (
    <div className="relative min-h-screen pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 grid-bg mask-fade-b opacity-40" />

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
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M5 4h9l5 5v11H5z" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Audit Report</span>
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
              <p className="mt-3 text-sm uppercase tracking-widest text-slate-500">
                Potential billing errors found
              </p>
              <p className="mt-1 font-mono text-5xl font-extrabold text-flag-red sm:text-7xl">
                <AnimatedNumber value={report.totalDisputable} prefix="$" decimals={0} />
              </p>
              <p className="mt-3 max-w-md text-sm text-slate-400">
                Across {report.lineItems.length} line items, compared against the{' '}
                <span className="text-slate-300">{report.source}</span>.
              </p>

              {/* Bill health score */}
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
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              <Stat label="Total billed" value={`$${report.totalCharged.toLocaleString()}`} />
              <Stat label="Fair-market est." value={`$${report.totalFair.toLocaleString()}`} tone="green" />
              <Stat label="Red flags" value={report.counts.red} tone="red" />
              <Stat label="Review" value={report.counts.yellow} tone="yellow" />
            </div>
          </div>
        </motion.div>

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
                Generate a formal appeal letter citing every flagged charge and the total disputed.
              </p>
              <button onClick={() => setShowLetter(true)} className="btn-primary mt-4 w-full">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M5 4h9l5 5v11H5z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M8 13h7M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                Generate appeal letter
              </button>
            </div>

            <BeforeAfterCard report={report} />

            <div className="glass rounded-2xl p-5">
              <p className="text-xs leading-relaxed text-slate-400">
                <span className="font-semibold text-slate-300">How to read this:</span> benchmarks are
                the Medicare-allowed amount for each code. Charges well above the benchmark, duplicates,
                and unbundled services are flagged. This is informational, not legal advice.
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
