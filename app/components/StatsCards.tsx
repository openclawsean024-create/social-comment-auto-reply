'use client'

import type { Comment } from '@/app/lib/types'
import { BarChart3, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface Props {
  comments: Comment[]
}

export function StatsCards({ comments }: Props) {
  const autoReplied = comments.filter((c) => c.status === 'auto-replied').length
  const noMatch = comments.filter((c) => c.status === 'no-match').length
  const pending = comments.filter((c) => c.status === 'pending').length
  const total = comments.length

  const items = [
    { icon: BarChart3, label: '總留言', value: total, color: 'text-white' },
    { icon: CheckCircle, label: '自動回覆', value: autoReplied, color: 'text-emerald-400' },
    { icon: AlertCircle, label: '無匹配', value: noMatch, color: 'text-amber-400' },
    { icon: Clock, label: '待人工', value: pending, color: 'text-blue-400' },
  ]

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
      {items.map((it) => {
        const Icon = it.icon
        return (
          <div
            key={it.label}
            className="bg-surface-2 rounded-2xl p-5 border border-white/5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-black uppercase tracking-wider opacity-50">
                {it.label}
              </div>
              <Icon size={16} className={it.color} />
            </div>
            <div className={`text-4xl font-light leading-none ${it.color}`}>{it.value}</div>
          </div>
        )
      })}
    </div>
  )
}
