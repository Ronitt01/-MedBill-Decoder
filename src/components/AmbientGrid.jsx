import { useIsLowPower } from '../lib/useIsLowPower.js'

// "Living Grid" — amplifies the grid background the app already uses: a gentle
// transform-only tide (CSS keyframe, frozen for free under reduced-motion), a lit
// teal top-edge (the shadow-glow token), and brighter cells near the top. Static
// and compositor-only; degrades to a plain static grid via useIsLowPower.
export default function AmbientGrid({ variant = 'hero', glow = false }) {
  const low = useIsLowPower()
  const isHero = variant === 'hero'
  const gridOpacity = isHero ? 'opacity-60' : 'opacity-40'
  const washAlpha = isHero ? 0.1 : 0.07

  return (
    <div
      className={`pointer-events-none absolute overflow-hidden ${
        isHero ? 'inset-0' : 'inset-x-0 top-0 h-[460px]'
      }`}
    >
      {/* Breathing base grid */}
      <div
        className={`absolute -inset-16 grid-bg mask-fade-b ${gridOpacity} ${
          low ? '' : 'animate-grid-tide'
        }`}
        style={{ willChange: 'transform' }}
      />

      {glow && !low && (
        <>
          {/* Brighter cells near the top edge */}
          <div
            className="absolute -inset-16"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'linear-gradient(to bottom, black, transparent 220px)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 220px)',
            }}
          />
          {/* Soft teal wash on the top edge */}
          <div
            className="absolute inset-x-0 top-0 h-[220px] mix-blend-screen"
            style={{ background: `linear-gradient(to bottom, rgba(61,212,200,${washAlpha}), transparent)` }}
          />
        </>
      )}
    </div>
  )
}
