import { MapPin, Map } from 'lucide-react'
import type { Neighborhood } from '../../mocks/recommendations'

type Props = { neighborhoods: Neighborhood[]; selectedId: string | null; onSelect: (id: string) => void }
export default function NeighborhoodMap({ neighborhoods, selectedId, onSelect }: Props) {
  return <section className="neighborhood-map" aria-label="후보 동네 위치 개념도">
    <div className="map-placeholder-label"><Map size={18} /><div><strong>카카오맵 연결 예정</strong><span>아래 배치는 실제 지도가 아닌 위치 개념도예요.</span></div></div>
    <div className="mock-river" aria-hidden="true"><span>한강</span></div>
    <span className="map-area-label" aria-hidden="true">마포구</span>
    <div className="map-markers">{neighborhoods.map(item => <button key={item.id} className={`neighborhood-marker ${item.id === selectedId ? 'is-selected' : ''}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} onClick={() => onSelect(item.id)} aria-pressed={item.id === selectedId} aria-label={`${item.name} 선택`}><span>{item.rank}</span>{item.name}</button>)}</div>
    <div className="map-footnote"><MapPin size={16} /> 동네를 누르면 오른쪽 카드가 선택돼요.</div>
  </section>
}
