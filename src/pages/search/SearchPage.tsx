import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { loadKakaoMaps } from '../../services/kakaoMaps'
import type { MapInstance, MapsSDK } from '../../services/kakaoMaps'
import type { ConditionConversation } from '../../services/conditionConversationApi'
import type { ConditionDraft } from '../../components/conditions/conditionModel'
import { fetchCandidates, fetchRecommendations } from '../../services/recommendApi'
import type { CandidatesResult, Recommendation } from '../../services/recommendApi'

type BasePlace = { label: string; lat: number; lng: number }

/** 탐색 지도: 내 거점 → 예산 통과 동네(점) → 가까운 후보 20곳 → TOP 순위 핀 */
function SearchMap({ step, places, candidates, results }: { step: number; places: BasePlace[]; candidates: CandidatesResult | null; results: Recommendation[] | null }) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<MapInstance | null>(null)
  const sdk = useRef<MapsSDK | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  useEffect(() => {
    let disposed = false
    let observer: ResizeObserver | undefined
    loadKakaoMaps().then(api => {
      if (disposed || !container.current) return
      sdk.current = api
      map.current = new api.Map(container.current, { center: new api.LatLng(37.545, 126.98), level: 9 })
      observer = new ResizeObserver(() => map.current?.relayout())
      observer.observe(container.current)
      setReady(true)
    }).catch(() => { if (!disposed) setError(true) })
    return () => { disposed = true; observer?.disconnect(); map.current = null; sdk.current = null }
  }, [])
  useEffect(() => {
    if (!ready || !map.current || !sdk.current) return
    const api = sdk.current
    const target = map.current
    const candidateIds = new Set(candidates?.candidates.map(spot => spot.id) ?? [])
    const rankById = new Map((results ?? []).map(result => [`${result.gu}-${result.dong}`, result.rank]))
    const overlays: { setMap(map: MapInstance | null): void }[] = []
    const add = (lat: number, lng: number, content: HTMLElement, zIndex: number, yAnchor = 0.5) =>
      overlays.push(new api.CustomOverlay({ map: target, position: new api.LatLng(lat, lng), content, yAnchor, zIndex, clickable: false }))

    // ① 예산 통과 동네: 작은 점 → 후보가 정해지면 후보만 진하게, 결과가 나오면 TOP만 순위 핀
    if (step >= 1 && candidates) {
      candidates.budgetPassed.forEach((spot, index) => {
        const rank = rankById.get(spot.id)
        if (step >= 3 && rank) {
          const pin = document.createElement('span')
          pin.className = 'search-candidate-pin'
          pin.textContent = String(rank)
          pin.style.animationDelay = `${rank * 120}ms`
          add(spot.lat, spot.lng, pin, 3, 1)
          return
        }
        const dot = document.createElement('span')
        const isCandidate = candidateIds.has(spot.id)
        dot.className = `search-dot${step >= 2 && isCandidate ? ' is-candidate' : ''}${(step >= 2 && !isCandidate) || step >= 3 ? ' is-faded' : ''}`
        if (step === 1) dot.style.animationDelay = `${Math.min(index * 4, 900)}ms`
        add(spot.lat, spot.lng, dot, isCandidate ? 2 : 1)
      })
    }
    // 내 거점 라벨 (TOP 핀보다는 아래에 표시)
    places.forEach(place => {
      const tag = document.createElement('span')
      tag.className = 'search-place'
      tag.textContent = place.label
      add(place.lat, place.lng, tag, 2, 1)
    })

    // 단계에 맞춰 보이는 범위 조정
    const focus = step >= 3 && results?.length ? results.map(r => ({ lat: r.lat, lng: r.lng }))
      : step >= 2 && candidates ? candidates.candidates
      : step >= 1 && candidates ? candidates.budgetPassed
      : []
    const points = focus.length ? focus : places
    if (points.length) {
      const bounds = new api.LatLngBounds()
      points.forEach(point => bounds.extend(new api.LatLng(point.lat, point.lng)))
      target.setBounds(bounds, 40, 40, 40, 40)
      if (target.getLevel() < 6) target.setLevel(6)
    }
    return () => overlays.forEach(overlay => overlay.setMap(null))
  }, [ready, step, places, candidates, results])
  return <div className="relative aspect-[26/17] w-full overflow-hidden rounded-[20px] border border-[var(--line-panel)] bg-[#EEF0EC]" aria-label="후보 동네 탐색 지도">
    <div ref={container} className="absolute inset-0" />
    {!ready && <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-[var(--muted)]">{error ? '지도를 불러오지 못했어요. 추천 화면은 계속 준비합니다.' : '지도를 불러오는 중이에요…'}</div>}
    {step < 3 && <div className="search-scan pointer-events-none absolute inset-0 z-10" aria-hidden="true" />}
  </div>
}

