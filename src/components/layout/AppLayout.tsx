import type { ReactNode } from 'react'
import Header from './Header'
import type { HeaderProps } from './Header'

type Props={
  children: ReactNode
  className?: string
  variant?: 'page'|'workspace'
  header?: HeaderProps
}

export default function AppLayout({ children,className='',variant='page',header }: Props) {
  return <div className={`min-h-svh flex flex-col ${variant==='workspace'? 'h-svh max-[760px]:h-auto':''} ${className}`}>
    <Header {...header} />
    {children}
  </div>
}
