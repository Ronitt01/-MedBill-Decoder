// DEPRECATED — the US CMS table is now a benchmark "pack" at ./benchmarks/us.js,
// and the audit engine consumes a pluggable pack rather than this module directly
// (see src/data/benchmarks/index.js). This shim re-exports the US pack's data so any
// older import keeps working. Prefer importing from ./benchmarks/ going forward.

import { US_PACK } from './benchmarks/us.js'

export const CMS_RATES = US_PACK.rates
export const BUNDLE_MAP = US_PACK.bundleMap
export const CMS_SOURCE = US_PACK.source

export function lookupRate(code) {
  return US_PACK.lookupRate(code)
}

export function rateCount() {
  return Object.keys(US_PACK.rates).length
}
