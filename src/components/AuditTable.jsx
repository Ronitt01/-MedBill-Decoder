import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useIsLowPower } from '../lib/useIsLowPower.js'

const FLAG_DOT = { red: 'bg-flag-red', yellow: 'bg-flag-yellow', green: 'bg-flag-green' }
const FLAG_TEXT = { red: 'text-flag-red', yellow: 'text-flag-yellow', green: 'text-flag-green' }
const FLAG_HEX = { red: '#FF5C72', yellow: '#FFC857', green: '#46E0A0' }
const FLAG_LABEL = { red: 'Overcharge', yellow: 'Review', green: 'Fair' }
const FLASH_ALPHA = { 2: 0.9, 1: 0.5, 0: 0 } // silent green (severity 0)
const DOT_NEUTRAL = '#2A2F3A'
const EASE = [0.22, 1, 0.36, 1]
const CHECK_LABEL = {
  overcharge: 'Overcharge',
  duplicate: 'Duplicate',
  unbundling: 'Unbundling',
  upcoding: 'Upcoding',
  unverified: 'Unverified',
}

// Monospace digit-scramble that settles left-to-right — used only on the Charged
// figure of red (severity 2) rows, as the beam crosses them, to dramatize "computing".
function ScrambleNumber({ value, delay = 0, play = true, duration = 520 }) {
  const final = `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const [text, setText] = useState(play ? '' : final)

  useEffect(() => {
    if (!play) {
      setText(final)
      return
    }
    let raf
    let start = null
    const timer = setTimeout(() => {
      const tick = (ts) => {
        if (start === null) start = ts
        const t = Math.min(1, (ts - start) / duration)
        const settled = Math.floor(t * final.length)
        let out = ''
        for (let i = 0; i < final.length; i++) {
          const ch = final[i]
          if (i < settled || ch < '0' || ch > '9') out += ch
          else out += String(Math.floor(Math.random() * 10))
        }
        setText(out)
        if (t < 1) raf = requestAnimationFrame(tick)
        else setText(final)
      }
      raf = requestAnimationFrame(tick)
    }, delay * 1000)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [final, play, delay, duration])

  return <span className="tabular-nums">{text || ' '}</span>
}

function Row({ row, delay, skip }) {
  const [open, setOpen] = useState(false)
  const fade = {
    initial: skip ? false : { opacity: 0, x: -4 },
    animate: { opacity: 1, x: 0 },
  }
  const figureTx = (k) => ({ delay: delay + k * 0.025, duration: 0.34, ease: EASE })

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        data-glow={row.flag}
        data-readout={[
          row.code || '—',
          row.multiplier != null ? `${row.multiplier}× Medicare` : null,
          FLAG_LABEL[row.flag]?.toUpperCase(),
        ]
          .filter(Boolean)
          .join('  ·  ')}
        className="relative grid w-full grid-cols-[16px_1fr_auto] items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.025] sm:grid-cols-[16px_64px_1fr_90px_90px_70px_28px] sm:gap-4 sm:px-6"
      >
        {/* Severity flash bar (silent for green) */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[2px]"
          initial={skip ? false : { opacity: 0 }}
          animate={{ opacity: skip ? 0 : [0, FLASH_ALPHA[row.severity] ?? 0, 0] }}
          transition={{ delay, duration: 0.55, ease: EASE }}
          style={{ backgroundColor: FLAG_HEX[row.flag] }}
        />

        {/* Flag dot — ignites from neutral to the flag color as the beam crosses */}
        <motion.span
          className="h-2.5 w-2.5 rounded-full"
          initial={skip ? false : { scale: 1, backgroundColor: DOT_NEUTRAL }}
          animate={{ scale: skip ? 1 : [1, 1.5, 1], backgroundColor: FLAG_HEX[row.flag] }}
          transition={{ delay, duration: 0.45, ease: EASE, backgroundColor: { delay, duration: 0.3 } }}
          title={FLAG_LABEL[row.flag]}
        />

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

        <motion.span
          {...fade}
          transition={figureTx(0)}
          className="hidden text-right font-mono text-sm text-white sm:block"
        >
          {row.severity === 2 ? (
            <ScrambleNumber value={row.chargedAmount} delay={delay} play={!skip} />
          ) : (
            `$${row.chargedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
          )}
        </motion.span>
        <motion.span
          {...fade}
          transition={figureTx(1)}
          className="hidden text-right font-mono text-sm text-slate-400 sm:block"
        >
          {row.medicare != null ? `$${row.medicare.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
        </motion.span>
        <motion.span
          {...fade}
          transition={figureTx(2)}
          className={`hidden text-right font-mono text-sm font-semibold sm:block ${FLAG_TEXT[row.flag]}`}
        >
          {row.multiplier != null ? `${row.multiplier}×` : '—'}
        </motion.span>

        <span className="flex items-center justify-end">
          <motion.span {...fade} transition={figureTx(0)} className="text-right font-mono text-sm text-white sm:hidden">
            ${row.chargedAmount.toLocaleString()}
          </motion.span>
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
  const reduce = useReducedMotion()
  const low = useIsLowPower()
  const skip = Boolean(reduce || low)
  const wrapRef = useRef(null)
  const [beamH, setBeamH] = useState(null)

  // Measure only the rows-container height (cheap, single read) for the beam travel.
  useLayoutEffect(() => {
    if (skip) {
      setBeamH(null)
      return
    }
    if (wrapRef.current) setBeamH(wrapRef.current.getBoundingClientRect().height)
  }, [report.lineItems.length, skip])

  const rowCount = report.lineItems.length
  const travel = Math.min(620, 70 * rowCount)
  // Rows are fixed-height, so row centers are analytic — no per-row DOM measurement.
  const delayFor = (i) => (skip ? 0 : Math.round((travel * (i + 0.5)) / rowCount) / 1000)

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

      <div ref={wrapRef} className="relative divide-y divide-white/5">
        {/* Triage Beam — one teal sweep top -> bottom; rows ignite as it crosses */}
        {beamH != null && !skip && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 mix-blend-screen"
            style={{
              background:
                'linear-gradient(90deg, transparent, #3DD4C8 20%, #7FF0E7 50%, #3DD4C8 80%, transparent)',
              boxShadow: '0 0 14px 1px rgba(61,212,200,0.55), 0 0 4px rgba(127,240,231,0.9)',
              willChange: 'transform',
            }}
            initial={{ y: -2, opacity: 0 }}
            animate={{ y: beamH, opacity: [0, 1, 1, 1, 0] }}
            transition={{
              duration: 0.8,
              ease: EASE,
              opacity: { duration: 0.8, times: [0, 0.04, 0.85, 0.92, 1] },
            }}
          />
        )}

        {report.lineItems.map((row, i) => (
          <Row key={row.id} row={row} delay={delayFor(i)} skip={skip} />
        ))}
      </div>
    </div>
  )
}
