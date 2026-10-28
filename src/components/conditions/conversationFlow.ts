import { blankPlace, isPlaceResolved } from './conditionModel'
import type { ConditionDraft } from './conditionModel'

export type Followup = { key: 'primary' | 'deposit' | 'rent' | 'address' | 'mode' | 'minutes'; placeId?: string; text: string }
// Local conversation parsing; location completion requires a Kakao search result.
export function primaryReady(draft: ConditionDraft): boolean {
  const first = draft.places.find(p => p.source === 'work')
  return Boolean(first && draft.deposit !== '' && draft.rent !== '' && isPlaceResolved(first) && first.mode && Number(first.minutes) > 0)
}
export function conditionsReady(draft: ConditionDraft): boolean {
  return primaryReady(draft) && draft.places.every(isPlaceResolved)
}
export function nextQuestion(draft: ConditionDraft): Followup | null {
  const first = draft.places.find(p => p.source === 'work')
  if (!first) return { key: 'primary', text: '가장 먼저 회사나 학교를 기준으로 정리할게요. 다니는 회사 또는 학교와 위치를 알려주세요.' }
  if (draft.deposit === '') return { key: 'deposit', text: '보증금은 최대 얼마까지 생각하고 계세요? 예: 2,000만 원' }
  if (draft.rent === '') return { key: 'rent', text: '월세는 최대 얼마까지 생각하고 계세요? 예: 70만 원' }
  if (!isPlaceResolved(first)) return { key: 'address', placeId: first.id, text: `${first.name} 이름이나 위치를 알려주세요. 예: 강남 파이브가이즈. 장소명 또는 주소로 검색할게요.` }
  if (!first.mode) return { key: 'mode', placeId: first.id, text: `${first.name}까지 주로 어떻게 이동하시나요? 대중교통, 도보, 자차 중 선택하거나 직접 알려주세요.` }
  if (Number(first.minutes) <= 0) return { key: 'minutes', placeId: first.id, text: `${first.name}까지 편도로 최대 몇 분까지 괜찮으세요? 예: 45분 이내` }
  const other = draft.places.find(p => p.source !== 'work' && !isPlaceResolved(p))
  return other ? { key: 'address', placeId: other.id, text: `${other.name || '추가 거점'}의 장소명이나 위치를 알려주세요. 검색으로 장소를 확인할게요.` } : null
}
function amount(text: string): string | null {
  const match = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(억|천|만)?/)
  if (!match) return null
  const value = Number(match[1]) * (match[2] === '억' ? 10000 : match[2] === '천' ? 1000 : 1)
  return Number.isSafeInteger(value) && value <= 999999 ? String(value) : null
}
export function receiveAnswer(previous: ConditionDraft, text: string, pending: Followup | null): ConditionDraft {
  const next = { ...previous, places: previous.places.map(p => ({ ...p })) }
  const chunks = text.split(/[,\n]/).filter(Boolean)
  const kinds = ['회사', '학교', '본가', '연인', '친구', '헬스장', '교회']
  for (const name of kinds) {
    const chunk = chunks.find(c => c.includes(name))
    if (!chunk) continue
    if (next.places.some(p => p.name === name || (name === '회사' && p.source === 'work'))) continue
    const primary = (name === '회사' || name === '학교') && !next.places.some(p => p.source === 'work')
    next.places.push({ ...blankPlace(`chat-${name}`, primary ? 'work' : name === '본가' ? 'family' : undefined), name, address: '', importance: primary ? '필수' : '중간' })
  }
  // University names may be supplied without the word '학교'.
  if (!next.places.some(p => p.source === 'work') && /통학|대학교|서울대/.test(text)) {
    next.places.unshift({ ...blankPlace('chat-school', 'work'), name: '학교', importance: '필수', address: '' })
  }
  for (const [label, key] of [['보증금', 'deposit'], ['월세', 'rent']] as const) {
    const match = text.match(new RegExp(`${label}\\s*([\\d,.]+\\s*(?:억|천|만)?(?:\\s*원)?)`))
    if (match) { const value = amount(match[1]); if (value !== null) next[key] = value }
  }
  if (pending?.key === 'deposit' || pending?.key === 'rent') {
    if (!/보증금|월세/.test(text)) { const value = amount(text); if (value !== null) next[pending.key] = value }
  }
  const primary = next.places.find(p => p.source === 'work')
  const target = pending?.placeId ? next.places.find(p => p.id === pending.placeId) : primary
  if (pending?.key === 'address' && target) { target.address = text.trim(); target.resolvedPlace = undefined }
  // Other bases only receive addresses; their remaining settings stay unset.
  if (primary && (!pending || pending.placeId === primary.id || ['primary', 'deposit', 'rent'].includes(pending.key))) {
    if (/대중교통|지하철|버스/.test(text)) primary.mode = '대중교통'
    else if (/도보|걸어/.test(text)) primary.mode = '도보'
    else if (/자차|자동차|운전/.test(text)) primary.mode = '자차'
    const minutes = text.match(/(\d+)\s*분/)
    const hour = text.match(/(\d+)\s*시간/)
    const total = Number(minutes?.[1] ?? 0) + Number(hour?.[1] ?? 0) * 60 + (hour && /시간\s*반/.test(text) ? 30 : 0)
    if (total > 0 && total <= 999) primary.minutes = String(total)
    else if (pending?.key === 'minutes' && /^\d+$/.test(text) && Number(text) > 0 && Number(text) <= 999) primary.minutes = text
    const frequency = text.match(/(주|월)\s*(\d+)\s*(?:회|일)/)
    if (frequency) { primary.period = frequency[1]; primary.count = frequency[2] }
  }
  if (!pending && primaryReady(previous) && next.places.length === previous.places.length) next.preference = [next.preference, text].filter(Boolean).join('\n')
  return next
}
