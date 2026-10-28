import { useId, useState } from 'react'
import type { RefObject } from 'react'
import { MessageCircle, X } from 'lucide-react'

type Props = { dialogRef: RefObject<HTMLDialogElement | null> }

export default function LoginDialog({ dialogRef }: Props) {
  const titleId = useId()
  const usernameId = useId()
  const passwordId = useId()
  const noticeId = useId()
  const [notice, setNotice] = useState('')

  function showNotice(feature: string) {
    setNotice(`${feature} 기능을 준비하고 있어요.`)
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="m-auto max-h-[calc(100svh-32px)] w-[min(400px,calc(100%-32px))] overflow-y-auto rounded-[24px] border-0 bg-white p-0 text-[var(--text)] shadow-[var(--shadow-modal)] backdrop:bg-black/40"
      onClose={() => setNotice('')}
      onClick={event => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
          dialogRef.current?.close()
        }
      }}
    >
      <form className="relative flex flex-col gap-2.5 px-7 pb-7 pt-8 tracking-[-.03em] max-[380px]:px-5" onSubmit={event => { event.preventDefault(); showNotice('로그인') }}>
        <button type="button" className="absolute right-2.5 top-2.5 grid size-11 place-items-center rounded-[10px] text-[var(--muted-light)] hover:bg-gray-100 hover:text-gray-900" aria-label="로그인 창 닫기" onClick={() => dialogRef.current?.close()}><X size={20} /></button>
        <div className="mb-3 flex flex-col items-center gap-2.5">
          <svg className="h-[57px] w-11" viewBox="0 0 96 124" aria-hidden="true"><path d="M48 4C25 4 7 22 7 45c0 29 41 67 41 67s41-38 41-67C89 22 71 4 48 4z" fill="var(--g)" /><ellipse cx="34" cy="44" rx="12" ry="14" fill="white" /><ellipse cx="62" cy="44" rx="12" ry="14" fill="white" /><circle cx="36" cy="47" r="6.5" fill="#0B2A22" /><circle cx="64" cy="47" r="6.5" fill="#0B2A22" /></svg>
          <h2 id={titleId} className="text-[22px] font-extrabold tracking-[-.05em] text-[var(--ink)]">두리번 로그인</h2>
        </div>
        <label className="sr-only" htmlFor={usernameId}>아이디</label>
        <input id={usernameId} name="username" autoComplete="username" autoCapitalize="off" spellCheck={false} placeholder="아이디를 입력해 주세요" className="h-[50px] min-w-0 rounded-xl border-[1.5px] border-[var(--line-secondary)] bg-white px-4 text-[15px] text-[var(--ink)] placeholder:text-[var(--muted-light)] focus:border-[var(--g)] focus:outline-none focus:shadow-[0_0_0_1.5px_#059669]" />
        <label className="sr-only" htmlFor={passwordId}>비밀번호</label>
        <input id={passwordId} name="password" type="password" autoComplete="current-password" placeholder="비밀번호를 입력해 주세요" className="h-[50px] min-w-0 rounded-xl border-[1.5px] border-[var(--line-secondary)] bg-white px-4 text-[15px] text-[var(--ink)] placeholder:text-[var(--muted-light)] focus:border-[var(--g)] focus:outline-none focus:shadow-[0_0_0_1.5px_#059669]" />
        <p id={noticeId} role="status" aria-live="polite" className="empty:hidden text-[12.5px] leading-relaxed text-[#B45309]">{notice}</p>
        <button type="submit" className="mt-1.5 h-[52px] rounded-xl bg-[var(--gd)] text-base font-extrabold text-white hover:bg-[var(--hover)]">로그인</button>
        <button type="button" onClick={() => showNotice('회원가입')} className="h-[50px] rounded-xl border border-[#CFE3DA] bg-white text-[15px] font-bold text-[var(--gd)] hover:bg-[var(--gl)]">회원가입</button>
        <div className="mb-1 mt-3.5 flex items-center gap-2.5 text-[13px] text-[var(--muted-light)] before:h-px before:flex-1 before:bg-[var(--line)] after:h-px after:flex-1 after:bg-[var(--line)]">SNS 계정으로 간편하게 시작하기</div>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {[
            { name: '구글', mark: 'G', color: 'bg-[#F3F4F6] text-[#4B5563]' },
            { name: '네이버', mark: 'N', color: 'bg-[#03C75A] text-white' },
            { name: '카카오', mark: null, color: 'bg-[#FEE500] text-[#191919]' },
          ].map(service => <button key={service.name} type="button" onClick={() => showNotice(`${service.name} 로그인`)} className="group flex flex-col items-center gap-2.5 rounded-[14px] py-1.5">
            <span aria-hidden="true" className={`grid size-16 place-items-center rounded-full text-[28px] font-extrabold transition-transform group-hover:-translate-y-0.5 ${service.color}`}>{service.mark ?? <MessageCircle size={28} fill="currentColor" />}</span>
            <span className="whitespace-nowrap text-[13.5px] font-semibold">{service.name} 로그인</span>
          </button>)}
        </div>
        <div className="mt-3.5 flex items-center justify-center gap-3.5 border-t border-[var(--line)] pt-4 text-sm font-semibold text-[#374151]">
          <button type="button" className="min-h-11 hover:text-[var(--gd)]" onClick={() => showNotice('아이디 찾기')}>아이디 찾기</button>
          <span aria-hidden="true" className="h-[13px] w-px bg-gray-300" />
          <button type="button" className="min-h-11 hover:text-[var(--gd)]" onClick={() => showNotice('비밀번호 찾기')}>비밀번호 찾기</button>
        </div>
      </form>
    </dialog>
  )
}
