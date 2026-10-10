import { useRef, useState } from 'react'
import { ArrowRight, ChevronRight, MessageCircle, Quote, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import './HomePage.css'

const examples = [
  '여의도 회사, 수원 본가,\n월세 70만 원 이하로 살고 싶어요.',
  '강남 회사 주 5일 출근,\n연인 집은 홍대, 월세 80만 원 이하예요.',
  '서울대 통학 예정이고,\n본가는 대전이에요. 월세 60만 원 이하예요.',
]

export default function HomePage() {
  const [condition, setCondition] = useState('')
  const navigate = useNavigate()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function selectExample(example: string) {
    setCondition(example.replace('\n', ' '))
    inputRef.current?.focus()
  }

  return (
    <div className="home-page">
      <Header />
      <main className="home-main">
        <section className="home-intro" aria-labelledby="home-title">
          <h1 id="home-title">어디에서<br /><span>살지 고민</span>이신가요?</h1>
          <p>회사, 학교, 본가, 연인, 친구 등 여러 생활거점과 예산을 고려해<br className="desktop-break" /> 나에게 딱 맞는 동네를 찾아드려요.</p>
        </section>

        <form className="condition-form" onSubmit={(event) => {
          event.preventDefault()
          if (!condition.trim()) return
          navigate('/consultation', { state: { condition: condition.trim() } })
        }}>
          <MessageCircle className="input-icon" size={32} aria-hidden="true" />
          <label className="sr-only" htmlFor="condition">생활거점과 예산, 원하는 동네 조건</label>
          <textarea
            ref={inputRef}
            id="condition"
            value={condition}
            onChange={(event) => { setCondition(event.target.value) }}
            placeholder={'어디에 자주 가시나요? 예산은 어느 정도예요?\n자연어로 자유롭게 입력해주세요.'}
          />
          <div className="input-actions">
            <button className="submit-condition" type="submit" disabled={!condition.trim()} aria-label="입력한 조건으로 시작하기"><ArrowRight size={30} /></button>
          </div>
        </form>

        <section className="examples" aria-labelledby="examples-title">
          <h2 id="examples-title"><Sparkles size={22} aria-hidden="true" /> 이런 예시로 시작해보세요!</h2>
          <div className="example-grid">
            {examples.map((example) => (
              <button className="example-card" key={example} onClick={() => selectExample(example)}>
                <Quote className="quote-icon" size={21} aria-hidden="true" />
                <span>{example}</span>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </main>

    </div>
  )
}
