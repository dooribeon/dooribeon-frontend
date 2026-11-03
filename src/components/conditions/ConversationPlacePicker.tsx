import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { placeSearchQuery, searchConversationPlace, selectConversationPlace } from '../../services/conditionConversationApi'
import type { ConditionConversation, ConversationConditions, PlaceSearchType } from '../../services/conditionConversationApi'

type Props = {
  conversationId: string
  place: ConversationConditions['places'][number]
  modal: boolean
  onClose: () => void
  onBusyChange: (busy: boolean) => void
  onSelected: (conversation: ConditionConversation) => void
}

export default function ConversationPlacePicker({ conversationId, place, modal, onClose, onBusyChange, onSelected }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const request = useRef(0)
  const initialQuery = placeSearchQuery(place)
  const [query, setQuery] = useState(initialQuery)
  const [type, setType] = useState<PlaceSearchType>('KEYWORD')
  const [result, setResult] = useState<Awaited<ReturnType<typeof searchConversationPlace>> | null>(null)
  const [searching, setSearching] = useState(Boolean(initialQuery.trim()))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const initialRequest = useRef<ReturnType<typeof searchConversationPlace> | null>(null)
  const name = place.label || place.query || '장소'
  const button = 'rounded-xl border border-[var(--line-secondary)] px-3 text-sm hover:bg-[var(--gl)]'

  useEffect(() => {
    if (!initialQuery.trim()) return
    let active = true
    onBusyChange(true)
    // StrictMode에서도 같은 검색을 두 번 보내 후보 번호가 바뀌지 않게 한다.
    initialRequest.current ??= searchConversationPlace(conversationId, place.id, initialQuery, 'KEYWORD', place.label)
    initialRequest.current.then(found => {
      if (active) { setResult(found); setQuery(found.query ?? initialQuery) }
    }).catch(err => {
      if (active) setError(err instanceof Error ? err.message : '다시 검색해주세요.')
    }).finally(() => {
      if (active) { setSearching(false); onBusyChange(false) }
    })
    return () => { active = false; onBusyChange(false) }
  }, [conversationId, place.id, place.label, initialQuery, onBusyChange])

  useEffect(() => {
    if (modal) dialog.current?.showModal()
  }, [modal])

  function resetResults() {
    request.current++
    setResult(null)
    setError('')
  }

  async function search() {
    const version = ++request.current
    setResult(null)
    setError('')
    setSearching(true)
    onBusyChange(true)
    try {
      const found = await searchConversationPlace(conversationId, place.id, query.trim(), type)
      if (request.current === version) setResult(found)
    } catch (err) {
      if (request.current === version) setError(err instanceof Error ? err.message : '다시 검색해주세요.')
    } finally {
      if (request.current === version) { setSearching(false); onBusyChange(false) }
    }
  }

  async function select(candidateId: string) {
    if (!result || saving) return
    setSaving(true)
    setError('')
    onBusyChange(true)
    try {
      const response = await selectConversationPlace(conversationId, place.id, result.searchId, candidateId)
      onSelected(response)
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : '위치를 저장하지 못했어요. 다시 검색해주세요.')
    } finally {
      setSaving(false)
      onBusyChange(false)
    }
  }

  const content = <>
    <header className="flex items-center justify-between gap-2"><h2 className="text-base font-bold">{name} 위치 선택</h2>
      {modal && <button type="button" className="px-3" aria-label="닫기" disabled={searching || saving} onClick={onClose}><X size={20} /></button>}
    </header>
    {modal && <form className="my-3 grid gap-2" onSubmit={event => { event.preventDefault(); if (!searching && !saving && query.trim()) void search() }}>
      <select aria-label="검색 방식" className={button} value={type} disabled={saving || searching} onChange={event => { resetResults(); setType(event.target.value as PlaceSearchType) }}>
        <option value="KEYWORD">장소 이름으로 검색</option><option value="ADDRESS">주소로 검색</option>
      </select>
      <input aria-label="장소 검색어" maxLength={200} value={query} disabled={saving || searching} className="h-11 rounded-xl border px-3" onChange={event => { resetResults(); setQuery(event.target.value) }} />
      <button className="rounded-xl bg-[var(--gd)] text-sm font-bold text-white" disabled={saving || searching || !query.trim()}>검색</button>
    </form>}
    <p role="status" className="mt-2 text-sm text-[var(--muted)]">{saving ? '선택한 위치를 저장하고 있어요.' : searching ? '장소 후보를 확인하고 있어요.' : result ? (result.candidates.length ? '주소를 확인하고 맞는 장소를 선택해주세요.' : modal ? '검색 결과가 없어요. 검색어나 검색 방식을 바꿔주세요.' : '장소를 찾지 못했어요. 채팅으로 지역이나 주소를 더 알려주세요.') : ''}</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {error && !modal && <button type="button" className={button} disabled={saving || searching} onClick={() => void search()}>후보 다시 불러오기</button>}
    <ul className="mt-2 grid gap-2">{result?.candidates.map(({ candidateId, location }) =>
      <li key={candidateId}><button type="button" className={`${button} grid w-full gap-1 py-2 text-left`} disabled={saving || searching} onClick={() => void select(candidateId)}>
        <strong>{location.placeName || location.address}</strong>{location.placeName && <span>{location.address}</span>}
      </button></li>)}</ul>
  </>

  return modal ? <dialog ref={dialog} aria-label={`${name} 위치 선택`} onCancel={event => {
    event.preventDefault()
    if (!saving && !searching) onClose()
  }} className="m-auto max-h-[85svh] w-[min(440px,94vw)] overflow-y-auto rounded-[22px] bg-white p-5 shadow-xl backdrop:bg-black/40">{content}</dialog>
    : <section aria-label={`채팅에서 ${name} 위치 선택`} className="mb-4 rounded-2xl border border-[var(--line-secondary)] bg-[#F8FCFA] p-4">{content}</section>
}
