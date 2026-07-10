# 社群留言自動回覆系統 (Comment Auto-Reply Designer) v2.0

純前端、零 API Key 的社群留言自動回覆**規則設計助手**。

## 為什麼 v2.0？
原 v1.0 為單檔 636 行 SPA，難維護且有 FB / IG ToS 誤導 CTA。v2.0 重新設計：
- 拆檔至 `components/` + `hooks/` + `lib/`
- 明確標示 MVP 為「規則設計助手 + bookmarklet」非真實自動發送
- 內建測試 sandbox（模擬留言產生、即時分類）

## 技術棧
- Next.js 16.2.4 + React 19 + TypeScript
- Tailwind CSS v4
- localStorage 持久化 (`sc-app-store-v2`)

## 開發
```bash
npm install
npm run dev
```

## 部署
`vercel.json` 已設定 `outputDirectory: .next`。  
Push 至 `main` branch 會自動觸發 Vercel deploy。

## 完整規格
見 Notion 規格書：[社群留言自動回覆系統 — 規格書 v2.0](https://app.notion.com/p/v2-0-2026-07-10-399449ca65d881489384d91d65aa2b08)

## License
Private - OpenClaw Project
