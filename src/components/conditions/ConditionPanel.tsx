import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, MapPin, Plus, Search, Trash2, X } from 'lucide-react'
import { searchPlaces } from '../../services/placeSearch'
import type { ResolvedPlace } from '../../services/placeSearch'
import type { ConditionDraft, PlaceCondition } from './conditionModel'
import { blankPlace, digits, validationMessage } from './conditionModel'

const inputClass = 'h-11 w-full min-w-0 rounded-[10px] border border-[var(--line-secondary)] bg-white px-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--g)] focus:ring-1 focus:ring-[var(--g)] disabled:bg-gray-50 disabled:text-gray-400'
type Props = { value: ConditionDraft; onChange: (value: ConditionDraft) => void; onRecommend: () => void }

export default function ConditionPanel({ value, onChange, onRecommend }: Props) {
  const searchRef = useRef<HTMLDialogElement>(null)
  const deleteRef = useRef<HTMLDialogElement>(null)
  const addRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLButtonElement | null>(null)
  const [searchId, setSearchId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ResolvedPlace[]>([])
  const [searchMessage, setSearchMessage] = useState('')
  const [searching, setSearching] = useState(false)
  const requestRef = useRef(0)
  useEffect(() => () => { requestRef.current += 1 }, [])
  const [tried, setTried] = useState(false)
  const issue = validationMessage(value)
  const target = value.places.find(p => p.id === deleteId)
  function update(id: string, patch: Partial<PlaceCondition>) {
    onChange({ ...value, places: value.places.map(p => p.id === id ? { ...p, ...patch } : p) })
  }
  function applyPlace(place: ResolvedPlace) {
    if (!searchId) return
    update(searchId, { address: place.address, resolvedPlace: place })
    searchRef.current?.close()
  }
  async function search() {
    const version = ++requestRef.current
    setSearching(true)
    setResults([])
    setSearchMessage('')
    try {
      const result = await searchPlaces(query)
      if (version !== requestRef.current) return
      if (result.total === 1 && result.items.length === 1) applyPlace(result.items[0])
      else {
        setResults(result.items)
        setSearchMessage(result.items.length ? '맞는 장소를 선택해주세요. 원하는 장소가 없다면 지역이나 지점명을 추가해 검색해주세요.' : '검색 결과가 없어요. 지역이나 지점명을 추가해주세요.')
      }
    } catch (error) {
      if (version === requestRef.current) setSearchMessage(error instanceof Error ? error.message : '검색에 실패했어요. 다시 시도해주세요.')
    } finally { if (version === requestRef.current) setSearching(false) }
  }
  return <aside className="@container flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] border border-[#DFE9E4] bg-white shadow-[var(--shadow-card)] max-[760px]:rounded-[22px]" aria-labelledby="conditions-title">
    <h1 id="conditions-title" className="shrink-0 px-6 pt-7 pb-4 max-[760px]:px-3.5 text-[26px] font-extrabold tracking-[-.05em] text-[var(--ink)] max-[760px]:text-[22px]">조건 확인 및 수정</h1>
    <div className="min-h-0 flex-1 panel-scroll overflow-y-auto overscroll-contain px-6 pb-5 max-[760px]:px-3.5">
    <h2 className="mt-2 mb-3 text-[15px] font-extrabold text-[var(--ink)]">예산</h2>
    <div className="grid grid-cols-2 gap-2 @max-[450px]:grid-cols-1">
      {([{ key: 'deposit', label: '보증금' }, { key: 'rent', label: '월세' }] as const).map(field => <label key={field.key} className="flex min-w-0 flex-wrap items-center gap-2 rounded-[14px] border border-[var(--line-subtle)] bg-[#FAFCFB] p-3 text-sm">
        <span className="font-bold">{field.label}</span><input className={`${inputClass} flex-1 basis-16 text-right font-bold`} inputMode="numeric" aria-label={`${field.label} 상한 (만 원)`} value={value[field.key]} onChange={e => onChange({ ...value, [field.key]: digits(e.target.value) })} placeholder="미설정" /><span className="whitespace-nowrap">만 원 이하</span>
      </label>)}
    </div>
    <h2 className="mt-7 mb-3 text-[15px] font-extrabold text-[var(--ink)]">장소별 조건</h2>
    <div className="grid gap-2.5">
      {value.places.map((place, index) => <fieldset key={place.id} className={`relative min-w-0 rounded-2xl border p-3.5 ${place.importance === '필수' ? 'border-[#A7D9C2] bg-[#FBFEFC]' : 'border-[var(--line-subtle)] bg-white'}`}>
        <legend className="sr-only">{place.name || `장소 ${index + 1}`} 조건</legend>
        <div className="grid grid-cols-[minmax(100px,1fr)_minmax(0,2fr)] gap-3 pr-11 @max-[400px]:grid-cols-1">
          <label className="flex min-w-0 flex-col"><span className="block text-xs leading-4 text-[var(--muted-light)]">장소명</span><input aria-label={`장소 ${index + 1} 이름`} className={`${inputClass} mt-1 font-bold`} value={place.name} placeholder="장소명 입력" onChange={e => update(place.id, { name: e.target.value })} /></label>
          <div className="min-w-0">
            <span className="block text-xs leading-4 text-[var(--muted-light)]">주소</span>
            <button type="button" className={`${inputClass} mt-1 flex items-center gap-2 text-left hover:border-[var(--g)] hover:bg-[var(--gl)]`} aria-label={`${place.name || '장소'} 주소 ${place.address ? '변경' : '찾기'}${place.address ? `: ${place.address}` : ''}`} title={place.address || '주소 찾기'} onClick={event => { returnFocusRef.current = event.currentTarget; setSearchId(place.id); setQuery(place.resolvedPlace?.name || place.address); setResults([]); setSearchMessage(''); setSearching(false); searchRef.current?.showModal() }}>
              <MapPin size={14} className="shrink-0 text-[var(--g)]" aria-hidden="true" />
              <span className={`min-w-0 flex-1 truncate ${place.address ? '' : 'text-[var(--muted-light)]'}`}>{place.address || '주소를 찾아주세요'}</span>
            </button>
          </div>
        </div>
        <button type="button" className="absolute right-2 top-5 grid size-11 place-items-center rounded-[10px] text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`${place.name || '장소'} 삭제`} onClick={event => { returnFocusRef.current = event.currentTarget; setDeleteId(place.id); deleteRef.current?.showModal() }}><Trash2 size={18} /></button>
        <div className="mt-3 grid grid-cols-[92px_minmax(0,1fr)] gap-3 @min-[560px]:grid-cols-[92px_minmax(0,1fr)_minmax(0,1fr)] @max-[320px]:grid-cols-1">
          <label className="flex min-w-0 flex-col"><span className="block text-xs leading-4 text-[var(--muted-light)]">중요도</span><select className={`${inputClass} mt-1`} value={place.importance} onChange={e => update(place.id, { importance: e.target.value })}><option value="">미설정</option>{['필수', '높음', '중간', '낮음'].map(v => <option key={v}>{v}</option>)}</select></label>
          <div className="min-w-0"><span className="block text-xs leading-4 text-[var(--muted-light)]">이동수단 · 편도시간</span><div className="mt-1 flex items-center gap-1.5"><select aria-label={`${place.name || '장소'} 이동수단`} className={`${inputClass} flex-1`} value={place.mode} onChange={e => update(place.id, { mode: e.target.value, minutes: e.target.value ? place.minutes : '' })}><option value="">미설정</option><option>도보</option><option>대중교통</option><option>자차</option></select><input aria-label={`${place.name || '장소'} 편도시간 (분)`} inputMode="numeric" className={`${inputClass} !w-14 text-right`} disabled={!place.mode} value={place.minutes} onChange={e => update(place.id, { minutes: digits(e.target.value).slice(0, 3) })} placeholder="-" /><span className="text-sm">분</span></div></div>
          <div className="col-span-full min-w-0 @min-[560px]:col-span-1"><span className="block text-xs leading-4 text-[var(--muted-light)]">방문 빈도</span><div className="mt-1 flex items-center gap-1.5"><select aria-label={`${place.name || '장소'} 빈도 기간`} className={`${inputClass} !w-24`} value={place.period} onChange={e => update(place.id, { period: e.target.value, count: e.target.value ? place.count : '' })}><option value="">미설정</option><option>주</option><option>월</option></select><input aria-label={`${place.name || '장소'} 방문 횟수`} inputMode="numeric" className={`${inputClass} !w-14 text-right`} disabled={!place.period} value={place.count} onChange={e => update(place.id, { count: digits(e.target.value).slice(0, 2) })} placeholder="-" /><span className="text-sm">회</span></div></div>
        </div>
        {place.importance === '필수' && (!place.mode || Number(place.minutes) <= 0) && <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-[var(--badge-text)]"><AlertTriangle size={16} className="shrink-0" />필수로 적용하려면 이동수단과 편도시간을 정해 주세요.</p>}
      </fieldset>)}
      {!value.places.length && <p className="rounded-2xl border border-dashed border-[#CFE3DA] p-5 text-sm text-[var(--muted)]">대화에서 장소를 알려주시거나 아래 버튼으로 추가해주세요.</p>}
    </div>
    <button ref={addRef} type="button" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#A7D9C2] px-4 text-sm font-bold text-[var(--gd)] hover:bg-[var(--gl)]" onClick={() => onChange({ ...value, places: [...value.places, blankPlace(crypto.randomUUID())] })}><Plus size={17} />장소 추가</button>
    </div>
    <div className="shrink-0 border-t border-[#EEF2F0] bg-white px-6 pt-4 pb-6 text-center max-[760px]:px-3.5">
      {tried && issue && <p role="alert" className="mb-3 max-h-20 panel-scroll overflow-y-auto overscroll-contain rounded-xl bg-red-50 p-3 text-left text-sm text-red-700">{issue}</p>}
      <button type="button" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--gd)] px-4 font-bold text-white hover:bg-[var(--hover)]" onClick={() => { setTried(true); if (!issue) onRecommend() }}><Search size={18} />이 조건으로 동네 찾기</button>
    </div>
    <dialog ref={searchRef} onClose={() => { requestRef.current += 1; setSearching(false); returnFocusRef.current?.focus() }} className="m-auto max-h-[calc(100svh-32px)] w-[min(440px,calc(100%-32px))] overflow-auto rounded-[22px] border-0 bg-white p-6 shadow-[var(--shadow-modal)] backdrop:bg-black/40" aria-labelledby="address-title">
      <div className="flex items-center justify-between"><h2 id="address-title" className="text-lg font-extrabold">주소 찾기</h2><button type="button" aria-label="주소 찾기 닫기" className="grid size-11 place-items-center" onClick={() => searchRef.current?.close()}><X size={20} /></button></div>
      <form onSubmit={e => { e.preventDefault(); void search() }} className="mt-3">
        <label className="block text-sm">장소 이름이나 주소<input className={`${inputClass} mt-2`} value={query} onChange={e => { requestRef.current += 1; setSearching(false); setResults([]); setSearchMessage(''); setQuery(e.target.value) }} placeholder="예: 강남 파이브가이즈" /></label>
        <button type="submit" disabled={searching || !query.trim()} className="mt-3 w-full rounded-xl bg-[var(--gd)] px-4 text-sm font-bold text-white">{searching ? '검색 중…' : '장소 검색'}</button>
      </form>
      <p role="status" className="my-3 text-xs leading-relaxed text-[var(--muted)]">{searchMessage || '검색 결과가 한 곳이면 자동으로 반영해요.'}</p>
      <ul className="grid gap-2">{results.map(result => <li key={result.id}><button type="button" className="w-full rounded-xl border border-[var(--line-subtle)] p-3 text-left hover:bg-[var(--gl)]" onClick={() => applyPlace(result)}><strong className="block text-sm">{result.name}</strong><span className="text-xs text-[var(--muted)]">{result.address}</span></button></li>)}</ul>

    </dialog>
    <dialog ref={deleteRef} onClose={() => { if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus(); else addRef.current?.focus() }} className="m-auto w-[min(400px,calc(100%-32px))] rounded-[22px] border-0 bg-white p-6 shadow-[var(--shadow-modal)] backdrop:bg-black/40" aria-labelledby="delete-place-title">
      <h2 id="delete-place-title" className="text-lg font-extrabold">{target?.name || '이 장소'} 조건을 삭제할까요?</h2><p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">이 장소와 연결된 설정이 이번 추천 조건에서 빠져요.</p><div className="mt-5 flex gap-2.5"><button type="button" className="flex-1 rounded-xl border border-[var(--line)]" onClick={() => deleteRef.current?.close()}>취소</button><button type="button" className="flex-1 rounded-xl bg-red-600 text-white" onClick={() => { onChange({ ...value, places: value.places.filter(p => p.id !== deleteId) }); deleteRef.current?.close() }}>삭제</button></div>
    </dialog>
  </aside>
}
