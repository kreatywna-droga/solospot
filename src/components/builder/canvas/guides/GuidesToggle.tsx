'use client'

/**
 * GuidesToggle — C16.19 Smart Guides Toggle (Sprint 6B)
 *
 * A small toggle button in the bottom toolbar that controls
 * whether smart guides are shown on the canvas.
 *
 * DESIGN DECISIONS:
 *   - Minimal UI — icon-only button with tooltip
 *   - Controlled component — state lives in BuilderContext or parent
 *   - Tooltip shows guide count when active (optional)
 */

import React from 'react'
import { Ruler } from 'lucide-react'

interface GuidesToggleProps {
  /** Whether guides are currently enabled */
  enabled: boolean
  /** Callback when toggle changes */
  onChange: (enabled: boolean) => void
  /** Optional count of active guides (shown in tooltip) */
  activeGuideCount?: number
  /** Size variant */
  size?: 'sm' | 'md'
}

export function GuidesToggle({
  enabled,
  onChange,
  activeGuideCount = 0,
  size = 'sm',
}: GuidesToggleProps) {
  const sizeClass = size === 'sm' ? 'p-1.5' : 'p-2'
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative ${sizeClass} rounded-lg transition-all duration-150 ${
        enabled
          ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
      }`}
      title={
        enabled
          ? `Wyłącz prowadnice${activeGuideCount > 0 ? ` (${activeGuideCount} aktywnych)` : ''}`
          : 'Włącz prowadnice'
      }
    >
      <Ruler className={iconSize} />

      {/* Active indicator dot */}
      {enabled && activeGuideCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-violet-400 rounded-full" />
      )}
    </button>
  )
}
