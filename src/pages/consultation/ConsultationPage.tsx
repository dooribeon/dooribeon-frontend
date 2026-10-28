import { useEffect,useRef,useState } from 'react'
import { useLocation,useNavigate,Link } from 'react-router-dom'
import { ArrowLeft,ArrowRight,Building2,House,Wallet,Trees,MapPin,Sparkles,Infinity as InfinityIcon,Pencil,Check } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'

const fields=[
  { key: 'work',title: '회사 · 학교',icon: Building2,placeholder: '예: 여의도역 인근 회사',question: '회사나 학교의 위치를 알려주세요.',hint: '역 이름이나 주소를 적으면 더 정확하게 조건을 정리할 수 있어요.',options: [] },
  { key: 'frequency',title: '방문 빈도',icon: MapPin,placeholder: '예: 주 5회',question: '회사나 학교에는 주 몇 회 가시나요?',hint: '자주 방문하는 거점일수록 이동 부담이 중요해요.',options: ['주 5회','주 3~4회','주 1~2회','거의 안 감'] },
  { key: 'family',title: '다른 생활거점',icon: House,placeholder: '예: 수원 본가, 월 2회 방문',question: '본가나 연인 집 등 다른 생활거점도 있나요?',hint: '위치와 방문 빈도를 함께 알려주세요. 없다면 없다고 적어주세요.',options: ['없어요'] },
  { key: 'budget',title: '예산',icon: Wallet,placeholder: '예: 보증금 2,000만 원 / 월세 70만 원 이하',question: '생각하시는 보증금과 월세 예산은 얼마인가요?',hint: '보증금과 월세 상한을 함께 입력해주세요.',options: [] },
  { key: 'preference',title: '선호 조건',icon: Trees,placeholder: '예: 출근 45분 이내, 조용한 동네',question: '꼭 지키고 싶은 조건이나 선호가 있나요?',hint: '이동시간, 환승, 주변 시설 등 자유롭게 알려주세요.',options: ['조용한 동네','환승 적게','역에서 가까운 곳','특별히 없어요'] },
] as const

type Message={ role: 'assistant'|'user'; text: string }
type Conditions=Record<string,string>

