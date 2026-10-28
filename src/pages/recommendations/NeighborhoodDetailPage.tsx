import { useEffect,useRef } from 'react'
import { Link,useLocation,useNavigate,useParams } from 'react-router-dom'
import { ArrowLeft,ArrowRight,Building2,CheckCircle2,CircleAlert,Heart,House,MapPin,TrainFront,Trees } from 'lucide-react'
import { recommendations } from '../../mocks/recommendations'

const details: Record<string,{ deposit: string; walking: number; reasons: string[]; cautions: string[] }>={
  hapjeong: { deposit: '2,000 ~ 5,000',walking: 5,reasons: ['여의도까지 40분 이내인 이동 예시예요.','한강과 주변 상권을 함께 고려할 수 있어요.'],cautions: ['비교 후보 중 월세 예시가 높은 편이에요.','상권 인근은 시간대별 소음 확인이 필요해요.'] },
  sinchon: { deposit: '1,000 ~ 3,000',walking: 7,reasons: ['후보 중 월세 예시가 가장 낮아요.','대학가의 생활시설을 고려할 수 있어요.'],cautions: ['수원까지 이동 예시는 48분이에요.','번화가 주변은 야간 환경을 확인해보세요.'] },
  mangwon: { deposit: '2,000 ~ 4,000',walking: 9,reasons: ['한강과 동네 상권을 함께 고려할 수 있어요.','월세 예시는 65만 원이에요.'],cautions: ['여의도까지 이동 예시는 40분을 넘어요.','실제 집에서 역까지의 도보 거리를 확인해보세요.'] },
  sangsu: { deposit: '2,000 ~ 4,000',walking: 6,reasons: ['홍대 인근 문화 공간을 고려할 수 있어요.','여의도까지 이동 예시는 40분이에요.'],cautions: ['수원까지 이동 예시는 50분이에요.','주말 혼잡도와 야간 소음을 확인해보세요.'] },
  dangsan: { deposit: '3,000 ~ 5,000',walking: 4,reasons: ['여의도까지 이동 예시가 후보 중 가장 짧아요.','회사까지 환승 없는 이동 예시예요.'],cautions: ['후보 중 월세 예시가 가장 높아요.','예산과 실제 주거비를 함께 확인해보세요.'] },
}