export default function SearchPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { condition?: string; conditions?: Record<string, string>; conditionDraft?: ConditionDraft; aiConversation?: ConditionConversation } | null
  const draft = state?.conditionDraft
  const confirmed = state?.aiConversation?.conditions
  const [step, setStep] = useState(0)
  const [candidates, setCandidates] = useState<CandidatesResult | null>(null)
  const [results, setResults] = useState<Recommendation[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!draft) return
    let disposed = false
    const startedAt = Date.now()
    const timers: number[] = []
    // 시작 후 ms 시점에 실행 (응답이 빨라도 단계를 차례로 보여주기 위해)
    const at = (ms: number, run: () => void) => timers.push(window.setTimeout(() => { if (!disposed) run() }, Math.max(0, ms - (Date.now() - startedAt))))
    const fail = (e: Error) => { if (!disposed) setError(e.message) }
    // ①② 예산·거리 후보는 바로 나오고, ③ 실제 경로 확인은 시간이 걸려서 동시에 요청
    fetchCandidates(draft, confirmed).then(result => {
      if (disposed) return
      setCandidates(result)
      at(700, () => setStep(current => Math.max(current, 1)))
      at(2000, () => setStep(current => Math.max(current, 2)))
    }).catch(fail)
    fetchRecommendations(draft, confirmed).then(result => {
      // 결과가 늦게 와도 TOP 핀을 잠깐 보여준 뒤 이동
      const showAt = Math.max(3200, Date.now() - startedAt)
      at(showAt, () => { setResults(result); setStep(3) })
      at(showAt + 1600, () => { setStep(4); navigate('/recommendations', { replace: true, state: { ...location.state, results: result } }) })
    }).catch(fail)
    return () => { disposed = true; timers.forEach(window.clearTimeout) }
  }, [draft, confirmed, navigate, location.state])
  const places = useMemo<BasePlace[]>(() => confirmed
    ? confirmed.places.flatMap(place => place.location ? [{ label: place.label || place.location.placeName || '거점', lat: place.location.lat, lng: place.location.lng }] : [])
    : (draft?.places ?? []).flatMap(place => place.resolvedPlace ? [{ label: place.name || place.resolvedPlace.name, lat: place.resolvedPlace.lat, lng: place.resolvedPlace.lng }] : []),
  [draft, confirmed])
  if (!draft) return <Navigate to="/consultation" replace />
  const budgetText = `보증금 ${draft.deposit ? `${Number(draft.deposit).toLocaleString()}만 원` : '미설정'} · 월세 ${draft.rent ? `${Number(draft.rent).toLocaleString()}만 원` : '미설정'} 이하`
  const placeNames = places.map(place => place.label).join(' · ') || '생활거점'
  const steps = [
    { title: '예산 확인', description: candidates && step >= 1 ? `서울 ${candidates.totalNeighborhoods}개 동네 중 예산에 맞는 동네 ${candidates.budgetPassed.length}곳` : budgetText },
    { title: '가까운 후보 고르기', description: candidates && step >= 2 ? `${placeNames}에서 가까운 순으로 ${candidates.candidates.length}곳 선택` : `${placeNames} 기준 거리 비교` },
    { title: '실제 이동시간 확인', description: step >= 3 ? '편도시간 조건을 넘는 동네는 제외했어요' : `후보 동네에서 ${placeNames}까지 대중교통·도보 경로를 확인하고 있어요` },
    { title: '후보 정리', description: results ? `중요도를 반영해 TOP ${results.length} 선정` : '중요도를 반영해 상위 5곳 정리' },
  ]
  return <AppLayout header={{ appearance: 'prototype' }} className="bg-[#F4F8F6] text-[var(--text)] [--header-background:rgba(244,248,246,.94)]">
    <main className="flex flex-1 items-center justify-center px-[clamp(16px,3vw,48px)] py-8">
      <section className="w-full max-w-[960px] rounded-[28px] border border-[#DFE9E4] bg-white p-8 shadow-[var(--shadow-card)] max-[760px]:rounded-[22px] max-[760px]:px-4 max-[760px]:py-[22px]" aria-labelledby="search-title">
        <div className="mb-6 flex items-center gap-4">
          <svg className="search-look-pin h-[68px] w-[52px] shrink-0 max-[760px]:h-[52px] max-[760px]:w-10" viewBox="0 0 96 124" aria-hidden="true"><path d="M48 4C25 4 7 22 7 45c0 29 41 67 41 67s41-38 41-67C89 22 71 4 48 4z" fill="var(--g)" /><ellipse cx="34" cy="44" rx="11" ry="13" fill="white" /><ellipse cx="62" cy="44" rx="11" ry="13" fill="white" /><g className="search-pupils"><circle cx="35" cy="46" r="5.5" fill="#0B2A22" /><circle cx="63" cy="46" r="5.5" fill="#0B2A22" /><circle cx="37" cy="43.5" r="1.7" fill="white" /><circle cx="65" cy="43.5" r="1.7" fill="white" /></g></svg>
          <div><h1 id="search-title" className="text-2xl font-extrabold tracking-[-.05em] text-[var(--ink)] max-[760px]:text-xl">조건에 맞는 동네를 찾고 있어요</h1><p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--muted)]">두리번이 후보 동네를 두리번두리번 살펴보는 중이에요.</p></div>
        </div>
        <div className="grid grid-cols-[minmax(0,520px)_minmax(0,1fr)] items-center gap-7 max-[960px]:grid-cols-1">
          <SearchMap step={step} places={places} candidates={candidates} results={results} />
          <ol className="flex flex-col gap-3.5">{steps.map((item, index) => <li key={item.title} className={`flex items-start gap-3 transition-opacity ${step < index ? 'opacity-40' : ''}`} aria-current={step === index ? 'step' : undefined}>
            <span className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${step > index ? 'border-[var(--gd)] bg-[var(--gd)] text-white' : 'border-[#CFE3DA] bg-white text-[var(--gd)]'}`} aria-hidden="true">{step > index ? <Check size={15} strokeWidth={3} /> : step === index ? <LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" /> : null}</span>
            <div className="pt-0.5"><strong className="text-[15.5px] text-[var(--ink)]">{item.title}</strong><p className="mt-[3px] text-[13.5px] leading-relaxed text-[var(--muted)]">{item.description}</p></div>
          </li>)}</ol>
        </div>
        {error && <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F3D2D2] bg-[#FFF7F7] px-5 py-4" role="alert"><p className="text-sm text-[#9F1D1D]">{error}</p><button className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-white" onClick={() => navigate('/consultation', { state: location.state })}>조건 수정하기</button></div>}
        <p className="sr-only" role="status">{step < 4 ? steps[step].title : '후보 정리 완료. 추천 목록으로 이동합니다.'}</p>
      </section>
    </main>
  </AppLayout>
}
