import { useEffect,useRef,useState } from 'react'
import { useLocation,useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { sendConditionMessage, toConditionDraft } from '../../services/conditionConversationApi'
import type { ConditionConversation } from '../../services/conditionConversationApi'
import ConditionPanel from '../../components/conditions/ConditionPanel'
import { toLegacy } from '../../components/conditions/conditionModel'
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
  const restored = location.state?.aiConversation as ConditionConversation | undefined
  const [conversation, setConversation] = useState<ConditionConversation | null>(restored ?? null)
  const [conditionDraft, setConditionDraft] = useState<ConditionDraft>(() => restored ? toConditionDraft(restored.conditions) : { deposit: '', rent: '', preference: '', places: [] })
  const [messages, setMessages] = useState<Message[]>(() => location.state?.aiMessages ?? (initial ? [{ role: 'user', text: initial }] : [
    { role: 'assistant', text: '예산과 생활 조건을 알려주세요.' },
  ]))
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(Boolean(initial) && !restored)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const sendingRef = useRef(false)
  // StrictMode에서 첫 입력이 두 번 전송되어 대화 두 개가 만들어지는 것을 막는다.
  const initialRequest = useRef<Promise<ConditionConversation> | null>(null)
  const conditions: Conditions = location.state?.conditions ?? {}

  function applyResponse(response: ConditionConversation) {
    setConversation(response)
    setConditionDraft(toConditionDraft(response.conditions))
    const answer = [...response.notices, response.nextQuestion ?? '조건을 확인했어요. 수정할 내용이 있으면 채팅으로 알려주세요.']
      .filter(Boolean).join('\n\n')
    setMessages(current => [...current, { role: 'assistant', text: answer }])
  }

  useEffect(() => {
    if (!initial || restored) return
    let active = true
    initialRequest.current ??= sendConditionMessage(initial)
    initialRequest.current.then(response => {
      if (active) applyResponse(response)
    }).catch(error => {
      if (active) {
        setError(error instanceof Error ? error.message : '조건을 확인하지 못했어요.')
        setDraft(initial)
      }
    }).finally(() => {
      if (active) setTyping(false)
    })
    return () => { active = false }
  }, [initial, restored])

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }) }, [messages, typing, error])

  async function send(value: string) {
    const text = value.trim()
    if (!text || typing || sendingRef.current) return
    sendingRef.current = true
    setTyping(true)
    setError('')
    setMessages(current => [...current, { role: 'user', text }])
    setDraft('')
    try {
      applyResponse(await sendConditionMessage(text, conversation?.conversationId))
    } catch (error) {
      setError(error instanceof Error ? error.message : '조건을 확인하지 못했어요.')
      setDraft(text)
    } finally {
      setTyping(false)
      sendingRef.current = false
    }
  }

  return (
    <AppLayout header={{ appearance: 'prototype' }} className="bg-[#F4F8F6] text-[var(--text)] tracking-[-.03em] break-keep [--header-background:rgba(244,248,246,.94)] [&_button:disabled]:opacity-45 [&_button:disabled]:cursor-not-allowed [&_button]:min-h-11">
      <main className={`consultation-transition mx-auto grid w-full max-w-[1680px] items-start px-[clamp(20px,3vw,48px)] pt-6 pb-10 max-[760px]:px-4 ${conversation ? 'is-expanded' : ''}`}>
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
            {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error} 입력 내용을 확인하고 다시 보내주세요.</p>}
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
        <div className="condition-reveal min-w-0" inert={!conversation} aria-hidden={!conversation}>
          <ConditionPanel value={conditionDraft} readOnly readyForRecommendation={Boolean(conversation?.readyForRecommendation) && !typing && !error} onChange={setConditionDraft} onRecommend={() => navigate('/search', { state: { condition: initial, conditions: toLegacy(conditionDraft, conditions), conditionDraft, aiConversation: conversation, aiMessages: messages } })} />
        </div>
      </main>
    </AppLayout>
  )
}
