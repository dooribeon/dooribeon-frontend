import { useState } from 'react'
import { Link,useLocation,useNavigate,useParams } from 'react-router-dom'
import { ArrowLeft,Building2,Heart,House } from 'lucide-react'
import NeighborhoodDetailPage from './NeighborhoodDetailPage'
import AppLayout from '../../components/layout/AppLayout'
import NeighborhoodMap from '../../components/map/NeighborhoodMap'
import { toNeighborhoods,transportLabel } from '../../services/recommendApi'
import type { Recommendation } from '../../services/recommendApi'

export default function RecommendationsPage({ saved,onToggleSaved }: { saved: string[]; onToggleSaved: (id: string) => void }) {
  const location=useLocation()
  const { id: detailId }=useParams()
  const navigate=useNavigate()
  const [savedOnly,setSavedOnly]=useState<boolean>(location.state?.listState?.savedOnly??false)
  const recommendations=toNeighborhoods((location.state?.results??[]) as Recommendation[])
  const visible=recommendations.filter(item => !savedOnly||saved.includes(item.id)).sort((a,b) => a.rank-b.rank)
  const activeId=detailId??null

  function showList(onlySaved: boolean) {
    setSavedOnly(onlySaved)
    navigate('/recommendations', {
      replace: true,
      state: { ...location.state, listState: { savedOnly: onlySaved } },
    })
  }

  function select(id: string) {
    navigate(`/recommendations/${id}`,{
      replace: Boolean(detailId),
      state: { ...location.state,listState: { savedOnly } },
    })
  }

  return <AppLayout className="bg-[#F4F8F6] text-[var(--text)] tracking-[-.03em] [--header-background:rgba(244,248,246,.94)] [&_button]:min-h-11 recommendations-refresh min-[1001px]:h-dvh min-[1001px]:overflow-hidden" header={{ appearance: 'prototype' }}>
    <main className="mx-auto w-full max-w-[1680px] px-[clamp(20px,3vw,48px)] pt-6 pb-6 min-[1001px]:flex min-[1001px]:min-h-0 min-[1001px]:flex-1 min-[1001px]:flex-col max-[760px]:px-4">
      <h1 className="sr-only">동네 추천</h1>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(400px,min(40%,560px))] min-h-0 gap-6 min-[1001px]:flex-1 min-[1001px]:grid-rows-[minmax(0,1fr)] max-[1000px]:grid-cols-1">
      <div className="flex min-h-0 min-w-0 flex-col">
        <div className="relative flex min-h-0 min-[1001px]:flex-1 max-[1000px]:aspect-[3/2] max-[1000px]:max-h-[60svh] max-[1000px]:min-h-[360px] overflow-hidden rounded-[24px] border border-[var(--line-panel)] bg-[#EEF0EC] max-[760px]:min-h-[320px] max-[760px]:rounded-[18px]"><NeighborhoodMap neighborhoods={visible} selectedId={activeId} onSelect={select} />
          <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex flex-wrap items-start justify-between gap-2 max-[760px]:inset-x-3 max-[760px]:top-3">
            <Link to="/consultation" state={location.state} className="pointer-events-auto inline-flex min-h-11 items-center gap-1.5 rounded-3xl bg-white px-[17px] py-1 text-xs font-[550] text-black hover:bg-gray-50 max-[760px]:px-[13px]"><ArrowLeft size={14} />조건 수정</Link>
            <div className="
  pointer-events-auto ml-auto flex gap-[5px]
  [&_button]:rounded-3xl [&_button]:bg-white [&_button]:px-[17px] [&_button]:py-1 [&_button]:text-xs
  [&_button]:font-[550] [&_button]:text-text-secondary [&_button[aria-pressed=true]]:bg-primary
  [&_button[aria-pressed=true]]:text-white
  max-[760px]:[&_button]:px-[13px]
  max-[760px]:[&_button]:py-1
