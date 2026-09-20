import Link from 'next/link'

interface LogoProps {
  link?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ link = true, size = 'sm', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-10',
    md: 'h-12',
    lg: 'h-16'
  }

  const content = (
    <div className={`flex items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-solo-spot-new.png"
        alt="SOLOSPOT Logo"
        className={`${sizeClasses[size]} w-auto object-contain transition-all duration-300 group-hover:scale-105`}
      />
    </div>
  )

  if (link) {
    return <Link href="/" className="group">{content}</Link>
  }

  return content
}
