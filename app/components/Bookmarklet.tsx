'use client'

import { useState } from 'react'
import { Code, Copy, Check } from 'lucide-react'

const JS_BODY = `
(function(){
  const RULES = window.__SC_RULES__ || [];
  const SENSITIVE = ['獨立','統一','統獨','幹','爛','fuck','shit','asshole','傻逼','白癡','身分證字號','密碼','信用卡號','客訴','投訴','申訴','退錢','消保官'];
  const IMAGE_MARKER = /\\[(圖片?|image|photo)\\]|圖：|image:|photo:/i;
  if (!RULES.length) { alert('請先在工具中設定自動回覆規則'); return; }
  document.querySelectorAll('[role="article"] [aria-label*="Comment"], [data-testid="comment"]').forEach((el, i) => {
    const text = el.innerText || '';
    if (IMAGE_MARKER.test(text) || SENSITIVE.some(word => text.toLowerCase().includes(word.toLowerCase()))) {
      console.log('[SC-bookmarklet] Needs human review; skipped FAQ matching:', text.slice(0, 60));
      return;
    }
    const matched = RULES.find(r => r.enabled && text.toLowerCase().includes(r.keyword.toLowerCase()));
    if (matched) {
      console.log('[SC-bookmarklet] Matched rule:', matched.keyword, 'on comment:', text.slice(0, 60));
    }
  });
  alert('SC: 已掃描留言，請查看 console log 看哪些匹配');
})();
`.trim()

const BOOKMARKLET = `javascript:${encodeURIComponent(JS_BODY)}`

export function Bookmarklet() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(JS_BODY)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-2xl border p-5 sm:p-6 space-y-3"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
      >
        <div className="editorial-eyebrow">瀏覽器擴充 · 預覽工具</div>
        <h2 className="editorial-h2 mt-1">Bookmarklet 安裝教學</h2>
        <p className="editorial-lede mt-1">
          這段 JavaScript 只會掃描頁面上的留言並在 console 標記匹配，<strong style={{ color: 'var(--color-ink)' }}>不會自動發送</strong>。
          適合在 FB / IG 留言頁面快速驗證規則覆蓋率。
        </p>

        <ol className="text-sm space-y-1.5 list-decimal list-inside leading-relaxed" style={{ color: 'var(--color-ink-soft)' }}>
          <li>複製下方 JavaScript 程式碼</li>
          <li>在 Chrome 書籤列新增書籤</li>
          <li>將書籤的「網址」貼上這段程式碼</li>
          <li>儲存後，開 FB / IG 留言頁點這個書籤</li>
        </ol>
      </section>

      <section
        className="rounded-2xl border p-5 sm:p-6 space-y-3 relative"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
      >
        <div className="flex items-center gap-2">
          <Code size={16} style={{ color: 'var(--color-forest-strong)' }} />
          <span className="editorial-eyebrow">script.js</span>
        </div>
        <div
          className="relative rounded-xl p-3 max-h-56 overflow-y-auto border"
          style={{ background: 'var(--color-paper-soft)', borderColor: 'var(--color-line)' }}
        >
          <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed" style={{ color: 'var(--color-ink-soft)' }}>{JS_BODY}</pre>
          <button
            onClick={copy}
            className="absolute top-2 right-2 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1"
            style={{ background: 'var(--color-orange)', color: '#fff' }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? '已複製' : '複製'}
          </button>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          ⚠️ Bookmarklet 只會在 console 標記匹配結果，<strong style={{ color: 'var(--color-ink)' }}>不會自動發送留言</strong>（避免違反 FB / IG ToS）。
          {' '}
          <a
            href={BOOKMARKLET}
            draggable
            className="underline font-semibold"
            style={{ color: 'var(--color-orange-strong)' }}
            onClick={(e) => e.preventDefault()}
          >
            拖曳此連結到書籤列
          </a>
          {' '}也可建立可拖曳書籤。
        </p>
      </section>

      <section
        className="rounded-2xl border p-5 sm:p-6"
        style={{
          background: 'var(--color-gold-soft)',
          borderColor: 'var(--color-orange-border)',
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-gold-strong)', color: '#fff' }}
            aria-hidden
          >
            ⚠
          </span>
          <div>
            <div className="editorial-eyebrow" style={{ color: 'var(--color-gold-strong)' }}>MVP 邊界</div>
            <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--color-ink)' }}>
              本工具為<strong>規則設計助手</strong>。不串接 Meta Graph API、不讀取 FB / IG 帳號、不自動發送留言。
              所有回覆請回到原生社群平台手動貼上送出。
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
