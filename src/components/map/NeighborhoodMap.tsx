import { useEffect, useRef, useState } from 'react'
import { MapPin, Maximize, RefreshCw, Plus, Minus, LocateFixed } from 'lucide-react'
import type { Neighborhood } from '../../mocks/recommendations'
import { loadKakaoMaps } from '../../services/kakaoMaps'
import type { MapInstance, MapsSDK } from '../../services/kakaoMaps'
import './NeighborhoodMap.css'

const exampleBases = [
  { id: 'work', title: '회사', place: '여의도', lat: 37.5219, lng: 126.9245, icon: '▦' },
  { id: 'family', title: '본가', place: '수원', lat: 37.2663, lng: 126.9998, icon: '⌂' },
]

type Props = { neighborhoods: Neighborhood[]; selectedId: string | null; onSelect: (id: string) => void; detailControls?: boolean }
export default function NeighborhoodMap({ neighborhoods, selectedId, onSelect, detailControls = false }: Props) {
  const [satellite, setSatellite] = useState(false)
  const [hiddenBases, setHiddenBases] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState<{ map: MapInstance; sdk: MapsSDK } | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const fittedMapRef = useRef<MapInstance | null>(null)
  const lastSelectionRef = useRef<string | null>(null)
  const selectionRef = useRef(onSelect)
  useEffect(() => { selectionRef.current = onSelect }, [onSelect])

  useEffect(() => {
    let cancelled = false
    let observer: ResizeObserver | undefined
    const container = containerRef.current
    if (!container) return
    loadKakaoMaps().then(sdk => {
      if (cancelled) return
      const map = new sdk.Map(container, { center: new sdk.LatLng(37.55, 126.92), level: 6 })
      observer = new ResizeObserver(() => { const center = map.getCenter(); map.relayout(); map.setCenter(center) })
      observer.observe(container)
      setLoaded({ map, sdk })
    }).catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : '지도 연결에 실패했어요.') })
    return () => { cancelled = true; observer?.disconnect(); container.replaceChildren() }
  }, [attempt])

  useEffect(() => {
    if (!loaded) return
    const { map, sdk } = loaded
    const overlays = neighborhoods.map(item => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = `kakao-neighborhood-marker ${item.id === selectedId ? 'is-selected' : ''}`
      button.setAttribute('aria-label', `${item.name} 선택`)
      button.setAttribute('aria-pressed', String(item.id === selectedId))
      const badge = document.createElement('span')
      badge.textContent = String(item.rank)
      button.append(badge, document.createTextNode(item.name))
      button.onclick = () => selectionRef.current(item.id)
      return new sdk.CustomOverlay({ map, position: new sdk.LatLng(item.lat, item.lng), content: button, yAnchor: 1.2, zIndex: item.id === selectedId ? 3 : 1, clickable: true })
    })
    return () => overlays.forEach(overlay => overlay.setMap(null))
  }, [loaded, neighborhoods, selectedId])

  useEffect(() => {
    if (!loaded) return
    if (fittedMapRef.current !== loaded.map && neighborhoods.length) {
      if (!selectedId) {
        const bounds = new loaded.sdk.LatLngBounds()
        neighborhoods.forEach(item => bounds.extend(new loaded.sdk.LatLng(item.lat, item.lng)))
        loaded.map.setBounds(bounds)
      }
      fittedMapRef.current = loaded.map
    }
    if (!selectedId) lastSelectionRef.current = null
    const selected = neighborhoods.find(item => item.id === selectedId)
    if (selected && lastSelectionRef.current !== selectedId) {
      loaded.map.panTo(new loaded.sdk.LatLng(selected.lat, selected.lng))
      lastSelectionRef.current = selectedId
    }
  }, [loaded, selectedId, neighborhoods])

  useEffect(() => {
    if (!loaded) return
    const { map, sdk } = loaded
    const overlays = exampleBases.filter(base => !hiddenBases.includes(base.id)).map(base => {
      const marker = document.createElement('div')
      marker.className = `base-marker base-marker-${base.id}`
      marker.setAttribute('aria-label', `${base.title} ${base.place}, 예시 위치`)
      const icon = document.createElement('span')
      icon.className = 'base-marker-icon'
      icon.textContent = base.icon
      icon.setAttribute('aria-hidden', 'true')
      const label = document.createElement('div')
      const title = document.createElement('strong')
      title.textContent = base.title
      const place = document.createElement('small')
      place.textContent = `${base.place} · 예시`
      label.append(title, place)
      marker.append(icon, label)
      return new sdk.CustomOverlay({ map, position: new sdk.LatLng(base.lat, base.lng), content: marker, yAnchor: 1.2, zIndex: 4, clickable: false })
    })
    return () => overlays.forEach(overlay => overlay.setMap(null))
  }, [loaded, hiddenBases])

  useEffect(() => {
    if (loaded) loaded.map.setMapTypeId(satellite ? loaded.sdk.MapTypeId.HYBRID : loaded.sdk.MapTypeId.ROADMAP)
  }, [loaded, satellite])

  function showBases() {
    if (!loaded) return
    const bounds = new loaded.sdk.LatLngBounds()
    ;[...neighborhoods, ...exampleBases.filter(base => !hiddenBases.includes(base.id))].forEach(point => bounds.extend(new loaded.sdk.LatLng(point.lat, point.lng)))
    loaded.map.setBounds(bounds)
  }


  return <section className="neighborhood-map live-map" aria-label="추천 동네 카카오 지도">
    <div className="kakao-map-canvas" ref={containerRef} />
    {!loaded && <div className="map-load-state" role="status"><MapPin size={28} /><p>{error || '카카오맵을 불러오고 있어요…'}</p>{error && <button onClick={() => { setError(''); setAttempt(current => current + 1) }}><RefreshCw size={15} /> 다시 시도</button>}</div>}
    {loaded && detailControls && <>
      <div className="map-type-switch" aria-label="지도 종류"><button aria-pressed={!satellite} onClick={() => setSatellite(false)}>지도</button><button aria-pressed={satellite} onClick={() => setSatellite(true)}>위성</button></div>
      <div className="detail-map-legend"><span className="legend-work">회사</span><span className="legend-family">본가</span><span className="legend-neighborhood">추천 동네</span></div>
      <fieldset className="base-visibility"><legend>표시할 거점</legend>{exampleBases.map(base => <label key={base.id}><input type="checkbox" checked={!hiddenBases.includes(base.id)} onChange={() => setHiddenBases(current => current.includes(base.id) ? current.filter(id => id !== base.id) : [...current, base.id])} />{base.title} ({base.place})</label>)}<small>예시 위치 기준</small></fieldset>
    </>}
    {loaded && <div className="map-navigation-controls" aria-label="지도 조작">
      <div className="map-zoom-buttons">
        <button type="button" aria-label="지도 확대" title="확대" onClick={() => loaded.map.setLevel(Math.max(1, loaded.map.getLevel() - 1))}><Plus size={27} strokeWidth={1.8} /></button>
        <button type="button" aria-label="지도 축소" title="축소" onClick={() => loaded.map.setLevel(Math.min(14, loaded.map.getLevel() + 1))}><Minus size={27} strokeWidth={1.8} /></button>
      </div>
      <button type="button" className="map-recenter-button" aria-label="선택한 동네로 이동" title="선택한 동네로 이동" disabled={!neighborhoods.some(item => item.id === selectedId)} onClick={() => {
        const selected = neighborhoods.find(item => item.id === selectedId)
        if (selected) loaded.map.panTo(new loaded.sdk.LatLng(selected.lat, selected.lng))
      }}><LocateFixed size={25} strokeWidth={1.8} /></button>
    </div>}
    {loaded && <><button className="map-show-all" onClick={showBases}><Maximize size={15} /> 전체 위치 보기</button><div className="live-map-note">{neighborhoods.length ? '동네 대표 위치 · 마커를 눌러 선택하세요' : '현재 필터에 맞는 동네가 없어요'}</div></>}
  </section>
}
