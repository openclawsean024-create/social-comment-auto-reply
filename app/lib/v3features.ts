// ─── v3.0 新增功能 pure-function libs ──────────────────────────────────
// 涵蓋 SPEC §3.4 AC-005/AC-008/AC-009 + SPEC §3.3 v3.0 P2 願景項目（情緒分析）
// + 行銷加值（敏感詞過濾 / A/B 測試分組）

/**
 * 敏感詞清單（繁中 + 英文常見）。
 * 純資料，可擴充。命中後標記「需人工覆核」。
 */
export const SENSITIVE_WORDS: string[] = [
  // 政治 / 宗教（避免敏感）
  '獨立', '統一', '統獨',
  // 髒話 / 歧視（常見中英文）
  '幹', '爛', 'fuck', 'shit', 'asshole', '傻逼', '白癡',
  // 個資請求（避免洩漏）
  '身分證字號', '密碼', '信用卡號',
  // 投訴 / 客訴（升級客服）
  '客訴', '投訴', '申訴', '退錢', '消保官',
]

/**
 * 檢查留言是否含敏感詞。
 * @returns 命中敏感詞陣列（空 = 通過）
 */
export function findSensitiveWords(text: string): string[] {
  if (!text || typeof text !== 'string') return []
  const lower = text.toLowerCase()
  return SENSITIVE_WORDS.filter((w) => lower.includes(w.toLowerCase()))
}

/**
 * 判斷留言是否需要人工覆核（敏感詞命中）。
 */
export function needsHumanReview(text: string): boolean {
  return findSensitiveWords(text).length > 0
}

// ─── 情緒分析（v3.0 P2）─────────────────────────────────────────────────
// 規則式簡單情緒分析：正負面詞彙計數。
// 不用 AI/外部 API（純前端 + 可解釋，對齊 ADR-001）。

const POSITIVE_WORDS = [
  '讚', '推', '棒', '好', '棒極', '完美', '謝謝', '喜歡', '愛',
  'great', 'awesome', 'love', 'thanks', 'amazing', 'perfect', 'nice',
]
const NEGATIVE_WORDS = [
  '爛', '差', '糟', '慢', '貴', '難用', '討厭', '失望', '生氣',
  'bad', 'terrible', 'awful', 'hate', 'slow', 'expensive', 'worst',
]

export type Sentiment = 'positive' | 'neutral' | 'negative'

export interface SentimentResult {
  sentiment: Sentiment
  score: number // -1..+1，正負面詞彙差 / 總詞彙數
  positiveHits: string[]
  negativeHits: string[]
}

/**
 * 計算留言情緒分數。
 * - score > 0.1 → positive
 * - score < -0.1 → negative
 * - 其他 → neutral
 */
export function analyzeSentiment(text: string): SentimentResult {
  if (!text || typeof text !== 'string') {
    return { sentiment: 'neutral', score: 0, positiveHits: [], negativeHits: [] }
  }
  const lower = text.toLowerCase()
  const posHits = POSITIVE_WORDS.filter((w) => lower.includes(w))
  const negHits = NEGATIVE_WORDS.filter((w) => lower.includes(w))
  const total = posHits.length + negHits.length
  const score = total === 0 ? 0 : (posHits.length - negHits.length) / Math.max(total, 1)
  const sentiment: Sentiment = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral'
  return { sentiment, score, positiveHits: posHits, negativeHits: negHits }
}

// ─── A/B 測試分組（v2 行銷加值）──────────────────────────────────────────
// 規則上有多個 reply 時，依留言 hash 穩定分流到 A/B。

/**
 * 簡易 deterministic hash (djb2)，無需 crypto。
 */
function djb2Hash(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(hash)
}

/**
 * 將留言分流到 A/B 群組（50/50 機率，相同留言 → 相同組別）。
 * 用於「同一關鍵字 + 多組 reply」做 A/B 測試。
 */
export function assignABGroup(commentId: string): 'A' | 'B' {
  return djb2Hash(commentId) % 2 === 0 ? 'A' : 'B'
}

/**
 * 從候選回覆陣列中，依留言穩定選一個（用於 A/B testing reply template）。
 */
export function pickABReply<T>(commentId: string, candidates: T[]): T {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error('candidates must be non-empty array')
  }
  const idx = djb2Hash(commentId) % candidates.length
  return candidates[idx]
}

// ─── FAQ 驗證（CRUD 必填）────────────────────────────────────────────────

/**
 * FAQ 驗證：SPEC §3.4 AC-003 + §10.4 FAQ_001/FAQ_002 error codes。
 * @returns 錯誤訊息陣列（空 = 通過）
 */
export function validateFAQ(input: { keyword?: unknown; reply?: unknown }): string[] {
  const errors: string[] = []
  if (typeof input.keyword !== 'string' || input.keyword.trim() === '') {
    errors.push('FAQ_001: 關鍵字不可為空')
  }
  if (typeof input.reply !== 'string' || input.reply.trim() === '') {
    errors.push('FAQ_002: 答案不可為空')
  }
  return errors
}

