import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sendConditionMessage, toConditionDraft } from '../src/services/conditionConversationApi.ts'
import type { ConditionConversation, ConversationConditions } from '../src/services/conditionConversationApi.ts'

const conditions: ConversationConditions = { maxDeposit: null, maxRent: 50, places: [] }
const reply: ConditionConversation = {
  conversationId: 'test-conversation', conditions, readyForRecommendation: false,
  issues: [], nextQuestion: '보증금은 얼마인가요?', notices: [], deletionConfirmation: null,
}

test('첫 요청 후 받은 대화 번호로 추가 답변을 보내고 서버의 전체 조건을 표시한다', async () => {
  const originalFetch = globalThis.fetch
  const calls: { url: string; body: unknown }[] = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), body: JSON.parse(String(options?.body)) })
    const result = calls.length === 1 ? reply : {
      ...reply, conditions: { ...conditions, maxDeposit: 1000 }, readyForRecommendation: true, nextQuestion: null,
    }
    return Response.json(result)
  }
  try {
    const first = await sendConditionMessage('월세는 50만 원까지야.')
    assert.equal(toConditionDraft(first.conditions).deposit, '')
    const second = await sendConditionMessage('보증금은 천만 원까지야.', first.conversationId)
    assert.ok(calls[0].url.endsWith('/api/conditions/conversations'))
    assert.ok(calls[1].url.endsWith('/api/conditions/conversations/test-conversation/messages'))
    assert.deepEqual(calls.map(call => call.body), [{ text: '월세는 50만 원까지야.' }, { text: '보증금은 천만 원까지야.' }])
    assert.equal(toConditionDraft(second.conditions).deposit, '1000')
    assert.equal(toConditionDraft(second.conditions).rent, '50')
  } finally { globalThis.fetch = originalFetch }
})

test('0과 미입력, 중요도 미설정과 월 단위 빈도를 보존한다', () => {
  const draft = toConditionDraft({ maxDeposit: 0, maxRent: null, places: [{
    id: 'church', label: '교회', targetType: 'FIXED_PLACE', query: '교회 검색어', location: null,
    importance: null, transport: null, maxMinutes: null, frequency: { period: 'MONTH', count: 2 },
  }] })
  assert.equal(draft.deposit, '0')
  assert.equal(draft.rent, '')
  assert.equal(draft.places[0].importance, '')
  assert.equal(draft.places[0].resolvedPlace, undefined)
  assert.equal(draft.places[0].period, '월')
  assert.equal(draft.places[0].count, '2')
})

test('서버 실패와 잘못된 응답은 성공 조건으로 반환하지 않는다', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => Response.json({ message: 'AI 설정을 확인해 주세요.' }, { status: 503 })
    await assert.rejects(sendConditionMessage('입력'), /AI 설정/)
    globalThis.fetch = async () => Response.json({})
    await assert.rejects(sendConditionMessage('입력'), /응답을 확인하지/)
  } finally { globalThis.fetch = originalFetch }
})
