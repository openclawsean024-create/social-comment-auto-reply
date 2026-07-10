'use client'

import { useState } from 'react'
import { Code, Copy, Check } from 'lucide-react'

const JS_BODY = `
(function(){
  const RULES = window.__SC_RULES__ || [];
  if (!RULES.length) { alert('請先在工具中設定自動回覆規則'); return; }
  document.querySelectorAll('[role="article"] [aria-label*="Comment"], [data-testid="comment"]').forEach((el, i) => {
    const text = el.innerText || '';
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
    <div className="bg-surface-2 rounded-2xl p-6 border border-white/5 space-y-4">
      <div className="flex items-center gap-2">
        <Code size={18} className="text-accent" />
        <h3 className="text-base font-bold">Bookmarklet 安裝教學</h3>
      </div>

      <ol className="text-sm space-y-2 opacity-90 list-decimal list-inside">
        <li>複製下方 JavaScript 程式碼</li>
        <li>在 Chrome 書籤列新增書籤</li>
        <li>將書籤的「網址」貼上這段程式碼</li>
        <li>儲存後，開 FB / IG 留言頁點這個書籤</li>
      </ol>

      <div className="relative bg-surface-3 rounded-xl p-3 max-h-40 overflow-y-auto">
        <pre className="text-xs font-mono whitespace-pre-wrap break-all">{JS_BODY}</pre>
        <button
          onClick={copy}
          className="absolute top-2 right-2 px-2 py-1 bg-accent text-white rounded text-xs flex items-center gap-1"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? '已複製' : '複製'}
        </button>
      </div>

      <p className="text-xs opacity-60">
        ⚠️ Bookmarklet 只會在 console 標記匹配結果，不會自動發送留言（避免違反 FB / IG ToS）。
        {' '}
        <a
          href={BOOKMARKLET}
          draggable
          className="text-accent underline"
          onClick={(e) => e.preventDefault()}
        >
          拖曳此連結到書籤列
        </a>
        也可建立可拖曳書籤。
      </p>
    </div>
  )
}
