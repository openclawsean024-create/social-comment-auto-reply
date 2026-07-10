'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { Rule, MatchMode, Platform } from '@/app/lib/types'
import { PLATFORM_LABELS, PLATFORMS } from '@/app/lib/types'

interface Props {
  rules: Rule[]
  onChange: (rules: Rule[]) => void
}

export function RulesTable({ rules, onChange }: Props) {
  const [draft, setDraft] = useState<Omit<Rule, 'id'>>({
    keyword: '',
    reply: '',
    matchMode: 'exact' as MatchMode,
    platform: 'generic' as Platform,
    priority: 1,
    enabled: true,
  })

  const add = () => {
    if (!draft.keyword.trim() || !draft.reply.trim()) return
    const newRule: Rule = { ...draft, id: `r${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }
    onChange([...rules, newRule])
    setDraft({ ...draft, keyword: '', reply: '' })
  }

  const remove = (id: string) => {
    onChange(rules.filter((r) => r.id !== id))
  }

  const toggle = (id: string) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface-2 rounded-2xl p-5 space-y-3 border border-white/5">
        <h3 className="text-sm font-black uppercase tracking-wider opacity-60">新增規則</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="關鍵字 (例：價格、運費)"
            value={draft.keyword}
            onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
            className="px-3 py-2.5 bg-surface-3 rounded-lg border border-white/5 text-sm"
          />
          <select
            value={draft.matchMode}
            onChange={(e) => setDraft({ ...draft, matchMode: e.target.value as MatchMode })}
            className="px-3 py-2.5 bg-surface-3 rounded-lg border border-white/5 text-sm"
          >
            <option value="exact">精確包含</option>
            <option value="fuzzy">模糊 (全部詞)</option>
          </select>
          <select
            value={draft.platform}
            onChange={(e) => setDraft({ ...draft, platform: e.target.value as Platform })}
            className="px-3 py-2.5 bg-surface-3 rounded-lg border border-white/5 text-sm"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={99}
            value={draft.priority}
            onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })}
            className="px-3 py-2.5 bg-surface-3 rounded-lg border border-white/5 text-sm"
            placeholder="優先級 (1-99)"
          />
        </div>
        <textarea
          rows={2}
          placeholder="自動回覆文字 (例：嗨！我們的價格請看 https://...)"
          value={draft.reply}
          onChange={(e) => setDraft({ ...draft, reply: e.target.value })}
          className="w-full px-3 py-2.5 bg-surface-3 rounded-lg border border-white/5 text-sm"
        />
        <button
          onClick={add}
          disabled={!draft.keyword.trim() || !draft.reply.trim()}
          className="w-full bg-accent text-white py-2.5 rounded-lg font-semibold disabled:opacity-40 hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          <Plus size={16} /> 新增規則
        </button>
      </div>

      <div className="space-y-2">
        {rules.length === 0 ? (
          <div className="text-center py-10 opacity-50 text-sm">還沒有規則，新增第一條看看吧！</div>
        ) : (
          [...rules]
            .sort((a, b) => b.priority - a.priority)
            .map((r) => (
              <div
                key={r.id}
                className="bg-surface-2 rounded-xl p-4 border border-white/5 flex items-start gap-3"
              >
                <GripVertical size={16} className="opacity-30 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono px-2 py-0.5 bg-surface-3 rounded">
                      {PLATFORM_LABELS[r.platform]}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 bg-surface-3 rounded">
                      優先 {r.priority}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 bg-surface-3 rounded">
                      {r.matchMode}
                    </span>
                  </div>
                  <div className="font-mono text-sm text-accent break-all">{r.keyword}</div>
                  <div className="text-sm opacity-80 mt-1 break-words">{r.reply}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => toggle(r.id)}
                    className="text-xs px-2 py-1 rounded bg-surface-3 hover:opacity-80"
                  >
                    {r.enabled ? '停用' : '啟用'}
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