"><button aria-pressed={!savedOnly} onClick={() => showList(false)}>추천 동네 {recommendations.length}</button><button aria-pressed={savedOnly} onClick={() => showList(true)}>관심 동네 {saved.length}</button></div>
          </div>
        </div>
      </div>
      <div className="flex min-h-0 min-w-0 flex-col max-[760px]:block">
        {detailId? <div className="detail-refresh flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[var(--line-panel)] bg-white max-[760px]:rounded-[18px]"><NeighborhoodDetailPage saved={saved} onToggleSaved={onToggleSaved} /></div>:<section className="
  flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[var(--line-panel)] bg-white max-[760px]:rounded-[18px]
" aria-labelledby="results-title">
          <div className="
  flex shrink-0 flex-wrap items-center justify-between gap-2.5 px-5 pt-5 pb-3 max-[760px]:px-4 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-[var(--ink)]
  [&_h2_span]:text-[var(--gd)]
"><h2 id="results-title">{savedOnly? '관심 동네':'추천 동네 TOP'} <span>{visible.length}</span></h2></div>
          <div className="panel-scroll min-h-0 flex-1 min-[1001px]:overflow-y-auto min-[1001px]:overscroll-contain">
          <div className="[&>article+article]:before:absolute [&>article+article]:before:top-0 [&>article+article]:before:inset-x-5 [&>article+article]:before:h-px [&>article+article]:before:bg-[#E5E7EB] [&>article+article]:before:content-['']">{visible.map(item => <article className="relative bg-white p-5 transition-colors hover:bg-[#FBFEFC] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-[-2px] has-[a:focus-visible]:outline-[var(--g)] max-[760px]:p-4" key={item.id}>
            <div className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1 pr-10">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-[13px] font-extrabold text-white">{item.rank}</span>
              <h3 className="text-[21px] font-extrabold leading-tight tracking-[-.04em] text-[var(--ink)] max-[1250px]:text-lg">{item.name}</h3>
            </div>
            <button className={`absolute right-3 top-3 z-2 inline-flex size-11 items-center justify-center bg-transparent ${saved.includes(item.id)? 'text-[#BE185D]':'text-[var(--muted)] hover:text-[#BE185D]'}`} aria-label={`${item.name} 관심 동네 ${saved.includes(item.id)? '해제':'저장'}`} aria-pressed={saved.includes(item.id)} onClick={() => onToggleSaved(item.id)}><Heart size={20} fill={saved.includes(item.id)? 'currentColor':'none'} /></button>
            <div className="mt-3.5"><small className="block text-xs text-[var(--muted-light)]">예산 안 보통 시세 (보증금/월세)</small><strong className="mt-0.5 block text-[17px] text-[var(--ink)]">{item.medianDeposit.toLocaleString()}/{item.medianRent}</strong></div>
            <div className="mt-3.5 grid grid-cols-2 gap-2 [&>div]:rounded-[10px] [&>div]:border [&>div]:border-[#EEF2F0] [&>div]:bg-[#FAFCFB] [&>div]:p-3 [&_small]:flex [&_small]:items-center [&_small]:gap-1 [&_small]:text-xs [&_small]:text-[var(--muted-light)] [&_strong]:mt-1 [&_strong]:block [&_strong]:text-[17px] [&_strong]:text-[var(--ink)] [&_span]:text-xs [&_span]:text-[var(--muted)]">
              {item.routes.map(route => <div key={route.label}><small>{route.importance==='REQUIRED'? <Building2 size={14} />:<House size={14} />}{route.label}</small><strong>{route.minutes}분</strong><span>{route.transport==='WALK'? transportLabel(route.transport):`${transportLabel(route.transport)} · 환승 ${route.transfers}회`}</span></div>)}
            </div>
            <Link className="absolute inset-0 z-1" to={`/recommendations/${item.id}`} state={{ ...location.state,listState: { selectedId: item.id,savedOnly } }} aria-label={`${item.name} 상세 보기`}><span className="sr-only">상세 보기</span></Link>
          </article>)}</div>
          {visible.length===0&&<div className="
  px-[15px] py-[60px] text-center text-text-secondary [&>svg]:mx-auto [&>svg]:mb-4 [&_h2]:text-[17px]
  [&_h2]:font-semibold [&_p]:mt-2.5 [&_p]:text-[13px] [&_button]:mt-5 [&_button]:text-primary
"><Heart size={30} /><h2>{savedOnly? '표시할 관심 동네가 없어요':'조건에 맞는 동네를 찾지 못했어요'}</h2><p>{savedOnly? '카드의 하트를 눌러 관심 동네를 추가해보세요.':'필수 거점의 편도시간이나 예산을 조금 늘려서 다시 찾아보세요.'}</p>{savedOnly? <button onClick={() => { setSavedOnly(false) }}>전체 동네 보기</button>:<Link className="mt-5 inline-block text-primary" to="/consultation" state={location.state}>조건 수정하기</Link>}</div>}
          <p className="px-5 py-5 text-center text-[11px] text-text-secondary">관심 동네는 새로고침 전까지 유지돼요.</p>
          </div>
        </section>}
      </div>
      </div>
    </main>
  </AppLayout>
}
