import { useEffect,useRef,useState } from 'react'
import { MapPin,RefreshCw,Plus,Minus,LocateFixed } from 'lucide-react'
import type { Neighborhood } from '../../mocks/recommendations'
import { loadKakaoMaps } from '../../services/kakaoMaps'
import type { MapInstance,MapsSDK } from '../../services/kakaoMaps'

type Props={ neighborhoods: Neighborhood[]; selectedId: string|null; onSelect: (id: string) => void; detailControls?: boolean }
export default function NeighborhoodMap({ neighborhoods,selectedId,onSelect,detailControls=false }: Props) {
  const [satellite,setSatellite]=useState(false)
  const containerRef=useRef<HTMLDivElement>(null)
  const [loaded,setLoaded]=useState<{ map: MapInstance; sdk: MapsSDK }|null>(null)
  const [error,setError]=useState('')
  const [attempt,setAttempt]=useState(0)
  const fittedMapRef=useRef<MapInstance|null>(null)
  const lastSelectionRef=useRef<string|null>(null)
  const selectionRef=useRef(onSelect)
  useEffect(() => { selectionRef.current=onSelect },[onSelect])

  useEffect(() => {
    let cancelled=false
    let observer: ResizeObserver|undefined
    const container=containerRef.current
    if(!container) return
    loadKakaoMaps().then(sdk => {
      if(cancelled) return
      const map=new sdk.Map(container,{ center: new sdk.LatLng(37.55,126.92),level: 6 })
      observer=new ResizeObserver(() => { const center=map.getCenter(); map.relayout(); map.setCenter(center) })
      observer.observe(container)
      setLoaded({ map,sdk })
    }).catch(reason => { if(!cancelled) setError(reason instanceof Error? reason.message:'지도 연결에 실패했어요.') })
    return () => { cancelled=true; observer?.disconnect(); container.replaceChildren() }
  },[attempt])

  useEffect(() => {
    if(!loaded) return
    const { map,sdk }=loaded
    const overlays=neighborhoods.map(item => {
      const button=document.createElement('button')
      button.type='button'
      button.className=`flex items-center gap-3 whitespace-nowrap rounded-[22px] border-2 border-white bg-white py-1.5 pl-1.5 pr-4 text-sm font-[650] text-text-primary shadow-[0_3px_12px_#183c2326] [&>span]:grid [&>span]:size-[27px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-primary [&>span]:text-white [&.is-selected]:rounded-[24px_24px_24px_5px] [&.is-selected]:bg-primary [&.is-selected]:py-[9px] [&.is-selected]:pl-2 [&.is-selected]:pr-[19px] [&.is-selected]:text-base [&.is-selected]:text-white [&.is-selected]:shadow-[0_5px_20px_#006d4540] [&.is-selected>span]:size-[35px] [&.is-selected>span]:bg-white [&.is-selected>span]:text-[19px] [&.is-selected>span]:text-primary ${item.id===selectedId? 'is-selected':''}`
      button.setAttribute('aria-label',`${item.name} 선택`)
      button.setAttribute('aria-pressed',String(item.id===selectedId))
      const badge=document.createElement('span')
      badge.textContent=String(item.rank)
      button.append(badge,document.createTextNode(item.name))
      button.onclick=() => selectionRef.current(item.id)
      return new sdk.CustomOverlay({ map,position: new sdk.LatLng(item.lat,item.lng),content: button,yAnchor: 1.2,zIndex: item.id===selectedId? 3:1,clickable: true })
    })
    return () => overlays.forEach(overlay => overlay.setMap(null))
  },[loaded,neighborhoods,selectedId])

  useEffect(() => {
    if(!loaded) return
    if(fittedMapRef.current!==loaded.map&&neighborhoods.length) {
      if(!selectedId) {
        const bounds=new loaded.sdk.LatLngBounds()
        neighborhoods.forEach(item => bounds.extend(new loaded.sdk.LatLng(item.lat,item.lng)))
        loaded.map.setBounds(bounds)
      }
      fittedMapRef.current=loaded.map
    }
    if(!selectedId) lastSelectionRef.current=null
    const selected=neighborhoods.find(item => item.id===selectedId)
    if(selected&&lastSelectionRef.current!==selectedId) {
      loaded.map.panTo(new loaded.sdk.LatLng(selected.lat,selected.lng))
      lastSelectionRef.current=selectedId
    }
  },[loaded,selectedId,neighborhoods])

  useEffect(() => {
    if(loaded) loaded.map.setMapTypeId(satellite? loaded.sdk.MapTypeId.HYBRID:loaded.sdk.MapTypeId.ROADMAP)
  },[loaded,satellite])

  return <section className="
  relative min-h-[360px] h-full flex-1 overflow-hidden rounded-none max-[760px]:h-[420px]
  max-[760px]:min-h-[340px] max-[760px]:flex-auto isolate bg-surface
" aria-label="추천 동네 카카오 지도">
    <div className="absolute inset-0 size-full" ref={containerRef} />
    {!loaded&&<div className="
  absolute inset-0 z-5 flex flex-col items-center justify-center gap-4 bg-surface p-8 text-center text-sm
  leading-[1.7] text-text-secondary [&_button]:flex [&_button]:items-center [&_button]:gap-[7px]
  [&_button]:rounded-[10px] [&_button]:border [&_button]:border-border [&_button]:bg-white
  [&_button]:px-[15px] [&_button]:py-[11px] [&_button]:text-xs [&_button]:text-text-primary
" role="status"><MapPin size={28} /><p>{error||'카카오맵을 불러오고 있어요…'}</p>{error&&<button onClick={() => { setError(''); setAttempt(current => current+1) }}><RefreshCw size={15} /> 다시 시도</button>}</div>}
    {loaded&&detailControls&&<>
      <div className="
  absolute z-5 top-5 left-5 flex rounded-[13px] bg-white p-[5px] shadow-[0_3px_15px_#10253512]
  [&_button]:rounded-[9px] [&_button]:px-[17px] [&_button]:py-2 [&_button]:text-xs [&_button]:text-[#465970]
  [&_button[aria-pressed=true]]:bg-primary [&_button[aria-pressed=true]]:text-white
" aria-label="지도 종류"><button aria-pressed={!satellite} onClick={() => setSatellite(false)}>지도</button><button aria-pressed={satellite} onClick={() => setSatellite(true)}>위성</button></div>
      <div className="
  absolute z-5 top-5 left-[180px] flex items-center gap-[18px] rounded-xl bg-white px-[18px] py-[15px]
  text-[11px] shadow-[0_3px_15px_#10253508] [&_span]:flex [&_span]:items-center [&_span]:gap-[7px]
  [&_span]:before:size-[11px] [&_span]:before:rounded-full [&_span]:before:bg-primary
  [&_span]:before:content-[''] max-[1250px]:top-20 max-[1250px]:left-5
"><span className="legend-neighborhood">추천 동네</span></div>

    </>}
    {loaded&&<div className="
  absolute right-5 bottom-10 z-5 flex flex-col gap-[14px] text-[#102535] [&_button]:grid
  [&_button]:size-[54px] [&_button]:place-items-center [&_button]:bg-white [&_button]:text-inherit
  [&_button:enabled:hover]:bg-[#f3faf7] [&_button:enabled:hover]:text-primary
  [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-primary
  [&_button:focus-visible]:outline-offset-[-4px] [&_button:disabled]:opacity-50
  [&_button:disabled]:cursor-not-allowed max-[760px]:right-[14px] max-[760px]:bottom-[35px]
  max-[760px]:gap-2.5 max-[760px]:[&_button]:size-[46px]
" aria-label="지도 조작">
      <div className="
  overflow-hidden rounded-[17px] border border-[#edf0f3] bg-white shadow-[0_3px_14px_#17334a16]
  [&_button+button]:border-t [&_button+button]:border-[#edf0f3]
">
        <button type="button" aria-label="지도 확대" title="확대" onClick={() => loaded.map.setLevel(Math.max(1,loaded.map.getLevel()-1))}><Plus size={27} strokeWidth={1.8} /></button>
        <button type="button" aria-label="지도 축소" title="축소" onClick={() => loaded.map.setLevel(Math.min(14,loaded.map.getLevel()+1))}><Minus size={27} strokeWidth={1.8} /></button>
      </div>
      <button type="button" className="rounded-[17px] border border-[#edf0f3] shadow-[0_3px_14px_#17334a16]" aria-label="선택한 동네로 이동" title="선택한 동네로 이동" disabled={!neighborhoods.some(item => item.id===selectedId)} onClick={() => {
        const selected=neighborhoods.find(item => item.id===selectedId)
        if(selected) loaded.map.panTo(new loaded.sdk.LatLng(selected.lat,selected.lng))
      }}><LocateFixed size={25} strokeWidth={1.8} /></button>
    </div>}
    {loaded&&<div className="
  pointer-events-none absolute bottom-[38px] left-5 z-5 rounded-lg bg-[#ffffffed] px-4 py-3 text-[11px]
  text-text-secondary shadow-[0_4px_20px_#172c4110] max-[760px]:bottom-[35px] max-[760px]:text-[10px]
">{neighborhoods.length? '동네 대표 위치 · 마커를 눌러 선택하세요':'현재 필터에 맞는 동네가 없어요'}</div>}
  </section>
}
