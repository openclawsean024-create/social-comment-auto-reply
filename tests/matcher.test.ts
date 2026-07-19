// ─── matcher 引擎測試（SPEC §3.1 F-001 + §3.4 AC-001/AC-005）─────────────

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchRule, matchText, avatarFor } from '../app/lib/matcher.ts'
import type { Rule } from '../app/lib/types.ts'

test('matchText exact mode: keyword must be substring of comment', () => {
  assert.equal(matchText('請問價格？', '價格', 'exact'), true)
  assert.equal(matchText('請問價格？', '運費', 'exact'), false)
})

test('matchText exact mode: case-insensitive', () => {
  assert.equal(matchText('How much is the PRICE?', 'price', 'exact'), true)
})

test('matchText exact mode: empty keyword matches anything', () => {
  assert.equal(matchText('anything', '', 'exact'), true)
})

test('matchText fuzzy mode: all tokens must appear', () => {
  assert.equal(matchText('請問運費多少？', '運費 多少', 'fuzzy'), true)
  assert.equal(matchText('請問運費？', '運費 多少', 'fuzzy'), false)
})

test('matchRule: returns highest-priority matching rule', () => {
  const rules: Rule[] = [
    { id: '1', keyword: '價格', reply: 'A', matchMode: 'exact', enabled: true, priority: 1, platform: 'generic' },
    { id: '2', keyword: '價格', reply: 'B', matchMode: 'exact', enabled: true, priority: 99, platform: 'generic' },
  ]
  const result = matchRule('請問價格', rules)
  assert.ok(result)
  assert.equal(result.id, '2')
})

test('matchRule: skips disabled rules', () => {
  const rules: Rule[] = [
    { id: '1', keyword: '價格', reply: 'A', matchMode: 'exact', enabled: false, priority: 99, platform: 'generic' },
  ]
  const result = matchRule('請問價格', rules)
  assert.equal(result, null)
})

test('matchRule: returns null when no rules match', () => {
  const rules: Rule[] = [
    { id: '1', keyword: '運費', reply: 'A', matchMode: 'exact', enabled: true, priority: 1, platform: 'generic' },
  ]
  assert.equal(matchRule('請問價格', rules), null)
})

test('matchRule: SPEC AC-001 — "請問價格？" matches FAQ keyword "價格"', () => {
  const rules: Rule[] = [
    { id: 'p', keyword: '價格', reply: '我們的價格為 NT$499 起', matchMode: 'exact', enabled: true, priority: 10, platform: 'generic' },
  ]
  const result = matchRule('請問價格？', rules)
  assert.ok(result)
  assert.equal(result.reply, '我們的價格為 NT$499 起')
})

test('avatarFor: deterministic — same name produces same data URI', () => {
  const a = avatarFor('小明')
  const b = avatarFor('小明')
  assert.equal(a, b)
  assert.match(a, /^data:image\/svg\+xml;utf8,/)
})

test('avatarFor: different names produce different URIs', () => {
  const a = avatarFor('小明')
  const b = avatarFor('小美')
  assert.notEqual(a, b)
})

test('avatarFor: handles empty string', () => {
  const result = avatarFor('')
  assert.match(result, /^data:image\/svg\+xml;utf8,/)
})