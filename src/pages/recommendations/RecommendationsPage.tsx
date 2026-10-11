import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Heart, House, X } from 'lucide-react'
import NeighborhoodDetailPage from './NeighborhoodDetailPage'
import Header from '../../components/layout/Header'
import NeighborhoodMap from '../../components/map/NeighborhoodMap'
import { recommendations } from '../../mocks/recommendations'
import '../home/HomePage.css'
import './RecommendationsPage.css'
import './RecommendationsRefresh.css'

export default function RecommendationsPage({ saved, onToggleSaved }: { saved: string[]; onToggleSaved: (id: string) => void }) {
  const location = useLocation()
  const { id: detailId } = useParams()
  const navigate = useNavigate()
  const [savedOnly, setSavedOnly] = useState<boolean>(location.state?.listState?.savedOnly ?? false)
  const [rent, setRent] = useState<string>(location.state?.listState?.rent ?? 'all')
  const [travel, setTravel] = useState<string>(location.state?.listState?.travel ?? 'all')
  const [sort, setSort] = useState<string>(location.state?.listState?.sort ?? 'rank')
  const [tag, setTag] = useState<string>(location.state?.listState?.tag ?? 'all')
  const visible = recommendations.filter(item => (tag === 'all' || item.tags.includes(tag)) && (!savedOnly || saved.includes(item.id)) && (rent === 'all' || item.rent <= Number(rent)) && (travel === 'all' || item.work <= Number(travel))).sort((a, b) => sort === 'rent' ? a.rent - b.rent : sort === 'work' ? a.work - b.work : a.rank - b.rank)
  const activeId = detailId ?? null

  function select(id: string) {
    navigate(`/recommendations/${id}`, {
      replace: Boolean(detailId),
      state: { ...location.state, listState: { savedOnly, rent, travel, sort, tag } },
    })
  }

  return <div className="results-page recommendations-refresh">
    <Header><Link className="header-edit-conditions" to="/consultation" state={location.state}><ArrowLeft size={15} /> 조건 수정하기</Link></Header>
    <main className="results-layout">
      <div className="results-map-panel">
        <div className="results-toolbar">
          <div className="results-tabs"><button aria-pressed={!savedOnly} onClick={() => setSavedOnly(false)}>추천 동네 {recommendations.length}</button><button aria-pressed={savedOnly} onClick={() => setSavedOnly(true)}>관심 동네 {saved.length}</button><button onClick={() => { setSavedOnly(false); setRent('all'); setTravel('all'); setTag('all') }}>전체 보기</button></div>
        </div>
        <div className="results-filters"><label><span className="sr-only">월세</span><select value={rent} onChange={e => setRent(e.target.value)}><option value="all">월세</option><option value="60">60만 원 이하</option><option value="70">70만 원 이하</option></select></label><label><span className="sr-only">이동시간</span><select value={travel} onChange={e => setTravel(e.target.value)}><option value="all">이동시간</option><option value="30">30분 이내</option><option value="40">40분 이내</option></select></label><label><span className="sr-only">주변 환경</span><select value={tag} onChange={e => setTag(e.target.value)}><option value="all">주변 환경</option>{Array.from(new Set(recommendations.flatMap(item => item.tags))).map(value => <option key={value} value={value}>{value}</option>)}</select></label>{(rent !== 'all' || travel !== 'all' || tag !== 'all') && <button className="reset-filters" onClick={() => { setRent('all'); setTravel('all'); setTag('all') }}><X size={14} /> 초기화</button>}</div>
        <NeighborhoodMap neighborhoods={visible} selectedId={activeId} onSelect={select} />
      </div>
      <div className="shared-result-panel">
      {detailId ? <div className="detail-refresh shared-detail-wrapper"><NeighborhoodDetailPage saved={saved} onToggleSaved={onToggleSaved} /></div> : <section className="results-list" aria-labelledby="results-title">
        <div className="results-list-heading"><h1 id="results-title">{savedOnly ? '관심 동네' : '추천 동네 TOP'} <span>{visible.length}</span></h1><label className="sr-only" htmlFor="result-sort">정렬 기준</label><select id="result-sort" value={sort} onChange={e => setSort(e.target.value)}><option value="rank">추천 순</option><option value="rent">월세 낮은 순</option><option value="work">출근 빠른 순</option></select></div>
        <div className="result-cards">{visible.map(item => <article className="result-card clickable-result-card" key={item.id}>
          <div className="result-card-top"><div className="result-select"><span className="result-rank">{item.rank}</span><h2>{item.name}</h2></div><p className="result-description">{item.description}</p><button className={`save-neighborhood ${saved.includes(item.id) ? 'is-saved' : ''}`} aria-label={`${item.name} 관심 동네 ${saved.includes(item.id) ? '해제' : '저장'}`} aria-pressed={saved.includes(item.id)} onClick={() => onToggleSaved(item.id)}><Heart size={21} /></button></div>
          <div className="result-card-body"><Link className={`neighborhood-illustration tone-${item.tone}`} to={`/recommendations/${item.id}`} state={{ ...location.state, listState: { selectedId: item.id, savedOnly, rent, travel, sort, tag } }} aria-label={`${item.name} 상세 보기`}><Building2 size={38} strokeWidth={1.2} aria-hidden="true" /><span>상세 보기 →</span></Link><div className="result-info"><div className="result-tags">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="result-metrics"><div><Building2 size={17} /><span>여의도 <strong>{item.work}분</strong><small>환승 {item.transfers}회</small></span></div><div><House size={17} /><span>수원 <strong>{item.family}분</strong><small>환승 1회</small></span></div><div className="result-rent"><small>월세 예시</small><strong>{item.rent}만 원</strong></div></div></div><div className="recommendation-score" style={{ background: `conic-gradient(var(--color-primary) ${item.score * 3.6}deg, #dcf3eb 0deg)` }} aria-label={`추천도 예시 ${item.score}점, 100점 만점`}><div><span>추천도</span><strong>{item.score}</strong></div></div></div>
        </article>)}</div>
        {visible.length === 0 && <div className="results-empty"><Heart size={30} /><h2>{savedOnly ? '표시할 관심 동네가 없어요' : '조건에 맞는 예시 동네가 없어요'}</h2><p>{savedOnly ? '카드의 하트를 눌러 관심 동네를 추가하거나 필터를 바꿔보세요.' : '월세나 이동시간 필터를 바꿔보세요.'}</p><button onClick={() => { setSavedOnly(false); setRent('all'); setTravel('all'); setTag('all') }}>전체 동네 보기</button></div>}
        <p className="saved-session-note">관심 동네는 새로고침 전까지 유지돼요.</p>
      </section>}
      </div>
    </main>
  </div>
}
