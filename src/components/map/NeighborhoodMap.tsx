import { useEffect,useRef,useState } from 'react'
import { MapPin,Maximize,RefreshCw,Plus,Minus,LocateFixed } from 'lucide-react'
import type { Neighborhood } from '../../mocks/recommendations'
import { loadKakaoMaps } from '../../services/kakaoMaps'
import type { MapInstance,MapsSDK } from '../../services/kakaoMaps'

const exampleBases=[
  { id: 'work',title: '회사',place: '여의도',lat: 37.5219,lng: 126.9245,icon: '▦' },
  { id: 'family',title: '본가',place: '수원',lat: 37.2663,lng: 126.9998,icon: '⌂' },
]

type Props={ neighborhoods: Neighborhood[]; selectedId: string|null; onSelect: (id: string) => void; detailControls?: boolean }
export default function NeighborhoodMap({ neighborhoods,selectedId,onSelect,detailControls=false }: Props) {
  const [satellite,setSatellite]=useState(false)
  const [hiddenBases,setHiddenBases]=useState<string[]>([])
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
    if(!loaded) return
    const { map,sdk }=loaded
    const overlays=exampleBases.filter(base => !hiddenBases.includes(base.id)).map(base => {
      const marker=document.createElement('div')
      marker.className=`flex items-center gap-2.5 whitespace-nowrap rounded-[14px] border-2 border-white bg-white py-[9px] pl-2 pr-[14px] shadow-[0_4px_18px_#17334a25] [&_strong]:block [&_strong]:text-sm [&_strong]:text-[#102535] [&_small]:mt-[3px] [&_small]:block [&_small]:text-[11px] [&_small]:text-[#64748b] base-marker-${base.id}`
      marker.setAttribute('aria-label',`${base.title} ${base.place}, 예시 위치`)
      const icon=document.createElement('span')
      icon.className='grid h-11 w-10 place-items-center rounded-[22px_22px_22px_4px] bg-[#2388ff] text-[28px] leading-none text-white [.base-marker-family_&]:bg-[#ff557c]'
      icon.textContent=base.icon
      icon.setAttribute('aria-hidden','true')
      const label=document.createElement('div')
      const title=document.createElement('strong')
      title.textContent=base.title
      const place=document.createElement('small')
      place.textContent=`${base.place} · 예시`
      label.append(title,place)
      marker.append(icon,label)
      return new sdk.CustomOverlay({ map,position: new sdk.LatLng(base.lat,base.lng),content: marker,yAnchor: 1.2,zIndex: 4,clickable: false })
    })
    return () => overlays.forEach(overlay => overlay.setMap(null))
  },[loaded,hiddenBases])

  useEffect(() => {
    if(loaded) loaded.map.setMapTypeId(satellite? loaded.sdk.MapTypeId.HYBRID:loaded.sdk.MapTypeId.ROADMAP)
  },[loaded,satellite])

  function showBases() {
    if(!loaded) return
    const bounds=new loaded.sdk.LatLngBounds()
      ;[...neighborhoods,...exampleBases.filter(base => !hiddenBases.includes(base.id))].forEach(point => bounds.extend(new loaded.sdk.LatLng(point.lat,point.lng)))
    loaded.map.setBounds(bounds)
  }


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
"><span className="before:!bg-[#2388ff]">회사</span><span className="before:!bg-[#ff557c]">본가</span><span className="legend-neighborhood">추천 동네</span></div>
      <fieldset className="
  absolute z-5 bottom-10 left-6 min-w-[185px] rounded-[14px] border-0 bg-white p-5
  shadow-[0_4px_20px_#10253512] [&_legend]:float-left [&_legend]:mb-3 [&_legend]:w-full [&_legend]:text-sm
  [&_legend]:font-bold [&_label]:clear-both [&_label]:mt-[9px] [&_label]:flex [&_label]:items-center
  [&_label]:gap-[9px] [&_label]:text-[13px] [&_label]:text-[#465970] [&_input]:size-[17px]
  [&_input]:accent-[#2388ff] [&_label:nth-of-type(2)_input]:accent-[#ff557c] [&_small]:mt-3 [&_small]:block
  [&_small]:text-[10px] [&_small]:text-[#8492a2] max-[760px]:bottom-[35px] max-[760px]:left-[15px]
  max-[760px]:min-w-[150px] max-[760px]:p-[13px]
"><legend>표시할 거점</legend>{exampleBases.map(base => <label key={base.id}><input type="checkbox" checked={!hiddenBases.includes(base.id)} onChange={() => setHiddenBases(current => current.includes(base.id)? current.filter(id => id!==base.id):[...current,base.id])} />{base.title} ({base.place})</label>)}<small>예시 위치 기준</small></fieldset>
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
    {loaded&&<><button className="
  absolute top-[85px] right-5 z-5 flex items-center gap-[7px] rounded-[10px] border border-border bg-white
  px-[15px] py-[11px] text-xs text-text-primary shadow-[0_2px_10px_#0000000a] disabled:opacity-50
  disabled:cursor-not-allowed max-[1350px]:top-[140px]
" onClick={showBases}><Maximize size={15} /> 전체 위치 보기</button><div className="
  pointer-events-none absolute bottom-[38px] left-5 z-5 rounded-lg bg-[#ffffffed] px-4 py-3 text-[11px]
  text-text-secondary shadow-[0_4px_20px_#172c4110] max-[760px]:bottom-[35px] max-[760px]:text-[10px]
">{neighborhoods.length? '동네 대표 위치 · 마커를 눌러 선택하세요':'현재 필터에 맞는 동네가 없어요'}</div></>}
  </section>
}
