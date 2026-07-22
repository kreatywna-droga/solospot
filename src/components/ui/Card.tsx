import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function Card({ hover, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/5 bg-[#080a12] p-6
        ${hover ? 'hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-200' : ''}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mt-4 flex items-center gap-3 ${className}`} {...props}>
      {children}
    </div>
  )
}
