import type { ConditionConversation, ConversationConditions } from './conditionConversationApi'
import type { ConditionDraft, PlaceCondition } from '../components/conditions/conditionModel'

// ---- 백엔드 응답 모양 (POST /api/recommend) ----
export type PlaceRoute = {
  placeId: string
  label: string
  importance: 'REQUIRED' | 'HIGH' | 'MEDIUM' | 'LOW'
  transport: 'PUBLIC_TRANSIT' | 'WALK'
  minutes: number
  maxMinutes: number | null   // 사용자가 정한 편도 기준 (미설정이면 null)
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

// 같은 조건으로 두 번 부르지 않게 주소별 마지막 요청을 기억 (개발 모드 StrictMode 중복 호출 방지)
const lastRequests = new Map<string, { key: string; promise: Promise<unknown> }>()

function post<T>(path: string, body: string): Promise<T> {
  const last = lastRequests.get(path)
  if (last?.key === body) return last.promise as Promise<T>
  const promise = request<T>(path, body)
  lastRequests.set(path, { key: body, promise })
  promise.catch(() => { if (lastRequests.get(path)?.promise === promise) lastRequests.delete(path) })   // 실패하면 다시 시도할 수 있게
  return promise
}

const requestBody = (draft: ConditionDraft, confirmed?: ConversationConditions) => JSON.stringify(confirmed ?? toConditions(draft))

/** 추천 요청 (카카오 경로 조회 포함, 10~30초). 같은 조건이면 진행 중인 요청을 재사용 */
export function fetchRecommendations(draft: ConditionDraft, confirmed?: ConversationConditions): Promise<Recommendation[]> {
  return post<Recommendation[]>('/api/recommend', requestBody(draft, confirmed))
}

// ---- 탐색 화면용 후보 (POST /api/recommend/candidates) ----
export type Spot = { id: string; name: string; lat: number; lng: number }
export type CandidatesResult = {
  totalNeighborhoods: number   // 전체 동네 수
  budgetPassed: Spot[]         // 예산 필터 통과 동네 (가까운 순)
  candidates: Spot[]           // 경로를 확인할 후보 (최대 20곳)
}

/** 예산·거리로 걸러지는 후보 (경로 조회 없음, 빠름) */
export function fetchCandidates(draft: ConditionDraft, confirmed?: ConversationConditions): Promise<CandidatesResult> {
  return post<CandidatesResult>('/api/recommend/candidates', requestBody(draft, confirmed))
}

async function request<T>(path: string, body: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
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

const IMPORTANCE_LABEL: Record<PlaceRoute['importance'], string> = { REQUIRED: '필수', HIGH: '높음', MEDIUM: '중간', LOW: '낮음' }
export const importanceLabel = (importance: PlaceRoute['importance']) => IMPORTANCE_LABEL[importance]

/** 화면 state에서 사용자가 정한 예산 꺼내기 (AI 대화로 확정된 조건 우선) */
export function budgetFromState(state: unknown): { maxDeposit: number | null; maxRent: number | null } {
  const saved = state as { aiConversation?: ConditionConversation; conditionDraft?: ConditionDraft } | null
  const confirmed = saved?.aiConversation?.conditions
  if (confirmed) return { maxDeposit: confirmed.maxDeposit, maxRent: confirmed.maxRent }
  const draft = saved?.conditionDraft
  return { maxDeposit: draft?.deposit ? Number(draft.deposit) : null, maxRent: draft?.rent ? Number(draft.rent) : null }
}

/** 편도시간을 사용자 기준과 비교: 이내(초록) / 넘음(주황, 중요도 여유 안이라 통과) / 기준 없음(회색) */
export type TimeCheck = { kind: 'within' | 'over' | 'unset'; text: string }
export function compareTime(route: PlaceRoute): TimeCheck {
  if (route.maxMinutes == null) return { kind: 'unset', text: '기준 미설정 · 참고' }
  const diff = route.minutes - route.maxMinutes
  return diff <= 0
    ? { kind: 'within', text: `기준 ${route.maxMinutes}분 이내` }
    : { kind: 'over', text: `기준보다 ${diff}분 더` }
}

/** 비교 결과별 글자색 */
export const timeCheckColor = (kind: TimeCheck['kind']) =>
  kind === 'within' ? 'text-[var(--gd)]' : kind === 'over' ? 'text-[#B45309]' : 'text-[var(--muted)]'
