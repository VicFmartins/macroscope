import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Score → color token (for Tailwind className usage) */
export function scoreColor(score: number): string {
  if (score >= 71) return 'text-tertiary-dim'
  if (score >= 31) return 'text-secondary'
  return 'text-error'
}

/** Score → hex color (for SVG/canvas, e.g. world map fill) */
export function scoreHex(score: number): string {
  if (score >= 71) return '#48e5d0'
  if (score >= 31) return '#8a95ff'
  if (score > 0)   return '#ff716c'
  return '#262c3d'  // no data
}

/** Score → glow shadow */
export function scoreGlow(score: number): string {
  if (score >= 71) return '0 0 12px rgba(72,229,208,0.35)'
  if (score >= 31) return '0 0 12px rgba(138,149,255,0.3)'
  return '0 0 12px rgba(255,113,108,0.3)'
}

/** Format a number as a percentage string */
export function fmtPct(v: number | null, decimals = 1): string {
  if (v === null) return '—'
  return `${v.toFixed(decimals)}%`
}

/** Format a large number with K/M suffix */
export function fmtCompact(v: number | null): string {
  if (v === null) return '—'
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

/** Flag emoji from ISO 3166-1 alpha-2 code */
export function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join('')
}

/** Flag image URL from flagcdn.com */
export function flagUrl(iso2: string, width = 40): string {
  return `https://flagcdn.com/w${width}/${iso2.toLowerCase()}.png`
}

/** Relative time string */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