export default function ConsultationPage() {
  const location=useLocation()
  const navigate=useNavigate()
  const initial=typeof location.state?.condition==='string'? location.state.condition:''
  const [messages,setMessages]=useState<Message[]>(() => [
    { role: 'assistant',text: '안녕하세요! 여러 생활거점과 예산을 함께 고려해 살고 싶은 동네의 조건을 정리해볼게요.' },
    ...(initial? [{ role: 'user' as const,text: initial }]:[]),
    { role: 'assistant',text: initial? '입력하신 내용을 확인했어요. 현재는 체험용 대화로, 아래 질문에 답하면 오른쪽 조건 카드에 반영돼요.':'현재는 체험용 대화예요. 아래 질문에 답하며 조건을 하나씩 정리해보세요.' },
  ])
  const [conditions,setConditions]=useState<Conditions>(location.state?.conditions??{})
  const [step,setStep]=useState(location.state?.conditions? fields.length:0)
  const [draft,setDraft]=useState('')
  const [editing,setEditing]=useState<string|null>(null)
  const [editValue,setEditValue]=useState('')
  const endRef=useRef<HTMLDivElement>(null)
  const question=fields[step]

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }) },[messages])

  function send(value: string) {
    const text=value.trim()
    if(!text) return
    if(question) {
      setConditions(current => ({ ...current,[question.key]: text }))
      setStep(current => current+1)
    }
    setMessages(current => [...current,
    { role: 'user',text },
    { role: 'assistant',text: question? (step===fields.length-1? '조건 정리가 끝났어요! 오른쪽 내용을 확인하고, 바꾸고 싶은 항목은 수정해주세요.':'좋아요! 조건에 반영했어요. 다음 내용도 확인할게요.'):'추가로 말씀하신 내용을 선호 조건에 기록했어요.' },
    ])
    if(!question) setConditions(current => ({ ...current,preference: [current.preference,text].filter(Boolean).join('\n') }))
    setDraft('')
  }

  return (
    <AppLayout className="
  h-svh flex flex-col [&_button:disabled]:opacity-45 [&_button:disabled]:cursor-not-allowed max-[700px]:h-auto
  max-[700px]:min-h-svh
" variant="workspace">
      <main className="
  mx-auto grid min-h-0 w-full max-w-[1500px] flex-1 grid-cols-[minmax(0,1.45fr)_minmax(330px,1fr)]
  max-[900px]:grid-cols-[minmax(0,1.2fr)_minmax(290px,1fr)] max-[700px]:flex max-[700px]:flex-col
">
        <section className="
  flex min-h-0 flex-col border-r border-border px-[26px] pt-5 pb-6 max-[900px]:p-4 max-[700px]:h-[70svh]
  max-[700px]:min-h-[460px] max-[700px]:border-r-0 max-[700px]:border-b
" aria-label="조건 정리 대화">
          <div className="
  flex items-center justify-between gap-3 pb-[22px] text-xs text-text-secondary [&_a]:flex [&_a]:items-center
  [&_a]:gap-1.5 [&_a]:text-inherit [&_a]:no-underline max-[700px]:text-[11px]
"><Link to="/"><ArrowLeft size={16} /> 처음으로</Link><span>체험용 대화 · AI 연결 전</span></div>
          <div className="flex-1 overflow-y-auto pt-2 pr-2 pb-5">
            <div role="log" aria-live="polite" aria-relevant="additions">
              {messages.map((message,index) => <div className={`mb-[22px] flex items-start gap-3 [&.user]:justify-end ${message.role}`} key={index}>
                {message.role==='assistant'&&<span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-primary text-white"><InfinityIcon size={22} aria-label="두리번" /></span>}
                <p className="
  max-w-[84%] rounded-[0_18px_18px] bg-[#f5f6f8] px-[18px] py-4 text-sm leading-[1.85] whitespace-pre-wrap
  [overflow-wrap:anywhere] [.user_&]:bg-[#e5f8f1] [.user_&]:rounded-[18px_0_18px_18px] max-[700px]:max-w-[88%]
">{message.text}</p>
              </div>)}
            </div>
            {question&&<div className="
  mt-1 mb-6 ml-11 rounded-2xl border border-border p-5 [&>p]:mt-2 [&>p]:ml-[37px] [&>p]:text-[13px]
  [&>p]:leading-[1.7] [&>p]:text-text-secondary max-[900px]:ml-0
">
              <div className="
  flex items-center gap-2.5 [&>span]:grid [&>span]:size-[27px] [&>span]:shrink-0 [&>span]:place-items-center
  [&>span]:rounded-full [&>span]:bg-primary [&>span]:text-sm [&>span]:text-white [&_h2]:text-base
  [&_h2]:font-bold
"><span>{step+1}</span><h2>{question.question}</h2></div>
              <p>{question.hint}</p>
              <div className="
  flex flex-wrap gap-2 [&:not(:empty)]:mt-[18px] [&_button]:rounded-3xl [&_button]:border
  [&_button]:border-border [&_button]:bg-surface [&_button]:px-[17px] [&_button]:py-[9px]
  [&_button]:text-[13px] [&_button:hover]:border-primary [&_button:hover]:text-primary
  [&_button:hover]:bg-primary-light
">{question.options.map(option => <button key={option} onClick={() => send(option)}>{option}</button>)}</div>
            </div>}
            <div ref={endRef} />
          </div>
          <form className="
  flex items-center gap-4 rounded-[18px] border border-border px-4 py-[14px] shadow-[0_2px_8px_#11182703]
  focus-within:border-primary [&_textarea]:min-w-0 [&_textarea]:flex-1 [&_textarea]:resize-none
  [&_textarea]:outline-none [&_textarea]:text-sm [&_textarea]:leading-[1.6]
  [&_textarea]:placeholder:text-[#8995a7] [&>button]:grid [&>button]:size-11 [&>button]:shrink-0
  [&>button]:place-items-center [&>button]:rounded-full [&>button]:bg-primary [&>button]:text-white
" onSubmit={event => { event.preventDefault(); send(draft) }}>
            <label className="sr-only" htmlFor="chat-message">조건 입력</label>
            <textarea id="chat-message" rows={2} value={draft} onChange={event => setDraft(event.target.value)} placeholder={question?.placeholder??'추가로 원하는 조건을 말씀해주세요.'} />
            <button type="submit" disabled={!draft.trim()} aria-label="메시지 보내기"><ArrowRight size={23} /></button>
          </form>
        </section>
        <aside className="
  overflow-y-auto bg-[linear-gradient(135deg,#f9fbfa55,white)] p-7 max-[900px]:px-[18px] max-[900px]:py-[22px]
  max-[700px]:overflow-visible max-[700px]:px-5 max-[700px]:py-[26px]
" aria-labelledby="summary-title">
          <div className="
  flex items-start gap-3 [&>svg]:mt-[3px] [&>svg]:text-primary [&_h1]:text-[23px] [&_h1]:font-[750]
  [&_h1]:tracking-[-.04em] [&_p]:mt-[5px] [&_p]:text-[13px] [&_p]:text-text-secondary
"><Sparkles size={24} /><div><h1 id="summary-title">입력하신 조건</h1><p>대화에서 확인한 조건을 모아 보여드려요.</p></div></div>
          <div className="mt-6 mb-2.5 flex justify-between text-xs text-text-secondary"><span>조건 정리</span><span>{Object.values(conditions).filter(Boolean).length} / {fields.length}</span></div>
          <div className="flex flex-col gap-3">
            {fields.map(({ key,title,icon: Icon,placeholder },index) => <section className={`rounded-[15px] border border-[#e8edf0] bg-white px-[18px] py-4 shadow-[0_2px_5px_#11182702] [&>p]:mt-[14px] [&>p]:ml-[35px] [&>p]:text-sm [&>p]:leading-[1.7] [&>p]:whitespace-pre-wrap [&>p]:[overflow-wrap:anywhere] summary-card-${index}`} key={key}>
              <div className="
  flex items-center gap-3 [&>svg]:text-primary [.summary-card-0_&>svg]:text-[#2583ed]
  [.summary-card-2_&>svg]:text-[#f45a7c] [.summary-card-3_&>svg]:text-[#8451e5] [&_h2]:flex-1 [&_h2]:text-base
  [&_h2]:font-bold [&_button]:flex [&_button]:items-center [&_button]:gap-1 [&_button]:rounded-[18px]
  [&_button]:border [&_button]:border-border [&_button]:px-2.5 [&_button]:py-1 [&_button]:text-xs
  [&_button]:text-text-secondary
"><Icon size={23} /><h2>{title}</h2><button aria-label={`${title} 수정`} onClick={() => { setEditing(key); setEditValue(conditions[key]??'') }}><Pencil size={12} /> 수정</button></div>
              {editing===key? <form className="
  mt-[14px] [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-primary
  [&_textarea]:p-2.5 [&_textarea]:text-sm [&>div]:mt-2 [&>div]:flex [&>div]:justify-end [&>div]:gap-3
  [&_button]:flex [&_button]:items-center [&_button]:gap-1 [&_button]:p-1 [&_button]:text-[13px]
  [&_button[type=submit]]:text-primary
" onSubmit={event => {
                  event.preventDefault()
                  if(!editValue.trim()) return
                  setConditions(current => ({ ...current,[key]: editValue.trim() }))
                  setEditing(null)
                }}>
                <label className="sr-only" htmlFor={`edit-${key}`}>{title}</label>
                <textarea autoFocus id={`edit-${key}`} value={editValue} onChange={event => setEditValue(event.target.value)} placeholder={placeholder} rows={2} />
                <div><button type="button" onClick={() => setEditing(null)}>취소</button><button type="submit" disabled={!editValue.trim()}><Check size={14} /> 저장</button></div>
              </form>:<p className={conditions[key]? '':'text-[#8b96a5]'}>{conditions[key]||'아직 입력하지 않았어요'}</p>}
            </section>)}
          </div>
          <div className="
  mt-6 [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:justify-center [&>button]:gap-3
  [&>button]:rounded-[13px] [&>button]:bg-primary [&>button]:px-3 [&>button]:py-[15px] [&>button]:font-[650]
  [&>button]:text-white [&>button:enabled:hover]:bg-primary-hover
"><button disabled={fields.some(field => !conditions[field.key])||editing!==null} onClick={() => navigate('/recommendations',{ state: { condition: initial,conditions } })}><Sparkles size={19} /> 이 조건으로 추천받기 <ArrowRight size={20} /></button>
          </div>
        </aside>
      </main>
    </AppLayout>
  )
}
