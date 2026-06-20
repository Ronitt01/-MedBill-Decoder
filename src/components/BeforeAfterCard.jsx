import { useRef, useState } from 'react'

export default function BeforeAfterCard({ report }) {
  const cardRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const exportImage = async () => {
    if (!cardRef.current) return
    setBusy(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#0A0C12',
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'medbill-savings.png'
      a.click()
    } catch {
      /* ignore */
    } finally {
      setBusy(false)
    }
  }

  const pct =
    report.totalCharged > 0
      ? Math.round((report.totalDisputable / report.totalCharged) * 100)
      : 0

  return (
    <div>
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink-800 to-ink-900 p-6"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-accent/15 blur-[60px]" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-accent">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                <path d="M5 4h9l5 5v11H5z" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </div>
            <span className="text-xs font-semibold tracking-tight text-slate-300">MedBill Decoder</span>
          </div>

          <p className="mt-5 text-xs uppercase tracking-widest text-slate-500">Potentially disputable</p>
          <p className="font-mono text-4xl font-extrabold text-flag-red">
            ${report.totalDisputable.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {pct}% of this bill may be overcharged or billed in error.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Original bill</p>
              <p className="font-mono text-lg font-bold text-white">
                ${report.totalCharged.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-flag-green/20 bg-flag-green/5 p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Fair-market est.</p>
              <p className="font-mono text-lg font-bold text-flag-green">
                ${report.totalFair.toLocaleString()}
              </p>
            </div>
          </div>

          <p className="mt-4 text-[10px] text-slate-600">
            Benchmarks: CMS Medicare fee schedule · Informational only
          </p>
        </div>
      </div>

      <button onClick={exportImage} disabled={busy} className="btn-ghost mt-3 w-full">
        {busy ? 'Generating…' : 'Save savings card (PNG)'}
      </button>
    </div>
  )
}
