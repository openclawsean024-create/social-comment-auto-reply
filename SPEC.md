# 社群留言自動回覆系統 — v1.0 SPEC

## 1. Concept & Vision

一個整合 Facebook 粉絲專頁的自動回覆機器人系統，讓品牌主能透過關鍵字規則自動回覆粉絲留言，提升互動效率與粉絲黏著度。

## 2. 產品功能

### 2.1 平台設定（Settings）
- Facebook Page ID + Access Token 設定（OAuth 流程說明）
- Instagram Business 帳號連結（如有）
- 開啟/關閉自動回覆開關
- 同步頻率設定（每 15/30/60 分鐘）

### 2.2 關鍵字規則設定（Rule Engine）
- 新增規則：關鍵字（精靈比對/模糊比對）+ 回覆模板
- 支援多條件（AND/OR邏輯）
- 多個回覆模板，隨機輪流
- 排除清單（特定用戶不回覆）
- 優先級設定

### 2.3 留言總覽（Dashboard）
- 最近 50 筆留言卡片（姓名、頭像、內容、時間、已/未回覆狀態）
- 狀態標記：✅ 已自動回覆 / ⏳ 待處理 / ❌ 無符合規則
- 篩選器：全部 / 待回覆 / 已回覆
- 關鍵字標註：哪些規則被觸發

### 2.4 手動回覆（Manual Reply）
- 點擊留言可直接回覆（需 Access Token）
- 編輯自動回覆內容後手動發送

### 2.5 數據統計（Stats）
- 今日/本週/本月 回覆數量
- 規則觸發排行榜（最熱門關鍵字）
- 平均回覆時間

### 2.6 範例留言匯入（Demo Mode）
- 在無法連接 Facebook API 時，可貼上粉絲專頁貼文 URL
- 系統嘗試以非官方方式抓取留言顯示（展示用）
- 或手動新增測試留言

## 3. 設計語言

- **主色**：`#2563EB`（Facebook 藍）、`#E1306C`（Instagram 粉）、`#1a1a2e`（深色背景）
- **字體**：Inter / system-ui
- **圖示**：Lucide React
- **圓角**：卡片 `rounded-2xl`、晶片 `rounded-full`

## 4. 技術棧

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Meta Graph API 整合（如有 Access Token）
- 無 token 時：Demo 模式 + 手動測試留言
- Vercel 部署

## 5. 不做清單

- 不做付費牆或認證系統（本版為本地 Demo）
- 不實作真正的 Facebook OAuth（需 Meta App 審核）
- 不串接 LINE / Discord Webhook（本版專注 Facebook)
