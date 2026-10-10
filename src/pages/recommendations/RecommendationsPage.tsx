import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Building2, Heart, House, SlidersHorizontal, TrainFront, X } from 'lucide-react'
import Header from '../../components/layout/Header'
import NeighborhoodMap from '../../components/map/NeighborhoodMap'
import { recommendations } from '../../mocks/recommendations'
import '../home/HomePage.css'
import './RecommendationsPage.css'

export default function RecommendationsPage({ saved, onToggleSaved }: { saved: string[]; onToggleSaved: (id: string) => void }) {
  const location = useLocation()
  const [selectedId, setSelectedId] = useState<string | null>(location.state?.listState?.selectedId ?? recommendations[0].id)
  const [savedOnly, setSavedOnly] = useState<boolean>(location.state?.listState?.savedOnly ?? false)
  const [rent, setRent] = useState<string>(location.state?.listState?.rent ?? 'all')
  const [travel, setTravel] = useState<string>(location.state?.listState?.travel ?? 'all')
  const [sort, setSort] = useState<string>(location.state?.listState?.sort ?? 'rank')
  const cardRefs = useRef<Record<string, HTMLElement | null>>({})
  const visible = recommendations.filter(item => (!savedOnly || saved.includes(item.id)) && (rent === 'all' || item.rent <= Number(rent)) && (travel === 'all' || item.work <= Number(travel))).sort((a, b) => sort === 'rent' ? a.rent - b.rent : sort === 'work' ? a.work - b.work : a.rank - b.rank)
  const activeId = visible.some(item => item.id === selectedId) ? selectedId : visible[0]?.id ?? null

  function select(id: string) {
    setSelectedId(id)
    cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return <div className="results-page">
    <Header />
    <main className="results-layout">
      <div className="results-map-panel">
        <div className="results-toolbar">
          <Link to="/consultation" state={location.state}><ArrowLeft size={15} /> 조건 수정하기</Link>
          <div className="results-tabs"><button aria-pressed={!savedOnly} onClick={() => setSavedOnly(false)}>추천 동네 {recommendations.length}</button><button aria-pressed={savedOnly} onClick={() => setSavedOnly(true)}>관심 동네 {saved.length}</button></div>
        </div>
        <div className="results-filters"><SlidersHorizontal size={16} /><label>월세 <select value={rent} onChange={e => setRent(e.target.value)}><option value="all">전체</option><option value="60">60만 원 이하</option><option value="70">70만 원 이하</option></select></label><label>회사까지 <select value={travel} onChange={e => setTravel(e.target.value)}><option value="all">전체</option><option value="30">30분 이내</option><option value="40">40분 이내</option></select></label>{(rent !== 'all' || travel !== 'all') && <button className="reset-filters" onClick={() => { setRent('all'); setTravel('all') }}><X size={14} /> 초기화</button>}</div>
        <NeighborhoodMap neighborhoods={visible} selectedId={activeId} onSelect={select} />
      </div>
      <section className="results-list" aria-labelledby="results-title">
        <div className="results-list-heading"><h1 id="results-title">{savedOnly ? '관심 동네' : '추천 동네'} <span>{visible.length}</span></h1><label className="sr-only" htmlFor="result-sort">정렬 기준</label><select id="result-sort" value={sort} onChange={e => setSort(e.target.value)}><option value="rank">추천 순</option><option value="rent">월세 낮은 순</option><option value="work">출근 빠른 순</option></select></div>
        <p className="results-data-note">예시 기준: 회사 여의도 · 본가 수원 · 월세 단위 만 원</p>
        <div className="result-cards">{visible.map(item => <article ref={node => { cardRefs.current[item.id] = node }} className={`result-card ${activeId === item.id ? 'is-selected' : ''}`} key={item.id}>
          <div className="result-card-top"><button className="result-select" onClick={() => select(item.id)} aria-pressed={activeId === item.id}><span className="result-rank">{item.rank}</span><h2>{item.name}</h2></button><button className={`save-neighborhood ${saved.includes(item.id) ? 'is-saved' : ''}`} aria-label={`${item.name} 관심 동네 ${saved.includes(item.id) ? '해제' : '저장'}`} aria-pressed={saved.includes(item.id)} onClick={() => onToggleSaved(item.id)}><Heart size={21} /></button></div>
          <p className="result-description">{item.description}</p>
          <div className="result-card-body"><div className={`neighborhood-illustration tone-${item.tone}`} aria-hidden="true"><Building2 size={45} strokeWidth={1.2} /><span>{item.name}</span></div><div className="result-info"><div className="result-tags">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="result-metrics"><div><Building2 size={17} /><span>여의도 <strong>{item.work}분</strong><small>환승 {item.transfers}회</small></span></div><div><House size={17} /><span>수원 <strong>{item.family}분</strong><small>환승 1회</small></span></div><div className="result-rent"><small>월세 예시</small><strong>{item.rent}만 원</strong></div></div></div></div>
          {activeId === item.id && <div className="selected-note"><TrainFront size={14} /> 선택한 동네 · 실제 경로와 주거비는 연동 후 제공돼요.</div>}
          <Link className="detail-link" to={`/recommendations/${item.id}`} state={{ ...location.state, listState: { selectedId: item.id, savedOnly, rent, travel, sort } }}>동네 자세히 보기 →</Link>
        </article>)}</div>
        {visible.length === 0 && <div className="results-empty"><Heart size={30} /><h2>{savedOnly ? '표시할 관심 동네가 없어요' : '조건에 맞는 예시 동네가 없어요'}</h2><p>{savedOnly ? '카드의 하트를 눌러 관심 동네를 추가하거나 필터를 바꿔보세요.' : '월세나 이동시간 필터를 바꿔보세요.'}</p><button onClick={() => { setSavedOnly(false); setRent('all'); setTravel('all') }}>전체 동네 보기</button></div>}
        <p className="saved-session-note">관심 동네는 새로고침 전까지 유지돼요.</p>
      </section>
    </main>
  </div>
}
