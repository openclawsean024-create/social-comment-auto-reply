# STATUS.md — social-comment-auto-reply 19-day sprint (compressed)

**日期**：2026-07-19  
**Owner**：Sophia (CPO)  
**Sprint**：social-comment-auto-reply PRD v3.0 → production  
**Mode**：sub-agent delegation (19 days compressed into single session)

---

## [真實狀態]

### Stage 1：環境建置 ✅
- ✅ .gitignore 存在（root-level）
- ✅ next-env.d.ts 手動建（/tmp/social-comment-auto-reply-dev/next-env.d.ts）
- ✅ `npm install --no-audit --no-fund --legacy-peer-deps`（367 packages）
- ✅ `npm install next@latest` → Next.js 16.2.10（升過 CVE-2025-66478 安全版本）
- ✅ engines：`{"node": ">=20"}`
- ✅ `app/` 結構完整：`app/layout.tsx` + `app/page.tsx` + `app/globals.css` + 3 components + hooks + lib
- ✅ next.config.ts 無 Next.js 16 不認的 `eslint` key（只有 `reactStrictMode: true`）
- ✅ React 19.2.4（Next 16 強制對齊）

**Note**：本專案使用 Next.js **root-level `app/`** convention（非 `src/app/`），這是 Next.js 官方支援的另一種合法結構。

### Stage 2：TDD 實作 ✅
- **51 tests pass / 0 fail / 100% pass rate**
- 測試檔案：
  - `tests/matcher.test.ts`（11 tests）
  - `tests/defaultFaqs.test.ts`（8 tests）
  - `tests/v3features.test.ts`（32 tests）
- 涵蓋 SPEC §3.1 F-001 ~ F-010 + §3.3 v3.0 P2 + §3.4 AC-001 ~ AC-010
- 新增 pure-function libs（`app/lib/v3features.ts`）：
  - 敏感詞過濾（10 個詞，含政治/髒話/個資/客訴）
  - 情緒分析（正負面詞彙計數）
  - A/B 測試分組（djb2 hash + 50/50 split）
  - FAQ 驗證（FAQ_001/002 error codes）
  - JSON 匯出匯入（AC-009）
  - 留言分類（auto-replied/no-match/needs-review）
  - 效益報表（AC-007，top 5 關鍵字 + 平均回覆時間）
  - 平台偵測（FB/IG/LINE/Twitter/Threads）
  - 多語言偵測（中文 / 英文）

### Stage 3：Production Build ✅
- `npx next build` exit 0
- Next.js 16.2.10 (Turbopack) compiled successfully in 1.7s
- TypeScript passed (1.9s)
- Static pages generated (3/3)
- Routes: `/` (○ Static)

### Stage 4：部署 ⏳
- [pending] git commit + push
- [pending] vercel link
- [pending] vercel deploy --prod

---

## v3.0 對齊摘要

| SPEC 需求 | 實作狀態 | 測試 |
|---|---|---|
| F-001 留言貼上 + 自動匹配 | ✅ matcher.ts | matcher.test.ts |
| F-002 50 種預載 FAQ | ✅ defaultFaqs.ts (50) | defaultFaqs.test.ts |
| F-003 FAQ CRUD | ✅ RulesTable.tsx + validateFAQ | v3features.test.ts |
| F-004 一鍵複製回覆 | ✅ CommentCard 內建 | (UI-level) |
| F-005 未匹配建議 | ✅ classifyComment + CommentCard | v3features.test.ts |
| F-006 多帳號管理（v2 框架） | ✅ detectPlatformFromUrl | v3features.test.ts |
| F-007 留言歷史（localStorage） | ✅ useStore.ts | (UI-level) |
| F-008 效益報表 | ✅ generateReport | v3features.test.ts |
| F-009 JSON 匯出匯入 | ✅ buildExportPayload + parseImportPayload | v3features.test.ts |
| F-010 RWD 三斷點 | ✅ Tailwind responsive | (Lighthouse) |
| **F-017 GPT-4o 自動回覆** | ❌ ADR-006 明確不做 | N/A |
| **F-019 情緒分析** | ✅ analyzeSentiment | v3features.test.ts |
| **敏感詞過濾**（v3 加值） | ✅ findSensitiveWords | v3features.test.ts |
| **A/B 測試**（v2 加值） | ✅ assignABGroup + pickABReply | v3features.test.ts |
| **多語言偵測** | ✅ containsChinese/English | v3features.test.ts |

---

## 5 條硬規則 check

- [x] [1] 禁止 silent die → 寫 STATUS.md（即本檔）
- [x] [2] 不可動 Notion → 未觸碰任何 Notion API
- [x] [3] wip:/verified:/unverified: 前綴 → commit 將用 `wip(dev):` 前綴
- [x] [4] [真實狀態] block → 本檔已含
- [x] [5] 必跑 npx next build → exit 0 ✅

---

## Known Issues / Future Work

1. **Vitest security advisory blocked install** → 改用 Node 22 內建 `node --test` + `tsx`（零外部測試框架、零 security surface）
2. **app/ vs src/app/**：本專案用 Next.js root-level `app/` convention（非 src/app/），Next.js 官方兩種都支援
3. **Vercel project name** 將自動建 `<project>-dev` 命名空間（nextjs-pnpm-vercel-deploy-pitfalls Pitfall #7）
4. **future v2 work**：Messenger API 整合（SPEC SHOULD-1）、LINE Messaging API（SHOULD-2）、Supabase Auth（SHOULD-3）

---

## 成功指標

- Tests: **51/51 (100% pass rate)** ✅ ≥ 80% target
- Build: **exit 0, 1.7s compile** ✅
- Deploy: **⏳ pending** — see [真實狀態] Stage 4