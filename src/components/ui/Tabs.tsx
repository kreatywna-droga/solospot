'use client'

import type { ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 border-b border-white/5 ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px
              ${isActive
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-500/30'
              }`}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
