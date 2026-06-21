import { lazy, Suspense, useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Landing from './components/Landing.jsx'
import CursorAurora from './components/CursorAurora.jsx'
import { auditBill, applyEstimates } from './lib/audit.js'
import { extractBill, estimateMarketRates } from './lib/api.js'
import { SAMPLES } from './lib/sampleBill.js'
import { getPack } from './data/benchmarks/index.js'

const Dashboard = lazy(() => import('./components/Dashboard.jsx'))

// Static film-grain veil — adds premium "print" tooth and dithers gradient banding.
const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export default function App() {
  const [view, setView] = useState('landing') // 'landing' | 'dashboard'
  const [report, setReport] = useState(null)
  const [meta, setMeta] = useState(null)
  const [country, setCountry] = useState('US') // manual benchmark-pack selection
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'error'
  const [error, setError] = useState('')

  const runAudit = useCallback((rawItems, billMeta, opts = {}) => {
    const pack = getPack(opts.country)
    const result = auditBill(rawItems, { pack, bill: opts.bill || {} })
    setReport(result)
    setMeta(billMeta)
    setView('dashboard')
    setStatus('idle')
    setError('')
    window.scrollTo({ top: 0, behavior: 'instant' })
    return { result, pack }
  }, [])

  const handleAnalyze = useCallback(
    async (file) => {
      setStatus('loading')
      setError('')
      try {
        const data = await extractBill(file)
        if (!data.rawItems || data.rawItems.length === 0) {
          throw new Error('No line items found on this document. Try a clearer photo.')
        }
        const { result, pack } = runAudit(
          data.rawItems,
          {
            providerName: data.providerName || '[Provider / Hospital Name]',
            accountNumber: data.accountNumber || '[Account / Statement Number]',
            patientName: '[Your Name]',
          },
          { country, bill: data.bill || {} }
        )

        // Layer 3 — fetch labeled AI estimates for lines we couldn't verify or flag.
        const uncoded = result.lineItems.filter((l) => l.grounding === 'none')
        if (uncoded.length > 0) {
          estimateMarketRates(
            uncoded.map((l) => ({
              id: l.id,
              description: l.description,
              qty: l.qty,
              chargedAmount: l.chargedAmount,
            })),
            pack.countryName,
            pack.currency.code
          ).then((estimates) => {
            if (estimates.length > 0) {
              setReport((prev) => (prev ? applyEstimates(prev, estimates) : prev))
            }
          })
        }
      } catch (err) {
        setStatus('error')
        setError(err.message || 'Something went wrong. Please try again.')
      }
    },
    [runAudit, country]
  )

  const handleSample = useCallback(
    (sampleCountry = 'US') => {
      const s = SAMPLES[sampleCountry] || SAMPLES.US
      runAudit(
        s.rawItems,
        {
          providerName: s.providerName,
          accountNumber: s.accountNumber,
          patientName: s.patientName,
        },
        { country: s.country, bill: s.bill }
      )
    },
    [runAudit]
  )

  const handleReset = useCallback(() => {
    setView('landing')
    setReport(null)
    setStatus('idle')
    setError('')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <>
      <CursorAurora />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[55]"
        style={{
          backgroundImage: GRAIN_URL,
          backgroundSize: '160px',
          opacity: 0.045,
          mixBlendMode: 'overlay',
        }}
      />
      <AnimatePresence mode="wait">
      {view === 'landing' ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.5 }}
        >
          <Landing
            onAnalyze={handleAnalyze}
            onSample={handleSample}
            status={status}
            error={error}
            country={country}
            onCountryChange={setCountry}
          />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Suspense fallback={<div className="min-h-screen bg-ink-950" />}>
            <Dashboard report={report} meta={meta} onReset={handleReset} />
          </Suspense>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  )
}
