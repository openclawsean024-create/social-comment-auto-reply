// ─── v3.0 features 測試：敏感詞 / 情緒分析 / A/B / JSON / 報表 / 平台偵測 ──
// 涵蓋 SPEC §3.3 v3.0 P2 + §3.4 AC-005/AC-007/AC-008/AC-009/AC-010

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  findSensitiveWords,
  needsHumanReview,
  analyzeSentiment,
  assignABGroup,
  pickABReply,
  validateFAQ,
  buildExportPayload,
  parseImportPayload,
  classifyComment,
  generateReport,
  detectPlatformFromUrl,
  PLATFORMS,
  containsChinese,
  containsEnglish,
} from '../app/lib/v3features.ts'

// ─── 敏感詞過濾 ────────────────────────────────────────────────────────

test('findSensitiveWords: returns matched words', () => {
  const hits = findSensitiveWords('這個服務真爛，我要客訴')
  assert.ok(hits.includes('爛'))
  assert.ok(hits.includes('客訴'))
})

test('findSensitiveWords: empty text returns empty array', () => {
  assert.deepEqual(findSensitiveWords(''), [])
})

test('findSensitiveWords: clean text returns empty array', () => {
  assert.deepEqual(findSensitiveWords('請問價格多少？'), [])
})

test('needsHumanReview: true when sensitive word present', () => {
  assert.equal(needsHumanReview('fuck you'), true)
  assert.equal(needsHumanReview('請問價格'), false)
})

// ─── 情緒分析 ──────────────────────────────────────────────────────────

test('analyzeSentiment: positive when more positive words', () => {
  const r = analyzeSentiment('這個產品太讚了，我好喜歡，完美！')
  assert.equal(r.sentiment, 'positive')
  assert.ok(r.score > 0)
})

test('analyzeSentiment: negative when more negative words', () => {
  const r = analyzeSentiment('這個服務太爛了，慢又貴，我討厭')
  assert.equal(r.sentiment, 'negative')
  assert.ok(r.score < 0)
})

test('analyzeSentiment: neutral when no signal words', () => {
  const r = analyzeSentiment('請問價格')
  assert.equal(r.sentiment, 'neutral')
  assert.equal(r.score, 0)
})

test('analyzeSentiment: empty text returns neutral', () => {
  const r = analyzeSentiment('')
  assert.equal(r.sentiment, 'neutral')
  assert.equal(r.score, 0)
})

test('analyzeSentiment: SPEC AC-008 — mixed Chinese + English works', () => {
  const r = analyzeSentiment('This is great! 讚')
  assert.equal(r.sentiment, 'positive')
})

// ─── A/B 測試分組 ──────────────────────────────────────────────────────

test('assignABGroup: deterministic — same id always same group', () => {
  assert.equal(assignABGroup('comment-1'), assignABGroup('comment-1'))
})

test('assignABGroup: returns either A or B', () => {
  for (let i = 0; i < 50; i++) {
    const g = assignABGroup(`comment-${i}`)
    assert.ok(g === 'A' || g === 'B')
  }
})

test('assignABGroup: distribution roughly 50/50', () => {
  let aCount = 0
  for (let i = 0; i < 1000; i++) {
    if (assignABGroup(`comment-${i}`) === 'A') aCount++
  }
  assert.ok(aCount > 400 && aCount < 600, `Got ${aCount} A's in 1000`)
})

test('pickABReply: deterministic pick from candidates', () => {
  const a = pickABReply('c1', ['reply A', 'reply B'])
  const b = pickABReply('c1', ['reply A', 'reply B'])
  assert.equal(a, b)
})

test('pickABReply: throws on empty array', () => {
  assert.throws(() => pickABReply('c1', []), /non-empty/)
})

// ─── FAQ 驗證 ──────────────────────────────────────────────────────────

test('validateFAQ: empty keyword → FAQ_001 error', () => {
  const errs = validateFAQ({ keyword: '', reply: 'valid' })
  assert.ok(errs.some((e) => e.includes('FAQ_001')))
})

test('validateFAQ: empty reply → FAQ_002 error', () => {
  const errs = validateFAQ({ keyword: 'valid', reply: '   ' })
  assert.ok(errs.some((e) => e.includes('FAQ_002')))
})

test('validateFAQ: both valid → no errors', () => {
  assert.deepEqual(validateFAQ({ keyword: '價格', reply: 'NT$499' }), [])
})

// ─── JSON 匯出匯入（AC-009）────────────────────────────────────────────

