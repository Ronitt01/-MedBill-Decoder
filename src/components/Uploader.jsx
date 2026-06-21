import { useRef, useState } from 'react'

const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
const MAX_BYTES = 10 * 1024 * 1024 // 10MB pre-downscale guard

export default function Uploader({ onAnalyze, status, error, compact = false }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState('')
  const loading = status === 'loading'

  const validateAndSend = (file) => {
    setLocalError('')
    if (!file) return
    if (!ACCEPTED.includes(file.type)) {
      setLocalError('Please upload a PNG, JPG, WEBP, or PDF.')
      return
    }
    if (file.size > MAX_BYTES) {
      setLocalError('File is too large. Keep it under 10MB.')
      return
    }
    onAnalyze(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (loading) return
    validateAndSend(e.dataTransfer.files?.[0])
  }

  const shownError = localError || error

  return (
    <div className={compact ? '' : 'w-full max-w-xl'}>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!loading) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        data-cursor="dropzone"
        data-dragging={dragging}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !loading && inputRef.current?.click()}
        className={[
          'group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed text-center transition-all duration-300',
          compact ? 'gap-2 px-5 py-6' : 'gap-3 px-8 py-12',
          dragging
            ? 'border-accent bg-accent/10 shadow-glow'
            : 'border-white/15 glass hover:border-accent/60 hover:bg-white/[0.05]',
          loading ? 'pointer-events-none opacity-90' : '',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => validateAndSend(e.target.files?.[0])}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent" />
            </div>
            <p className="text-sm font-medium text-slate-200">Reading your bill…</p>
            <p className="text-xs text-slate-400">Extracting codes &amp; running the tiered audit</p>
          </div>
        ) : (
          <>
            <div
              className={[
                'flex items-center justify-center rounded-xl bg-accent/15 text-accent transition-transform group-hover:scale-110',
                compact ? 'h-10 w-10' : 'h-14 w-14',
              ].join(' ')}
            >
              <svg viewBox="0 0 24 24" fill="none" className={compact ? 'h-5 w-5' : 'h-7 w-7'}>
                <path
                  d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className={compact ? 'text-sm font-semibold text-white' : 'text-base font-semibold text-white'}>
                Drop your bill here or <span className="text-accent">browse</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">PNG, JPG, or PDF — a photo of the bill works fine</p>
            </div>
          </>
        )}
      </div>

      {shownError && (
        <p className="mt-3 text-center text-sm text-flag-red">{shownError}</p>
      )}
      {!compact && !shownError && (
        <p className="mt-3 text-center text-xs text-slate-500">
          Your bill is processed for this audit only — no account, no storage.
        </p>
      )}
    </div>
  )
}
