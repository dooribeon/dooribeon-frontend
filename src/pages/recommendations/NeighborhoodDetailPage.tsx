import { useEffect,useRef } from 'react'
import { Link,useLocation,useParams } from 'react-router-dom'
import { ArrowLeft,Check,CircleAlert,Heart,MapPin,TrainFront } from 'lucide-react'
import { recommendations } from '../../mocks/recommendations'

const details: Record<string,{ walking: number; reasons: string[]; cautions: string[] }>={
  hapjeong: { walking: 5,reasons: ['여의도까지 40분 이내인 이동 예시예요.','한강과 주변 상권을 함께 고려할 수 있어요.'],cautions: ['비교 후보 중 월세 예시가 높은 편이에요.','상권 인근은 시간대별 소음 확인이 필요해요.'] },
  sinchon: { walking: 7,reasons: ['후보 중 월세 예시가 가장 낮아요.','대학가의 생활시설을 고려할 수 있어요.'],cautions: ['수원까지 이동 예시는 48분이에요.','번화가 주변은 야간 환경을 확인해보세요.'] },
  mangwon: { walking: 9,reasons: ['한강과 동네 상권을 함께 고려할 수 있어요.','월세 예시는 65만 원이에요.'],cautions: ['여의도까지 이동 예시는 40분을 넘어요.','실제 집에서 역까지의 도보 거리를 확인해보세요.'] },
  sangsu: { walking: 6,reasons: ['홍대 인근 문화 공간을 고려할 수 있어요.','여의도까지 이동 예시는 40분이에요.'],cautions: ['수원까지 이동 예시는 50분이에요.','주말 혼잡도와 야간 소음을 확인해보세요.'] },
  dangsan: { walking: 4,reasons: ['여의도까지 이동 예시가 후보 중 가장 짧아요.','회사까지 환승 없는 이동 예시예요.'],cautions: ['후보 중 월세 예시가 가장 높아요.','예산과 실제 주거비를 함께 확인해보세요.'] },
}

