import { PACK_LIST } from '../data/benchmarks/index.js'

// Manual benchmark-pack picker. The user chooses the bill's country so we audit
// against the right fee schedule (and never FX-convert across schedules). Layer 1
// structural checks run regardless of choice.
export default function CountrySelect({ country, onChange, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
        Bill country / benchmark
      </label>
      <div className="inline-flex flex-wrap gap-1.5 rounded-xl bg-white/[0.03] p-1">
        {PACK_LIST.map((p) => {
          const active = country === p.country
          return (
            <button
              key={p.country}
              type="button"
              onClick={() => onChange(p.country)}
              aria-pressed={active}
              title={`${p.countryName} · ${p.scheduleName}`}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
                active
                  ? 'bg-accent/15 text-white ring-1 ring-accent/40'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <span aria-hidden="true">{p.flag}</span>
              <span className="font-medium">{p.country}</span>
              <span className="hidden text-xs text-slate-500 sm:inline">{p.benchmarkLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
