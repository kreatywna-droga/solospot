import Link from 'next/link'

interface LogoProps {
  link?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Logo({ link = true, size = 'sm', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-9 sm:h-10',
    md: 'h-13 sm:h-15',
    lg: 'h-16 sm:h-18',
    xl: 'h-20 sm:h-24'
  }

  const content = (
    <div className={`flex items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-solospot.png?v=20260920"
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
