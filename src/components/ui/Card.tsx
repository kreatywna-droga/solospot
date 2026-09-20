import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function Card({ hover, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#0D1118]/85 backdrop-blur-md p-6
        ${hover ? 'hover:border-[#D9A86C]/30 hover:shadow-lg hover:shadow-[#D9A86C]/5 transition-all duration-200' : ''}
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
