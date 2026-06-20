import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const FLAG_DOT = { red: 'bg-flag-red', yellow: 'bg-flag-yellow', green: 'bg-flag-green' }
const FLAG_TEXT = { red: 'text-flag-red', yellow: 'text-flag-yellow', green: 'text-flag-green' }
const FLAG_LABEL = { red: 'Overcharge', yellow: 'Review', green: 'Fair' }
const CHECK_LABEL = {
  overcharge: 'Overcharge',
  duplicate: 'Duplicate',
  unbundling: 'Unbundling',
  upcoding: 'Upcoding',
  unverified: 'Unverified',
}

function Row({ row }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid w-full grid-cols-[16px_1fr_auto] items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.025] sm:grid-cols-[16px_64px_1fr_90px_90px_70px_28px] sm:gap-4 sm:px-6"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${FLAG_DOT[row.flag]}`} title={FLAG_LABEL[row.flag]} />

        <span className="hidden font-mono text-xs text-slate-400 sm:block">{row.code || '—'}</span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-white">
            {row.description || 'Unlabeled charge'}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 sm:hidden">
            <span className="font-mono text-[11px] text-slate-500">{row.code || '—'}</span>
            <span className={`text-[11px] font-semibold ${FLAG_TEXT[row.flag]}`}>
              {FLAG_LABEL[row.flag]}
            </span>
          </span>
        </span>

        <span className="hidden text-right font-mono text-sm text-white sm:block">
          ${row.chargedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
        <span className="hidden text-right font-mono text-sm text-slate-400 sm:block">
          {row.medicare != null ? `$${row.medicare.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
        </span>
        <span className={`hidden text-right font-mono text-sm font-semibold sm:block ${FLAG_TEXT[row.flag]}`}>
          {row.multiplier != null ? `${row.multiplier}×` : '—'}
        </span>

        <span className="flex items-center justify-end">
          <span className="text-right font-mono text-sm text-white sm:hidden">
            ${row.chargedAmount.toLocaleString()}
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`ml-2 h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden bg-ink-900/40"
          >
            <div className="px-6 py-4 sm:pl-[104px]">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(row.checks?.length ? row.checks : ['ok']).map((c) => (
                  <span
                    key={c}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300"
                  >
                    {CHECK_LABEL[c] || 'No issues'}
                  </span>
                ))}
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">{row.reason}</p>
              {row.medicare != null && (
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-slate-500">
                  <span>Medicare: ${row.medicare.toFixed(2)}</span>
                  {row.fair != null && <span>Fair-market est.: ${row.fair.toFixed(2)}</span>}
                  {row.multiplier != null && <span>Charged {row.multiplier}× Medicare</span>}
                  <span>Confidence: {row.confidence}</span>
                </div>
              )}
              {row.source && row.medicare != null && (
                <p className="mt-2 text-xs text-slate-600">Source: {row.source}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default function AuditTable({ report }) {
  return (
    <div className="card overflow-hidden">
      <div className="hidden grid-cols-[16px_64px_1fr_90px_90px_70px_28px] gap-4 border-b border-white/5 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:grid">
        <span />
        <span>Code</span>
        <span>Description</span>
        <span className="text-right">Charged</span>
        <span className="text-right">Medicare</span>
        <span className="text-right">Mult.</span>
        <span />
      </div>
      <div className="divide-y divide-white/5">
        {report.lineItems.map((row) => (
          <Row key={row.id} row={row} />
        ))}
      </div>
    </div>
  )
}
