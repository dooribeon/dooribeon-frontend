import { useEffect,useRef,useState } from 'react'
import { useLocation,useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { searchPlaces } from '../../services/placeSearch'
import type { ResolvedPlace } from '../../services/placeSearch'
import ConditionPanel from '../../components/conditions/ConditionPanel'
import { fromLegacy, toLegacy } from '../../components/conditions/conditionModel'
import { nextQuestion, primaryReady, receiveAnswer } from '../../components/conditions/conversationFlow'
import type { ConditionDraft } from '../../components/conditions/conditionModel'

type Message={ role: 'assistant'|'user'; text: string }
type Conditions=Record<string,string>

function BotAvatar() {
  return <svg className="-mt-0.5 h-11 w-[34px] shrink-0" viewBox="0 0 96 124" role="img" aria-label="두리번"><path d="M48 4C25 4 7 22 7 45c0 29 41 67 41 67s41-38 41-67C89 22 71 4 48 4z" fill="var(--g)" /><ellipse cx="34" cy="44" rx="12" ry="14" fill="white" /><ellipse cx="62" cy="44" rx="12" ry="14" fill="white" /><circle cx="36" cy="47" r="6.5" fill="var(--ink)" /><circle cx="64" cy="47" r="6.5" fill="var(--ink)" /></svg>
}

export default function ConsultationPage() {
  const location=useLocation()
  const navigate=useNavigate()
  const initial=typeof location.state?.condition==='string'? location.state.condition:''
  const [conditionDraft,setConditionDraft]=useState<ConditionDraft>(() => location.state?.conditionDraft ?? receiveAnswer(fromLegacy(location.state?.conditions ?? {}), initial, null))
  const [messages,setMessages]=useState<Message[]>(() => initial ? [{ role: 'user', text: initial }] : [])
  const [draft,setDraft]=useState('')
  const [typing,setTyping]=useState(true)
  const [searching,setSearching]=useState(false)
  const [candidates,setCandidates]=useState<{ placeId: string; items: ResolvedPlace[]; total: number } | null>(null)
  const searchVersion=useRef(0)
  useEffect(() => () => { searchVersion.current += 1 }, [])
  const [panelVisible,setPanelVisible]=useState(() => Boolean(location.state?.conditionDraft && primaryReady(location.state.conditionDraft)))
  const [pendingReply,setPendingReply]=useState(() => nextQuestion(conditionDraft)?.text ?? '조건을 확인하고 원하는 내용을 수정해주세요.')
  const endRef=useRef<HTMLDivElement>(null)
  const sendingRef=useRef(false)
  const currentQuestion = nextQuestion(conditionDraft)
  const quickReplies = currentQuestion?.key === 'mode' ? ['대중교통', '도보', '자차'] : currentQuestion?.key === 'minutes' ? ['30분', '1시간', '1시간 반'] : []
  const conditions: Conditions=location.state?.conditions ?? {}

  useEffect(() => {
    if(!typing || searching) return
    const timer=window.setTimeout(() => {
      setMessages(current => [...current, { role: 'assistant', text: pendingReply }])
      setTyping(false)
      sendingRef.current=false
      if(primaryReady(conditionDraft)) setPanelVisible(true)
    }, 850)
    return () => window.clearTimeout(timer)
  },[typing,searching,pendingReply,conditionDraft])

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }) },[messages,typing])

  function replyFor(next: ConditionDraft, prefix = '') {
    const reveal=!panelVisible && primaryReady(next)
    setPendingReply(prefix + (reveal ? '회사·학교의 필수 정보가 모였어요. 조건 패널에서 확인하고 수정할 수 있어요.\n\n' : '') + (nextQuestion(next)?.text ?? '장소를 모두 확인했어요. 조건을 확인하고 ‘이 조건으로 동네 찾기’를 눌러주세요.'))
    setConditionDraft(next)
    setTyping(true)
  }

  function choosePlace(placeId: string, place: ResolvedPlace) {
    const next={ ...conditionDraft, places: conditionDraft.places.map(p => p.id === placeId ? { ...p, address: place.address, resolvedPlace: place } : p) }
    setCandidates(null)
    setMessages(current => [...current, { role: 'user', text: `${place.name} 선택` }])
    replyFor(next, `${place.name} (${place.address})로 반영했어요.\n\n`)
  }

  async function send(value: string) {
    const text=value.trim()
    if(!text || typing || sendingRef.current) return
    sendingRef.current=true
    const pending=nextQuestion(conditionDraft)
    const next=receiveAnswer(conditionDraft,text,pending)
    setCandidates(null)
    setMessages(current => [...current, { role: 'user', text }])
    setDraft('')
    setTyping(true)
    if (pending?.key === 'address' && pending.placeId) {
      const version=++searchVersion.current
      setSearching(true)
      try {
        const result=await searchPlaces(text)
        if (version !== searchVersion.current) return
        if (result.total === 1 && result.items.length === 1) {
          const place=result.items[0]
          replyFor({ ...next, places: next.places.map(p => p.id === pending.placeId ? { ...p, address: place.address, resolvedPlace: place } : p) }, `${place.name} (${place.address})로 반영했어요.\n\n`)
        } else {
          setConditionDraft(next)
          setCandidates(result.items.length ? { placeId: pending.placeId, ...result } : null)
          setPendingReply(result.items.length ? '여러 장소가 검색됐어요. 아래에서 맞는 장소를 선택하거나 지점명을 더 자세히 알려주세요.' : '검색 결과가 없어요. 지역이나 지점명을 추가해서 다시 알려주세요.')
        }
      } catch (error) {
        if (version !== searchVersion.current) return
        setPendingReply(error instanceof Error ? error.message : '장소 검색에 실패했어요. 다시 입력해주세요.')
      } finally {
        if (version === searchVersion.current) setSearching(false)
      }
      return
    }
    replyFor(next)
  }

  return (
    <AppLayout header={{ appearance: 'prototype' }} className="bg-[#F4F8F6] text-[var(--text)] tracking-[-.03em] break-keep [--header-background:rgba(244,248,246,.94)] [&_button:disabled]:opacity-45 [&_button:disabled]:cursor-not-allowed [&_button]:min-h-11">
      <main className={`consultation-transition mx-auto grid w-full max-w-[1680px] items-start px-[clamp(20px,3vw,48px)] pt-6 pb-10 max-[760px]:px-4 ${panelVisible ? 'is-expanded' : ''}`}>
        <section className="flex h-[var(--consultation-panel-height)] min-w-0 flex-col overflow-hidden rounded-[28px] border border-[#DFE9E4] bg-white shadow-[0_18px_50px_rgba(15,45,35,.06)] max-[760px]:rounded-[22px]" aria-label="조건 정리 대화">
          <div className="flex min-h-0 flex-1 flex-col panel-scroll overflow-y-auto overscroll-contain px-6 pt-6 pb-2 max-[1299px]:px-3.5">
            <div className="" role="log" aria-live="polite" aria-relevant="additions">
              {messages.map((message,index) => <div className={`mb-[18px] flex items-start gap-2.5 [&.user]:justify-end ${message.role}`} key={index}>
                {message.role==='assistant'&&<BotAvatar />}
                <p className="
  max-w-[78%] rounded-[4px_20px_20px_20px] bg-[#F3F6F5] px-[18px] py-3.5 text-[15.5px] leading-[1.75] whitespace-pre-wrap
  [overflow-wrap:anywhere] [.user_&]:bg-[#DDF5EA] [.user_&]:text-[var(--ink)] [.user_&]:rounded-[20px_4px_20px_20px]
  max-[1299px]:max-w-[88%] max-[760px]:px-[15px] max-[760px]:py-3 max-[760px]:text-[15px]
">{message.text}</p>
              </div>)}
            </div>
            {typing && <div className="mb-[18px] flex items-start gap-2.5" role="status" aria-label="두리번이 응답을 준비하고 있어요"><BotAvatar /><div className="flex gap-1.5 rounded-[4px_20px_20px_20px] bg-[#F3F6F5] px-[18px] py-5" aria-hidden="true">{[0,1,2].map(dot => <span key={dot} className="chat-thinking size-[7px] rounded-full bg-[#7FA796]" style={{ animationDelay: `${dot * 150}ms` }} />)}</div></div>}
            {candidates && !typing && <div className="mb-4 ml-11 grid gap-2" aria-label="장소 검색 결과">
              {candidates.items.map(place => <button key={place.id} type="button" className="rounded-xl border border-[var(--line-panel)] bg-white p-3 text-left hover:bg-[var(--gl)]" onClick={() => choosePlace(candidates.placeId, place)}><strong className="block text-sm">{place.name}</strong><span className="text-xs text-[var(--muted)]">{place.address}</span></button>)}
              {candidates.total > candidates.items.length && <p className="text-xs text-[var(--muted)]">검색 결과 중 {candidates.items.length}곳을 표시했어요. 원하는 장소가 없다면 지역·지점명을 더 입력해주세요.</p>}
            </div>}
            {!typing && quickReplies.length > 0 && <div className="mb-4 ml-11 flex flex-wrap gap-2" role="group" aria-label={currentQuestion?.key === 'mode' ? '이동수단 선택' : '최대 편도시간 선택'}>
              {quickReplies.map(option => <button type="button" key={option} className="min-h-11 rounded-full border border-[#CFE3DA] bg-white px-4 text-sm font-semibold text-[var(--gd)] transition-colors hover:border-[var(--g)] hover:bg-[var(--gl)]" onClick={() => void send(option)}>{option}</button>)}
            </div>}
            <div ref={endRef} />
          </div>
          <form className="
  mx-6 mt-[18px] mb-6 flex shrink-0 items-center gap-3 rounded-[18px] border-[1.5px] border-[#CFE3DA] bg-white py-3 pl-[18px] pr-3
  focus-within:border-[var(--g)] focus-within:shadow-[0_0_0_1.5px_#059669] [&_textarea]:min-w-0 [&_textarea]:flex-1 [&_textarea]:resize-none
  [&_textarea]:h-14 [&_textarea]:outline-none [&_textarea]:text-[15px] [&_textarea]:leading-[1.85]
  [&_textarea]:placeholder:text-[var(--muted-light)] [&>button]:grid [&>button]:size-11 [&>button]:shrink-0
  [&>button]:place-items-center [&>button]:rounded-full [&>button]:bg-[var(--gd)] [&>button]:text-white [&>button:enabled:hover]:bg-[var(--hover)] max-[1299px]:m-3.5
" onSubmit={event => { event.preventDefault(); send(draft) }}>
            <label className="sr-only" htmlFor="chat-message">조건 입력</label>
            <textarea id="chat-message" rows={2} onKeyDown={event => {
              if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
              event.preventDefault()
              if (!event.repeat) void send(draft)
            }} value={draft} onChange={event => setDraft(event.target.value)} placeholder={typing ? '두리번이 응답을 준비하고 있어요…' : '더 알려줄 내용이 있으면 입력해주세요'} />
            <button type="submit" disabled={typing || !draft.trim()} aria-label="메시지 보내기"><ArrowRight size={23} /></button>
          </form>
        </section>
        <div className="condition-reveal min-w-0" inert={!panelVisible} aria-hidden={!panelVisible}>
          <ConditionPanel value={conditionDraft} onChange={value => { searchVersion.current += 1; setCandidates(null); setSearching(false); setConditionDraft(value) }} onRecommend={() => navigate('/search', { state: { condition: initial, conditions: toLegacy(conditionDraft, conditions), conditionDraft } })} />
        </div>
      </main>
    </AppLayout>
  )
}
