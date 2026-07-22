import Link from 'next/link'

interface LogoProps {
  link?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ link = true, size = 'sm', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: {
      wrapper: 'w-10 h-10',
      text: 'text-base gap-2.5'
    },
    md: {
      wrapper: 'w-12 h-12',
      text: 'text-xl gap-3'
    },
    lg: {
      wrapper: 'w-16 h-16',
      text: 'text-3xl gap-4'
    }
  }

  const content = (
    <div className={`flex items-center ${sizeClasses[size].text} ${className}`}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slow-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-slow-spin {
          animation: slow-spin 25s linear infinite;
        }
        .text-gradient-pronounced {
          background: linear-gradient(to bottom, #ffffff 30%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
        }
      `}} />
      <div className={`relative flex items-center justify-center group ${sizeClasses[size].wrapper}`}>
        {/* Background glow removed entirely */}
        
        {/* Holographic 3D floating crystal wrapped in neon S-ribbon with slow spin (No glow, thick lines) */}
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          className="w-full h-full relative z-10 animate-slow-spin transition-all duration-750 group-hover:scale-110"
        >
          <defs>
            {/* Gradients for glass structure */}
            <linearGradient id="glass-grad-top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="glass-grad-left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="glass-grad-right" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.05" />
            </linearGradient>

            {/* Glowing neon S ribbon gradients */}
            <linearGradient id="neon-s-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Outer Glass Crystal Hexagon Frame (Isometric view with thick lines) */}
          {/* Back edges (internal structure) */}
          <line x1="50" y1="88" x2="50" y2="48" stroke="#ffffff" strokeOpacity="0.25" strokeDasharray="2 2" strokeWidth="2" />
          <line x1="20" y1="68" x2="50" y2="48" stroke="#ffffff" strokeOpacity="0.25" strokeDasharray="2 2" strokeWidth="2" />
          <line x1="80" y1="68" x2="50" y2="48" stroke="#ffffff" strokeOpacity="0.25" strokeDasharray="2 2" strokeWidth="2" />

          {/* Floating Ribbon around core (Drawn behind front glass for depth) */}
          <path 
            d="M 32,58 C 30,50 40,36 50,36 C 60,36 68,44 68,48" 
            stroke="url(#neon-s-grad)" 
            strokeWidth="4.5" 
            strokeLinecap="round" 
            strokeOpacity="0.75"
          />

          {/* Left Face (Glass) */}
          <polygon 
            points="20,32 50,48 50,88 20,72" 
            fill="url(#glass-grad-left)" 
            stroke="#ffffff" 
            strokeWidth="2.5" 
            strokeOpacity="0.4" 
            strokeLinejoin="round" 
          />

          {/* Right Face (Glass) */}
          <polygon 
            points="50,48 80,32 80,72 50,88" 
            fill="url(#glass-grad-right)" 
            stroke="#ffffff" 
            strokeWidth="2.5" 
            strokeOpacity="0.35" 
            strokeLinejoin="round" 
          />

          {/* Top Face (Glass Cap) */}
          <polygon 
            points="50,48 80,32 50,16 20,32" 
            fill="url(#glass-grad-top)" 
            stroke="#ffffff" 
            strokeWidth="3" 
            strokeOpacity="0.6" 
            strokeLinejoin="round" 
          />

          {/* Front part of Ribbon (drawn in front of glass for 3D overlay effect, no shadow) */}
          <path 
            d="M 32,58 C 32,64 40,72 50,72 C 62,72 70,58 68,48 C 66,42 62,38 58,38" 
            stroke="url(#neon-s-grad)" 
            strokeWidth="5" 
            strokeLinecap="round" 
          />
          {/* White reflection line on S-Ribbon */}
          <path 
            d="M 34,58 C 34,62 40,70 50,70 C 60,70 66,58 66,48" 
            stroke="#ffffff" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeOpacity="0.7"
          />
        </svg>
      </div>
      
      {/* SOLOSPOT: Uppercase, vertical gradient, Impact font */}
      <span 
        className="uppercase text-gradient-pronounced group-hover:opacity-90 transition-opacity"
        style={{ 
          fontFamily: 'Impact, Charcoal, sans-serif',
          letterSpacing: '0.04em',
          fontWeight: 'normal'
        }}
      >
        SOLOSPOT
      </span>
    </div>
  )

  if (link) {
    return <Link href="/" className="group">{content}</Link>
  }

  return content
}