export default function NeighborhoodDetailPage({ saved,onToggleSaved }: { saved: string[]; onToggleSaved: (id: string) => void }) {
  const { id }=useParams()
  const location=useLocation()
  const panelRef=useRef<HTMLDivElement>(null)
  const index=recommendations.findIndex(item => item.id===id)
  const item=recommendations[index]
  useEffect(() => { panelRef.current?.scrollTo({ top: 0 }) },[id])
  const returnState={ ...location.state,listState: { ...location.state?.listState,selectedId: id } }

  if(!item) return <main className="
  px-[15px] py-[60px] text-center text-text-secondary [&>svg]:mx-auto [&>svg]:mb-4 [&_h2]:text-[17px]
  [&_h2]:font-semibold [&_p]:mt-2.5 [&_p]:text-[13px] [&_button]:mt-5 [&_button]:text-primary
"><MapPin size={32} /><h1>동네 정보를 찾을 수 없어요</h1><p>추천 목록에서 동네를 다시 선택해주세요.</p><Link className="mt-3 ml-auto block w-fit py-[5px] text-xs text-primary-hover" to="/recommendations" state={location.state}>추천 목록으로 돌아가기</Link></main>
  const detail=details[item.id]
  return <section className="shared-detail-panel flex min-h-0 flex-1 flex-col overflow-hidden bg-white" aria-labelledby="neighborhood-title">
    <nav className="shrink-0 px-5 pt-5 pb-3 max-[760px]:px-4" aria-label="동네 탐색">
      <div className="relative h-6">
        <Link className="absolute -left-2.5 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center text-[var(--ink)] hover:text-primary" to="/recommendations" state={returnState} aria-label="추천 목록으로 돌아가기"><ArrowLeft size={20} /></Link>
      </div>
    </nav>
    <div className="panel-scroll min-h-0 flex-1 p-5 min-[1001px]:overflow-y-auto min-[1001px]:overscroll-contain max-[760px]:p-4" ref={panelRef}>
    <div className="relative mb-5 grid grid-cols-[28px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1 pr-10">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[13px] font-extrabold text-white">{item.rank}</span>
      <h1 id="neighborhood-title" className="text-[21px] font-extrabold leading-tight tracking-[-.04em] text-[var(--ink)] max-[1250px]:text-lg">{item.name}</h1>
      <button className={`absolute -right-2 -top-2 z-2 inline-flex size-11 items-center justify-center bg-transparent max-[760px]:-right-1 max-[760px]:-top-1 ${saved.includes(item.id)? 'text-[#BE185D]':'text-[var(--muted)] hover:text-[#BE185D]'}`} aria-label={`${item.name} 관심 동네 ${saved.includes(item.id)? '해제':'저장'}`} aria-pressed={saved.includes(item.id)} onClick={() => onToggleSaved(item.id)}><Heart size={20} fill={saved.includes(item.id)? 'currentColor':'none'} /></button>
    </div>
    <div className="flex flex-col gap-5 [&_h2]:mt-1 [&_h2]:mb-2.5 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:text-base [&_h2]:font-extrabold [&_h2]:text-[var(--ink)] [&_h2_svg]:size-[18px] [&_h2_svg]:shrink-0">
      <section>
        <h2>주거비 정보</h2>
        <dl className="grid grid-cols-2 gap-2.5 [&>div]:rounded-xl [&>div]:border [&>div]:border-[#EAF0ED] [&>div]:bg-[#F7FAF9] [&>div]:px-3.5 [&>div]:py-3 [&_dt]:text-xs [&_dt]:text-[#6B7280] [&_dd]:mt-0.5 [&_dd]:text-lg [&_dd]:font-bold [&_dd]:text-[var(--ink)]">
          <div><dt>보증금</dt><dd>{item.deposit}만 원</dd></div>
          <div><dt>월세</dt><dd>{item.rent}만 원</dd></div>
        </dl>
      </section>
      <section className="border-t border-[#E5E7EB] pt-4">
        <h2>주요 거점까지 이동시간</h2>
        <dl className="flex flex-col gap-2 [&>div]:grid [&>div]:grid-cols-[34px_minmax(0,1fr)_auto] [&>div]:items-center [&>div]:gap-2.5 [&>div]:rounded-xl [&>div]:border [&>div]:border-[#EAF0ED] [&>div]:px-3 [&>div]:py-2.5 [&_dt]:text-[14.5px] [&_dt]:font-bold [&_dt]:text-[var(--ink)] [&_small]:mt-px [&_small]:block [&_small]:text-xs [&_small]:font-normal [&_small]:text-[#6B7280] [&_dd]:text-right [&_dd]:text-base [&_dd]:font-bold [&_dd]:text-[var(--ink)]">
          <div>
            <span className="grid size-[34px] place-items-center rounded-[10px] bg-[var(--gl)] text-[var(--gd)]"><TrainFront size={18} aria-hidden="true" /></span>
            <dt>회사 · 여의도<small>환승 {item.transfers}회 · 도보 {detail.walking}분 포함</small></dt><dd>{item.work}분</dd>
          </div>
          <div>
            <span className="grid size-[34px] place-items-center rounded-[10px] bg-[var(--gl)] text-[var(--gd)]"><TrainFront size={18} aria-hidden="true" /></span>
            <dt>본가 · 수원<small>환승 1회 · 도보 8분 포함</small></dt><dd>{item.family}분</dd>
          </div>
        </dl>
      </section>
      <section className="border-t border-[#E5E7EB] pt-4">
        <h2>이런 점이 좋아요</h2>
        <ul className="flex flex-col gap-[7px] [&_li]:flex [&_li]:items-start [&_li]:gap-2 [&_li]:text-sm [&_li]:leading-[1.6] [&_li]:text-[#374151] [&_svg]:mt-0.5 [&_svg]:shrink-0 [&_svg]:text-[var(--gd)]">
          {detail.reasons.map(reason => <li key={reason}><Check size={17} /><span>{reason}</span></li>)}
        </ul>
      </section>
      <section>
        <h2>이런 점은 고려해 주세요</h2>
        <ul className="flex flex-col gap-[7px] [&_li]:flex [&_li]:items-start [&_li]:gap-2 [&_li]:text-sm [&_li]:leading-[1.6] [&_li]:text-[#374151] [&_svg]:mt-0.5 [&_svg]:shrink-0 [&_svg]:text-[#6B7280]">
          {detail.cautions.map(caution => <li key={caution}><CircleAlert size={17} /><span>{caution}</span></li>)}
        </ul>
      </section>
    </div>
    </div>
  </section>
}
