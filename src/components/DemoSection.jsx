import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { auditBill } from '../lib/audit.js'
import { SAMPLE_BILL } from '../lib/sampleBill.js'
import AnimatedNumber from './AnimatedNumber.jsx'

const FLAG_STYLES = {
  red: 'bg-flag-red/15 text-flag-red border-flag-red/30',
  yellow: 'bg-flag-yellow/15 text-flag-yellow border-flag-yellow/30',
  green: 'bg-flag-green/15 text-flag-green border-flag-green/30',
}
const FLAG_LABEL = { red: 'Overcharge', yellow: 'Review', green: 'Fair' }

export default function DemoSection({ onSample }) {
  const report = useMemo(() => auditBill(SAMPLE_BILL.rawItems), [])
  const topRows = report.lineItems.filter((l) => l.flag !== 'green').slice(0, 4)

  return (
    <section id="demo" className="relative py-24">
      <div className="section">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="eyebrow">Live demo</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            See a real audit in action
          </h2>
          <p className="mt-3 text-slate-400">
            This is an actual run of our audit engine on a sample ER bill — same logic your bill gets.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]"
        >
          {/* Audit rows */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-white">{SAMPLE_BILL.providerName}</p>
                <p className="text-xs text-slate-500">Account {SAMPLE_BILL.accountNumber}</p>
              </div>
              <span className="rounded-full bg-flag-red/15 px-3 py-1 text-xs font-semibold text-flag-red">
                {report.counts.red} red flags
              </span>
            </div>
            <div className="divide-y divide-white/5">
              {topRows.map((row) => (
                <div key={row.id} className="flex items-center gap-4 px-6 py-4">
                  <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase ${FLAG_STYLES[row.flag]}`}>
                    {FLAG_LABEL[row.flag]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{row.description}</p>
                    <p className="font-mono text-xs text-slate-500">CPT {row.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold text-white">
                      ${row.chargedAmount.toLocaleString()}
                    </p>
                    {row.medicare != null && (
                      <p className="font-mono text-xs text-slate-500">
                        Medicare ${row.medicare.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Result card */}
          <div className="card flex flex-col justify-between p-7">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Potential errors found</p>
              <p className="mt-2 font-mono text-4xl font-extrabold text-flag-red sm:text-5xl">
                <AnimatedNumber value={report.totalDisputable} prefix="$" decimals={0} />
              </p>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total billed</span>
                  <span className="font-mono text-white">${report.totalCharged.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Fair-market est.</span>
                  <span className="font-mono text-flag-green">
                    ${report.totalFair.toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">Disputable</span>
                  <span className="font-mono font-semibold text-flag-red">
                    ${report.totalDisputable.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onSample} className="btn-primary mt-7 w-full">
              Open full sample audit
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
