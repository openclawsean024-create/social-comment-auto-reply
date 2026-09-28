'use client'

import type { Comment } from '@/app/lib/types'
import { BarChart3, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface Props {
  comments: Comment[]
}

/**
 * Editorial statline — a single dense row, not a KPI tile grid.
 * Numbers get the ink treatment; labels stay small and uppercase so the
 * eye reads ratios before counts.
 */
export function StatsCards({ comments }: Props) {
  const total = comments.length
  const matched = comments.filter((c) => c.status === 'auto-replied').length
  const noMatch = comments.filter((c) => c.status === 'no-match').length
  const needsReview = comments.filter((c) => c.status === 'needs-review').length
  const pending = comments.filter((c) => c.status === 'pending').length
  const matchRate = total > 0 ? Math.round((matched / total) * 100) : 0

  // Top 3 triggered keywords.
  const keywordCounts = new Map<string, number>()
  for (const c of comments) {
    if (c.status === 'auto-replied' && c.triggeredRule) {
      keywordCounts.set(c.triggeredRule, (keywordCounts.get(c.triggeredRule) ?? 0) + 1)
    }
  }
  const topKeywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const items = [
    { icon: BarChart3, label: '總留言', value: total, tone: 'ink' as const },
    { icon: CheckCircle, label: '找到規則 · 待複製', value: matched, tone: 'forest' as const },
    { icon: AlertCircle, label: '無匹配', value: noMatch, tone: 'gold' as const },
    { icon: Clock, label: '待人工', value: needsReview + pending, tone: 'danger' as const },
  ]

  const toneToColor: Record<'ink' | 'forest' | 'gold' | 'danger', string> = {
    ink: 'var(--color-ink)',
    forest: 'var(--color-forest-strong)',
    gold: 'var(--color-gold-strong)',
    danger: 'var(--color-danger)',
  }

  return (
    <div className="space-y-4">
      {/* Editorial statline — single dense row */}
      <div
        className="rounded-2xl border p-5 sm:p-6 flex flex-wrap items-center gap-x-6 gap-y-4"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
      >
        {items.map((it, idx) => {
          const Icon = it.icon
          return (
            <div key={it.label} className="flex items-center gap-3">
              <Icon size={18} style={{ color: toneToColor[it.tone] }} />
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl leading-none" style={{ color: toneToColor[it.tone] }}>
                  {it.value}
                </span>
                <span className="editorial-eyebrow text-[10px]">{it.label}</span>
              </div>
              {idx < items.length - 1 && (
                <span className="hidden sm:inline-block w-px h-6 ml-3" style={{ background: 'var(--color-line)' }} aria-hidden />
              )}
            </div>
          )
        })}
        <span className="hidden sm:inline-block w-px h-6" style={{ background: 'var(--color-line)' }} aria-hidden />
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl leading-none" style={{ color: 'var(--color-orange)' }}>
              {matchRate}%
            </span>
            <span className="editorial-eyebrow text-[10px]">留言規則符合率</span>
          </div>
        </div>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        僅代表目前工作區留言符合 FAQ 規則的比例。符合時只會提供建議回覆，仍需由你複製並手動送出。
      </p>

      {topKeywords.length > 0 && (
        <div
          className="rounded-2xl border p-5 sm:p-6"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
        >
          <div className="editorial-eyebrow">熱門關鍵字 · Top 3</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {topKeywords.map(([kw, count]) => (
              <span
                key={kw}
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-mono"
                style={{ background: 'var(--color-forest-soft)', color: 'var(--color-forest-strong)' }}
              >
                <span>{kw}</span>
                <span className="font-serif text-base leading-none">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
