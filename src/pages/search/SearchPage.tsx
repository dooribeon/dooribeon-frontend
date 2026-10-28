import { useEffect, useRef, useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { loadKakaoMaps } from '../../services/kakaoMaps'
import type { MapInstance, MapsSDK } from '../../services/kakaoMaps'
import type { ConditionDraft } from '../../components/conditions/conditionModel'
import { fetchRecommendations } from '../../services/recommendApi'
import { recommendations } from '../../mocks/recommendations'   // 탐색 중 지도 연출용 핀 위치

function SearchMap({ step }: { step: number }) {
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
      map.current = new api.Map(container.current, { center: new api.LatLng(37.545, 126.93), level: 8 })
      observer = new ResizeObserver(() => map.current?.relayout())
      observer.observe(container.current)
      setReady(true)
    }).catch(() => { if (!disposed) setError(true) })
    return () => { disposed = true; observer?.disconnect(); map.current = null; sdk.current = null }
  }, [])
  useEffect(() => {
    if (!ready || !map.current || !sdk.current) return
    const api = sdk.current
    map.current.setLevel(Math.max(6, 8 - step))
    if (step < 2) return
    const overlays = recommendations.slice(0, step === 2 ? 2 : 5).map((place, index) => {
      const marker = document.createElement('span')
      marker.className = 'search-candidate-pin'
      marker.textContent = String.fromCharCode(65 + index)
      marker.style.animationDelay = `${index * 100}ms`
      return new api.CustomOverlay({ map: map.current!, position: new api.LatLng(place.lat, place.lng), content: marker, yAnchor: 1, zIndex: 2, clickable: false })
    })
    return () => overlays.forEach(overlay => overlay.setMap(null))
  }, [ready, step])
  return <div className="relative aspect-[26/17] w-full overflow-hidden rounded-[20px] border border-[var(--line-panel)] bg-[#EEF0EC]" aria-label="후보 동네 탐색 지도">
    <div ref={container} className="absolute inset-0" />
    {!ready && <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-[var(--muted)]">{error ? '지도를 불러오지 못했어요. 추천 화면은 계속 준비합니다.' : '지도를 불러오는 중이에요…'}</div>}
    <div className="search-scan pointer-events-none absolute inset-0 z-10" aria-hidden="true" />
  </div>
}

export default function SearchPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { condition?: string; conditions?: Record<string, string>; conditionDraft?: ConditionDraft } | null
  const draft = state?.conditionDraft
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!draft) return
    let disposed = false
    const startedAt = Date.now()
    // 실제 진행률은 알 수 없어서 앞 단계는 시간에 맞춰 넘기고, 응답이 오면 마지막 단계로 이동
    const timers = [1100, 2300, 3500].map((delay, index) => window.setTimeout(() => setStep(current => Math.max(current, index + 1)), delay))
    fetchRecommendations(draft).then(results => {
      if (disposed) return
      const wait = Math.max(0, 3600 - (Date.now() - startedAt))   // 너무 빨리 끝나도 단계 연출은 보여주기
      timers.push(window.setTimeout(() => setStep(4), wait))
      timers.push(window.setTimeout(() => navigate('/recommendations', { replace: true, state: { ...location.state, results } }), wait + 500))
    }).catch((e: Error) => { if (!disposed) setError(e.message) })
    return () => { disposed = true; timers.forEach(window.clearTimeout) }
  }, [draft, navigate, location.state])
  if (!draft) return <Navigate to="/consultation" replace />
  const required = draft.places.filter(place => place.importance === '필수')
  const steps = [
    { title: '예산 확인', description: `보증금 ${draft.deposit ? `${Number(draft.deposit).toLocaleString()}만 원 이하` : '미설정'} · 월세 ${draft.rent ? `${Number(draft.rent).toLocaleString()}만 원 이하` : '미설정'}` },
    { title: '필수 조건 확인', description: required.length ? required.map(place => `${place.name || '거점'} ${place.mode || '이동수단 미설정'} ${place.minutes ? `${place.minutes}분 이내` : ''}`).join(' · ') : '필수 시간 조건 없음 · 모든 후보 비교' },
    { title: '생활거점 이동시간 비교', description: draft.places.length ? `${draft.places.map(place => place.name || '생활거점').join(' · ')} 이동 조건 확인` : '입력한 생활거점 확인' },
    { title: '후보 정리', description: '중요도를 반영해 상위 5곳 정리' },
  ]
  return <AppLayout header={{ appearance: 'prototype' }} className="bg-[#F4F8F6] text-[var(--text)] [--header-background:rgba(244,248,246,.94)]">
    <main className="flex flex-1 items-center justify-center px-[clamp(16px,3vw,48px)] py-8">
      <section className="w-full max-w-[960px] rounded-[28px] border border-[#DFE9E4] bg-white p-8 shadow-[var(--shadow-card)] max-[760px]:rounded-[22px] max-[760px]:px-4 max-[760px]:py-[22px]" aria-labelledby="search-title">
        <div className="mb-6 flex items-center gap-4">
          <svg className="search-look-pin h-[68px] w-[52px] shrink-0 max-[760px]:h-[52px] max-[760px]:w-10" viewBox="0 0 96 124" aria-hidden="true"><path d="M48 4C25 4 7 22 7 45c0 29 41 67 41 67s41-38 41-67C89 22 71 4 48 4z" fill="var(--g)" /><ellipse cx="34" cy="44" rx="11" ry="13" fill="white" /><ellipse cx="62" cy="44" rx="11" ry="13" fill="white" /><g className="search-pupils"><circle cx="35" cy="46" r="5.5" fill="#0B2A22" /><circle cx="63" cy="46" r="5.5" fill="#0B2A22" /><circle cx="37" cy="43.5" r="1.7" fill="white" /><circle cx="65" cy="43.5" r="1.7" fill="white" /></g></svg>
          <div><h1 id="search-title" className="text-2xl font-extrabold tracking-[-.05em] text-[var(--ink)] max-[760px]:text-xl">조건에 맞는 동네를 찾고 있어요</h1><p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--muted)]">두리번이 후보 동네를 두리번두리번 살펴보는 중이에요.</p></div>
        </div>
        <div className="grid grid-cols-[minmax(0,520px)_minmax(0,1fr)] items-center gap-7 max-[960px]:grid-cols-1">
          <SearchMap step={step} />
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
