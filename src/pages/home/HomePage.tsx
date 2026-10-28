import { useRef,useState } from 'react'
import { ArrowRight,ChevronRight,MessageCircle,Quote,Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'

const examples=[
  '여의도 회사, 수원 본가,\n월세 70만 원 이하로 살고 싶어요.',
  '강남 회사 주 5일 출근,\n연인 집은 홍대, 월세 80만 원 이하예요.',
  '서울대 통학 예정이고,\n본가는 대전이에요. 월세 60만 원 이하예요.',
]

export default function HomePage() {
  const [condition,setCondition]=useState('')
  const navigate=useNavigate()
  const inputRef=useRef<HTMLTextAreaElement>(null)

  function selectExample(example: string) {
    setCondition(example.replace('\n',' '))
    inputRef.current?.focus()
  }

  return (
    <AppLayout header={{ appearance: 'prototype' }} className="bg-white text-[var(--text)] tracking-[-.03em] break-keep [&_:focus-visible]:outline-[3px] [&_:focus-visible]:outline-[var(--g)] [&_:focus-visible]:outline-offset-[3px]">
      <main className="flex flex-1 flex-col justify-center px-8 pb-[clamp(56px,12vh,160px)] pt-[clamp(40px,9vh,120px)] max-[760px]:px-4 max-[760px]:pb-14 max-[760px]:pt-10">
        <section className="
  mx-auto mb-11 w-full max-w-[1200px] text-center
  [&_h1]:m-0 [&_h1]:text-[clamp(38px,4.4vw,60px)] [&_h1]:leading-[1.2] [&_h1]:tracking-[-.06em]
  [&_h1]:font-extrabold [&_h1]:text-[var(--ink)] [&_h1_span]:text-[var(--g)]
  [&_p]:mx-auto [&_p]:mt-5 [&_p]:max-w-[640px] [&_p]:text-[19px] [&_p]:leading-[1.7]
  [&_p]:text-[var(--muted)] [&_p]:tracking-[-.04em]
  max-[760px]:[&_h1]:text-[clamp(32px,9vw,40px)] max-[760px]:[&_p]:text-[15.5px] max-[760px]:[&_p]:mt-4
" aria-labelledby="home-title">
          <h1 id="home-title">어디에서<br /><span>살지 고민</span>이신가요?</h1>
          <p>회사, 학교, 본가, 연인, 친구 등 여러 생활거점과 예산을 고려해<br className="max-[760px]:hidden" /> 나에게 딱 맞는 동네를 찾아드려요.</p>
        </section>

        <form className="
  mx-auto flex w-full max-w-[880px] items-center gap-4 rounded-[20px] border-[1.5px] border-[var(--g)] bg-white py-5 pl-6 pr-5
  shadow-[0_16px_40px_rgba(5,150,105,.10)] transition-shadow focus-within:shadow-[0_0_0_1.5px_#059669,0_16px_40px_rgba(5,150,105,.14)]
  [&_textarea]:min-w-0 [&_textarea]:flex-1 [&_textarea]:h-[58px] [&_textarea]:resize-none
  [&_textarea]:border-0 [&_textarea]:outline-none [&_textarea]:bg-transparent [&_textarea]:text-[17px]
  [&_textarea]:leading-[1.7] [&_textarea]:tracking-[-.035em] [&_textarea]:text-[var(--ink)]
  [&_textarea]:placeholder:text-[var(--muted-light)] [&_textarea]:placeholder:opacity-100
  max-[760px]:items-end max-[760px]:gap-2.5 max-[760px]:rounded-[18px] max-[760px]:py-4 max-[760px]:pl-4 max-[760px]:pr-3.5
  max-[760px]:[&_textarea]:h-[84px] max-[760px]:[&_textarea]:text-base
" onSubmit={(event) => {
            event.preventDefault()
            if(!condition.trim()) return
            navigate('/consultation',{ state: { condition: condition.trim() } })
          }}>
          <MessageCircle className="size-7 shrink-0 self-center text-[var(--g)] max-[760px]:size-6" size={32} aria-hidden="true" />
          <label className="sr-only" htmlFor="condition">생활거점과 예산, 원하는 동네 조건</label>
          <textarea
            ref={inputRef}
            id="condition"
            value={condition}
            onKeyDown={event => {
              if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
              event.preventDefault()
              if (!event.repeat) event.currentTarget.form?.requestSubmit()
            }}
            onChange={(event) => { setCondition(event.target.value) }}
            placeholder={'어디에 자주 가시나요? 예산은 어느 정도예요?\n자연어로 자유롭게 입력해주세요.'}
          />
          <div className="flex shrink-0 flex-col items-center justify-center">
            <button className="
  grid size-[52px] place-items-center rounded-full border-0 bg-[var(--gd)] text-white transition
  enabled:hover:translate-x-0.5 enabled:hover:bg-[var(--hover)] disabled:cursor-not-allowed disabled:opacity-40
  max-[760px]:size-[46px]
" type="submit" disabled={!condition.trim()} aria-label="입력한 조건으로 시작하기"><ArrowRight size={26} strokeWidth={2.4} /></button>
          </div>
        </form>

        <section className="
  mx-auto mt-[26px] w-full max-w-[880px] [&_h2]:mb-3.5 [&_h2]:flex [&_h2]:items-center
  [&_h2]:gap-2.5 [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:text-[var(--ink)] [&_h2_svg]:text-[var(--g)]
" aria-labelledby="examples-title">
          <h2 id="examples-title"><Sparkles size={20} aria-hidden="true" /> 이런 예시로 시작해보세요!</h2>
          <div className="grid grid-cols-3 gap-3.5 max-[760px]:grid-cols-1 max-[760px]:gap-2.5">
            {examples.map((example) => (
              <button className="
  flex min-h-[76px] items-center gap-2.5 rounded-[40px] border border-[#D7EFE5] bg-[#F2FAF6] py-3.5 pl-[18px] pr-4 text-left
  transition-colors hover:border-[var(--g)] hover:bg-[var(--gl)] [&_span]:flex-1 [&_span]:whitespace-pre-line
  [&_span]:text-[13.5px] [&_span]:leading-[1.75] [&_span]:tracking-[-.04em] [&_svg]:shrink-0
  max-[760px]:min-h-11 max-[760px]:rounded-[18px] max-[760px]:[&_span]:whitespace-normal
" key={example} onClick={() => selectExample(example)}>
                <Quote className="mt-[3px] rotate-180 self-start fill-[var(--g)] text-[var(--g)]" size={18} aria-hidden="true" />
                <span>{example}</span>
                <ChevronRight className="text-[var(--muted-light)]" size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </main>

    </AppLayout>
  )
}
