'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { useStore } from './hooks/useStore'
import { PLATFORMS, PLATFORM_LABELS, type Comment, type Rule } from './lib/types'
import { matchRule, avatarFor } from './lib/matcher'
import { DEFAULT_FAQS } from './lib/defaultFaqs'
import {
  findSensitiveWords,
  containsChinese,
  containsEnglish,
} from './lib/v3features'
import { RulesTable } from './components/RulesTable'
import { StatsCards } from './components/StatsCards'
import { Bookmarklet } from './components/Bookmarklet'
import {
  Sparkles, Settings, BarChart3, Send, Sun, Moon, Trash2, MessageSquare,
  Copy, Check, Download, Upload, Plus, ImageIcon, Wand2,
} from 'lucide-react'

type Tab = 'composer' | 'rules' | 'stats' | 'extension'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'composer', label: '工作台', icon: MessageSquare },
  { id: 'rules', label: 'FAQ 規則', icon: Settings },
  { id: 'stats', label: '規則分析', icon: BarChart3 },
  { id: 'extension', label: '瀏覽器擴充', icon: Send },
]

// ─── Image-comment detection ─────────────────────────────────────────────
// Image comments are routed to human handling. We deliberately do NOT add
// OCR or any image-understanding capability — this MVP is paste-and-match
// only. We treat placeholder markers as the canonical image signal so
// that copy-pasted comments from social apps (e.g. "[圖片]", "[image]")
// fall through to the human-review queue.
const IMAGE_PATTERNS: RegExp[] = [
  /\[(圖片?|image|photo)\]/i,
  /圖：|image:|photo:/i,
]
export function looksLikeImageComment(text: string): boolean {
  return IMAGE_PATTERNS.some((re) => re.test(text))
}

function detectLanguage(text: string): 'zh' | 'en' | 'mixed' {
  const zh = containsChinese(text)
  const en = containsEnglish(text)
  if (zh && en) return 'mixed'
  if (zh) return 'zh'
  if (en) return 'en'
  return 'mixed'
}

