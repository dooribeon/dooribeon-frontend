import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addConversationPlace, deleteConversationPlace, placeSearchQuery, saveConditionEdits, searchConversationPlace, selectConversationPlace, sendConditionMessage, toConditionDraft } from '../src/services/conditionConversationApi.ts'
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

test('선택한 장소의 검색·후보 번호만 보내고 서버가 저장한 위치를 카드에 반영한다', async () => {
  const originalFetch = globalThis.fetch
  const location = { placeId: 'map-123', placeName: '아크플레이스', address: '테스트 주소', lat: 37.5, lng: 127.03 }
  const place = { id: 'work', importance: 'REQUIRED', location, maxMinutes: 60, frequency: null }
  const calls: { url: string; method: string | undefined; body: unknown }[] = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url: new URL(String(url)).pathname, method: options?.method, body: JSON.parse(String(options?.body)) })
    return Response.json(calls.length === 1
      ? { searchId: 'search1', placeId: 'work', candidates: [{ candidateId: 'candidate1', location }] }
      : { ...reply, conditions: { ...conditions, places: [place] } })
  }
  try {
    const found = await searchConversationPlace('chat', 'work', '아크플레이스', 'KEYWORD')
    const saved = await selectConversationPlace('chat', 'work', found.searchId, found.candidates[0].candidateId)
    assert.deepEqual(calls, [
      { method: 'POST', url: '/api/conditions/conversations/chat/places/work/search', body: { query: '아크플레이스', type: 'KEYWORD', page: 1 } },
      { method: 'PUT', url: '/api/conditions/conversations/chat/places/work/location', body: { searchId: 'search1', candidateId: 'candidate1' } },
    ])
    assert.equal(toConditionDraft(saved.conditions).places[0].resolvedPlace?.id, 'map-123')
  } finally { globalThis.fetch = originalFetch }
})

test('카드 편집은 위치와 서버 id를 보존하고 이름 비우기와 0을 그대로 전송한다', async () => {
  const originalFetch = globalThis.fetch
  const location = { placeId: 'k1', placeName: '건물', address: '주소', lat: 37.5, lng: 127.03 }
  const initial: ConditionConversation = { ...reply, conditions: { ...conditions, places: [{
    id: 'church', label: '교회', targetType: 'FIXED_PLACE', query: '건물', location,
    importance: null, transport: null, maxMinutes: null, frequency: null,
  }] } }
  const draft = toConditionDraft(initial.conditions)
  draft.deposit = '0'
  draft.places[0] = { ...draft.places[0], name: '', importance: '높음', mode: '대중교통', minutes: '70', period: '주', count: '1' }
  let sent: Record<string, unknown> = {}
  globalThis.fetch = async (_url, options) => {
    sent = JSON.parse(String(options?.body))
    return Response.json({ ...initial, conditions: sent.values })
  }
  try {
    const saved = await saveConditionEdits(initial, draft)
    assert.deepEqual(sent.expected, initial.conditions)
    const place = saved.conditions.places[0]
    assert.equal(place.label, null)
    assert.deepEqual(place.location, location)
    assert.equal(place.id, 'church')
    assert.equal(saved.conditions.maxDeposit, 0)
    assert.deepEqual(place.frequency, { period: 'WEEK', count: 1 })
  } finally { globalThis.fetch = originalFetch }
})