export default function NeighborhoodDetailPage({ saved,onToggleSaved }: { saved: string[]; onToggleSaved: (id: string) => void }) {
  const { id }=useParams()
  const location=useLocation()
  const navigate=useNavigate()
  const panelRef=useRef<HTMLElement>(null)
  const index=recommendations.findIndex(item => item.id===id)
  const item=recommendations[index]
  useEffect(() => { panelRef.current?.scrollTo({ top: 0 }) },[id])
  const returnState={ ...location.state,listState: { ...location.state?.listState,selectedId: id } }

  if(!item) return <main className="
  px-[15px] py-[60px] text-center text-text-secondary [&>svg]:mx-auto [&>svg]:mb-4 [&_h2]:text-[17px]
  [&_h2]:font-semibold [&_p]:mt-2.5 [&_p]:text-[13px] [&_button]:mt-5 [&_button]:text-primary
"><MapPin size={32} /><h1>동네 정보를 찾을 수 없어요</h1><p>추천 목록에서 동네를 다시 선택해주세요.</p><Link className="mt-3 ml-auto block w-fit py-[5px] text-xs text-primary-hover" to="/recommendations" state={location.state}>추천 목록으로 돌아가기</Link></main>
  const detail=details[item.id]
  function changeNeighborhood(nextId: string) { navigate(`/recommendations/${nextId}`,{ replace: true,state: location.state }) }

  return <section className="
  min-h-0 flex-1 overflow-y-auto border-l border-[#edf0f3] px-[26px] pt-[14px] pb-6
  max-[760px]:overflow-visible max-[760px]:border-0 max-[760px]:px-[18px] max-[760px]:py-5 shared-detail-panel
" ref={panelRef} aria-labelledby="neighborhood-title">
    <nav className="
  mb-6 flex justify-between gap-3 text-[11px] text-text-secondary [&_a]:flex [&_a]:items-center [&_a]:gap-1.5
  [&_button]:flex [&_button]:items-center [&_button]:gap-1.5 [&_button:disabled]:opacity-35
  [&_button:disabled]:cursor-not-allowed [&>div]:flex [&>div]:items-center [&>div]:gap-3
  [&>div]:rounded-[20px] [&>div]:border [&>div]:border-[#edf0f3] [&>div]:px-2.5 [&>div]:py-1.5
  max-[760px]:gap-2 max-[760px]:[&>div]:gap-2
" aria-label="동네 탐색"><Link to="/recommendations" state={returnState}><ArrowLeft size={15} /> 추천 목록으로 돌아가기</Link><div><button disabled={index===0} onClick={() => changeNeighborhood(recommendations[index-1].id)} aria-label="이전 동네"><ArrowLeft size={14} /> 이전 동네</button><button disabled={index===recommendations.length-1} onClick={() => changeNeighborhood(recommendations[index+1].id)} aria-label="다음 동네">다음 동네 <ArrowRight size={14} /></button></div></nav>
    <div className="
  flex items-center gap-3 [&_h1]:text-[27px] [&_h1]:font-[750] [&_h1]:tracking-[-.04em] [&_h1]:text-[#102535]
  [&>.result-rank]:size-[34px] [&>.save-neighborhood]:ml-auto
"><span className="
  result-rank grid size-[30px] shrink-0 place-items-center rounded-full
  bg-[linear-gradient(135deg,#08b589,#008562)] text-sm text-white
">{item.rank}</span><h1 id="neighborhood-title">{item.name}</h1><span className="rounded-[20px] bg-primary-light px-[9px] py-1 text-[11px] text-primary-hover">추천 {item.rank}위 · 예시</span><button className={`save-neighborhood relative z-2 shrink-0 p-[3px] text-[#344a62] [&.is-saved]:text-primary [&.is-saved_svg]:fill-primary max-[480px]:ml-auto ${saved.includes(item.id)? 'is-saved':''}`} aria-label={`${item.name} 관심 동네 ${saved.includes(item.id)? '해제':'저장'}`} aria-pressed={saved.includes(item.id)} onClick={() => onToggleSaved(item.id)}><Heart size={23} /></button></div>
    <p className="mt-[3px] mb-[14px] ml-[46px] text-[13px] leading-[1.7] text-text-secondary">{item.description}</p>
    <div className={`relative flex min-h-[145px] items-center justify-center gap-4 overflow-hidden rounded-[9px] bg-[linear-gradient(145deg,#ffffff80,transparent)] pb-10 [&_span]:absolute [&_span]:bottom-[35px] [&_span]:text-sm [&_span]:font-[650] [&_small]:absolute [&_small]:bottom-[14px] [&_small]:text-[10px] ${item.tone==='blue'? 'bg-[#e2edf6] text-[#6287a9]':item.tone==='peach'? 'bg-[#f5e8dd] text-[#b28b6a]':item.tone==='sage'? 'bg-[#e5efdf] text-[#7c9369]':'bg-[#e1efdb] text-[#477b62]'}`}><Trees size={52} strokeWidth={1} /><Building2 size={84} strokeWidth={1} /><House size={60} strokeWidth={1} /><span>{item.name} 둘러보기</span><small>동네 사진 연결 예정 · 예시 일러스트</small></div>
    <div className="
  mb-2.5 flex flex-wrap gap-[5px] [&_span]:rounded-[15px] [&_span]:bg-[#f4f6f8] [&_span]:px-2
  [&_span]:py-[3px] [&_span]:text-[10px] [&_span]:text-[#64748b] !mt-3 !mb-[22px] !gap-2 [&_span]:!px-[13px]
  [&_span]:!py-[5px] [&_span]:!text-[11px]
">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
    <section className="
  mt-3 rounded-[11px] border border-[#e9edf1] px-[17px] py-[15px] shadow-[0_2px_5px_#163d3302] [&_h2]:flex
  [&_h2]:items-center [&_h2]:gap-[9px] [&_h2]:text-sm [&_h2]:font-bold [&_h2>svg]:shrink-0
  [&_h2>svg]:text-primary [&_h2>span]:ml-[5px] [&_h2>span]:text-[11px] [&_h2>span]:font-normal
  [&_h2>span]:text-text-secondary
"><h2><TrainFront size={20} /> 주요 거점까지 이동 시간</h2>
      <dl className="
  mt-2.5 [&>div]:flex [&>div]:justify-between [&>div]:gap-2.5 [&>div]:border-b [&>div]:border-[#f0f2f4]
  [&>div]:py-3 [&>div]:text-xs [&>div:last-child]:border-b-0 [&>div:last-child]:pb-0 [&_dt]:flex
  [&_dt]:items-center [&_dt]:gap-[7px] [&_dt_svg]:text-[#3388de] [&>div:nth-child(2)_dt_svg]:text-[#f16a88]
  [&_dt_span]:text-text-secondary [&_dd]:flex [&_dd]:flex-wrap [&_dd]:items-center [&_dd]:gap-3
  [&_dd_small]:text-[10px] [&_dd_small]:text-text-secondary max-[1000px]:[&>div]:flex-wrap
  max-[1000px]:[&_dd]:ml-[25px]
"><div><dt><Building2 size={18} /> 회사 <span>여의도</span></dt><dd><strong>{item.work}분</strong><span>환승 {item.transfers}회</span><small>도보 {detail.walking}분 포함</small></dd></div><div><dt><House size={18} /> 본가 <span>수원</span></dt><dd><strong>{item.family}분</strong><span>환승 1회</span><small>도보 8분 포함</small></dd></div></dl>

    </section>
    <section className="
  mt-3 rounded-[11px] border border-[#e9edf1] px-[17px] py-[15px] shadow-[0_2px_5px_#163d3302] [&_h2]:flex
  [&_h2]:items-center [&_h2]:gap-[9px] [&_h2]:text-sm [&_h2]:font-bold [&_h2>svg]:shrink-0
  [&_h2>svg]:text-primary [&_h2>span]:ml-[5px] [&_h2>span]:text-[11px] [&_h2>span]:font-normal
  [&_h2>span]:text-text-secondary
"><h2><House size={20} /> 주거비 정보 <span>예시</span></h2><dl className="
  mt-3 grid grid-cols-[1fr_1.4fr] gap-2 [&>div]:rounded-lg [&>div]:bg-[#f5f6f8] [&>div]:p-3 [&_dt]:mb-[5px]
  [&_dt]:text-[11px] [&_dt]:text-text-secondary [&_dd]:text-[15px] [&_dd]:font-[650]
  max-[760px]:[&_dd]:text-sm
"><div><dt>월세</dt><dd>{item.rent}만 원</dd></div><div><dt>보증금</dt><dd>{detail.deposit}만 원</dd></div></dl></section>
    <section className="
  mt-3 rounded-[11px] border border-[#e9edf1] px-[17px] py-[15px] shadow-[0_2px_5px_#163d3302] [&_h2]:flex
  [&_h2]:items-center [&_h2]:gap-[9px] [&_h2]:text-sm [&_h2]:font-bold [&_h2>svg]:shrink-0
  [&_h2>svg]:text-primary [&_h2>span]:ml-[5px] [&_h2>span]:text-[11px] [&_h2>span]:font-normal
  [&_h2>span]:text-text-secondary
"><h2><CheckCircle2 size={20} /> 이렇게 좋아요 <span>추천 이유 예시</span></h2><ul className="
  mt-[13px] grid gap-[7px] pl-[21px] [&_li]:flex [&_li]:items-start [&_li]:gap-[9px] [&_li]:text-xs
  [&_li]:leading-[1.7] [&_svg]:mt-0.5 [&_svg]:shrink-0 [&_svg]:text-primary
">{detail.reasons.map(reason => <li key={reason}><CheckCircle2 size={16} />{reason}</li>)}</ul></section>
    <section className="
  mt-3 rounded-[11px] border border-[#e9edf1] px-[17px] py-[15px] shadow-[0_2px_5px_#163d3302] [&_h2]:flex
  [&_h2]:items-center [&_h2]:gap-[9px] [&_h2]:text-sm [&_h2]:font-bold [&_h2>svg]:shrink-0
  [&_h2>svg]:text-primary [&_h2>span]:ml-[5px] [&_h2>span]:text-[11px] [&_h2>span]:font-normal
  [&_h2>span]:text-text-secondary [&_svg]:!text-[#f58220]
"><h2><CircleAlert size={20} /> 이 점은 고려해보세요</h2><ul className="
  mt-[13px] grid gap-[7px] pl-[21px] [&_li]:flex [&_li]:items-start [&_li]:gap-[9px] [&_li]:text-xs
  [&_li]:leading-[1.7] [&_svg]:mt-0.5 [&_svg]:shrink-0 [&_svg]:text-primary
">{detail.cautions.map(caution => <li key={caution}><CircleAlert size={16} />{caution}</li>)}</ul></section>
    <p className="mt-5 text-center text-[11px] text-text-secondary">이동시간·주거비·추천 이유는 예시 데이터예요.<br />관심 동네는 새로고침 전까지 유지돼요.</p>
  </section>
}
