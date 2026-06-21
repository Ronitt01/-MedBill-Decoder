// Benchmark pack registry. Each pack is a pluggable per-country price source that
// exposes a common interface (lookupRate, rates, bundleMap, fairMultiple, currency,
// source, benchmarkLabel). The audit engine takes a pack rather than importing any
// single country's data — this is what makes the audit "universal".

import { US_PACK } from './us.js'
import { AU_PACK } from './au.js'
import { IN_PACK } from './in.js'

export const PACKS = {
  US: US_PACK,
  AU: AU_PACK,
  IN: IN_PACK,
}

// Order shown in the country picker (US is the demo hero / default).
export const PACK_LIST = [US_PACK, AU_PACK, IN_PACK]

export const DEFAULT_PACK = US_PACK

export function getPack(country) {
  if (!country) return DEFAULT_PACK
  return PACKS[String(country).trim().toUpperCase()] || DEFAULT_PACK
}
