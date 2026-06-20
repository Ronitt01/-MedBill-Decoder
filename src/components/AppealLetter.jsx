import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { buildAppealLetter } from '../lib/appealLetter.js'

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadPdf(text) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  doc.setFont('courier', 'normal')
  doc.setFontSize(9)
  const marginX = 48
  const marginY = 56
  const lineHeight = 12
  const pageHeight = doc.internal.pageSize.getHeight()
  const usableWidth = doc.internal.pageSize.getWidth() - marginX * 2
  const lines = doc.splitTextToSize(text, usableWidth)
  let y = marginY
  lines.forEach((line) => {
    if (y > pageHeight - marginY) {
      doc.addPage()
      y = marginY
    }
    doc.text(line, marginX, y)
    y += lineHeight
  })
  doc.save('medbill-appeal-letter.pdf')
}

export default function AppealLetter({ report, meta, onClose }) {
  const letter = useMemo(() => buildAppealLetter(report, meta || {}), [report, meta])
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-card"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-white">Your appeal letter</h3>
            <p className="text-xs text-slate-400">Ready to send — review the bracketed fields first.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5">
          <pre className="whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-slate-200">
            {letter}
          </pre>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 px-6 py-4">
          <button onClick={copy} className="btn-primary">
            {copied ? 'Copied!' : 'Copy letter'}
          </button>
          <button onClick={() => downloadText('medbill-appeal-letter.txt', letter)} className="btn-ghost">
            Download .txt
          </button>
          <button onClick={() => downloadPdf(letter)} className="btn-ghost">
            Download PDF
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
