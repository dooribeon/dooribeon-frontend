import type { ConditionDraft } from '../components/conditions/conditionModel'

export type ConversationConditions = {
  maxDeposit: number | null
  maxRent: number | null
  places: {
    id: string
    label: string | null
    targetType: 'FIXED_PLACE' | 'NEARBY_FACILITY' | null
    query: string | null
    location: { placeId: string | null; placeName: string | null; address: string | null; lat: number; lng: number } | null
    importance: 'REQUIRED' | 'HIGH' | 'MEDIUM' | 'LOW' | null
    transport: 'PUBLIC_TRANSIT' | 'WALK' | null
    maxMinutes: number | null
    frequency: { period: 'WEEK' | 'MONTH'; count: number } | null
  }[]
}

export type ConditionConversation = {
  conversationId: string
  conditions: ConversationConditions
  readyForRecommendation: boolean
  issues: { path: string; kind: string; message: string }[]
  nextQuestion: string | null
  notices: string[]
  deletionConfirmation: { placeId: string; confirmationText: string } | null
}

const API_BASE = (import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')

const conversations = '/api/conditions/conversations'

export function placeSearchQuery(place: ConversationConditions['places'][number]): string {
  const query = (place.query || place.location?.placeName || place.location?.address || place.label || '').trim()
  return ['교회', '회사', '직장', '학교', '친구', '본가'].includes(query) ? '' : query
}

async function conditionRequest(path: string, method: 'POST' | 'PUT', body: object) {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    })
  } catch {
    throw new Error('AI 조건 서버의 응답을 받지 못했어요. 연결 상태를 확인해 주세요.')
  }
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(result?.message ?? 'AI 조건 서버에서 요청을 처리하지 못했어요.')
  return result
}

function readConversation(result: ConditionConversation | null): ConditionConversation {
  if (!result?.conversationId || !result.conditions || !Array.isArray(result.conditions.places)
      || !Array.isArray(result.notices) || typeof result.readyForRecommendation !== 'boolean') {
    throw new Error('서버의 조건 응답을 확인하지 못했어요.')
  }
  return result
}

export async function sendConditionMessage(text: string, conversationId?: string) {
  const path = conversationId ? `${conversations}/${encodeURIComponent(conversationId)}/messages` : conversations
  return readConversation(await conditionRequest(path, 'POST', { text }))
}

type CandidateLocation = NonNullable<ConversationConditions['places'][number]['location']>
export type PlaceSearchType = 'KEYWORD' | 'ADDRESS'
type PlaceSearchResult = {
  searchId: string
  placeId: string
  query?: string
  candidates: { candidateId: string; location: CandidateLocation }[]
}

function placePath(conversationId: string, placeId: string) {
  return `${conversations}/${encodeURIComponent(conversationId)}/places/${encodeURIComponent(placeId)}`
}

export async function searchConversationPlace(conversationId: string, placeId: string, query: string, type: PlaceSearchType, initialLabel?: string | null): Promise<PlaceSearchResult> {
  const result = await conditionRequest(`${placePath(conversationId, placeId)}/search`, 'POST', { query, type, page: 1 })
  if (!result?.searchId || result.placeId !== placeId || !Array.isArray(result.candidates)) {
    throw new Error('장소 검색 결과를 확인하지 못했어요. 다시 검색해주세요.')
  }
  const label = initialLabel?.trim()
  if (label && !result.candidates.length && type === 'KEYWORD') {
    let building = ''
    if (query.endsWith(' ' + label)) building = query.slice(0, -label.length).trim()
    else if (query.startsWith(label + ' ')) building = query.slice(label.length).trim()
    if (building) return searchConversationPlace(conversationId, placeId, building, type)
  }
  return result
}

export async function selectConversationPlace(conversationId: string, placeId: string, searchId: string, candidateId: string) {
  const result = await conditionRequest(`${placePath(conversationId, placeId)}/location`, 'PUT', { searchId, candidateId })
  return readConversation(result)
}

const IMPORTANCE = { REQUIRED: '필수', HIGH: '높음', MEDIUM: '중간', LOW: '낮음' }
const TRANSPORT = { PUBLIC_TRANSIT: '대중교통', WALK: '도보' }

/** 미입력과 명시적인 0, 주·월 빈도를 서버 응답 그대로 표시한다. */
export function toConditionDraft(conditions: ConversationConditions): ConditionDraft {
  return {
    deposit: conditions.maxDeposit == null ? '' : String(conditions.maxDeposit),
    rent: conditions.maxRent == null ? '' : String(conditions.maxRent),
    preference: '',
    places: conditions.places.map(place => ({
      id: place.id,
      name: place.label ?? place.location?.placeName ?? place.location?.address ?? '',
      address: place.location?.address ?? place.query ?? '',
      resolvedPlace: place.location ? {
        id: place.location.placeId ?? place.id,
        name: place.location.placeName ?? place.location.address ?? '',
        address: place.location.address ?? '',
        lat: place.location.lat,
        lng: place.location.lng,
      } : undefined,
      importance: place.importance ? IMPORTANCE[place.importance] : '',
      mode: place.transport ? TRANSPORT[place.transport] : '',
      minutes: place.maxMinutes == null ? '' : String(place.maxMinutes),
      period: place.frequency ? (place.frequency.period === 'WEEK' ? '주' : '월') : '',
      count: place.frequency ? String(place.frequency.count) : '',
    })),
  }
}

export async function saveConditionEdits(conversation: ConditionConversation, draft: ConditionDraft) {
  const importance = { '필수': 'REQUIRED', '높음': 'HIGH', '중간': 'MEDIUM', '낮음': 'LOW' } as const
  const transport = { '대중교통': 'PUBLIC_TRANSIT', '도보': 'WALK' } as const
  const original = toConditionDraft(conversation.conditions)
  const values: ConversationConditions = {
    ...conversation.conditions,
    maxDeposit: draft.deposit === '' ? null : Number(draft.deposit),
    maxRent: draft.rent === '' ? null : Number(draft.rent),
    places: conversation.conditions.places.map((place, index) => {
      const edited = draft.places.find(item => item.id === place.id)
      if (!edited) throw new Error('장소 목록이 바뀌었어요. 다시 확인해주세요.')
      if (Boolean(edited.period) !== Boolean(edited.count)) throw new Error('방문 빈도는 주·월과 횟수를 함께 입력해주세요.')
      return {
        ...place,
        label: edited.name === original.places[index].name ? place.label : edited.name.trim() || null,
        importance: importance[edited.importance as keyof typeof importance] ?? null,
        transport: transport[edited.mode as keyof typeof transport] ?? null,
        maxMinutes: edited.minutes === '' ? null : Number(edited.minutes),
        frequency: edited.period ? { period: edited.period === '주' ? 'WEEK' : 'MONTH', count: Number(edited.count) } : null,
      }
    }),
  }
  return readConversation(await conditionRequest(`${conversations}/${encodeURIComponent(conversation.conversationId)}/conditions`, 'PUT', {
    expected: conversation.conditions, values,
  }))
}
