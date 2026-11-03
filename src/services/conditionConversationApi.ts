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

export async function sendConditionMessage(text: string, conversationId?: string): Promise<ConditionConversation> {
  const path = '/api/conditions/conversations' + (conversationId ? `/${encodeURIComponent(conversationId)}/messages` : '')
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(120000),
    })
  } catch {
    throw new Error('AI 조건 서버의 응답을 받지 못했어요. 연결 상태를 확인해 주세요.')
  }
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(result?.message ?? 'AI 조건 서버에서 요청을 처리하지 못했어요.')
  if (!result?.conversationId || !result.conditions || !Array.isArray(result.conditions.places)
      || !Array.isArray(result.notices) || typeof result.readyForRecommendation !== 'boolean') {
    throw new Error('서버의 조건 응답을 확인하지 못했어요.')
  }
  return result
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
