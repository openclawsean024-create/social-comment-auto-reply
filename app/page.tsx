'use client'

import { useState, useEffect, useMemo } from 'react'
import { useStore } from './hooks/useStore'
import { PLATFORMS, PLATFORM_LABELS, type Comment, type Rule } from './lib/types'
import { matchRule, avatarFor } from './lib/matcher'
import { DEFAULT_FAQS } from './lib/defaultFaqs'
import { RulesTable } from './components/RulesTable'
import { StatsCards } from './components/StatsCards'
import { Bookmarklet } from './components/Bookmarklet'
import {
  ArrowRight, ArrowLeft, Sparkles, Settings, BarChart3, Send,
  Sun, Moon, Trash2, MessageSquare, Copy, Check, Download, Upload, Plus,
} from 'lucide-react'

type Tab = 'composer' | 'rules' | 'stats' | 'extension'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'composer', label: '貼文/留言', icon: MessageSquare },
  { id: 'rules', label: '規則', icon: Settings },
  { id: 'stats', label: '統計', icon: BarChart3 },
  { id: 'extension', label: '瀏覽器擴充', icon: Send },
]

/**
 * Generate mock comments from post content (deterministic).
 * Real comments would come from FB Graph API — but v1.0 is design-assistant-only.
 */
function mockCommentsFromPost(content: string): Comment[] {
  if (!content.trim()) return []
  const seed = [...content].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const names = ['小明', '美美', '阿德', 'Yuki', 'Leo', 'Kelly', '阿信', 'Vivian', 'Max', '小芳', 'John', 'May', 'Kai', 'Lulu', 'Ben']
  const templates = [
    '請問價格多少？',
    '運費怎麼算？',
    '有現貨嗎？',
    '可以超商取貨嗎？',
    '請問營業時間？',
    '有折扣嗎',
    '這個怎麼用？',
    '請問品質好嗎',
    '我可以合作嗎？',
    '謝謝分享',
  ]
  return templates.map((text, i) => ({
    id: `c${i}`,
    name: names[(seed + i) % names.length],
    avatar: avatarFor(names[(seed + i) % names.length]),
    text,
    time: `${i + 1} 分鐘前`,
    status: 'pending',
  }))
}

