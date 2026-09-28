'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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
    const newRule: Rule = { ...draft, id: `user-${crypto.randomUUID()}` }
    onChange([...rules, newRule])
    setDraft({ ...draft, keyword: '', reply: '' })
  }

  const remove = (id: string) => {
    onChange(rules.filter((r) => r.id !== id))
  }

  const toggle = (id: string) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  }

  const sorted = [...rules].sort((a, b) => b.priority - a.priority)

  const fieldStyle: React.CSSProperties = {
    background: 'var(--color-paper-soft)',
    borderColor: 'var(--color-line)',
    color: 'var(--color-ink)',
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-2xl border p-5 sm:p-6 space-y-3"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="editorial-eyebrow">新增規則</div>
            <h3 className="editorial-h2 mt-1 text-xl">建立一條 FAQ</h3>
          </div>
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>優先級高的先匹配</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="關鍵字 (例：價格、運費)"
            value={draft.keyword}
            onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
            className="px-3 py-2.5 rounded-lg border text-sm"
            style={fieldStyle}
          />
          <select
            value={draft.matchMode}
            onChange={(e) => setDraft({ ...draft, matchMode: e.target.value as MatchMode })}
            className="px-3 py-2.5 rounded-lg border text-sm"
            style={fieldStyle}
          >
            <option value="exact">精確包含</option>
            <option value="fuzzy">模糊 (全部詞)</option>
          </select>
          <select
            value={draft.platform}
            onChange={(e) => setDraft({ ...draft, platform: e.target.value as Platform })}
            className="px-3 py-2.5 rounded-lg border text-sm"
            style={fieldStyle}
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
            className="px-3 py-2.5 rounded-lg border text-sm"
            style={fieldStyle}
            placeholder="優先級 (1-99)"
          />
        </div>
        <textarea
          rows={2}
          placeholder="自動回覆文字 (例：嗨！我們的價格請看 https://...)"
          value={draft.reply}
          onChange={(e) => setDraft({ ...draft, reply: e.target.value })}
          className="w-full px-3 py-2.5 rounded-lg border text-sm"
          style={fieldStyle}
        />
        <button
          onClick={add}
          disabled={!draft.keyword.trim() || !draft.reply.trim()}
          className="w-full py-2.5 rounded-lg font-bold disabled:opacity-40 transition flex items-center justify-center gap-2"
          style={{ background: 'var(--color-orange)', color: '#fff' }}
        >
          <Plus size={16} /> 新增規則
        </button>
      </section>

      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div
            className="text-center py-12 rounded-2xl border text-sm"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}
          >
            還沒有規則，新增第一條看看吧！
          </div>
        ) : (
          sorted.map((r) => (
            <div
              key={r.id}
              className="rounded-xl p-4 border flex items-start gap-3"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-line)',
                opacity: r.enabled ? 1 : 0.6,
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'var(--color-paper-soft)', color: 'var(--color-muted-strong)' }}>
                    {PLATFORM_LABELS[r.platform]}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'var(--color-paper-soft)', color: 'var(--color-muted-strong)' }}>
                    優先 {r.priority}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'var(--color-paper-soft)', color: 'var(--color-muted-strong)' }}>
                    {r.matchMode}
                  </span>
                  {!r.enabled && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'var(--color-gold-soft)', color: 'var(--color-gold-strong)' }}>
                      已停用
                    </span>
                  )}
                </div>
                <div className="font-mono text-sm break-all" style={{ color: 'var(--color-forest-strong)' }}>{r.keyword}</div>
                <div className="text-sm mt-1 break-words leading-relaxed" style={{ color: 'var(--color-ink-soft)' }}>{r.reply}</div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => toggle(r.id)}
                  className="text-xs px-2 py-1 rounded font-semibold border"
                  style={{
                    background: 'var(--color-paper-soft)',
                    borderColor: 'var(--color-line)',
                    color: r.enabled ? 'var(--color-forest-strong)' : 'var(--color-muted-strong)',
                  }}
                >
                  {r.enabled ? '停用' : '啟用'}
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="text-xs px-2 py-1 rounded border flex items-center justify-center"
                  style={{ background: 'var(--color-paper-soft)', borderColor: 'var(--color-line)', color: 'var(--color-danger)' }}
                  aria-label={`刪除規則 ${r.keyword}`}
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