test('buildExportPayload: includes exportedAt ISO timestamp', () => {
  const payload = buildExportPayload({ rules: [{ id: '1' }], comments: [] })
  assert.match(payload.exportedAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.equal(payload.rules.length, 1)
})

test('parseImportPayload: valid JSON parses', () => {
  const raw = JSON.stringify({ rules: [{ id: '1' }], comments: [], exportedAt: '2026-07-19' })
  const p = parseImportPayload(raw)
  assert.equal(p.rules.length, 1)
})

test('parseImportPayload: invalid JSON throws', () => {
  assert.throws(() => parseImportPayload('not json'), /JSON/)
})

test('parseImportPayload: missing rules throws', () => {
  assert.throws(() => parseImportPayload('{"comments":[]}'), /rules/)
})

// ─── 留言分類 ──────────────────────────────────────────────────────────

test('classifyComment: sensitive → needs-review', () => {
  const r = classifyComment('fuck you', [])
  assert.equal(r.status, 'needs-review')
})

test('classifyComment: matching FAQ → auto-replied with keyword', () => {
  const rules = [{ keyword: '價格', reply: 'R', enabled: true, priority: 10 }]
  const r = classifyComment('請問價格', rules)
  assert.equal(r.status, 'auto-replied')
  assert.equal(r.triggeredRule, '價格')
})

test('classifyComment: no match → no-match', () => {
  const rules = [{ keyword: '價格', reply: 'R', enabled: true, priority: 10 }]
  const r = classifyComment('請問運費', rules)
  assert.equal(r.status, 'no-match')
})

// ─── 報表（AC-007）────────────────────────────────────────────────────

test('generateReport: SPEC AC-007 — totals + autoRate + top 5', () => {
  const comments = [
    { status: 'auto-replied', triggeredRule: '價格', replyTime: 30 },
    { status: 'auto-replied', triggeredRule: '價格', replyTime: 20 },
    { status: 'auto-replied', triggeredRule: '運費', replyTime: 40 },
    { status: 'no-match' },
    { status: 'auto-replied', triggeredRule: '運費' },
  ]
  const r = generateReport(comments, [{ keyword: '價格' }, { keyword: '運費' }])
  assert.equal(r.total, 5)
  assert.equal(r.autoReplied, 4)
  assert.equal(r.noMatch, 1)
  assert.equal(r.needsReview, 0)
  assert.equal(r.autoRate, 0.8)
  assert.ok(r.topKeywords.length > 0)
  assert.ok(r.topKeywords[0].count >= r.topKeywords[r.topKeywords.length - 1].count)
})

test('generateReport: empty input → zeros', () => {
  const r = generateReport([], [])
  assert.equal(r.total, 0)
  assert.equal(r.autoRate, 0)
})

// ─── 平台偵測（v2 多帳號預先實作）─────────────────────────────────────

test('detectPlatformFromUrl: facebook', () => {
  assert.equal(detectPlatformFromUrl('https://facebook.com/page'), 'facebook')
  assert.equal(detectPlatformFromUrl('https://fb.com/x'), 'facebook')
})

test('detectPlatformFromUrl: instagram / line / threads', () => {
  assert.equal(detectPlatformFromUrl('https://instagram.com/p/abc'), 'instagram')
  assert.equal(detectPlatformFromUrl('https://line.me/R/ti/abc'), 'line')
  assert.equal(detectPlatformFromUrl('https://threads.net/@user'), 'threads')
})

test('detectPlatformFromUrl: unknown URL → generic', () => {
  assert.equal(detectPlatformFromUrl('https://example.com'), 'generic')
  assert.equal(detectPlatformFromUrl(''), 'generic')
})

test('PLATFORMS: contains expected platforms', () => {
  assert.ok(PLATFORMS.includes('facebook'))
  assert.ok(PLATFORMS.includes('instagram'))
  assert.ok(PLATFORMS.includes('line'))
})

// ─── 多語言偵測（AC-008）───────────────────────────────────────────────

test('containsChinese: detects Chinese chars', () => {
  assert.equal(containsChinese('請問價格'), true)
  assert.equal(containsChinese('Hello'), false)
  assert.equal(containsChinese(''), false)
})

test('containsEnglish: detects English letters', () => {
  assert.equal(containsEnglish('Hello'), true)
  assert.equal(containsEnglish('你好'), false)
  assert.equal(containsEnglish('Hello 你好'), true)
})