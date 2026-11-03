import { useEffect, useRef, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { searchConversationPlace, selectConversationPlace } from '../../services/conditionConversationApi'
import type { ConditionConversation, ConversationConditions, PlaceSearchType } from '../../services/conditionConversationApi'

type Props = {
  conversationId: string
  place: ConversationConditions['places'][number]
  disabled: boolean
  onSelected: (conversation: ConditionConversation) => void
}

export default function ConversationPlacePicker({ conversationId, place, disabled, onSelected }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const request = useRef(0)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<PlaceSearchType>('KEYWORD')
  const [result, setResult] = useState<Awaited<ReturnType<typeof searchConversationPlace>> | null>(null)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const name = place.label || place.query || '장소'
  const button = 'rounded-xl border border-[var(--line-secondary)] px-3 text-sm hover:bg-[var(--gl)]'
  useEffect(() => () => { request.current++ }, [])

  function resetResults() {
    request.current++
    setResult(null)
    setError('')
    setSearching(false)
  }

  async function search(text: string, searchType: PlaceSearchType, initialLabel?: string | null) {
    const version = ++request.current
    setResult(null)
    setError('')
    setSearching(true)
    try {
      const keyword = text.trim()
      let found = await searchConversationPlace(conversationId, place.id, keyword, searchType)
      if (version !== request.current) return
      // 첫 검색어 끝이나 처음에 붙은 거점명이 건물 검색을 막을 때만 재시도한다.
      const label = initialLabel?.trim()
      if (label && !found.candidates.length) {
        let building = ''
        if (keyword.endsWith(' ' + label)) building = keyword.slice(0, -label.length).trim()
        else if (keyword.startsWith(label + ' ')) building = keyword.slice(label.length).trim()
        if (building) {
          setQuery(building)
          found = await searchConversationPlace(conversationId, place.id, building, searchType)
        }
      }
      if (request.current === version) setResult(found)
    } catch (err) {
      if (request.current === version) setError(err instanceof Error ? err.message : '다시 검색해주세요.')
    } finally {
      if (request.current === version) setSearching(false)
    }
  }

  function open() {
    const text = place.query || place.location?.placeName || place.location?.address || place.label || ''
    resetResults()
    setQuery(text)
    setType('KEYWORD')
    dialog.current?.showModal()
    if (text.trim()) void search(text, 'KEYWORD', place.label)
  }

  async function select(candidateId: string) {
    if (!result || saving) return
    setSaving(true)
    setError('')
    try {
      const response = await selectConversationPlace(conversationId, place.id, result.searchId, candidateId)
      onSelected(response)
      dialog.current?.close()
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : '위치를 저장하지 못했어요. 다시 검색해주세요.')
    } finally {
      setSaving(false)
    }
  }

  return <>
    <button type="button" disabled={disabled} onClick={open} aria-label={`${name} 위치 ${place.location ? '변경' : '선택'}`}
      className={`${button} mt-1 flex w-full items-center gap-2 text-left text-[var(--gd)]`}>
      <MapPin size={16} className="shrink-0" />
      <span>{place.location?.address || place.location?.placeName || `${place.query ? place.query + ' · ' : ''}위치 선택`}</span>
    </button>
    <dialog ref={dialog} aria-label={`${name} 위치 선택`} onClose={resetResults} onCancel={event => { if (saving) event.preventDefault() }}
      className="m-auto max-h-[85svh] w-[min(440px,94vw)] overflow-y-auto rounded-[22px] bg-white p-5 shadow-xl backdrop:bg-black/40">
      <header className="flex items-center justify-between gap-2"><h2 className="text-lg font-bold">{name} 위치 선택</h2>
        <button type="button" className="px-3" aria-label="닫기" disabled={saving} onClick={() => dialog.current?.close()}><X size={20} /></button>
      </header>
      <form className="my-3 grid gap-2" onSubmit={event => { event.preventDefault(); if (!searching && !saving && query.trim()) void search(query, type) }}>
        <select aria-label="검색 방식" className={button} value={type} disabled={saving || searching} onChange={event => { resetResults(); setType(event.target.value as PlaceSearchType) }}>
          <option value="KEYWORD">장소 이름으로 검색</option><option value="ADDRESS">주소로 검색</option>
        </select>
        <input aria-label="장소 검색어" maxLength={200} value={query} disabled={saving || searching} className="h-11 rounded-xl border px-3" onChange={event => { resetResults(); setQuery(event.target.value) }} />
        <button className="rounded-xl bg-[var(--gd)] text-sm font-bold text-white" disabled={saving || searching || !query.trim()}>검색</button>
      </form>
      <p role="status" className="text-sm text-[var(--muted)]">{saving ? '선택한 위치를 저장하고 있어요.' : searching ? '장소를 검색하고 있어요.' : result ? (result.candidates.length ? '주소를 확인하고 맞는 장소를 선택해주세요.' : '검색 결과가 없어요. 검색어나 검색 방식을 바꿔주세요.') : ''}</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <ul className="mt-2 grid gap-2">{result?.candidates.map(({ candidateId, location }) =>
        <li key={candidateId}><button type="button" className={`${button} grid w-full gap-1 py-2 text-left`} disabled={saving} onClick={() => void select(candidateId)}>
          <strong>{location.placeName || location.address}</strong>{location.placeName && <span>{location.address}</span>}
        </button></li>)}</ul>
    </dialog>
  </>
}
