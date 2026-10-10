import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Building2, House, Wallet, Trees, MapPin, Sparkles, Infinity as InfinityIcon, Pencil, Check } from 'lucide-react'
import Header from '../../components/layout/Header'
import '../home/HomePage.css'
import './ConsultationPage.css'

const fields = [
  { key: 'work', title: '회사 · 학교', icon: Building2, placeholder: '예: 여의도역 인근 회사', question: '회사나 학교의 위치를 알려주세요.', hint: '역 이름이나 주소를 적으면 더 정확하게 조건을 정리할 수 있어요.', options: [] },
  { key: 'frequency', title: '방문 빈도', icon: MapPin, placeholder: '예: 주 5회', question: '회사나 학교에는 주 몇 회 가시나요?', hint: '자주 방문하는 거점일수록 이동 부담이 중요해요.', options: ['주 5회', '주 3~4회', '주 1~2회', '거의 안 감'] },
  { key: 'family', title: '다른 생활거점', icon: House, placeholder: '예: 수원 본가, 월 2회 방문', question: '본가나 연인 집 등 다른 생활거점도 있나요?', hint: '위치와 방문 빈도를 함께 알려주세요. 없다면 없다고 적어주세요.', options: ['없어요'] },
  { key: 'budget', title: '예산', icon: Wallet, placeholder: '예: 보증금 2,000만 원 / 월세 70만 원 이하', question: '생각하시는 보증금과 월세 예산은 얼마인가요?', hint: '보증금과 월세 상한을 함께 입력해주세요.', options: [] },
  { key: 'preference', title: '선호 조건', icon: Trees, placeholder: '예: 출근 45분 이내, 조용한 동네', question: '꼭 지키고 싶은 조건이나 선호가 있나요?', hint: '이동시간, 환승, 주변 시설 등 자유롭게 알려주세요.', options: ['조용한 동네', '환승 적게', '역에서 가까운 곳', '특별히 없어요'] },
] as const

type Message = { role: 'assistant' | 'user'; text: string }
type Conditions = Record<string, string>

export default function ConsultationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initial = typeof location.state?.condition === 'string' ? location.state.condition : ''
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: 'assistant', text: '안녕하세요! 여러 생활거점과 예산을 함께 고려해 살고 싶은 동네의 조건을 정리해볼게요.' },
    ...(initial ? [{ role: 'user' as const, text: initial }] : []),
    { role: 'assistant', text: initial ? '입력하신 내용을 확인했어요. 현재는 체험용 대화로, 아래 질문에 답하면 오른쪽 조건 카드에 반영돼요.' : '현재는 체험용 대화예요. 아래 질문에 답하며 조건을 하나씩 정리해보세요.' },
  ])
  const [conditions, setConditions] = useState<Conditions>(location.state?.conditions ?? {})
  const [step, setStep] = useState(location.state?.conditions ? fields.length : 0)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const question = fields[step]

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }) }, [messages])

  function send(value: string) {
    const text = value.trim()
    if (!text) return
    if (question) {
      setConditions(current => ({ ...current, [question.key]: text }))
      setStep(current => current + 1)
    }
    setMessages(current => [...current,
      { role: 'user', text },
      { role: 'assistant', text: question ? (step === fields.length - 1 ? '조건 정리가 끝났어요! 오른쪽 내용을 확인하고, 바꾸고 싶은 항목은 수정해주세요.' : '좋아요! 조건에 반영했어요. 다음 내용도 확인할게요.') : '추가로 말씀하신 내용을 선호 조건에 기록했어요.' },
    ])
    if (!question) setConditions(current => ({ ...current, preference: [current.preference, text].filter(Boolean).join('\n') }))
    setDraft('')
  }

  return (
    <div className="consultation-page">
      <Header />
      <main className="consultation-layout">
        <section className="chat-panel" aria-label="조건 정리 대화">
          <div className="chat-toolbar"><Link to="/"><ArrowLeft size={16} /> 처음으로</Link><span>체험용 대화 · AI 연결 전</span></div>
          <div className="chat-history">
            <div role="log" aria-live="polite" aria-relevant="additions">
              {messages.map((message, index) => <div className={`chat-row ${message.role}`} key={index}>
                {message.role === 'assistant' && <span className="assistant-avatar"><InfinityIcon size={22} aria-label="두리번" /></span>}
                <p className="chat-bubble">{message.text}</p>
              </div>)}
            </div>
            {question && <div className="question-card">
              <div className="question-heading"><span>{step + 1}</span><h2>{question.question}</h2></div>
              <p>{question.hint}</p>
              <div className="question-options">{question.options.map(option => <button key={option} onClick={() => send(option)}>{option}</button>)}</div>
            </div>}
            <div ref={endRef} />
          </div>
          <form className="chat-composer" onSubmit={event => { event.preventDefault(); send(draft) }}>
            <label className="sr-only" htmlFor="chat-message">조건 입력</label>
            <textarea id="chat-message" rows={2} value={draft} onChange={event => setDraft(event.target.value)} placeholder={question?.placeholder ?? '추가로 원하는 조건을 말씀해주세요.'} />
            <button type="submit" disabled={!draft.trim()} aria-label="메시지 보내기"><ArrowRight size={23} /></button>
          </form>
        </section>
        <aside className="summary-panel" aria-labelledby="summary-title">
          <div className="summary-heading"><Sparkles size={24} /><div><h1 id="summary-title">입력하신 조건</h1><p>대화에서 확인한 조건을 모아 보여드려요.</p></div></div>
          <div className="summary-progress"><span>조건 정리</span><span>{Object.values(conditions).filter(Boolean).length} / {fields.length}</span></div>
          <div className="condition-cards">
            {fields.map(({ key, title, icon: Icon, placeholder }, index) => <section className={`summary-card summary-card-${index}`} key={key}>
              <div className="summary-card-heading"><Icon size={23} /><h2>{title}</h2><button aria-label={`${title} 수정`} onClick={() => { setEditing(key); setEditValue(conditions[key] ?? '') }}><Pencil size={12} /> 수정</button></div>
              {editing === key ? <form className="condition-editor" onSubmit={event => {
                event.preventDefault()
                if (!editValue.trim()) return
                setConditions(current => ({ ...current, [key]: editValue.trim() }))
                setEditing(null)
                          }}>
                <label className="sr-only" htmlFor={`edit-${key}`}>{title}</label>
                <textarea autoFocus id={`edit-${key}`} value={editValue} onChange={event => setEditValue(event.target.value)} placeholder={placeholder} rows={2} />
                <div><button type="button" onClick={() => setEditing(null)}>취소</button><button type="submit" disabled={!editValue.trim()}><Check size={14} /> 저장</button></div>
              </form> : <p className={conditions[key] ? '' : 'condition-empty'}>{conditions[key] || '아직 입력하지 않았어요'}</p>}
            </section>)}
          </div>
          <div className="recommend-action"><button disabled={fields.some(field => !conditions[field.key]) || editing !== null} onClick={() => navigate('/recommendations', { state: { condition: initial, conditions } })}><Sparkles size={19} /> 이 조건으로 추천받기 <ArrowRight size={20} /></button>
</div>
        </aside>
      </main>
    </div>
  )
}