// ─── JSON 匯出匯入（SPEC §3.4 AC-009）────────────────────────────────────

export interface ExportPayload {
  rules: unknown[]
  comments: unknown[]
  post?: unknown
  exportedAt: string
}

const EXPORT_VERSION = 'social-comment-auto-reply/v1'

/**
 * 包裝匯出 payload，加版本戳。
 */
export function buildExportPayload(data: { rules: unknown[]; comments: unknown[]; post?: unknown }): ExportPayload {
  return {
    ...data,
    exportedAt: new Date().toISOString(),
  }
}

/**
 * 驗證匯入 JSON 格式（SPEC §3.4 AC-009）。
 * @returns 解析後的 payload 或 throws
 */
export function parseImportPayload(raw: string): ExportPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    throw new Error(`JSON 解析失敗: ${(e as Error).message}`)
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('匯入檔案格式不正確（需為物件）')
  }
  const obj = parsed as Record<string, unknown>
  if (!Array.isArray(obj.rules)) {
    throw new Error('匯入檔案缺少 rules 陣列')
  }
  return {
    rules: obj.rules,
    comments: Array.isArray(obj.comments) ? obj.comments : [],
    post: obj.post,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
  }
}

// ─── 留言分類 helper（給 stats 用）───────────────────────────────────────

export interface ClassifiedComment {
  status: 'auto-replied' | 'no-match' | 'needs-review'
  triggeredRule?: string
}

/**
 * 純函式版「留言分類」：先檢查敏感詞（needs-review），再匹配 FAQ。
 */
export function classifyComment(
  text: string,
  rules: Array<{ keyword: string; reply: string; enabled: boolean; priority?: number }>,
): ClassifiedComment {
  if (needsHumanReview(text)) return { status: 'needs-review' }
  const sorted = [...rules]
    .filter((r) => r.enabled)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  for (const r of sorted) {
    if (text.toLowerCase().includes(r.keyword.toLowerCase())) {
      return { status: 'auto-replied', triggeredRule: r.keyword }
    }
  }
  return { status: 'no-match' }
}

// ─── 效益報表（SPEC §3.4 AC-007）─────────────────────────────────────────

export interface ReportStats {
  total: number
  autoReplied: number
  noMatch: number
  needsReview: number
  autoRate: number // 0..1
  topKeywords: Array<{ keyword: string; count: number }>
  averageReplySeconds: number
}

/**
 * 從留言歷史 + 規則生成報表。
 */
export function generateReport(
  comments: Array<{ status?: string; triggeredRule?: string; replyTime?: number }>,
  rules: Array<{ keyword: string }>,
): ReportStats {
  const total = comments.length
  const autoReplied = comments.filter((c) => c.status === 'auto-replied').length
  const noMatch = comments.filter((c) => c.status === 'no-match').length
  const needsReview = comments.filter((c) => c.status === 'needs-review').length
  const autoRate = total === 0 ? 0 : autoReplied / total
  const counts = new Map<string, number>()
  for (const c of comments) {
    if (c.triggeredRule) counts.set(c.triggeredRule, (counts.get(c.triggeredRule) ?? 0) + 1)
  }
  const topKeywords = [...counts.entries()]
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const replyTimes = comments.filter((c) => typeof c.replyTime === 'number').map((c) => c.replyTime as number)
  const averageReplySeconds = replyTimes.length === 0 ? 0 : replyTimes.reduce((a, b) => a + b, 0) / replyTimes.length
  return { total, autoReplied, noMatch, needsReview, autoRate, topKeywords, averageReplySeconds }
}

// ─── 平台判斷（給多帳號 v2 預先實作框架用）───────────────────────────────

export type Platform = 'facebook' | 'instagram' | 'line' | 'twitter' | 'threads' | 'generic'

export const PLATFORMS: Platform[] = ['facebook', 'instagram', 'line', 'twitter', 'threads', 'generic']

export const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  line: 'LINE 官方帳號',
  twitter: 'Twitter / X',
  threads: 'Threads',
  generic: '通用',
}

/**
 * 偵測留言來源平台（從 URL pattern）。
 * v1 為 hint 用，v2 串接 Meta Graph API / LINE Messaging API 自動偵測。
 */
export function detectPlatformFromUrl(url: string): Platform {
  if (!url || typeof url !== 'string') return 'generic'
  const u = url.toLowerCase()
  if (u.includes('facebook.com') || u.includes('fb.com') || u.includes('fb.me')) return 'facebook'
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('line.me')) return 'line'
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter'
  if (u.includes('threads.net') || u.includes('threads.com')) return 'threads'
  return 'generic'
}

// ─── 多語言偵測（SPEC §3.4 AC-008）───────────────────────────────────────

/**
 * 簡易多語言偵測：是否含中文字元。
 */
export function containsChinese(text: string): boolean {
  if (!text) return false
  return /[\u4e00-\u9fff]/.test(text)
}

/**
 * 簡易多語言偵測：是否含英文字母。
 */
export function containsEnglish(text: string): boolean {
  if (!text) return false
  return /[a-z]/i.test(text)
}