export default function HomePage() {
  const { state, update, hydrated } = useStore()
  const [activeTab, setActiveTab] = useState<Tab>('composer')

  // Re-classify comments whenever rules change
  const classified = useMemo(() => {
    return state.comments.map((c) => {
      const rule = matchRule(c.text, state.rules)
      if (rule) return { ...c, status: 'auto-replied' as const, triggeredRule: rule.keyword }
      if (state.rules.some((r) => r.enabled)) return { ...c, status: 'no-match' as const }
      return c
    })
  }, [state.comments, state.rules])

  const ingestComments = () => {
    const newComments = mockCommentsFromPost(state.post.content)
    update({ comments: newComments })
    if (newComments.length > 0) {
      setActiveTab('stats')
    }
  }

  const clearAll = () => {
    if (confirm('確定要清除所有資料？此操作不可復原')) {
      localStorage.removeItem('sc-app-store-v2')
      location.reload()
    }
  }

  // JSON 匯出
  const exportJSON = () => {
    const data = { rules: state.rules, comments: state.comments, post: state.post, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comment-reply-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // JSON 匯入
  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!data.rules || !Array.isArray(data.rules)) {
          alert('檔案格式不正確（缺少 rules 陣列）')
          return
        }
        if (!confirm(`將匯入 ${data.rules.length} 條規則、${data.comments?.length || 0} 則留言。繼續？`)) return
        update({ rules: data.rules, comments: data.comments || [], post: data.post || state.post })
        alert('匯入成功')
      } catch (err) {
        alert('JSON 解析失敗：' + (err as Error).message)
      }
    }
    reader.readAsText(file)
    e.target.value = '' // reset
  }

  // 重置為預設 50 FAQ
  const restoreDefaults = () => {
    if (!confirm(`將重置為 ${DEFAULT_FAQS.length} 條預載 FAQ（會清除自訂規則）。繼續？`)) return
    update({ rules: DEFAULT_FAQS })
  }

  // Apply theme class
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.classList.toggle('light', state.theme === 'light')
  }, [state.theme])

  // Expose rules for bookmarklet
  useEffect(() => {
    if (typeof window === 'undefined') return
    ;(window as unknown as { __SC_RULES__: Rule[] }).__SC_RULES__ = state.rules
  }, [state.rules])

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm opacity-60">
        載入中…
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-bg/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-base font-black">社群留言自動回覆</h1>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] opacity-50">
                Comment Auto-Reply Designer
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportJSON}
              className="p-2 rounded-lg hover:bg-surface-2 opacity-70 hover:opacity-100"
              aria-label="匯出 JSON"
              title="匯出 JSON 備份"
            >
              <Download size={16} />
            </button>
            <label
              className="p-2 rounded-lg hover:bg-surface-2 opacity-70 hover:opacity-100 cursor-pointer"
              aria-label="匯入 JSON"
              title="匯入 JSON 備份"
            >
              <Upload size={16} />
              <input type="file" accept=".json" onChange={importJSON} className="hidden" />
            </label>
            <button
              onClick={() => update({ theme: state.theme === 'dark' ? 'light' : 'dark' })}
              className="p-2 rounded-lg hover:bg-surface-2"
              aria-label="切換主題"
            >
              {state.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={clearAll}
              className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"
              aria-label="清除所有資料"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="max-w-6xl mx-auto px-5 flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === t.id
                    ? 'border-accent text-white'
                    : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8 space-y-6 animate-fade-in">
        {activeTab === 'composer' && (
          <ComposerStep
            post={state.post}
            onChange={(post) => update({ post })}
            onNext={ingestComments}
          />
        )}

        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold mb-1">自動回覆規則</h2>
                <p className="text-sm opacity-60">
                  設定關鍵字與對應回覆，留言比對時優先級高的先匹配。
                  目前 {state.rules.length} 條規則（{state.rules.filter((r) => r.enabled).length} 啟用）。
                </p>
              </div>
              <button
                onClick={restoreDefaults}
                className="text-xs px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 opacity-70 hover:opacity-100 flex items-center gap-1"
              >
                ↻ 重置為 {DEFAULT_FAQS.length} 條預載 FAQ
              </button>
            </div>
            <RulesTable
              rules={state.rules}
              onChange={(rules) => update({ rules })}
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold mb-1">留言統計</h2>
              <p className="text-sm opacity-60">
                {state.comments.length === 0
                  ? '貼上貼文並產生模擬留言後，會在這裡看到統計結果。'
                  : `已根據 ${state.rules.filter((r) => r.enabled).length} 條啟用規則分析 ${state.comments.length} 則留言。`}
              </p>
            </div>
            <StatsCards comments={classified} />
            {classified.length > 0 && (
              <CommentList
                comments={classified}
                rules={state.rules}
                onAddRule={(keyword, reply) => {
                  const id = `user-${Date.now()}`
                  const newRule: Rule = { id, keyword, reply, matchMode: 'exact', enabled: true, priority: 50, platform: 'generic' }
                  update({ rules: [...state.rules, newRule] })
                  alert(`已新增 FAQ「${keyword}」`)
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'extension' && <Bookmarklet />}
      </main>

      <footer className="max-w-6xl mx-auto px-5 py-8 text-xs opacity-50 text-center border-t border-white/5 mt-12">
        社群留言自動回覆 v2.0 — 純前端、零 API Key ｜ 規則設計助手，不實際發送留言
      </footer>
    </div>
  )
}

function ComposerStep({
  post,
  onChange,
  onNext,
}: {
  post: { content: string; url: string; platform: 'facebook' | 'instagram' | 'twitter' | 'threads' | 'generic' }
  onChange: (post: { content: string; url: string; platform: 'facebook' | 'instagram' | 'twitter' | 'threads' | 'generic' }) => void
  onNext: () => void
}) {
  const valid = post.content.trim().length > 0

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-black uppercase tracking-wider opacity-50 mb-1">Step 1</div>
        <h2 className="text-2xl font-bold mb-1">貼文設定</h2>
        <p className="text-sm opacity-60">貼上原始貼文內容、設定平台，然後產生模擬留言做規則測試。</p>
      </div>

      <div className="bg-surface-2 rounded-2xl p-6 border border-white/5 space-y-4">
        <div>
          <label className="text-xs font-black uppercase tracking-wider opacity-60 block mb-2">
            貼文內容
          </label>
          <textarea
            rows={5}
            placeholder="貼上你的貼文內容…(純文字即可)"
            value={post.content}
            onChange={(e) => onChange({ ...post, content: e.target.value })}
            className="w-full px-4 py-3 bg-surface-3 rounded-lg border border-white/5 text-sm"
          />
          <div className="text-xs opacity-50 mt-1">{post.content.length} 字</div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-black uppercase tracking-wider opacity-60 block mb-2">
              目標平台
            </label>
            <select
              value={post.platform}
              onChange={(e) =>
                onChange({ ...post, platform: e.target.value as 'facebook' | 'instagram' | 'twitter' | 'threads' | 'generic' })
              }
              className="w-full px-3 py-2.5 bg-surface-3 rounded-lg border border-white/5 text-sm"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider opacity-60 block mb-2">
              原始貼文 URL (選填)
            </label>
            <input
              type="url"
              placeholder="https://facebook.com/…"
              value={post.url}
              onChange={(e) => onChange({ ...post, url: e.target.value })}
              className="w-full px-3 py-2.5 bg-surface-3 rounded-lg border border-white/5 text-sm"
            />
          </div>
        </div>

        <button
          onClick={onNext}
          disabled={!valid}
          className="w-full bg-accent text-white py-3 rounded-xl font-bold disabled:opacity-40 hover:bg-accent-hover transition flex items-center justify-center gap-2"
        >
          產生模擬留言 → 前往規則 <ArrowRight size={16} />
        </button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-sm">
        <strong className="text-amber-300">⚠️ MVP 限制</strong>：本工具為<strong>規則設計助手</strong>，
        不會自動發送留言到 FB / IG。所有回覆實際上還是要從 <code>統計</code> 頁手動複製貼上。
      </div>
    </div>
  )
}

function CommentList({ comments, rules, onAddRule }: { comments: Comment[]; rules: Rule[]; onAddRule: (keyword: string, reply: string) => void }) {
  if (!comments.length) return null
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-black uppercase tracking-wider opacity-60">留言列表</h3>
      {comments.map((c) => (
        <CommentCard key={c.id} c={c} rules={rules} onAddRule={onAddRule} />
      ))}
    </div>
  )
}

