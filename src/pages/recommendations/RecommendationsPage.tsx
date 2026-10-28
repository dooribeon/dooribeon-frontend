import { useState } from 'react'
import { Link,useLocation,useNavigate,useParams } from 'react-router-dom'
import { ArrowLeft,Building2,Heart,House } from 'lucide-react'
import NeighborhoodDetailPage from './NeighborhoodDetailPage'
import AppLayout from '../../components/layout/AppLayout'
import NeighborhoodMap from '../../components/map/NeighborhoodMap'
import { recommendations } from '../../mocks/recommendations'

export default function RecommendationsPage({ saved,onToggleSaved }: { saved: string[]; onToggleSaved: (id: string) => void }) {
  const location=useLocation()
  const { id: detailId }=useParams()
  const navigate=useNavigate()
  const [savedOnly,setSavedOnly]=useState<boolean>(location.state?.listState?.savedOnly??false)
  const [sort,setSort]=useState<string>(location.state?.listState?.sort??'rank')
  const visible=recommendations.filter(item => !savedOnly||saved.includes(item.id)).sort((a,b) => sort==='rent'? a.rent-b.rent:sort==='work'? a.work-b.work:a.rank-b.rank)
  const activeId=detailId??null

  function select(id: string) {
    navigate(`/recommendations/${id}`,{
      replace: Boolean(detailId),
      state: { ...location.state,listState: { savedOnly,sort } },
    })
  }

  return <AppLayout className="bg-[#F4F8F6] text-[var(--text)] tracking-[-.03em] [--header-background:rgba(244,248,246,.94)] [&_select]:cursor-pointer [&_select]:bg-transparent [&_button]:min-h-11 recommendations-refresh" header={{ appearance: 'prototype' }}>
    <main className="mx-auto w-full max-w-[1680px] px-[clamp(20px,3vw,48px)] pt-6 pb-24 max-[760px]:px-4 max-[760px]:pb-16">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[30px] font-extrabold tracking-[-.05em] text-[var(--ink)] max-[760px]:text-[26px]">동네 추천</h1>
        <Link to="/consultation" state={location.state} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#CFE3DA] bg-white px-4 text-sm font-bold text-[var(--gd)] hover:bg-[var(--gl)]"><ArrowLeft size={16} /> 조건 수정하기</Link>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(400px,min(40%,560px))] items-start gap-6 max-[1000px]:grid-cols-1">
      <div className="sticky top-[88px] flex min-w-0 flex-col gap-3 max-[1000px]:relative max-[1000px]:top-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="
  flex gap-[5px] rounded-3xl border border-[#edf0f3] bg-[#ffffffed] p-1.5 shadow-[0_4px_14px_#172c4110]
  [&_button]:rounded-3xl [&_button]:bg-[#f4f6f8] [&_button]:px-[17px] [&_button]:py-2.5 [&_button]:text-xs
  [&_button]:font-[550] [&_button]:text-text-secondary [&_button[aria-pressed=true]]:bg-primary
  [&_button[aria-pressed=true]]:text-white [&_button:last-child]:border [&_button:last-child]:border-[#eef1f5]
  [&_button:last-child]:bg-white [&_button:last-child]:text-[#24364a] max-[760px]:[&_button]:px-[13px]
  max-[760px]:[&_button]:py-[9px]
"><button aria-pressed={!savedOnly} onClick={() => setSavedOnly(false)}>추천 동네 {recommendations.length}</button><button aria-pressed={savedOnly} onClick={() => setSavedOnly(true)}>관심 동네 {saved.length}</button><button onClick={() => { setSavedOnly(false) }}>전체 보기</button></div>
        </div>
        <div className="relative flex aspect-[3/2] max-h-[calc(100svh-220px)] min-h-[360px] overflow-hidden rounded-[24px] border border-[var(--line-panel)] bg-[#EEF0EC] max-[760px]:min-h-[320px] max-[760px]:rounded-[18px]"><NeighborhoodMap neighborhoods={visible} selectedId={activeId} onSelect={select} /></div>
      </div>
      <div className="flex min-h-0 min-w-0 flex-col max-[760px]:block">
        {detailId? <div className="detail-refresh flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-[var(--line-panel)] bg-white max-[760px]:block"><NeighborhoodDetailPage saved={saved} onToggleSaved={onToggleSaved} /></div>:<section className="
  min-w-0 flex-1
" aria-labelledby="results-title">
          <div className="
  mb-3 flex flex-wrap items-center justify-between gap-2.5 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-[var(--ink)]
  [&_h2_span]:text-[var(--gd)] [&_select]:min-h-11 [&_select]:rounded-[10px] [&_select]:border [&_select]:border-[var(--line-panel)]
  [&_select]:bg-white [&_select]:px-3 [&_select]:text-xs [&_select]:text-[var(--muted)]
"><h2 id="results-title">{savedOnly? '관심 동네':'추천 동네 TOP'} <span>{visible.length}</span></h2><label className="sr-only" htmlFor="result-sort">정렬 기준</label><select id="result-sort" value={sort} onChange={e => setSort(e.target.value)}><option value="rank">추천 순</option><option value="rent">월세 낮은 순</option><option value="work">출근 빠른 순</option></select></div>
          <div className="grid gap-3.5">{visible.map(item => <article className="relative scroll-m-[88px] rounded-[22px] border border-[var(--line-panel)] bg-white p-5 shadow-[0_8px_24px_rgba(15,45,35,.05)] transition-colors hover:border-[#A7D9C2] hover:bg-[#FBFEFC] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-[var(--g)] max-[760px]:p-4" key={item.id}>
            <div className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 pr-[82px] max-[380px]:pr-0">
              <span className="grid size-7 place-items-center rounded-full bg-[#064E3B] text-[13px] font-extrabold text-white">{item.rank}</span>
              <h3 className="text-[21px] font-extrabold leading-tight tracking-[-.04em] text-[var(--ink)] max-[1250px]:text-lg">{item.name}</h3>
              <div className="row-span-2 flex flex-col items-center text-xs text-[var(--muted-light)]" aria-label={`추천도 예시 ${item.score}점, 100점 만점`}><span>추천도</span><strong className="text-[22px] font-extrabold leading-tight text-[var(--ink)]">{item.score}<small className="ml-px text-sm">점</small></strong></div>
              <div className="col-start-2 flex flex-wrap gap-1">{item.tags.map(tag => <span className="rounded-full bg-[var(--gl)] px-[9px] py-0.5 text-[12.5px] font-bold text-[var(--gd)]" key={tag}>{tag}</span>)}</div>
            </div>
            <button className={`absolute right-3 top-4 z-2 inline-flex items-center gap-1 rounded-full border px-2.5 text-[13px] font-bold max-[380px]:relative max-[380px]:top-auto max-[380px]:right-auto max-[380px]:mt-3 ${saved.includes(item.id)? 'border-[#FBCFE8] bg-[#FFF1F4] text-[#BE185D]':'border-[var(--line)] bg-white text-[var(--muted)] hover:border-[#FBCFE8] hover:bg-[#FFF1F4] hover:text-[#BE185D]'}`} aria-label={`${item.name} 관심 동네 ${saved.includes(item.id)? '해제':'저장'}`} aria-pressed={saved.includes(item.id)} onClick={() => onToggleSaved(item.id)}><Heart size={18} fill={saved.includes(item.id)? 'currentColor':'none'} /><span>관심</span></button>
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--muted)]">{item.description}</p>
            <div className="mt-3.5"><small className="block text-xs text-[var(--muted-light)]">월세 예시</small><strong className="mt-0.5 block text-[17px] text-[var(--ink)]">{item.rent}만 원</strong></div>
            <div className="mt-3.5 grid grid-cols-2 gap-2 [&>div]:rounded-[10px] [&>div]:border [&>div]:border-[#EEF2F0] [&>div]:bg-[#FAFCFB] [&>div]:p-3 [&_small]:flex [&_small]:items-center [&_small]:gap-1 [&_small]:text-xs [&_small]:text-[var(--muted-light)] [&_strong]:mt-1 [&_strong]:block [&_strong]:text-[17px] [&_strong]:text-[var(--ink)] [&_span]:text-xs [&_span]:text-[var(--muted)]">
              <div><small><Building2 size={14} />회사 · 여의도</small><strong>{item.work}분</strong><span>환승 {item.transfers}회</span></div>
              <div><small><House size={14} />본가 · 수원</small><strong>{item.family}분</strong><span>환승 1회</span></div>
            </div>
            <Link className="mt-3 inline-flex min-h-11 items-center text-[13px] font-semibold text-[var(--gd)] after:absolute after:inset-0 after:z-1 after:rounded-[22px] after:content-['']" to={`/recommendations/${item.id}`} state={{ ...location.state,listState: { selectedId: item.id,savedOnly,sort } }} aria-label={`${item.name} 상세 보기`}>상세 보기 →</Link>
          </article>)}</div>
          {visible.length===0&&<div className="
  px-[15px] py-[60px] text-center text-text-secondary [&>svg]:mx-auto [&>svg]:mb-4 [&_h2]:text-[17px]
  [&_h2]:font-semibold [&_p]:mt-2.5 [&_p]:text-[13px] [&_button]:mt-5 [&_button]:text-primary
"><Heart size={30} /><h2>{savedOnly? '표시할 관심 동네가 없어요':'조건에 맞는 예시 동네가 없어요'}</h2><p>{savedOnly? '카드의 하트를 눌러 관심 동네를 추가해보세요.':'전체 동네 보기를 눌러 추천 목록을 확인해주세요.'}</p><button onClick={() => { setSavedOnly(false) }}>전체 동네 보기</button></div>}
          <p className="mt-5 text-center text-[11px] text-text-secondary">관심 동네는 새로고침 전까지 유지돼요.</p>
        </section>}
      </div>
      </div>
    </main>
  </AppLayout>
}
