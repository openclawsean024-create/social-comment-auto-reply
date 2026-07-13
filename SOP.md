# 社群留言自動回覆系統 — SOP

> 從這個 repo 起新專案的標準作業流程。

## 1. 技術棧（統一規格，不要換）

```
Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + lucide-react
```

**資料層（v1 → v2 漸進式）**：
- v1 MVP：localStorage（這個 repo 用的）
- v2：Supabase（多 schema 隔離 — 你已有 `cyogyaabolrwlanjwozo` / `nebcqkiesxnfmobjhybh` 兩個 org）

**禁止**：換 Vite、換 Vue、換純 HTML — 統一用 Next.js 16 撐未來 5 年擴展。

## 2. 起新專案的 3 步驟

```bash
# Step 1: Clone 這個 repo
git clone https://github.com/openclawsean024-create/social-comment-auto-reply.git my-new-saas
cd my-new-saas

# Step 2: 改 SPEC.md 為你的新專案規格（從 /tmp/work/00-social-reply/SPEC.md 看範例）
# - 1-14 區塊完整（v2.2.1）
# - 寫 10 條 P0 MVP 功能 + AC（Given/When/Then）

# Step 3: 改 app/ 內的程式碼
# - app/lib/types.ts    → 改成你的 domain types
# - app/lib/matcher.ts  → 改成你的匹配邏輯
# - app/hooks/useStore.ts → 改 state 結構
# - app/page.tsx        → 改 UI + 商業邏輯
# - app/components/     → 共用組件保留 RulesTable/StatsCards pattern

# Step 4: 部署到 Vercel
vercel --prod
```

## 3. 結構對照表（從這個 repo 學習）

| 檔案 | 用途 | 新專案要做什麼 |
|---|---|---|
| `app/layout.tsx` | HTML 根 layout | 改 `<title>` + metadata |
| `app/page.tsx` | 主頁（tabs + 互動） | 改成你的商業流程 |
| `app/lib/types.ts` | 全域 TypeScript types | 改成你的 domain model |
| `app/lib/matcher.ts` | 規則匹配引擎 | 改成你的業務邏輯 |
| `app/lib/defaultFaqs.ts` | 預載資料 | 改成你的 seed data |
| `app/hooks/useStore.ts` | localStorage 持久化 | v1 沿用；v2 換 Supabase |
| `app/components/RulesTable.tsx` | CRUD UI 範本 | 改成你的列表 UI |
| `app/components/StatsCards.tsx` | 報表 UI 範本 | 改成你的 KPI 卡片 |
| `app/globals.css` | Tailwind 4 + 自訂主題 | 改顏色 token |

## 4. 擴展路徑（不大改）

| 需求 | 加什麼 | 改什麼檔案 |
|---|---|---|
| 加登入 | `npm i @supabase/supabase-js` + `@supabase/ssr` | 新增 `app/auth/`、middleware.ts |
| 加 DB | Supabase 多 schema | 新增 `app/lib/supabase.ts`，useStore 加 `syncToCloud` |
| 加金流 | `npm i stripe` + `@stripe/stripe-js` | 新增 `app/api/checkout/` route handlers |
| 加 Email | `npm i resend` + `react-email` | 新增 `app/api/email/` + Email templates |
| 加後台 | 同專案加 `/admin/*` route | 新增 `app/admin/page.tsx` |
| 加 SSR/SEO | 改 `'use client'` → server component | 逐步重構 useStore 為 server-side fetch |

## 5. Vercel 部署

```bash
# 第一次
vercel link  # 連結到 Vercel 專案
vercel --prod

# 之後
git push  # 自動部署
```

## 6. 已實作的 SPEC P0 功能（社群留言專案）

- ✅ F-001 留言貼上 + 自動匹配
- ✅ F-002 50 種預載 FAQ
- ✅ F-003 FAQ 規則 CRUD（含啟用/停用、平台篩選）
- ✅ F-004 一鍵複製回覆
- ✅ F-005 未匹配建議「加入 FAQ」
- ⚠️ F-006 多帳號管理（v2 — 框架已備）
- ⚠️ F-007 留言歷史 100 則上限（localStorage 無上限但建議 v2 改 DB）
- ✅ F-008 效益報表（StatsCards）
- ✅ F-009 JSON 匯出匯入
- ✅ F-010 RWD 三斷點（Tailwind 響應式）

## 7. 注意事項

- localStorage 5MB 上限 → v2 一定要接 Supabase
- Vercel Free Plan 10 秒 cold start → 純前端 SPA 不影響
- Supabase Free Plan 每 org 2 project 上限 → 用「多 schema」策略隔離
- 不要每個專案都從 `npx create-next-app` 從零起 — 直接 clone 這個 repo 改最快

---

**這個 repo 是你「7 個 SaaS 統一架構」的 base template，未來新專案 SOP。**