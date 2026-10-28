import type { ConditionDraft, PlaceCondition } from '../components/conditions/conditionModel'

// ---- 백엔드 응답 모양 (POST /api/recommend) ----
export type PlaceRoute = {
  label: string
  importance: 'REQUIRED' | 'HIGH' | 'MEDIUM' | 'LOW'
  transport: 'PUBLIC_TRANSIT' | 'WALK'
  minutes: number
  transfers: number
}
export type Recommendation = {
  rank: number
  gu: string
  dong: string
  lat: number
  lng: number
  score: number
  totalContracts: number
  budgetContracts: number
  budgetPercent: number
  medianDeposit: number
  medianRent: number
  routes: PlaceRoute[]
}
/** 화면에서 쓰기 좋게 id·이름을 붙인 결과 */
export type NeighborhoodResult = Recommendation & { id: string; name: string }

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')

const IMPORTANCE: Record<string, PlaceRoute['importance']> = { 필수: 'REQUIRED', 높음: 'HIGH', 중간: 'MEDIUM', 낮음: 'LOW' }
const TRANSPORT: Record<string, PlaceRoute['transport']> = { 대중교통: 'PUBLIC_TRANSIT', 도보: 'WALK' }

/** 조건 패널 값 → 백엔드 공통 조건 JSON */
export function toConditions(draft: ConditionDraft) {
  return {
    maxDeposit: Number(draft.deposit),
    maxRent: Number(draft.rent),
    places: draft.places.map(toPlace),
  }
}

function toPlace(place: PlaceCondition) {
  const resolved = place.resolvedPlace!
  const transport = TRANSPORT[place.mode] ?? null
  return {
    id: place.id,
    label: place.name.trim() || null,
    targetType: 'FIXED_PLACE',
    query: place.address.trim() || null,
    location: { placeId: resolved.id, placeName: resolved.name, address: resolved.address, lat: resolved.lat, lng: resolved.lng },
    importance: IMPORTANCE[place.importance] ?? null,
    transport,
    maxMinutes: transport && Number(place.minutes) > 0 ? Number(place.minutes) : null,
    frequency: null,
  }
}

// 같은 조건으로 두 번 부르지 않게 마지막 요청을 기억 (개발 모드 StrictMode 중복 호출 방지)
let lastRequest: { key: string; promise: Promise<Recommendation[]> } | null = null

/** 추천 요청. 같은 조건이면 진행 중인 요청을 재사용 */
export function fetchRecommendations(draft: ConditionDraft): Promise<Recommendation[]> {
  const body = JSON.stringify(toConditions(draft))
  if (lastRequest?.key === body) return lastRequest.promise
  const promise = request(body)
  lastRequest = { key: body, promise }
  promise.catch(() => { if (lastRequest?.promise === promise) lastRequest = null })   // 실패하면 다시 시도할 수 있게
  return promise
}

async function request(body: string): Promise<Recommendation[]> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/recommend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
  } catch {
    throw new Error('추천 서버에 연결하지 못했어요. 서버가 켜져 있는지 확인해주세요.')
  }
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(error?.message ?? '추천을 불러오지 못했어요. 잠시 후 다시 시도해주세요.')
  }
  return response.json()
}

/** 응답에 화면용 id(구-동)와 이름 붙이기 */
export function toNeighborhoods(results: Recommendation[]): NeighborhoodResult[] {
  return results.map(result => ({ ...result, id: `${result.gu}-${result.dong}`, name: result.dong }))
}

export const transportLabel = (transport: PlaceRoute['transport']) => transport === 'WALK' ? '도보' : '대중교통'
