import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-10 ${className}`}>
      {children}
    </div>
  )
}
