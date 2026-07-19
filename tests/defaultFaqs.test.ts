// ─── 預載 FAQ 模板測試（SPEC §3.1 F-002 + §3.4 AC-002）───────────────────

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_FAQS } from '../app/lib/defaultFaqs.ts'

test('DEFAULT_FAQS: contains exactly 50 templates (SPEC AC-002)', () => {
  assert.equal(DEFAULT_FAQS.length, 50, `Expected 50 FAQs, got ${DEFAULT_FAQS.length}`)
})

test('DEFAULT_FAQS: every FAQ has non-empty keyword and reply', () => {
  for (const faq of DEFAULT_FAQS) {
    assert.ok(faq.keyword && faq.keyword.trim().length > 0, `Empty keyword: ${JSON.stringify(faq)}`)
    assert.ok(faq.reply && faq.reply.trim().length > 0, `Empty reply: ${JSON.stringify(faq)}`)
  }
})

test('DEFAULT_FAQS: every FAQ is enabled by default', () => {
  for (const faq of DEFAULT_FAQS) {
    assert.equal(faq.enabled, true)
  }
})

test('DEFAULT_FAQS: keywords are unique (no duplicate triggers)', () => {
  const keywords = DEFAULT_FAQS.map((f) => f.keyword)
  const unique = new Set(keywords)
  assert.equal(unique.size, keywords.length, `Duplicates: ${keywords.filter((k, i) => keywords.indexOf(k) !== i)}`)
})

test('DEFAULT_FAQS: all IDs are unique', () => {
  const ids = DEFAULT_FAQS.map((f) => f.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('DEFAULT_FAQS: covers required categories from SPEC AC-002', () => {
  // 必須涵蓋：價格 / 營業時間 / 退換貨 / 客服聯繫 / 配送
  const text = DEFAULT_FAQS.map((f) => f.keyword).join(',')
  assert.match(text, /價格/)
  assert.match(text, /營業時間/)
  assert.match(text, /退貨|換貨/)
  assert.match(text, /客服|聯繫/)
  assert.match(text, /運費|配送/)
})

test('DEFAULT_FAQS: matches SPEC AC-001 — 價格 FAQ has correct reply', () => {
  const price = DEFAULT_FAQS.find((f) => f.keyword === '價格')
  assert.ok(price)
  assert.match(price.reply, /NT\$/)
})

test('DEFAULT_FAQS: priority is set to a positive number', () => {
  for (const faq of DEFAULT_FAQS) {
    assert.ok(faq.priority >= 1 && faq.priority <= 99, `Bad priority: ${faq.priority}`)
  }
})