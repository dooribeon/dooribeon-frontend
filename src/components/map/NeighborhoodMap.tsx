import { useEffect, useRef, useState } from 'react'
import { MapPin, Maximize, RefreshCw } from 'lucide-react'
import type { Neighborhood } from '../../mocks/recommendations'
import { loadKakaoMaps } from '../../services/kakaoMaps'
import type { MapInstance, MapsSDK } from '../../services/kakaoMaps'
import './NeighborhoodMap.css'

type Props = { neighborhoods: Neighborhood[]; selectedId: string | null; onSelect: (id: string) => void }
export default function NeighborhoodMap({ neighborhoods, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState<{ map: MapInstance; sdk: MapsSDK } | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
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
      map.addControl(new sdk.ZoomControl(), sdk.ControlPosition.RIGHT)
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
    const selected = neighborhoods.find(item => item.id === selectedId)
    if (selected) loaded.map.panTo(new loaded.sdk.LatLng(selected.lat, selected.lng))
  }, [loaded, selectedId, neighborhoods])

  function showAll() {
    if (!loaded || !neighborhoods.length) return
    const bounds = new loaded.sdk.LatLngBounds()
    neighborhoods.forEach(item => bounds.extend(new loaded.sdk.LatLng(item.lat, item.lng)))
    loaded.map.setBounds(bounds)
  }

  return <section className="neighborhood-map live-map" aria-label="추천 동네 카카오 지도">
    <div className="kakao-map-canvas" ref={containerRef} />
    {!loaded && <div className="map-load-state" role="status"><MapPin size={28} /><p>{error || '카카오맵을 불러오고 있어요…'}</p>{error && <button onClick={() => { setError(''); setAttempt(current => current + 1) }}><RefreshCw size={15} /> 다시 시도</button>}</div>}
    {loaded && <><button className="map-show-all" disabled={!neighborhoods.length} onClick={showAll}><Maximize size={15} /> 전체 동네 보기</button><div className="live-map-note">{neighborhoods.length ? '동네 대표 위치 · 마커를 눌러 선택하세요' : '현재 필터에 맞는 동네가 없어요'}</div></>}
  </section>
}
