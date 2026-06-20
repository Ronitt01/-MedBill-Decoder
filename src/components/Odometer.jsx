import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useIsLowPower } from '../lib/useIsLowPower.js'

// A rolling "odometer" money counter — a drop-in superset of AnimatedNumber.
// Counts up with the same easeOutExpo RAF, but each digit lives in an overflow
// slot and rolls up as it changes. Honors reduced-motion / low-power by rendering
// the final value statically. Accessible: reels are aria-hidden, with an sr-only
// final value.
const EASE = [0.22, 1, 0.36, 1]

function Slot({ char }) {
  const isDigit = char >= '0' && char <= '9'
  if (!isDigit) {
    return <span className="inline-block text-center" style={{ minWidth: char === ' ' ? '0.6ch' : undefined }}>{char}</span>
  }
  return (
    <span className="relative inline-block overflow-hidden align-baseline" style={{ width: '1ch', height: '1em' }}>
      <AnimatePresence initial={false}>
        <motion.span
          key={char}
          initial={{ y: '110%' }}
          animate={{ y: '0%' }}
          exit={{ y: '-110%' }}
          transition={{ duration: 0.22, ease: EASE }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export default function Odometer({
  value = 0,
  prefix = '',
  decimals = 0,
  duration = 1100,
  glow = 'rgba(127,240,231,0.4)',
}) {
  const low = useIsLowPower()
  const [display, setDisplay] = useState(low ? Number(value) || 0 : 0)
  const [settled, setSettled] = useState(low)
  const fromRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (low) {
      setDisplay(Number(value) || 0)
      setSettled(true)
      return
    }
    const from = fromRef.current
    const to = Number(value) || 0
    let start = null
    setSettled(false)
    const tick = (ts) => {
      if (start === null) start = ts
      const t = Math.min(1, (ts - start) / duration)
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setDisplay(from + (to - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
        setSettled(true)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration, low])

  const fmt = (n) =>
    n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  const num = fmt(display)
  const finalNum = fmt(Number(value) || 0)
  // Pad to the final width with leading spaces so digit slots never reflow.
  const padded = num.length < finalNum.length ? ' '.repeat(finalNum.length - num.length) + num : num

  return (
    <span
      className="inline-flex items-center leading-none transition-[text-shadow] duration-500"
      style={settled ? { textShadow: `0 0 26px ${glow}` } : undefined}
    >
      <span aria-hidden="true" className="inline-flex items-center tabular-nums">
        {prefix && <span className="inline-block">{prefix}</span>}
        {padded.split('').map((ch, i) => (
          <Slot key={i} char={ch} />
        ))}
      </span>
      <span className="sr-only">
        {prefix}
        {finalNum}
      </span>
    </span>
  )
}
