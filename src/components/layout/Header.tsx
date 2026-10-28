import { useEffect,useId,useRef,useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import LoginDialog from './LoginDialog'
import { Bookmark,ChevronDown,History,Infinity as InfinityIcon,LogOut,Settings,User,X } from 'lucide-react'

export type HeaderUser={ name: string; avatarUrl?: string }
export type HeaderProps={
  appearance?: 'default'|'prototype'
  children?: ReactNode
  action?: ReactNode
  user?: HeaderUser|null
  onLogin?: () => void
  onLogout?: () => void
  onAccount?: () => void
  onSaved?: () => void
  onHistory?: () => void
  onSettings?: () => void
}

export default function Header({ appearance='default',children,action,user,onLogin,onLogout,onAccount,onSaved,onHistory,onSettings }: HeaderProps) {
  const [open,setOpen]=useState(false)
  const menuId=useId()
  const menuRef=useRef<HTMLDivElement>(null)
  const triggerRef=useRef<HTMLButtonElement>(null)
  const dialogRef=useRef<HTMLDialogElement>(null)
  const dialogTitle=useId()
  useEffect(() => {
    if(!open) return
    function dismiss(event: PointerEvent) {
      if(event.target instanceof Node&&!menuRef.current?.contains(event.target)) setOpen(false)
    }
    function escape(event: KeyboardEvent) {
      if(event.key==='Escape') { setOpen(false); triggerRef.current?.focus() }
    }
    document.addEventListener('pointerdown',dismiss)
    document.addEventListener('keydown',escape)
    return () => { document.removeEventListener('pointerdown',dismiss); document.removeEventListener('keydown',escape) }
  },[open])
  const items=[
    { label: '내 계정',icon: User,callback: onAccount },
    { label: '저장한 동네',icon: Bookmark,callback: onSaved },
    { label: '이전 추천 기록',icon: History,callback: onHistory },
    { label: '계정 설정',icon: Settings,callback: onSettings },
    { label: '로그아웃',icon: LogOut,callback: onLogout },
  ]
  return <header className={appearance==='prototype'? "sticky top-0 z-50 flex h-[var(--header-height)] shrink-0 items-center gap-2 bg-[var(--header-background)] px-[clamp(20px,2.6vw,40px)] backdrop-blur-[10px] max-[760px]:h-auto max-[760px]:min-h-[52px] max-[760px]:px-4 max-[760px]:pt-1.5 max-[760px]:pb-0.5 [&>a]:min-h-11 [&>a]:gap-[9px] [&>a]:tracking-[-.06em] [&>a]:text-[var(--ink)] max-[760px]:[&>a]:gap-[7px] max-[760px]:[&>a]:text-[21px] [&>div>button]:min-h-11 [&>div>button]:px-[18px] [&>div>button]:py-0 [&>div>button]:font-semibold [&>div>button]:text-[var(--gd)] max-[760px]:[&>div>button]:px-[15px] max-[760px]:[&>div>button]:text-[13.5px]": `
  relative z-20 flex h-16 shrink-0 items-center gap-12 border-b border-border bg-background px-[34px]
  max-[760px]:gap-[18px] max-[760px]:px-[18px] max-[380px]:gap-3 max-[380px]:px-[14px]
`}>
    <Link className="inline-flex shrink-0 items-center gap-2.5 text-[23px] font-extrabold tracking-[-1.5px] text-text-primary no-underline" to="/" aria-label="두리번 홈">{appearance==='prototype'? <svg className="h-[34px] w-[26px] shrink-0 max-[760px]:h-[30px] max-[760px]:w-[23px]" viewBox="0 0 96 124" aria-hidden="true"><path d="M48 4C25 4 7 22 7 45c0 29 41 67 41 67s41-38 41-67C89 22 71 4 48 4z" fill="var(--g)" /><ellipse cx="34" cy="44" rx="12" ry="14" fill="#fff" /><ellipse cx="62" cy="44" rx="12" ry="14" fill="#fff" /><circle cx="36" cy="47" r="6.5" fill="#0B2A22" /><circle cx="64" cy="47" r="6.5" fill="#0B2A22" /></svg>:<span className="
  grid h-8 w-[26px] -rotate-45 place-items-center rounded-[55%_55%_55%_8%] bg-primary text-white
  [&_svg]:size-[19px] [&_svg]:rotate-45
"><InfinityIcon size={19} strokeWidth={3} aria-hidden="true" /></span>}<span>두리번</span></Link>
    {children&&<nav className="
  flex min-w-0 items-center gap-3 text-[13px] text-[#52627a] [&_a]:inline-flex [&_a]:items-center [&_a]:gap-2
  max-[760px]:text-[11px] max-[380px]:[&_a]:gap-1
" aria-label="페이지 이동">{children}</nav>}
    <div className="ml-auto shrink-0">{action??(user? <div className="relative" ref={menuRef} onBlur={event => {
      if(!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
    }}>
      <button className="flex items-center gap-2 p-1 text-sm" ref={triggerRef} aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(value => !value)}>
        <span className="grid size-[34px] place-items-center overflow-hidden rounded-full bg-[#e0f3ee] text-primary [&_img]:size-full [&_img]:object-cover">{user.avatarUrl? <img src={user.avatarUrl} alt="" />:<User size={19} />}</span><span className="max-w-[110px] truncate max-[760px]:max-w-16 max-[380px]:hidden">{user.name}</span><ChevronDown size={16} aria-hidden="true" />
      </button>
      {open&&<div id={menuId} className="
  absolute right-0 top-[calc(100%+12px)] w-[200px] rounded-2xl border border-border bg-white p-[9px]
  shadow-[0_12px_40px_#11182712] [&_button]:flex [&_button]:w-full [&_button]:items-center [&_button]:gap-3
  [&_button]:rounded-lg [&_button]:p-3 [&_button]:text-left [&_button]:text-sm
  [&_button:enabled:hover]:bg-primary-light [&_button:disabled]:cursor-not-allowed
  [&_button:disabled]:opacity-45 [&_button:last-child]:text-error [&_button:nth-child(4)]:mt-[5px]
  [&_button:nth-child(4)]:rounded-none [&_button:nth-child(4)]:border-t [&_button:nth-child(4)]:border-border
" aria-label="사용자 메뉴">{items.map(({ label,icon: Icon,callback }) => <button key={label} disabled={!callback} title={!callback? '준비 중':undefined} onClick={() => { setOpen(false); callback?.() }}><Icon size={18} aria-hidden="true" />{label}</button>)}</div>}
    </div>:<button className="
  rounded-full border border-primary bg-background px-5 py-[7px] text-sm font-medium text-primary
  transition-colors hover:bg-primary-light hover:text-primary-hover max-[760px]:px-3 max-[760px]:py-1.5
" onClick={() => onLogin? onLogin():dialogRef.current?.showModal()}>로그인</button>)}</div>
    {appearance==='prototype'? <LoginDialog dialogRef={dialogRef} />:<dialog className="
  m-auto w-[min(420px,calc(100%-32px))] rounded-[20px] border border-border p-8 backdrop:bg-[#11182755]
  [&_h2]:pr-3 [&_h2]:text-lg [&_h2]:font-bold [&_p]:mt-3 [&_p]:text-sm [&_p]:leading-[1.7]
  [&_p]:text-text-secondary
" ref={dialogRef} aria-labelledby={dialogTitle} onClick={event => { if(event.target===event.currentTarget) dialogRef.current?.close() }}>
      <button className="absolute right-2.5 top-2.5 p-[5px]" aria-label="닫기" onClick={() => dialogRef.current?.close()}><X size={20} /></button><h2 id={dialogTitle}>로그인 기능을 준비하고 있어요</h2><p>로그인 없이도 동네 추천 화면을 둘러볼 수 있어요.</p><button className="mt-6 w-full rounded-[10px] bg-primary p-2.5 text-white" onClick={() => dialogRef.current?.close()}>확인</button>
    </dialog>}
  </header>
}
