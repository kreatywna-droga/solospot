import Link from 'next/link'

interface LogoProps {
  link?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Logo({ link = true, size = 'sm', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-7 sm:h-8',
    md: 'h-8 sm:h-9',
    lg: 'h-11 sm:h-12',
    xl: 'h-14 sm:h-16'
  }

  const content = (
    <div className={`flex items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-solospot.png?v=20260920-v4"
        alt="SOLOSPOT Logo"
        className={`${sizeClasses[size]} w-auto object-contain transition-all duration-300 group-hover:scale-105`}
      />
    </div>
  )

  if (link) {
    return <Link href="/" className="group inline-flex items-center">{content}</Link>
  }

  return content
}
