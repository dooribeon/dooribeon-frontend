import type { ReactNode } from 'react'
import { Infinity as InfinityIcon } from 'lucide-react'

export default function Header({ children, action }: { children?: ReactNode; action?: ReactNode }) {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="두리번 홈">
        <span className="brand-pin"><InfinityIcon size={26} strokeWidth={3} /></span>
        <span>두리번</span>
      </a>
      {children}
      {action ?? <button className="login-button" type="button">로그인</button>}
    </header>
  )
}
