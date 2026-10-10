import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, CircleAlert, Heart, House, MapPin, Sparkles, TrainFront, Trees } from 'lucide-react'
import Header from '../../components/layout/Header'
import NeighborhoodMap from '../../components/map/NeighborhoodMap'
import { recommendations } from '../../mocks/recommendations'
import '../home/HomePage.css'
import './RecommendationsPage.css'
import './NeighborhoodDetailPage.css'

const details: Record<string, { deposit: string; walking: number; reasons: string[]; cautions: string[] }> = {
  hapjeong: { deposit: '2,000 ~ 5,000', walking: 5, reasons: ['여의도까지 40분 이내인 이동 예시예요.', '한강과 주변 상권을 함께 고려할 수 있어요.'], cautions: ['비교 후보 중 월세 예시가 높은 편이에요.', '상권 인근은 시간대별 소음 확인이 필요해요.'] },
  sinchon: { deposit: '1,000 ~ 3,000', walking: 7, reasons: ['후보 중 월세 예시가 가장 낮아요.', '대학가의 생활시설을 고려할 수 있어요.'], cautions: ['수원까지 이동 예시는 48분이에요.', '번화가 주변은 야간 환경을 확인해보세요.'] },
  mangwon: { deposit: '2,000 ~ 4,000', walking: 9, reasons: ['한강과 동네 상권을 함께 고려할 수 있어요.', '월세 예시는 65만 원이에요.'], cautions: ['여의도까지 이동 예시는 40분을 넘어요.', '실제 집에서 역까지의 도보 거리를 확인해보세요.'] },
  sangsu: { deposit: '2,000 ~ 4,000', walking: 6, reasons: ['홍대 인근 문화 공간을 고려할 수 있어요.', '여의도까지 이동 예시는 40분이에요.'], cautions: ['수원까지 이동 예시는 50분이에요.', '주말 혼잡도와 야간 소음을 확인해보세요.'] },
  dangsan: { deposit: '3,000 ~ 5,000', walking: 4, reasons: ['여의도까지 이동 예시가 후보 중 가장 짧아요.', '회사까지 환승 없는 이동 예시예요.'], cautions: ['후보 중 월세 예시가 가장 높아요.', '예산과 실제 주거비를 함께 확인해보세요.'] },
}

export default function NeighborhoodDetailPage({ saved, onToggleSaved }: { saved: string[]; onToggleSaved: (id: string) => void }) {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const panelRef = useRef<HTMLElement>(null)
  const index = recommendations.findIndex(item => item.id === id)
  const item = recommendations[index]
  useEffect(() => { panelRef.current?.scrollTo({ top: 0 }) }, [id])
  const returnState = { ...location.state, listState: { ...location.state?.listState, selectedId: id } }

  if (!item) return <div className="results-page"><Header /><main className="results-empty"><MapPin size={32} /><h1>동네 정보를 찾을 수 없어요</h1><p>추천 목록에서 동네를 다시 선택해주세요.</p><Link className="detail-link" to="/recommendations" state={location.state}>추천 목록으로 돌아가기</Link></main></div>
  const detail = details[item.id]
  function changeNeighborhood(nextId: string) { navigate(`/recommendations/${nextId}`, { replace: true, state: location.state }) }

  return <div className="results-page">
    <Header />
    <div className="results-notice"><Sparkles size={15} /> 화면 미리보기 · 모든 순위·이동시간·주거비·추천 설명은 예시이며 실제 조회 결과가 아니에요.</div>
    <main className="results-layout detail-layout">
      <div className="results-map-panel">
        <div className="results-toolbar"><Link to="/consultation" state={location.state}><ArrowLeft size={15} /> 조건 수정하기</Link><span className="detail-map-caption"><MapPin size={15} /> 선택한 동네: {item.name}</span></div>
        <NeighborhoodMap neighborhoods={recommendations} selectedId={item.id} onSelect={changeNeighborhood} />
      </div>
      <section className="detail-panel" ref={panelRef} aria-labelledby="neighborhood-title">
        <nav className="detail-navigation" aria-label="동네 탐색"><Link to="/recommendations" state={returnState}><ArrowLeft size={15} /> 추천 목록</Link><div><button disabled={index === 0} onClick={() => changeNeighborhood(recommendations[index - 1].id)} aria-label="이전 동네"><ArrowLeft size={14} /> 이전</button><button disabled={index === recommendations.length - 1} onClick={() => changeNeighborhood(recommendations[index + 1].id)} aria-label="다음 동네">다음 <ArrowRight size={14} /></button></div></nav>
        <div className="detail-title"><span className="result-rank">{item.rank}</span><h1 id="neighborhood-title">{item.name}</h1><span className="detail-rank-label">추천 {item.rank}위 · 예시</span><button className={`save-neighborhood ${saved.includes(item.id) ? 'is-saved' : ''}`} aria-label={`${item.name} 관심 동네 ${saved.includes(item.id) ? '해제' : '저장'}`} aria-pressed={saved.includes(item.id)} onClick={() => onToggleSaved(item.id)}><Heart size={23} /></button></div>
        <p className="detail-description">{item.description}</p>
        <div className={`detail-illustration tone-${item.tone}`}><Trees size={52} strokeWidth={1} /><Building2 size={84} strokeWidth={1} /><House size={60} strokeWidth={1} /><span>{item.name} 둘러보기</span><small>동네 사진 연결 예정 · 예시 일러스트</small></div>
        <div className="result-tags detail-tags">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        <section className="detail-section"><h2><TrainFront size={20} /> 주요 거점까지 이동 시간</h2><p className="detail-section-note">예시 기준: 동네 대표 지점 → 여의도 회사 / 수원 본가</p>
          <dl className="detail-travel"><div><dt><Building2 size={18} /> 회사 <span>여의도</span></dt><dd><strong>{item.work}분</strong><span>환승 {item.transfers}회</span><small>도보 {detail.walking}분 포함</small></dd></div><div><dt><House size={18} /> 본가 <span>수원</span></dt><dd><strong>{item.family}분</strong><span>환승 1회</span><small>도보 8분 포함</small></dd></div></dl>
          <p className="detail-section-note">실제 경로와 출발 시각별 이동시간은 지도·경로 API 연결 후 제공돼요.</p>
        </section>
        <section className="detail-section"><h2><House size={20} /> 주거비 정보 <span>예시</span></h2><dl className="detail-cost"><div><dt>월세</dt><dd>{item.rent}만 원</dd></div><div><dt>보증금</dt><dd>{detail.deposit}만 원</dd></div></dl><p className="detail-section-note">실거래 통계가 아니에요. 주택 유형·면적·계약 기간별 데이터는 연결 예정이에요.</p></section>
        <section className="detail-section"><h2><CheckCircle2 size={20} /> 이렇게 좋아요 <span>추천 이유 예시</span></h2><ul className="detail-reasons">{detail.reasons.map(reason => <li key={reason}><CheckCircle2 size={16} />{reason}</li>)}</ul></section>
        <section className="detail-section detail-cautions"><h2><CircleAlert size={20} /> 이 점은 고려해보세요</h2><ul className="detail-reasons">{detail.cautions.map(caution => <li key={caution}><CircleAlert size={16} />{caution}</li>)}</ul></section>
        <p className="saved-session-note">관심 동네는 목록과 공유되며 새로고침하면 초기화돼요.</p>
      </section>
    </main>
  </div>
}
