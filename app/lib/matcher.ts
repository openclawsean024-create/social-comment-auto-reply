// ─── Rule matching engine ────────────────────────────────────────────────

import type { Comment, Rule } from './types'

/**
 * Match a comment text against rules. Returns the highest-priority matching rule.
 * Higher priority number = checked first.
 */
export function matchRule(comment: string, rules: Rule[]): Rule | null {
  const candidates = rules
    .filter((r) => r.enabled)
    .sort((a, b) => b.priority - a.priority)

  for (const rule of candidates) {
    if (matchText(comment, rule.keyword, rule.matchMode)) {
      return rule
    }
  }
  return null
}

export function matchText(text: string, keyword: string, mode: 'exact' | 'fuzzy'): boolean {
  const t = text.toLowerCase()
  const k = keyword.toLowerCase()
  if (mode === 'exact') return t.includes(k)
  // fuzzy: keyword words all appear (whitespace-stripped)
  const tokens = k.split(/\s+/).filter(Boolean)
  return tokens.every((tok) => t.includes(tok))
}

/**
 * Generate a deterministic mock avatar URL (no external network — base64 gradient).
 */
export function avatarFor(name: string): string {
  // Use first char + hash-derived hue → inline SVG data URI
  const hue = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360
  const initial = (name[0] || '?').toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hue},70%,60%)"/><stop offset="100%" stop-color="hsl(${(hue + 60) % 360},70%,50%)"/></linearGradient></defs><rect width="80" height="80" rx="40" fill="url(#g)"/><text x="40" y="50" text-anchor="middle" font-size="36" fill="white" font-family="sans-serif" font-weight="bold">${initial}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
