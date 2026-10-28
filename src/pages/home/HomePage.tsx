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
    <AppLayout className="min-h-svh bg-[radial-gradient(ellipse_at_50%_66%,#ecfdf535,transparent_65%)]">
      <main className="mx-auto w-full max-w-[960px] px-6 pb-14 pt-[clamp(64px,10vh,104px)] max-[600px]:px-5 max-[600px]:pb-9 max-[600px]:pt-12">
        <section className="
  text-center [&_h1]:m-0 [&_h1]:text-[clamp(36px,4.4vw,58px)] [&_h1]:leading-[1.23] [&_h1]:tracking-[-.065em]
  [&_h1]:font-extrabold [&_h1]:text-[#091b27] [&_h1]:break-keep [&_h1_span]:text-primary [&_p]:mt-6 [&_p]:mb-8
  [&_p]:text-lg [&_p]:leading-[1.7] [&_p]:text-text-secondary [&_p]:tracking-[-.045em] [&_p]:break-keep
  max-[760px]:[&_p]:text-[17px] max-[600px]:[&_h1]:text-[clamp(32px,8vw,40px)] max-[600px]:[&_p]:text-[15px]
  max-[600px]:[&_p]:mt-5 max-[600px]:[&_p]:mb-7
" aria-labelledby="home-title">
          <h1 id="home-title">어디에서<br /><span>살지 고민</span>이신가요?</h1>
          <p>회사, 학교, 본가, 연인, 친구 등 여러 생활거점과 예산을 고려해<br className="max-[600px]:hidden" /> 나에게 딱 맞는 동네를 찾아드려요.</p>
        </section>

        <form className="
  flex min-h-[104px] items-center gap-[18px] rounded-2xl border border-primary bg-background p-[22px]
  shadow-[0_12px_40px_#05966908] transition-shadow focus-within:shadow-[0_0_0_3px_#05966920]
  [&_textarea]:min-w-0 [&_textarea]:flex-1 [&_textarea]:h-14 [&_textarea]:min-h-14 [&_textarea]:resize-y
  [&_textarea]:border-0 [&_textarea]:outline-none [&_textarea]:bg-transparent [&_textarea]:text-[17px]
  [&_textarea]:leading-[1.65] [&_textarea]:tracking-[-.035em] [&_textarea]:placeholder:text-text-secondary
  max-[600px]:gap-3 max-[600px]:p-[18px] max-[600px]:[&_textarea]:h-20 max-[600px]:[&_textarea]:min-h-20
  max-[600px]:[&_textarea]:text-base
" onSubmit={(event) => {
            event.preventDefault()
            if(!condition.trim()) return
            navigate('/consultation',{ state: { condition: condition.trim() } })
          }}>
          <MessageCircle className="size-[26px] shrink-0 text-primary max-[600px]:w-6" size={32} aria-hidden="true" />
          <label className="sr-only" htmlFor="condition">생활거점과 예산, 원하는 동네 조건</label>
          <textarea
            ref={inputRef}
            id="condition"
            value={condition}
            onChange={(event) => { setCondition(event.target.value) }}
            placeholder={'어디에 자주 가시나요? 예산은 어느 정도예요?\n자연어로 자유롭게 입력해주세요.'}
          />
          <div className="flex shrink-0 flex-col items-center justify-center">
            <button className="
  grid size-[50px] place-items-center rounded-full border-0 bg-primary text-white transition
  enabled:hover:translate-x-0.5 enabled:hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50
  max-[600px]:size-[46px]
" type="submit" disabled={!condition.trim()} aria-label="입력한 조건으로 시작하기"><ArrowRight size={30} /></button>
          </div>
        </form>

        <section className="
  mt-7 [&_h2]:mb-[14px] [&_h2]:flex [&_h2]:items-center [&_h2]:gap-3 [&_h2]:text-[15px] [&_h2]:font-semibold
  [&_h2_svg]:text-primary
" aria-labelledby="examples-title">
          <h2 id="examples-title"><Sparkles size={22} aria-hidden="true" /> 이런 예시로 시작해보세요!</h2>
          <div className="grid grid-cols-3 gap-[14px] max-[760px]:grid-cols-1">
            {examples.map((example) => (
              <button className="
  flex items-center gap-2.5 rounded-[48px] border border-transparent bg-[#f2faf7] p-4 text-left
  transition-colors hover:border-primary hover:bg-primary-light [&_span]:flex-1 [&_span]:whitespace-pre-line
  [&_span]:text-[13px] [&_span]:leading-[1.8] [&_span]:tracking-[-.04em] [&_span]:break-keep [&_svg]:shrink-0
  max-[760px]:rounded-[18px] max-[760px]:[&_span]:whitespace-normal
" key={example} onClick={() => selectExample(example)}>
                <Quote className="mt-1 rotate-180 self-start fill-primary text-primary" size={21} aria-hidden="true" />
                <span>{example}</span>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </main>

    </AppLayout>
  )
}
