import { useEffect, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from 'framer-motion'

// "Aurora Audit Light" — a soft teal glow trails the cursor (the native cursor is
// always kept on top, never hidden), screen-blended onto the near-black UI so the
// page feels lit from within. It warms to red/yellow/green as it passes over
// flagged audit rows, and brightens over buttons and the dropzone — dramatizing
// the act of scanning a bill for overcharges.
//
// Design notes: pointer-events:none overlay (never blocks the 3D canvas, buttons,
// inputs, or dropzone), no per-frame React renders (everything rides MotionValues),
// gated out on touch + reduced-motion. Compositor-only: animates background + opacity.

const EASE = [0.22, 1, 0.36, 1]
const SIZE_SPRING = { stiffness: 140, damping: 22, mass: 0.6 }
const POS_SPRING = { stiffness: 180, damping: 26, mass: 0.55 }

// rgb triplets matching the Tailwind palette tokens
const COLORS = {
  cyan: [61, 212, 200], // accent #3DD4C8
  soft: [127, 240, 231], // accent-soft #7FF0E7
  red: [255, 92, 114], // flag-red #FF5C72
  yellow: [255, 200, 87], // flag-yellow #FFC857
  green: [70, 224, 160], // flag-green #46E0A0
}

const HOVER_SELECTOR =
  '[data-cursor],button,a,input,textarea,[role="button"],[data-glow],.btn,.card'

export default function CursorAurora() {
  const [enabled, setEnabled] = useState(false)
  const [readout, setReadout] = useState(null) // { text, name } over flagged rows

  // Cursor position (raw) + lagging spring for the glow center.
  const x = useMotionValue(-9999)
  const y = useMotionValue(-9999)
  const sx = useSpring(x, POS_SPRING)
  const sy = useSpring(y, POS_SPRING)

  // State targets (set imperatively) -> springs (breathe smoothly).
  const auroraRT = useMotionValue(520)
  const coreRT = useMotionValue(90)
  const opT = useMotionValue(0.55)
  const crT = useMotionValue(COLORS.cyan[0])
  const cgT = useMotionValue(COLORS.cyan[1])
  const cbT = useMotionValue(COLORS.cyan[2])

  const auroraR = useSpring(auroraRT, SIZE_SPRING)
  const coreR = useSpring(coreRT, SIZE_SPRING)
  const opacity = useSpring(opT, SIZE_SPRING)
  const cr = useSpring(crT, SIZE_SPRING)
  const cg = useSpring(cgT, SIZE_SPRING)
  const cb = useSpring(cbT, SIZE_SPRING)

  // Click / drop ripple.
  const rScale = useMotionValue(0)
  const rOpacity = useMotionValue(0)
  const rcr = useMotionValue(COLORS.soft[0])
  const rcg = useMotionValue(COLORS.soft[1])
  const rcb = useMotionValue(COLORS.soft[2])

  const auroraBg = useMotionTemplate`radial-gradient(${auroraR}px circle at ${sx}px ${sy}px, rgba(${cr}, ${cg}, ${cb}, 0.22) 0%, rgba(127,240,231,0.10) 35%, transparent 70%)`
  const coreBg = useMotionTemplate`radial-gradient(${coreR}px circle at ${sx}px ${sy}px, rgba(127,240,231,0.30) 0%, transparent 60%)`
  const rippleBorder = useMotionTemplate`1.5px solid rgba(${rcr}, ${rcg}, ${rcb}, 1)`

  // Gate: fine pointer, no reduced-motion, no touch. Re-evaluate live.
  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const evaluate = () =>
      setEnabled(fine.matches && !reduced.matches && !('ontouchstart' in window))
    evaluate()
    reduced.addEventListener?.('change', evaluate)
    fine.addEventListener?.('change', evaluate)
    return () => {
      reduced.removeEventListener?.('change', evaluate)
      fine.removeEventListener?.('change', evaluate)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const setColor = (name) => {
      const c = COLORS[name] || COLORS.cyan
      crT.set(c[0])
      cgT.set(c[1])
      cbT.set(c[2])
    }
    const idle = () => {
      auroraRT.set(520)
      coreRT.set(90)
      opT.set(0.55)
      setColor('cyan')
      setReadout(null)
    }

    const onMove = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }

    const onOver = (e) => {
      const el = e.target.closest?.(HOVER_SELECTOR)
      if (!el) {
        idle()
        return
      }
      const ds = el.dataset

      // Dropzone — the marquee surface.
      if (ds.cursor === 'dropzone' || el.closest('[data-cursor="dropzone"]')) {
        const zone = el.closest('[data-cursor="dropzone"]') || el
        auroraRT.set(760)
        coreRT.set(150)
        opT.set(0.95)
        setColor(zone.dataset.dragging === 'true' ? 'green' : 'soft')
        setReadout(null)
        return
      }

      // Flagged audit row — the "light audits with you" moment.
      if (ds.readout) {
        auroraRT.set(600)
        coreRT.set(120)
        opT.set(0.85)
        setColor(ds.glow || 'cyan')
        setReadout({ text: ds.readout, name: ds.glow || 'cyan' })
        return
      }

      // Inputs — a tighter "reading lamp".
      if (el.matches('input, textarea')) {
        auroraRT.set(560)
        coreRT.set(120)
        opT.set(0.8)
        setColor('cyan')
        setReadout(null)
        return
      }

      // Cards — subtler glow: inspectable, not clickable.
      if (el.matches('.card') && !el.matches('button, a, .btn, [role="button"]')) {
        auroraRT.set(560)
        coreRT.set(100)
        opT.set(0.65)
        setColor(ds.glow || 'cyan')
        setReadout(null)
        return
      }

      // Buttons / links / anything interactive — brightest.
      auroraRT.set(620)
      coreRT.set(120)
      opT.set(0.8)
      setColor(ds.glow || 'cyan')
      setReadout(null)
    }

    const onLeave = () => opT.set(0)

    const onDown = (e) => {
      const overDrop = e.target.closest?.('[data-cursor="dropzone"]')
      const ripple = overDrop ? COLORS.green : COLORS.soft
      rcr.set(ripple[0])
      rcg.set(ripple[1])
      rcb.set(ripple[2])
      rScale.set(0)
      rOpacity.set(0.5)
      animate(rScale, 1, { type: 'spring', stiffness: 120, damping: 20 })
      animate(rOpacity, 0, { duration: 0.6, ease: EASE })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { capture: true, passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    window.addEventListener('pointerdown', onDown, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver, { capture: true })
      document.documentElement.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  if (!enabled) return null

  const chipColor = readout ? `rgb(${(COLORS[readout.name] || COLORS.cyan).join(',')})` : undefined

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60]"
        style={{ opacity }}
      >
        <motion.div
          className="absolute inset-0 mix-blend-screen"
          style={{ background: auroraBg, willChange: 'background' }}
        />
        <motion.div
          className="absolute inset-0 mix-blend-screen"
          style={{ background: coreBg, willChange: 'background' }}
        />
      </motion.div>

      {/* Click / drop ripple */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[60]"
        style={{ x, y }}
      >
        <motion.div
          className="-translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 340,
            height: 340,
            scale: rScale,
            opacity: rOpacity,
            border: rippleBorder,
          }}
        />
      </motion.div>

      {/* Readout chip over flagged audit rows */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[61]"
        style={{ x: sx, y: sy }}
      >
        <AnimatePresence>
          {readout && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16, ease: EASE }}
              className="absolute left-[20px] top-[20px] whitespace-nowrap rounded-md border bg-ink-900/80 px-2 py-1 font-mono text-[10px] tracking-[0.08em] backdrop-blur-sm"
              style={{ borderColor: chipColor, color: chipColor }}
            >
              {readout.text}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