test('지역과 장소 종류만으로는 후보를 검색하지 않고 구체적인 이름과 주소는 검색한다', () => {
  const place: ConversationConditions['places'][number] = {
    id: 'work', label: '회사', targetType: 'FIXED_PLACE', query: null, location: null,
    importance: 'REQUIRED', transport: null, maxMinutes: null, frequency: null,
  }
  for (const query of ['회사', '여의도 회사', '수원 본가', '본가 부산', '부모님 집 수원', '지금 다니는 교회', '여의도', '부산', '서울', '부모님 집', '수원 부모님 집']) {
    assert.equal(placeSearchQuery({ ...place, query }), '', query)
  }
  for (const query of ['창훈대교회', '수원 창훈대교회', '역삼동 아크플레이스', '여의도역', '토스', '서울 강남구 테헤란로 142']) {
    assert.equal(placeSearchQuery({ ...place, query }), query)
  }
  for (const label of ['여자친구 잠실', '여의도 회사', '수원 본가', '토스']) {
    assert.equal(placeSearchQuery({ ...place, label }), '')
  }
  assert.equal(placeSearchQuery({ ...place, label: '여자친구', query: '여자친구 잠실' }), '')
  assert.equal(placeSearchQuery({ ...place, label: '여자친구', areaHint: '잠실', query: '잠실' }), '')
  assert.equal(placeSearchQuery({ ...place, label: '여자친구', areaHint: '잠실', query: '잠실역' }), '잠실역')
  assert.equal(placeSearchQuery({ ...place, label: '본가 부산' }), '')
  assert.equal(placeSearchQuery({ ...place, label: '본가 부산', query: '부산' }), '')
  assert.equal(placeSearchQuery({ ...place, label: '본가 부산', query: '부산역' }), '부산역')
  assert.equal(placeSearchQuery({ ...place, label: '친구', query: '혜화역 근처' }), '혜화역')
  assert.equal(placeSearchQuery({ ...place, label: '연인', query: '잠실역 주변' }), '잠실역')
  const location = { placeId: 'k1', placeName: '회사', address: '선택된 주소', lat: 37.5, lng: 127.03 }
  assert.equal(placeSearchQuery({ ...place, location }), '회사')
})

test('카드 장소 추가는 최신 조건을 보내고 서버가 발급한 장소 id를 그대로 사용한다', async () => {
  const originalFetch = globalThis.fetch
  const added = { id: 'server-issued', label: null, targetType: 'FIXED_PLACE' as const, query: null, location: null,
    importance: null, transport: null, maxMinutes: null, frequency: null }
  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).endsWith('/conversations/test-conversation/places'))
    assert.equal(options?.method, 'POST')
    assert.deepEqual(JSON.parse(String(options?.body)), { expected: conditions })
    return Response.json({ ...reply, conditions: { ...conditions, places: [added] } })
  }
  try {
    const result = await addConversationPlace(reply)
    assert.equal(toConditionDraft(result.conditions).places[0].id, 'server-issued')
    assert.equal(toConditionDraft(result.conditions).places[0].name, '')
  } finally { globalThis.fetch = originalFetch }
})

test('카드 삭제는 지정한 서버 장소 번호와 최신 조건을 보내고 목록을 갱신한다', async () => {
  const originalFetch = globalThis.fetch
  const initial: ConditionConversation = { ...reply, conditions: { ...conditions, places: [{
    id: 'selected-card', label: '여자친구', areaHint: '잠실', query: null, location: null, targetType: 'FIXED_PLACE',
    importance: null, transport: null, maxMinutes: null, frequency: null,
  }] } }
  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).endsWith('/conversations/test-conversation/places/selected-card/delete'))
    assert.equal(options?.method, 'POST')
    assert.deepEqual(JSON.parse(String(options?.body)), { expected: initial.conditions })
    return Response.json(reply)
  }
  try {
    const result = await deleteConversationPlace(initial, 'selected-card')
    assert.equal(result.conditions.places.length, 0)
  } finally { globalThis.fetch = originalFetch }
})

test('주변 공원 카드에서 시간을 비워 저장해도 도보와 주소 없는 시설 조건을 유지한다', async () => {
  const originalFetch = globalThis.fetch
  const initial: ConditionConversation = { ...reply, conditions: { maxDeposit: 1000, maxRent: 50, places: [{
    id: 'park', label: '러닝', areaHint: null, targetType: 'NEARBY_FACILITY', query: '공원', location: null,
    importance: 'REQUIRED', transport: 'WALK', maxMinutes: 15, frequency: { period: 'WEEK', count: 4 },
  }] }, readyForRecommendation: true, nextQuestion: null }
  const draft = toConditionDraft(initial.conditions)
  assert.equal(draft.places[0].mode, '도보')
  assert.equal(draft.places[0].resolvedPlace, undefined)
  draft.places[0].importance = '낮음'
  draft.places[0].minutes = ''
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(String(options?.body))
    assert.deepEqual(body.expected, initial.conditions)
    assert.deepEqual(body.values.places[0], {
      ...initial.conditions.places[0], importance: 'LOW', maxMinutes: null,
    })
    return Response.json({ ...initial, conditions: body.values })
  }
  try {
    const saved = await saveConditionEdits(initial, draft)
    assert.equal(saved.readyForRecommendation, true)
    assert.equal(toConditionDraft(saved.conditions).places[0].minutes, '')
    assert.equal(saved.conditions.places[0].location, null)
  } finally { globalThis.fetch = originalFetch }
})
