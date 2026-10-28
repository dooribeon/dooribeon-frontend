import { useState } from 'react'
import { Link,useLocation,useNavigate,useParams } from 'react-router-dom'
import { ArrowLeft,Building2,Heart,House,X } from 'lucide-react'
import NeighborhoodDetailPage from './NeighborhoodDetailPage'
import AppLayout from '../../components/layout/AppLayout'
import NeighborhoodMap from '../../components/map/NeighborhoodMap'
import { recommendations } from '../../mocks/recommendations'

export default function RecommendationsPage({ saved,onToggleSaved }: { saved: string[]; onToggleSaved: (id: string) => void }) {
  const location=useLocation()
  const { id: detailId }=useParams()
  const navigate=useNavigate()
  const [savedOnly,setSavedOnly]=useState<boolean>(location.state?.listState?.savedOnly??false)
  const [rent,setRent]=useState<string>(location.state?.listState?.rent??'all')
  const [travel,setTravel]=useState<string>(location.state?.listState?.travel??'all')
  const [sort,setSort]=useState<string>(location.state?.listState?.sort??'rank')
  const [tag,setTag]=useState<string>(location.state?.listState?.tag??'all')
  const visible=recommendations.filter(item => (tag==='all'||item.tags.includes(tag))&&(!savedOnly||saved.includes(item.id))&&(rent==='all'||item.rent<=Number(rent))&&(travel==='all'||item.work<=Number(travel))).sort((a,b) => sort==='rent'? a.rent-b.rent:sort==='work'? a.work-b.work:a.rank-b.rank)
  const activeId=detailId??null

  function select(id: string) {
    navigate(`/recommendations/${id}`,{
      replace: Boolean(detailId),
      state: { ...location.state,listState: { savedOnly,rent,travel,sort,tag } },
    })
  }

  return <AppLayout variant="workspace" className="
  flex h-svh flex-col [&_select]:cursor-pointer [&_select]:bg-transparent [&_select]:[font:inherit]
  [&_select]:text-text-primary max-[760px]:h-auto max-[760px]:min-h-svh recommendations-refresh
" header={{ children: <Link to="/consultation" state={location.state}><ArrowLeft size={15} /> 조건 수정하기</Link> }}>
    <main className="
  grid min-h-0 flex-1 grid-cols-[minmax(0,1.7fr)_minmax(440px,1fr)]
  max-[1250px]:grid-cols-[minmax(0,1.2fr)_minmax(420px,1fr)] max-[760px]:flex max-[760px]:flex-col
">
      <div className="relative flex min-h-0 flex-col border-0 max-[760px]:h-[420px] max-[760px]:shrink-0">
        <div className="absolute top-[15px] left-5 z-10 flex flex-wrap items-center justify-between gap-[14px]">
          <div className="
  flex gap-[5px] rounded-3xl border border-[#edf0f3] bg-[#ffffffed] p-1.5 shadow-[0_4px_14px_#172c4110]
  [&_button]:rounded-3xl [&_button]:bg-[#f4f6f8] [&_button]:px-[17px] [&_button]:py-2.5 [&_button]:text-xs
  [&_button]:font-[550] [&_button]:text-text-secondary [&_button[aria-pressed=true]]:bg-primary
  [&_button[aria-pressed=true]]:text-white [&_button:last-child]:border [&_button:last-child]:border-[#eef1f5]
  [&_button:last-child]:bg-white [&_button:last-child]:text-[#24364a] max-[760px]:[&_button]:px-[13px]
  max-[760px]:[&_button]:py-[9px]
"><button aria-pressed={!savedOnly} onClick={() => setSavedOnly(false)}>추천 동네 {recommendations.length}</button><button aria-pressed={savedOnly} onClick={() => setSavedOnly(true)}>관심 동네 {saved.length}</button><button onClick={() => { setSavedOnly(false); setRent('all'); setTravel('all'); setTag('all') }}>전체 보기</button></div>
        </div>
        <div className="
  absolute top-[15px] right-4 z-10 flex flex-wrap items-center gap-[5px] rounded-[30px] bg-[#ffffffed] p-1.5
  text-xs text-text-secondary shadow-[0_4px_14px_#172c4110] [&_label]:rounded-[18px] [&_label]:border
  [&_label]:border-[#eef1f5] [&_label]:bg-white [&_label]:px-3 [&_label]:py-[9px] [&_select]:max-w-[115px]
  [&_select]:text-xs max-[1350px]:top-[77px] max-[1350px]:left-5 max-[1350px]:right-auto max-[760px]:left-4
  max-[760px]:right-4 max-[760px]:w-fit
"><label><span className="sr-only">월세</span><select value={rent} onChange={e => setRent(e.target.value)}><option value="all">월세</option><option value="60">60만 원 이하</option><option value="70">70만 원 이하</option></select></label><label><span className="sr-only">이동시간</span><select value={travel} onChange={e => setTravel(e.target.value)}><option value="all">이동시간</option><option value="30">30분 이내</option><option value="40">40분 이내</option></select></label><label><span className="sr-only">주변 환경</span><select value={tag} onChange={e => setTag(e.target.value)}><option value="all">주변 환경</option>{Array.from(new Set(recommendations.flatMap(item => item.tags))).map(value => <option key={value} value={value}>{value}</option>)}</select></label>{(rent!=='all'||travel!=='all'||tag!=='all')&&<button className="flex items-center gap-[3px]" onClick={() => { setRent('all'); setTravel('all'); setTag('all') }}><X size={14} /> 초기화</button>}</div>
        <NeighborhoodMap neighborhoods={visible} selectedId={activeId} onSelect={select} />
      </div>
      <div className="flex min-h-0 min-w-0 flex-col max-[760px]:block">
        {detailId? <div className="detail-refresh flex min-h-0 flex-1 flex-col max-[760px]:block"><NeighborhoodDetailPage saved={saved} onToggleSaved={onToggleSaved} /></div>:<section className="
  min-h-0 flex-1 overflow-y-auto border-l border-[#edf0f3] bg-white px-[26px] pt-[14px] pb-6
  max-[760px]:overflow-visible max-[760px]:border-0 max-[760px]:px-[18px] max-[760px]:py-5
" aria-labelledby="results-title">
          <div className="
  mb-5 flex items-center justify-between gap-3 [&_h1]:flex [&_h1]:items-center [&_h1]:gap-1.5
  [&_h1]:text-[22px] [&_h1]:font-[750] [&_h1]:tracking-[-.04em] [&_h1]:text-[#102535]
  [&_select]:rounded-[20px] [&_select]:border [&_select]:border-[#edf0f3] [&_select]:px-2.5
  [&_select]:py-1.5 [&_select]:text-[11px] [&_select]:!text-text-secondary
"><h1 id="results-title">{savedOnly? '관심 동네':'추천 동네 TOP'} <span>{visible.length}</span></h1><label className="sr-only" htmlFor="result-sort">정렬 기준</label><select id="result-sort" value={sort} onChange={e => setSort(e.target.value)}><option value="rank">추천 순</option><option value="rent">월세 낮은 순</option><option value="work">출근 빠른 순</option></select></div>
          <div className="grid gap-3">{visible.map(item => <article className="
  relative scroll-m-3 rounded-[13px] border border-[#edf0f3] bg-white px-[15px] py-[14px]
  shadow-[0_2px_8px_#10253502] group/card cursor-pointer transition-colors hover:border-[#80cfb8]
  hover:bg-[linear-gradient(110deg,#f4fcf9,#fff)] has-[a:focus-visible]:border-[#80cfb8]
  has-[a:focus-visible]:bg-[linear-gradient(110deg,#f4fcf9,#fff)] has-[a:focus-visible]:outline-2
  has-[a:focus-visible]:outline-primary has-[a:focus-visible]:outline-offset-2
" key={item.id}>
            <div className="
  mb-3 flex items-center justify-between gap-3 min-[761px]:max-[1100px]:gap-2 max-[480px]:flex-wrap
  max-[480px]:gap-x-2.5 max-[480px]:gap-y-[5px]
"><div className="
  flex shrink-0 items-center gap-3 [&_h2]:text-[21px] [&_h2]:font-bold [&_h2]:text-[#102535]
  min-[761px]:max-[1100px]:[&_h2]:text-lg
"><span className="
  result-rank grid size-[30px] shrink-0 place-items-center rounded-full
  bg-[linear-gradient(135deg,#08b589,#008562)] text-sm text-white
">{item.rank}</span><h2>{item.name}</h2></div><p className="
  m-0 min-w-0 flex-1 break-keep text-[11px] leading-[1.5] text-text-secondary
  min-[761px]:max-[1100px]:text-[10px] max-[480px]:order-3 max-[480px]:ml-[42px] max-[480px]:basis-full
">{item.description}</p><button className={`save-neighborhood relative z-2 shrink-0 p-[3px] text-[#344a62] [&.is-saved]:text-primary [&.is-saved_svg]:fill-primary max-[480px]:ml-auto ${saved.includes(item.id)? 'is-saved':''}`} aria-label={`${item.name} 관심 동네 ${saved.includes(item.id)? '해제':'저장'}`} aria-pressed={saved.includes(item.id)} onClick={() => onToggleSaved(item.id)}><Heart size={21} /></button></div>
            <div className="flex items-stretch gap-[13px] min-[761px]:max-[1250px]:gap-[9px] max-[480px]:gap-2.5"><Link className={`flex h-[86px] w-[100px] shrink-0 flex-col items-center justify-center gap-[3px] rounded-lg bg-[linear-gradient(155deg,#ffffff80,transparent)] no-underline [&_span]:text-[10px] after:absolute after:inset-0 after:z-1 after:rounded-[inherit] after:content-[''] min-[761px]:max-[1250px]:w-[65px] max-[480px]:h-[90px] max-[480px]:w-[65px] ${item.tone==='blue'? 'bg-[#e2edf6] text-[#6287a9]':item.tone==='peach'? 'bg-[#f5e8dd] text-[#b28b6a]':item.tone==='sage'? 'bg-[#e5efdf] text-[#7c9369]':'bg-[#e1efdb] text-[#477b62]'}`} to={`/recommendations/${item.id}`} state={{ ...location.state,listState: { selectedId: item.id,savedOnly,rent,travel,sort,tag } }} aria-label={`${item.name} 상세 보기`}><Building2 size={38} strokeWidth={1.2} aria-hidden="true" /><span>상세 보기 →</span></Link><div className="flex min-w-0 flex-1 flex-col justify-between py-[3px]"><div className="
  mb-2.5 flex flex-wrap gap-[5px] [&_span]:rounded-[15px] [&_span]:bg-[#f4f6f8] [&_span]:px-2
  [&_span]:py-[3px] [&_span]:text-[10px] [&_span]:text-[#64748b]
">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="
  grid grid-cols-3 items-start gap-2 text-xs [&>div]:flex [&>div]:min-w-0 [&>div]:items-start [&>div]:gap-1
  [&>div:nth-child(2)]:-order-1 [&>div>span]:whitespace-nowrap [&_svg]:mt-0.5 [&_svg]:h-[18px] [&_svg]:w-4
  [&_svg]:shrink-0 [&_svg]:text-[#3388de] [&>div:nth-child(2)_svg]:text-[#f16a88] [&_strong]:text-[#102535]
  [&_small]:mt-[3px] [&_small]:block [&_small]:text-[11px] [&_small]:text-text-secondary
  min-[761px]:max-[1250px]:gap-1.5 min-[761px]:max-[1250px]:text-[10px]
  min-[761px]:max-[1250px]:[&_svg]:hidden min-[761px]:max-[1250px]:[&_small]:text-[9px] max-[480px]:gap-1.5
  max-[480px]:text-[10px] max-[480px]:[&_svg]:hidden max-[480px]:[&_small]:text-[9px]
"><div><Building2 size={17} /><span>여의도 <strong>{item.work}분</strong><small>환승 {item.transfers}회</small></span></div><div><House size={17} /><span>수원 <strong>{item.family}분</strong><small>환승 1회</small></span></div><div className="
  !block [&>small]:!mt-0 [&>strong]:mt-[3px] [&>strong]:block [&>strong]:whitespace-nowrap [&>strong]:text-sm
  min-[761px]:max-[1250px]:[&>strong]:text-xs max-[480px]:[&>strong]:text-xs
"><small>월세 예시</small><strong>{item.rent}만 원</strong></div></div></div><div className="
  mb-[3px] size-14 shrink-0 self-end rounded-full p-[3px] text-primary [&>div]:flex [&>div]:size-full
  [&>div]:flex-col [&>div]:items-center [&>div]:justify-center [&>div]:rounded-full [&>div]:bg-[#fbfffd]
  [&_span]:text-[9px] [&_span]:leading-[1.1] [&_strong]:text-[21px] [&_strong]:leading-[1.1]
  [&_strong]:font-[750] min-[761px]:max-[1250px]:size-12 min-[761px]:max-[1250px]:[&_strong]:text-lg
  max-[480px]:size-[46px] max-[480px]:[&_strong]:text-[17px]
" style={{ background: `conic-gradient(var(--color-primary) ${item.score*3.6}deg, #dcf3eb 0deg)` }} aria-label={`추천도 예시 ${item.score}점, 100점 만점`}><div><span>추천도</span><strong>{item.score}</strong></div></div></div>
          </article>)}</div>
          {visible.length===0&&<div className="
  px-[15px] py-[60px] text-center text-text-secondary [&>svg]:mx-auto [&>svg]:mb-4 [&_h2]:text-[17px]
  [&_h2]:font-semibold [&_p]:mt-2.5 [&_p]:text-[13px] [&_button]:mt-5 [&_button]:text-primary
"><Heart size={30} /><h2>{savedOnly? '표시할 관심 동네가 없어요':'조건에 맞는 예시 동네가 없어요'}</h2><p>{savedOnly? '카드의 하트를 눌러 관심 동네를 추가하거나 필터를 바꿔보세요.':'월세나 이동시간 필터를 바꿔보세요.'}</p><button onClick={() => { setSavedOnly(false); setRent('all'); setTravel('all'); setTag('all') }}>전체 동네 보기</button></div>}
          <p className="mt-5 text-center text-[11px] text-text-secondary">관심 동네는 새로고침 전까지 유지돼요.</p>
        </section>}
      </div>
    </main>
  </AppLayout>
}
