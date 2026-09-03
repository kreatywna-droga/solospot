'use client'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'

export function ContainerSection({ section, theme }: SectionComponentProps) {
  const config = ((section?.config || (section as any)?.props) ?? {}) as {
    padding?: string
    maxWidth?: string
    background?: string
  }

  const paddingMap: Record<string, string> = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12',
    xl: 'p-16',
  }
  const padding = paddingMap[config.padding ?? 'md'] ?? 'p-8'

  return (
    <div
      className={`w-full min-h-[60px] ${padding} border border-dashed border-white/10 rounded-lg`}
      style={{
        maxWidth: config.maxWidth || '1200px',
        margin: '0 auto',
        backgroundColor: config.background || 'transparent',
      }}
    >
      <div className="text-[10px] text-slate-600 text-center py-2">Container — add components inside</div>
    </div>
  )
}
