import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import Uploader from './Uploader.jsx'
import DemoSection from './DemoSection.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import AmbientGrid from './AmbientGrid.jsx'
import CountrySelect from './CountrySelect.jsx'

const Hero3D = lazy(() => import('./Hero3D.jsx'))

function HeroVisualFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-72 w-72 animate-pulse rounded-full bg-accent/10 blur-[80px]" />
    </div>
  )
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
}

function Navbar({ onSample }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="section mt-4">
        <div className="glass-strong flex items-center justify-between rounded-full px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M5 4h9l5 5v11H5z" stroke="currentColor" strokeWidth="1.6" />
                <path d="m8 13 2.5 2.6L16 10" stroke="#46E0A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">MedBill Decoder</span>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#how" className="transition hover:text-white">How it works</a>
            <a href="#demo" className="transition hover:text-white">Live demo</a>
            <a href="#trust" className="transition hover:text-white">Why trust it</a>
          </nav>
          <button onClick={onSample} className="btn-ghost px-4 py-2 text-xs">
            View sample audit
          </button>
        </div>
      </div>
    </header>
  )
}

function Hero({ onAnalyze, onSample, status, error, country, onCountryChange }) {
  return (
    <section className="relative overflow-hidden pt-36 pb-20">
      {/* Ambient background */}
      <AmbientGrid variant="hero" glow />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-accent/[0.06] blur-[140px]" />

      <div className="section relative grid items-center gap-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-flag-green" />
            Official US, Australia & India fee schedules
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Found a medical bill?
            <span className="block text-gradient">See potential overcharges in seconds.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Upload your bill and we audit every charge — against official fee schedules where we
            have them, and with universal math &amp; structural checks on any bill, in any currency.
            Each finding shows exactly how much to trust it.
          </p>

          <div className="mt-7">
            <CountrySelect country={country} onChange={onCountryChange} />
          </div>

          <div className="mt-5">
            <Uploader onAnalyze={onAnalyze} status={status} error={error} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button onClick={onSample} className="btn-ghost">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              View sample audit
            </button>
            <span className="text-xs text-slate-500">No signup · No storage · 100% free</span>
          </div>
        </motion.div>

        {/* 3D centerpiece */}
        <div className="relative h-[420px] w-full sm:h-[520px]">
          <ErrorBoundary fallback={<HeroVisualFallback />}>
            <Suspense fallback={<div className="h-full w-full animate-pulse rounded-3xl bg-white/[0.02]" />}>
              <Hero3D />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Upload your bill',
      body: 'Snap a photo or drop a PDF. Our extractor reads every line item, code, and charge.',
      icon: (
        <path d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      ),
    },
    {
      n: '02',
      title: 'Audit in tiers',
      body: 'Universal math & structural checks run on any bill; coded lines are benchmarked against the country’s official fee schedule. Every flag is graded by how much to trust it.',
      icon: (
        <path d="M4 12h4l2 5 4-12 2 7h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      ),
    },
    {
      n: '03',
      title: 'Get your report & letter',
      body: 'See exactly what you may be overcharged — then generate a ready-to-send appeal letter citing every figure.',
      icon: (
        <path d="M5 4h9l5 5v11H5zM9 13l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      ),
    },
  ]
  return (
    <section id="how" className="relative py-24">
      <div className="section">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            From confusing bill to confident dispute
          </h2>
          <p className="mt-3 text-slate-400">Three steps, under a minute, no expertise required.</p>
        </motion.div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.12 }}
              className="card group relative overflow-hidden p-7"
            >
              <div className="absolute right-5 top-5 font-mono text-5xl font-bold text-white/[0.04] transition group-hover:text-accent/10">
                {s.n}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">{s.icon}</svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
              {i < 2 && (
                <div className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 text-accent/30 md:block">
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrustSection() {
  const points = [
    {
      title: 'Official benchmarks, not guesses',
      body: 'Coded charges are measured against real fee schedules — US Medicare, Australian MBS, India CGHS — citable numbers, not vibes.',
    },
    {
      title: 'Graded by how much to trust it',
      body: 'Every flag carries a grounding badge: verified (official), structural (math/duplicate), or estimate (AI). Transparency is the point.',
    },
    {
      title: 'Works on any bill',
      body: 'Even with no codes or no fee schedule, universal arithmetic and structural checks still catch errors — in any currency.',
    },
  ]
  return (
    <section id="trust" className="relative py-24">
      <div className="section">
        <div className="card relative overflow-hidden p-8 sm:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/10 blur-[120px]" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <motion.div {...fadeUp}>
              <span className="eyebrow">Why you can trust it</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                It verifies your bill. It doesn’t just talk about it.
              </h2>
              <p className="mt-4 text-slate-400">
                A chatbot can explain a bill from memory. MedBill Decoder checks your charges against
                real fee-schedule data and runs the same tiered audit a professional billing advocate
                would — and tells you how much to trust every finding.
              </p>
            </motion.div>
            <div className="grid gap-4">
              {points.map((p, i) => (
                <motion.div
                  key={p.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                  className="glass flex gap-4 rounded-2xl p-5"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-flag-green/15 text-flag-green">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{p.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{p.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="section flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-accent">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path d="M5 4h9l5 5v11H5z" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </div>
          <span className="font-medium text-slate-300">MedBill Decoder</span>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-slate-500">
          Benchmarks derived from public fee schedules (US CMS Medicare, Australian MBS, India
          CGHS). For informational purposes only — not medical, legal, or financial advice.
        </p>
      </div>
    </footer>
  )
}

export default function Landing({ onAnalyze, onSample, status, error, country, onCountryChange }) {
  return (
    <div className="relative min-h-screen">
      <Navbar onSample={onSample} />
      <Hero
        onAnalyze={onAnalyze}
        onSample={onSample}
        status={status}
        error={error}
        country={country}
        onCountryChange={onCountryChange}
      />
      <HowItWorks />
      <DemoSection onSample={onSample} />
      <TrustSection />
      <Footer />
    </div>
  )
}