// ─── Sample comments used by the manual / sample-mode simulator ────────
// These stay illustrative. They are clearly labelled in the UI; the tool
// never claims to fetch or publish real social data.
const SAMPLE_NAMES = ['小明', '美美', '阿德', 'Yuki', 'Leo', 'Kelly', '阿信', 'Vivian', 'Max', '小芳', 'John', 'May', 'Kai', 'Lulu', 'Ben']
const SAMPLE_TEMPLATES = [
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

function sampleComments(): Comment[] {
  return SAMPLE_TEMPLATES.map((text, i) => ({
    id: `sample-${crypto.randomUUID()}`,
    name: SAMPLE_NAMES[i % SAMPLE_NAMES.length],
    avatar: avatarFor(SAMPLE_NAMES[i % SAMPLE_NAMES.length]),
    text,
    time: `${i + 1} 分鐘前`,
    status: 'pending' as const,
    language: detectLanguage(text),
  }))
}

// ─────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { state, update, hydrated } = useStore()
  const [activeTab, setActiveTab] = useState<Tab>('composer')
  const [pasteText, setPasteText] = useState('')
  const [pasteName, setPasteName] = useState('')
  const [pastePlatform, setPastePlatform] = useState<'facebook' | 'instagram' | 'twitter' | 'threads' | 'generic'>('facebook')

  // Classify the pasted comment against current rules. Image comments and
  // sensitive-text comments bypass matching and surface human-review UI.
  const evaluated = useMemo(() => {
    const sensitive = findSensitiveWords(pasteText)
    const isImage = looksLikeImageComment(pasteText)
    const matched = sensitive.length > 0 || isImage ? null : matchRule(pasteText, state.rules)
    return { matched, sensitive, isImage }
  }, [pasteText, state.rules])

  // Re-classify queue comments whenever rules change so the stats/list view
  // stays in sync. Image comments stay needs-review.
  const classified = useMemo(() => {
    return state.comments.map((c) => {
      if (c.isImage || findSensitiveWords(c.text).length > 0) {
        return { ...c, status: 'needs-review' as const, triggeredRule: undefined }
      }
      const rule = matchRule(c.text, state.rules)
      if (rule) return { ...c, status: 'auto-replied' as const, triggeredRule: rule.keyword }
      if (state.rules.some((r) => r.enabled)) return { ...c, status: 'no-match' as const }
      return c
    })
  }, [state.comments, state.rules])

  const ingestPaste = useCallback(() => {
    const text = pasteText.trim()
    if (!text) return
    const isImage = looksLikeImageComment(text)
    const hasSensitiveWords = findSensitiveWords(text).length > 0
    const matchedRule = isImage || hasSensitiveWords ? null : matchRule(text, state.rules)
    const name = pasteName.trim() || '訪客'
    const newComment: Comment = {
      id: `paste-${crypto.randomUUID()}`,
      name,
      avatar: avatarFor(name),
      text,
      time: '剛剛',
      status: isImage || hasSensitiveWords
        ? 'needs-review'
        : matchedRule
          ? 'auto-replied'
          : state.rules.some((r) => r.enabled)
            ? 'no-match'
            : 'pending',
      triggeredRule: matchedRule?.keyword,
      language: detectLanguage(text),
      isImage,
    }
    update({ comments: [newComment, ...state.comments].slice(0, 200) })
    setPasteText('')
    setPasteName('')
  }, [pasteText, pasteName, state.rules, state.comments, update])

  const ingestSamples = useCallback(() => {
    const samples = sampleComments()
    update({ comments: [...samples, ...state.comments].slice(0, 200) })
    setActiveTab('stats')
  }, [state.comments, update])

  const removeComment = useCallback((id: string) => {
    update({ comments: state.comments.filter((c) => c.id !== id) })
  }, [state.comments, update])

  const clearAll = () => {
    if (confirm('確定要清除所有資料？此操作不可復原')) {
      localStorage.removeItem('sc-app-store-v2')
      location.reload()
    }
  }

  // JSON 匯出 — payload schema unchanged so existing exports remain valid.
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

  // JSON 匯入 — preserves the original validation + confirm flow.
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
    e.target.value = ''
  }

  // 重置為預設 50 FAQ
  const restoreDefaults = () => {
    if (!confirm(`將重置為 ${DEFAULT_FAQS.length} 條預載 FAQ（會清除自訂規則）。繼續？`)) return
    update({ rules: DEFAULT_FAQS })
  }

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.classList.toggle('light', state.theme === 'light')
  }, [state.theme])

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
      <header className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ background: 'color-mix(in oklab, var(--color-paper) 78%, transparent)', borderColor: 'var(--color-line)' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
              style={{ background: 'var(--color-forest-strong)' }}
              aria-hidden
            >
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-lg sm:text-xl leading-tight truncate">社群留言工作台</h1>
              <div className="editorial-eyebrow mt-0.5 hidden sm:block">Comment Reply Workbench · v3</div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button onClick={exportJSON} className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] opacity-70 hover:opacity-100" aria-label="匯出 JSON" title="匯出 JSON 備份">
              <Download size={16} />
            </button>
            <label className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] opacity-70 hover:opacity-100 cursor-pointer" aria-label="匯入 JSON" title="匯入 JSON 備份">
              <Upload size={16} />
              <input type="file" accept=".json" onChange={importJSON} className="hidden" />
            </label>
            <button
              onClick={() => update({ theme: state.theme === 'dark' ? 'light' : 'dark' })}
              className="p-2 rounded-lg hover:bg-[var(--color-surface-2)]"
              aria-label="切換主題"
              title={state.theme === 'dark' ? '切換至亮色' : '切換至深色'}
            >
              {state.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={clearAll} className="p-2 rounded-lg hover:bg-[var(--color-danger-soft)] text-[var(--color-danger)]" aria-label="清除所有資料" title="清除所有資料">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <nav className="max-w-6xl mx-auto px-5 sm:px-8 flex gap-1 overflow-x-auto" aria-label="主分頁">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 sm:px-4 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                  active ? '' : 'opacity-60 hover:opacity-100'
                }`}
                style={
                  active
                    ? { borderColor: 'var(--color-orange)', color: 'var(--color-ink)' }
                    : { borderColor: 'transparent', color: 'var(--color-muted-strong)' }
                }
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 space-y-6 animate-fade-in">
        {activeTab === 'composer' && (
          <ComposerWorkspace
            text={pasteText}
            name={pasteName}
            platform={pastePlatform}
            onTextChange={setPasteText}
            onNameChange={setPasteName}
            onPlatformChange={setPastePlatform}
            evaluated={evaluated}
            enabledRuleCount={state.rules.filter((r) => r.enabled).length}
            rules={state.rules}
            onIngest={ingestPaste}
            onIngestSamples={ingestSamples}
            recent={classified.slice(0, 6)}
            onRemove={removeComment}
            onJumpToRules={() => setActiveTab('rules')}
            onAddRule={(keyword, reply) => {
              const id = `user-${crypto.randomUUID()}`
              const newRule: Rule = { id, keyword, reply, matchMode: 'exact', enabled: true, priority: 50, platform: 'generic' }
              update({ rules: [...state.rules, newRule] })
              alert(`已新增 FAQ「${keyword}」`)
            }}
          />
        )}

        {activeTab === 'rules' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <div className="editorial-eyebrow">Section · 02</div>
                <h2 className="editorial-h2 mt-1">FAQ 規則庫</h2>
                <p className="editorial-lede mt-2">
                  設定關鍵字與對應回覆，留言比對時優先級高的先匹配。目前{' '}
                  <strong className="text-[var(--color-ink)]">{state.rules.length}</strong> 條規則
                  （<strong className="text-[var(--color-forest)]">{state.rules.filter((r) => r.enabled).length}</strong> 啟用）。
                </p>
              </div>
              <button
                onClick={restoreDefaults}
                className="text-xs px-3 py-2 rounded-lg font-semibold border hover:opacity-90 self-start sm:self-auto"
                style={{ borderColor: 'var(--color-line)', color: 'var(--color-muted-strong)', background: 'var(--color-surface)' }}
              >
                ↻ 重置為 {DEFAULT_FAQS.length} 條預載 FAQ
              </button>
            </div>
            <RulesTable rules={state.rules} onChange={(rules) => update({ rules })} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-5">
            <div>
              <div className="editorial-eyebrow">Section · 03</div>
              <h2 className="editorial-h2 mt-1">留言規則分析</h2>
              <p className="editorial-lede mt-2">
                {state.comments.length === 0
                  ? '在工作台貼上留言後，會在這裡看到累計的匹配、覆蓋率與最常被觸發的關鍵字。'
                  : `已根據 ${state.rules.filter((r) => r.enabled).length} 條啟用規則分析 ${state.comments.length} 則留言。`}
              </p>
            </div>
            <StatsCards comments={classified} />
            {classified.length > 0 && (
              <CommentList
                comments={classified}
                rules={state.rules}
                onAddRule={(keyword, reply) => {
                  const id = `user-${crypto.randomUUID()}`
                  const newRule: Rule = { id, keyword, reply, matchMode: 'exact', enabled: true, priority: 50, platform: 'generic' }
                  update({ rules: [...state.rules, newRule] })
                  alert(`已新增 FAQ「${keyword}」`)
                }}
                onRemove={removeComment}
              />
            )}
          </div>
        )}

        {activeTab === 'extension' && <Bookmarklet />}
      </main>

      <footer className="max-w-6xl mx-auto px-5 sm:px-8 py-10 text-xs opacity-60 text-center border-t mt-12" style={{ borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}>
        社群留言工作台 v3.0 — 純前端、零 API Key · 本工具為<strong className="text-[var(--color-ink)]">規則設計助手</strong>，不會自動發送留言到任何社群平台。
      </footer>
    </div>
  )
}

// ─── Composer Workspace ──────────────────────────────────────────────────
// The primary paste → match → copy surface. The editor evaluates matching
// inline as the user types so the matched rule + reply are always visible
// before the comment is added to the queue.

function ComposerWorkspace(props: {
  text: string
  name: string
  platform: 'facebook' | 'instagram' | 'twitter' | 'threads' | 'generic'
  onTextChange: (v: string) => void
  onNameChange: (v: string) => void
  onPlatformChange: (v: 'facebook' | 'instagram' | 'twitter' | 'threads' | 'generic') => void
  evaluated: { matched: Rule | null; sensitive: string[]; isImage: boolean }
  enabledRuleCount: number
  rules: Rule[]
  onIngest: () => void
  onIngestSamples: () => void
  recent: Comment[]
  onRemove: (id: string) => void
  onJumpToRules: () => void
  onAddRule: (keyword: string, reply: string) => void
}) {
  const { text, evaluated, enabledRuleCount, rules, onIngest, onIngestSamples, recent, onRemove, onJumpToRules, onAddRule } = props
  const [copied, setCopied] = useState(false)

  const trimmed = text.trim()
  const canSubmit = trimmed.length > 0

  const copyReply = async () => {
    if (!evaluated.matched) return
    try {
      await navigator.clipboard.writeText(evaluated.matched.reply)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  // Decide what to show in the preview pane.
  let previewKind: 'image' | 'sensitive' | 'match' | 'no-match' | 'empty' | 'idle'
  if (!trimmed) previewKind = 'idle'
  else if (evaluated.isImage) previewKind = 'image'
  else if (evaluated.sensitive.length > 0) previewKind = 'sensitive'
  else if (evaluated.matched) previewKind = 'match'
  else if (enabledRuleCount > 0) previewKind = 'no-match'
  else previewKind = 'empty'

  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-2xl paper-grain p-6 sm:p-8 border"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-line)',
          boxShadow: 'var(--shadow-soft)',
        }}
      >
        <div className="editorial-eyebrow">Section · 01 · 貼上 → 匹配 → 複製</div>
        <h2 className="editorial-h1 mt-2">把留言貼進來，<br className="hidden sm:block" />看看哪一條 FAQ 適合回。</h2>
        <p className="editorial-lede mt-3">
          在留言框貼上（或輸入）一則來自社群平台的公開留言，工具會即時比對已啟用的 FAQ 規則並預覽建議回覆；
          只有按下「複製」按鈕後才會把回覆寫入剪貼簿，請再回到原生社群 App 貼上送出。
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SamplePill />
          <Pill tone="forest">無帳號連線 · 資料留在本機</Pill>
          <Pill tone="muted">{DEFAULT_FAQS.length} 條預載 FAQ · {enabledRuleCount} 條啟用中</Pill>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Composer card */}
        <section className="rounded-2xl border p-5 sm:p-6 space-y-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-line)' }}>
          <div>
            <label className="editorial-eyebrow block mb-2" htmlFor="paste-text">公開留言原文</label>
            <textarea
              id="paste-text"
              rows={6}
              placeholder="例：請問運費怎麼算？ · 或在文字中加入 [圖片] 標記"
              value={text}
              onChange={(e) => props.onTextChange(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border text-[15px] leading-relaxed resize-y"
              style={{ background: 'var(--color-paper-soft)', borderColor: 'var(--color-line)' }}
            />
            <div className="mt-1.5 text-xs flex items-center justify-between" style={{ color: 'var(--color-muted)' }}>
              <span>{trimmed.length} 字 · 偵測語言：{detectLanguageLabel(trimmed)}</span>
              {evaluated.sensitive.length > 0 && (
                <span style={{ color: 'var(--color-danger)' }}>
                  偵測到敏感詞：{evaluated.sensitive.join('、')}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="editorial-eyebrow block mb-2" htmlFor="paste-name">留言者（選填）</label>
              <input
                id="paste-name"
                type="text"
                value={props.name}
                onChange={(e) => props.onNameChange(e.target.value)}
                placeholder="訪客"
                className="w-full px-3 py-2.5 rounded-lg border text-sm"
                style={{ background: 'var(--color-paper-soft)', borderColor: 'var(--color-line)' }}
              />
            </div>
            <div>
              <label className="editorial-eyebrow block mb-2" htmlFor="paste-platform">來源平台</label>
              <select
                id="paste-platform"
                value={props.platform}
                onChange={(e) => props.onPlatformChange(e.target.value as 'facebook' | 'instagram' | 'twitter' | 'threads' | 'generic')}
                className="w-full px-3 py-2.5 rounded-lg border text-sm"
                style={{ background: 'var(--color-paper-soft)', borderColor: 'var(--color-line)' }}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onIngest}
              disabled={!canSubmit}
              className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition"
              style={{ background: 'var(--color-orange)', color: '#fff' }}
            >
              <Plus size={16} /> 加入待處理佇列
            </button>
            <button
              onClick={onIngestSamples}
              className="px-4 py-3 rounded-xl font-semibold border flex items-center justify-center gap-2 hover:opacity-90"
              style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink-soft)', background: 'var(--color-paper-soft)' }}
              title="把示意留言加到佇列，方便測試規則覆蓋率"
            >
              <Wand2 size={16} /> 載入示意留言（10 則）
            </button>
          </div>
        </section>

        {/* Preview / match card */}
        <section
          className="rounded-2xl border p-5 sm:p-6 space-y-4"
          style={{
            background: previewBackground(previewKind),
            borderColor: previewBorder(previewKind),
          }}
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="editorial-eyebrow">預覽 · 即時匹配</div>
              <h3 className="editorial-h2 mt-1 text-xl sm:text-2xl">{previewTitle(previewKind)}</h3>
            </div>
            {previewKind === 'match' && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded"
                style={{ background: 'var(--color-forest-soft)', color: 'var(--color-forest-strong)' }}
              >
                找到規則 · 回覆尚未複製
              </span>
            )}
          </div>

          {previewKind === 'idle' && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted-strong)' }}>
              開始輸入或貼上留言後，這裡會即時顯示比對結果。
            </p>
          )}

          {previewKind === 'empty' && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted-strong)' }}>
              目前沒有啟用的 FAQ 規則。前往「FAQ 規則」分頁新增一條，或重置為 {DEFAULT_FAQS.length} 條預載 FAQ。
            </p>
          )}

          {previewKind === 'image' && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-gold-strong)' }}>
                <ImageIcon size={14} className="inline mr-1 -mt-0.5" />
                貼上的文字含有 [圖片] / [image] 等標記，因此會轉交人工處理。本工具只辨識文字標記，不會偵測圖片附件，也不做 OCR 或影像理解。
              </p>
              <button
                onClick={onIngest}
                className="w-full py-2.5 rounded-lg font-semibold border"
                style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold-strong)', background: 'var(--color-paper-soft)' }}
              >
                仍加入佇列（標記人工處理）
              </button>
            </div>
          )}

          {previewKind === 'sensitive' && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-danger)' }}>
              偵測到敏感詞彙（{evaluated.sensitive.join('、')}），本工具不會自動建議回覆，請人工查看。
            </p>
          )}

          {previewKind === 'no-match' && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-soft)' }}>
                目前沒有任何啟用規則比對到這則留言。
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    const suggested = trimmed.slice(0, 10)
                    const reply = prompt(`為「${trimmed}」新增回覆模板：`, `您好，感謝您的留言！我們會盡快回覆您關於「${suggested}」的問題。`)
                    if (reply) onAddRule(suggested, reply)
                  }}
                  className="flex-1 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2"
                  style={{ background: 'var(--color-gold-soft)', color: 'var(--color-gold-strong)' }}
                >
                  <Plus size={14} /> 建議新增 FAQ
                </button>
                <button
                  onClick={onJumpToRules}
                  className="px-3 py-2.5 rounded-lg font-semibold border"
                  style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink-soft)' }}
                >
                  前往規則庫
                </button>
              </div>
            </div>
          )}

          {previewKind === 'match' && evaluated.matched && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded font-mono"
                  style={{ background: 'var(--color-paper-soft)', color: 'var(--color-forest-strong)' }}
                >
                  關鍵字 · {evaluated.matched.keyword}
                </span>
                <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: 'var(--color-paper-soft)', color: 'var(--color-muted-strong)' }}>
                  優先 {evaluated.matched.priority}
                </span>
                <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: 'var(--color-paper-soft)', color: 'var(--color-muted-strong)' }}>
                  {evaluated.matched.matchMode}
                </span>
                <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: 'var(--color-paper-soft)', color: 'var(--color-muted-strong)' }}>
                  {PLATFORM_LABELS[evaluated.matched.platform]}
                </span>
              </div>
              <div
                className="rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ background: 'var(--color-paper-soft)', color: 'var(--color-ink-soft)' }}
              >
                {evaluated.matched.reply}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={copyReply}
                  className="flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition"
                  style={{ background: 'var(--color-orange)', color: '#fff' }}
                >
                  {copied ? <><Check size={14} /> 已複製</> : <><Copy size={14} /> 複製回覆到剪貼簿</>}
                </button>
                <button
                  onClick={onIngest}
                  className="px-3 py-2.5 rounded-lg font-semibold border"
                  style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink-soft)' }}
                >
                  同時加入佇列
                </button>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                工具不會代替你送出。複製後請回到 Facebook / Instagram / Threads 的留言處貼上、回覆。
              </p>
            </div>
          )}
        </section>
      </div>

      {recent.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="editorial-eyebrow">佇列 · 最近 6 則</div>
              <h3 className="editorial-h2 mt-1">最近處理的留言</h3>
            </div>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>完整列表請見「規則分析」分頁</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {recent.map((c) => (
              <CommentCard
                key={c.id}
                c={c}
                rules={rules}
                compact
                onRemove={() => onRemove(c.id)}
                onAddRule={(kw, reply) => onAddRule(kw, reply)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function CommentList({ comments, rules, onAddRule, onRemove }: { comments: Comment[]; rules: Rule[]; onAddRule: (kw: string, reply: string) => void; onRemove?: (id: string) => void }) {
  if (!comments.length) return null
  return (
    <div className="space-y-3">
      <div className="editorial-eyebrow">完整佇列</div>
      {comments.map((c) => (
        <CommentCard key={c.id} c={c} rules={rules} onAddRule={onAddRule} onRemove={onRemove} />
      ))}
    </div>
  )
}

function CommentCard({ c, rules, onAddRule, onRemove, compact }: { c: Comment; rules: Rule[]; onAddRule: (kw: string, reply: string) => void; onRemove?: (id: string) => void; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const replyText = c.triggeredRule ? rules.find((r) => r.keyword === c.triggeredRule)?.reply || '' : ''

  const copy = () => {
    if (!replyText) return
    navigator.clipboard.writeText(replyText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const statusLabel =
    c.status === 'auto-replied' ? `找到規則「${c.triggeredRule}」 · 待複製`
    : c.status === 'no-match' ? '無匹配'
    : c.status === 'needs-review' ? '需人工處理'
    : '待處理'

  const statusStyle = (() => {
    if (c.status === 'auto-replied') return { background: 'var(--color-forest-soft)', color: 'var(--color-forest-strong)' }
    if (c.status === 'no-match') return { background: 'var(--color-gold-soft)', color: 'var(--color-gold-strong)' }
    if (c.status === 'needs-review') return { background: 'var(--color-danger-soft)', color: 'var(--color-danger)' }
    return { background: 'var(--color-blue-soft)', color: 'var(--color-blue-strong)' }
  })()

  return (
    <div
      className={`rounded-xl border p-4 flex items-start gap-3 ${compact ? 'min-h-0' : ''}`}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
    >
      <Image
        src={c.avatar}
        alt={c.name}
        width={40}
        height={40}
        unoptimized
        className="w-10 h-10 rounded-full flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-bold text-sm">{c.name}</span>
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{c.time}</span>
          {c.language && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--color-paper-soft)', color: 'var(--color-muted-strong)' }}>
              {c.language.toUpperCase()}
            </span>
          )}
          {c.isImage && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded inline-flex items-center gap-1" style={{ background: 'var(--color-gold-soft)', color: 'var(--color-gold-strong)' }}>
              <ImageIcon size={10} /> 圖片
            </span>
          )}
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider" style={statusStyle}>
            {statusLabel}
          </span>
        </div>
        <div className="text-sm leading-relaxed break-words" style={{ color: 'var(--color-ink)' }}>{c.text}</div>

        {c.status === 'auto-replied' && c.triggeredRule && (
          <div
            className="mt-2 px-3 py-2 rounded text-xs flex items-start gap-2"
            style={{ background: 'var(--color-paper-soft)', color: 'var(--color-ink-soft)' }}
          >
            <div className="flex-1 min-w-0">
              <span className="block mb-1 text-[10px] font-bold" style={{ color: 'var(--color-muted-strong)' }}>
                建議回覆 · 複製後手動貼上
              </span>
              <span className="whitespace-pre-wrap">{replyText}</span>
            </div>
            <button
              onClick={copy}
              className="flex-shrink-0 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1"
              style={{ background: 'var(--color-orange-soft)', color: 'var(--color-orange-strong)' }}
              title="複製回覆到剪貼簿"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? '已複製' : '複製'}
            </button>
          </div>
        )}

        {c.status === 'no-match' && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--color-gold-strong)' }}>未匹配，建議新增 FAQ</span>
            <button
              onClick={() => {
                const suggested = c.text.slice(0, 10)
                const reply = prompt(`為「${c.text}」新增回覆模板：`, `您好，感謝您的留言！我們會盡快回覆您關於「${suggested}」的問題。`)
                if (reply) onAddRule(suggested, reply)
              }}
              className="text-xs px-2 py-1 rounded font-semibold flex items-center gap-1"
              style={{ background: 'var(--color-gold-soft)', color: 'var(--color-gold-strong)' }}
            >
              <Plus size={12} /> 加入 FAQ
            </button>
          </div>
        )}

        {c.status === 'needs-review' && (
          <p className="mt-2 text-xs" style={{ color: 'var(--color-danger)' }}>
            {c.isImage
              ? '此文字含圖片標記；本工具不偵測圖片附件，也不做 OCR，請人工查看後處理。'
              : `留言含敏感詞（${findSensitiveWords(c.text).join('、')}），請人工檢視後再處理。`}
          </p>
        )}
      </div>
      {onRemove && (
        <button
          onClick={() => onRemove(c.id)}
          className="opacity-50 hover:opacity-100 p-1"
          style={{ color: 'var(--color-danger)' }}
          aria-label="從佇列移除"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

// ─── Small visual primitives ─────────────────────────────────────────────

function SamplePill() {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
      style={{
        background: 'var(--color-gold-soft)',
        color: 'var(--color-gold-strong)',
        borderColor: 'var(--color-orange-border)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-gold)' }} />
      示意模式 · 沒有真實留言
    </span>
  )
}

function Pill({ tone, children }: { tone: 'forest' | 'muted'; children: React.ReactNode }) {
  const style = tone === 'forest'
    ? { background: 'var(--color-forest-soft)', color: 'var(--color-forest-strong)' }
    : { background: 'var(--color-paper-soft)', color: 'var(--color-muted-strong)' }
  return (
    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={style}>
      {children}
    </span>
  )
}

function previewBackground(kind: 'image' | 'sensitive' | 'match' | 'no-match' | 'empty' | 'idle') {
  switch (kind) {
    case 'match':
      return 'var(--color-forest-soft)'
    case 'no-match':
      return 'var(--color-gold-soft)'
    case 'image':
      return 'var(--color-gold-soft)'
    case 'sensitive':
      return 'var(--color-danger-soft)'
    default:
      return 'var(--color-surface)'
  }
}

function previewBorder(kind: 'image' | 'sensitive' | 'match' | 'no-match' | 'empty' | 'idle') {
  switch (kind) {
    case 'match':
      return 'var(--color-forest-border)'
    case 'no-match':
      return 'var(--color-orange-border)'
    case 'image':
      return 'var(--color-orange-border)'
    case 'sensitive':
      return 'var(--color-danger)'
    default:
      return 'var(--color-line)'
  }
}

function previewTitle(kind: 'image' | 'sensitive' | 'match' | 'no-match' | 'empty' | 'idle') {
  switch (kind) {
    case 'match':
      return '找到對應規則'
    case 'no-match':
      return '沒有規則對應'
    case 'image':
      return '圖片留言 → 人工處理'
    case 'sensitive':
      return '偵測到敏感詞'
    case 'empty':
      return '尚未啟用任何 FAQ'
    default:
      return '等待留言'
  }
}

function detectLanguageLabel(text: string) {
  if (!text.trim()) return '—'
  const lang = detectLanguage(text)
  if (lang === 'zh') return '中文'
  if (lang === 'en') return 'English'
  return '中英混合'
}

// Suppress lint about unused icons
export { Settings }
