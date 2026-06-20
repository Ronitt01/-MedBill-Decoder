import { useEffect, useState } from 'react'

// Decide whether to skip the heavy WebGL hero. Returns true on small screens,
// low core counts, or when the user prefers reduced motion.
export function useIsLowPower() {
  const [low, setLow] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const smallScreen = window.matchMedia?.('(max-width: 768px)').matches
    const fewCores = (navigator.hardwareConcurrency || 8) <= 4
    setLow(Boolean(reduced || smallScreen || fewCores))
  }, [])

  return low
}
