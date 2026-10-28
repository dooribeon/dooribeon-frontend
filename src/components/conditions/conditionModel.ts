export type PlaceCondition = {
  id: string
  source?: 'work' | 'family'
  name: string
  address: string
  resolvedPlace?: { id: string; name: string; address: string; lat: number; lng: number }
  importance: string
  mode: string
  minutes: string
  period: string
  count: string
}
export type ConditionDraft = { deposit: string; rent: string; preference: string; places: PlaceCondition[] }
export const blankPlace = (id: string, source?: PlaceCondition['source']): PlaceCondition => ({
  id, source, name: source === 'work' ? '회사 · 학교' : source === 'family' ? '다른 생활거점' : '',
  address: '', importance: source === 'work' ? '필수' : '중간', mode: '', minutes: '', period: '', count: '',
})
export const digits = (value: string) => value.replace(/[^0-9]/g, '').slice(0, 6)
export function applyAnswer(draft: ConditionDraft, key: string, text: string): ConditionDraft {
  if (key === 'budget') {
    const deposit = text.match(/보증금\s*([\d,]+)\s*만/)
    const rent = text.match(/월세\s*([\d,]+)\s*만/)
    return { ...draft, deposit: deposit ? digits(deposit[1]) : draft.deposit, rent: rent ? digits(rent[1]) : draft.rent }
  }
  if (key === 'preference') return { ...draft, preference: text }
  if (key === 'family' && /^(없어요|없음|없다|없어)[.!\s]*$/.test(text)) return { ...draft, places: draft.places.filter(p => p.source !== 'family') }
  const source = key === 'frequency' ? 'work' : key
  if (source !== 'work' && source !== 'family') return draft
  const existing = draft.places.find(p => p.source === source)
  const place = existing ?? blankPlace(`chat-${source}`, source)
  const frequency = text.match(/(주|월)\s*(\d+)\s*(회|일)/)
  const changed = {
    ...place,
    ...(key === 'frequency' ? {} : { address: text }),
    ...(frequency ? { period: frequency[1], count: frequency[2] } : {}),
  }
  return { ...draft, places: existing ? draft.places.map(p => p.id === place.id ? changed : p) : [...draft.places, changed] }
}
export function fromLegacy(conditions: Record<string, string>): ConditionDraft {
  let draft: ConditionDraft = { deposit: '', rent: '', preference: '', places: [] }
  for (const key of ['work', 'frequency', 'family', 'budget', 'preference']) {
    if (conditions[key]) draft = applyAnswer(draft, key, conditions[key])
  }
  return draft
}
export function toLegacy(draft: ConditionDraft, previous: Record<string, string>): Record<string, string> {
  const work = draft.places.find(p => p.source === 'work')
  const others = draft.places.filter(p => p.source !== 'work')
  return {
    ...previous,
    work: work?.address ?? '',
    frequency: work?.period && work.count ? `${work.period} ${work.count}회` : '',
    family: others.map(p => `${p.name} ${p.address}`.trim()).join(', '),
    budget: [draft.deposit && `보증금 ${draft.deposit}만 원 이하`, draft.rent && `월세 ${draft.rent}만 원 이하`].filter(Boolean).join(' / '),
    preference: draft.preference,
  }
}
export function isPlaceResolved(place: PlaceCondition): boolean {
  return Boolean(place.resolvedPlace?.id && place.address === place.resolvedPlace.address && Number.isFinite(place.resolvedPlace.lat) && Number.isFinite(place.resolvedPlace.lng))
}
export function validationMessage(draft: ConditionDraft): string {
  if (!draft.places.length) return '장소를 한 곳 이상 추가해주세요.'
  const missing = draft.places.filter(p => !isPlaceResolved(p))
  if (missing.length) return `장소 검색으로 위치를 확정해주세요: ${missing.map(p => p.name || '이름 없는 장소').join(', ')}`
  if (draft.places.some(p => p.importance === '필수' && (!p.mode || Number(p.minutes) <= 0))) return '필수 조건의 이동수단과 1분 이상의 편도시간을 정해주세요.'
  if (draft.places.some(p => p.period && Number(p.count) <= 0)) return '방문 빈도를 설정했다면 1회 이상의 횟수를 입력해주세요.'
  return ''
}
