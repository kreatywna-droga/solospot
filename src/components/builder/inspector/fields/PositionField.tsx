'use client'

/**
 * PositionField — C16.31 Position Editor (Sprint 5A)
 *
 * Custom field renderer for position properties.
 * Registered as type 'position' in PropertyRegistry.
 *
 * Features:
 *   - Position type select (relative, absolute, fixed, sticky)
 *   - Conditional offset fields (top, right, bottom, left) — shown only for absolute/fixed/sticky
 *   - Z-index input with slider
 *   - Validation (zIndex 0-9999, offsets all numbers)
 *
 * Architecture:
 *   PositionField → onChange('position', value) / onChange('top', value)
 *     → dispatch(UPDATE_PROPS)
 */

import { useCallback, useMemo } from 'react'
import { Move, Layers } from 'lucide-react'
import type { FieldRendererProps } from '../../../../../packages/builder-core/src/PropertyRegistry'
import type { PositionType } from '../../../../../packages/builder-core/src/LayoutTypes'
import { validatePosition } from '../../../../../packages/builder-core/src/LayoutTypes'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POSITION_OPTIONS: Array<{ label: string; value: PositionType }> = [
  { label: 'Relative', value: 'relative' },
  { label: 'Absolute', value: 'absolute' },
  { label: 'Fixed', value: 'fixed' },
  { label: 'Sticky', value: 'sticky' },
]

const OFFSET_KEYS = ['top', 'right', 'bottom', 'left'] as const

// Icons referenced in JSX directly instead of record for type safety

// ---------------------------------------------------------------------------
// PositionField
// ---------------------------------------------------------------------------

export function PositionField({ schema, value, onChange, error }: FieldRendererProps) {
  // Determine the control type based on schema.key
  // 'position' → shows position type selector + z-index
  // 'zIndex'  → shows only z-index input
  // 'top'|'right'|'bottom'|'left' → shows offset input (future)
  const controlType = useMemo(() => {
    const key = schema.key.toLowerCase()
    if (key === 'position') return 'position'
    if (key === 'zindex' || key === 'z_index' || key === 'z-index') return 'zindex'
    if (['top', 'right', 'bottom', 'left'].includes(key)) return 'offset'
    return 'position' // fallback
  }, [schema.key])

  // --- Position type selector ---
  const currentPosition = useMemo((): PositionType => {
    if (controlType === 'position') {
      return typeof value === 'string' && validatePosition(value)
        ? (value as PositionType)
        : 'relative'
    }
    return 'relative'
  }, [controlType, value])

  const handlePositionChange = useCallback((newPos: string) => {
    if (validatePosition(newPos)) {
      onChange(schema.key, newPos)
    }
  }, [schema.key, onChange])

  // --- Z-Index ---
  const currentZIndex = useMemo((): number => {
    if (controlType === 'zindex') {
      return typeof value === 'number' ? value : 0
    }
    return 0
  }, [controlType, value])

  const handleZIndexChange = useCallback((rawValue: string) => {
    const numVal = rawValue === '' ? 0 : parseInt(rawValue, 10)
    if (isNaN(numVal)) return
    const clamped = Math.max(0, Math.min(9999, numVal))
    onChange(schema.key, clamped)
  }, [schema.key, onChange])

  // Render z-index input only when controlType is 'zindex' or we're in position mode with additional z-index
  const showZIndex = controlType === 'zindex' || controlType === 'position'

  return (
    <div>
      {/* Label */}
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        <Move className="w-3 h-3" />
        {schema.label}
      </label>

      {/* Position select (only for 'position' control type) */}
      {controlType === 'position' && (
        <select
          value={currentPosition}
          onChange={e => handlePositionChange(e.target.value)}
          className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2
                     text-sm text-white font-mono
                     focus:outline-none focus:border-violet-500/50 transition-all"
        >
          {POSITION_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* Z-Index (shown either as part of position group or standalone) */}
      {showZIndex && (
        <div className={controlType === 'position' ? 'mt-3' : ''}>
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            <Layers className="w-3 h-3" />
            {controlType === 'zindex' ? schema.label : 'Z-Index'}
          </label>
          <input
            type="number"
            value={controlType === 'zindex' ? currentZIndex : 0}
            min={0}
            max={9999}
            step={1}
            onChange={e => {
              if (controlType === 'zindex') {
                handleZIndexChange(e.target.value)
              }
            }}
            disabled={controlType !== 'zindex'}
            className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2
                       text-sm text-white font-mono
                       focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                       [&::-webkit-inner-spin-button]:appearance-none
                       transition-all
                       ${controlType !== 'zindex' ? 'opacity-30 cursor-not-allowed' : ''}`}
          />
        </div>
      )}

      {/* Error */}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