function CommentCard({ c, rules, onAddRule }: { c: Comment; rules: Rule[]; onAddRule: (keyword: string, reply: string) => void }) {
  const [copied, setCopied] = useState(false)
  const replyText = c.triggeredRule ? rules.find((r) => r.keyword === c.triggeredRule)?.reply || '' : ''

  const copy = () => {
    if (!replyText) return
    navigator.clipboard.writeText(replyText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="bg-surface-2 rounded-xl p-4 border border-white/5 flex items-start gap-3">
      <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-bold text-sm">{c.name}</span>
          <span className="text-xs opacity-50">{c.time}</span>
          <span
            className={`ml-auto text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
              c.status === 'auto-replied'
                ? 'bg-emerald-500/20 text-emerald-300'
                : c.status === 'no-match'
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-blue-500/20 text-blue-300'
            }`}
          >
            {c.status === 'auto-replied'
              ? `✓ 匹配「${c.triggeredRule}」`
              : c.status === 'no-match'
              ? '無匹配'
              : '待處理'}
          </span>
        </div>
        <div className="text-sm opacity-90 break-words">{c.text}</div>
        {c.status === 'auto-replied' && c.triggeredRule && (
          <div className="mt-2 px-3 py-2 bg-surface-3 rounded text-xs opacity-80 flex items-start gap-2">
            <span className="flex-1">💬 {replyText}</span>
            <button
              onClick={copy}
              className="flex-shrink-0 px-2 py-0.5 rounded bg-accent/20 hover:bg-accent/30 text-accent flex items-center gap-1"
              title="複製回覆到剪貼簿"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span className="text-[10px]">{copied ? '已複製' : '複製'}</span>
            </button>
          </div>
        )}
        {c.status === 'no-match' && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-amber-300">💡 未匹配，建議新增 FAQ</span>
            <button
              onClick={() => {
                const suggested = c.text.slice(0, 10)
                const reply = prompt(`為「${c.text}」新增回覆模板：`, `您好，感謝您的留言！我們會盡快回覆您關於「${suggested}」的問題。`)
                if (reply) {
                  onAddRule(suggested, reply)
                }
              }}
              className="text-xs px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 flex items-center gap-1"
            >
              <Plus size={12} /> 加入 FAQ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Suppress lint about unused exports (re-exported for clarity)
export { ArrowLeft }
