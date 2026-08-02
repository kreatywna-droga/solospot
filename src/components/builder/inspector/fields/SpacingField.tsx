'use client'

/**
 * SpacingField — C16.31 Spacing Editor (Sprint 5A)
 *
 * Custom field renderer for padding/margin properties.
 * Registered as type 'spacing' in PropertyRegistry.
 *
 * Features:
 *   - 4 input fields (top, right, bottom, left)
 *   - Link/unlink toggle (all sides together or separate)
 *   - Visual layout showing which side is which
 *   - Validation (0-500 range)
 *   - Keyboard navigation (Tab between fields)
 *
 * Architecture:
 *   SpacingField → onChange('padding', SpacingValue)
 *     → InspectorPanel.handlePropChange
 *       → dispatch(SET_SPACING)
 *
 * DESIGN DECISIONS:
 *   - SpacingValue is an object, not 4 separate fields (DR-LAYOUT-001)
 *   - linked=true: changing any side updates all 4
 *   - linked=false: each side is independent
 */

import { useCallback, useMemo } from 'react'
import { Link2, Link2Off } from 'lucide-react'
import type { FieldRendererProps } from '../../../../../packages/builder-core/src/PropertyRegistry'
import type { SpacingValue } from '../../../../../packages/builder-core/src/LayoutTypes'
import { validateSpacingValue } from '../../../../../packages/builder-core/src/LayoutTypes'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_SPACING: SpacingValue = { top: 0, right: 0, bottom: 0, left: 0, linked: true }

const SIDE_LABELS: Record<string, { label: string; short: string }> = {
  top:    { label: 'Top',    short: 'T' },
  right:  { label: 'Right',  short: 'R' },
  bottom: { label: 'Bottom', short: 'B' },
  left:   { label: 'Left',   short: 'L' },
}

const SIDE_ORDER = ['top', 'right', 'bottom', 'left'] as const

// ---------------------------------------------------------------------------
// SpacingField
// ---------------------------------------------------------------------------

export function SpacingField({ schema, value, onChange, error }: FieldRendererProps) {
  // Parse current value, fall back to defaults
  const spacing = useMemo((): SpacingValue => {
    if (value && typeof value === 'object') {
      const v = value as Record<string, unknown>
      return {
        top: typeof v.top === 'number' ? v.top : DEFAULT_SPACING.top,
        right: typeof v.right === 'number' ? v.right : DEFAULT_SPACING.right,
        bottom: typeof v.bottom === 'number' ? v.bottom : DEFAULT_SPACING.bottom,
        left: typeof v.left === 'number' ? v.left : DEFAULT_SPACING.left,
        linked: typeof v.linked === 'boolean' ? v.linked : DEFAULT_SPACING.linked,
      }
    }
    return DEFAULT_SPACING
  }, [value])

  // Toggle link/unlink
  const toggleLink = useCallback(() => {
    const newLinked = !spacing.linked
    if (newLinked) {
      // When linking, all sides take the value of the first non-zero, or top
      const refSide = spacing.top || spacing.right || spacing.bottom || spacing.left || 0
      onChange(schema.key, { ...spacing, top: refSide, right: refSide, bottom: refSide, left: refSide, linked: true })
    } else {
      onChange(schema.key, { ...spacing, linked: false })
    }
  }, [spacing, schema.key, onChange])

  // Handle change to a single side
  const handleSideChange = useCallback((side: string, rawValue: string) => {
    const numValue = rawValue === '' ? 0 : parseInt(rawValue, 10)
    if (isNaN(numValue)) return

    const clamped = Math.max(0, Math.min(500, numValue))

    if (spacing.linked) {
      // Linked: all sides change together
      onChange(schema.key, {
        ...spacing,
        top: clamped,
        right: clamped,
        bottom: clamped,
        left: clamped,
      })
    } else {
      // Unlinked: only this side changes
      onChange(schema.key, {
        ...spacing,
        [side]: clamped,
      })
    }
  }, [spacing, schema.key, onChange])

  // Validate
  const validation = useMemo(() => validateSpacingValue(spacing), [spacing])
  const displayError = error || (validation.valid ? null : validation.errors[0]?.message)

  return (
    <div>
      {/* Label */}
      <label className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {schema.label}
        </span>
        <button
          onClick={toggleLink}
          className={`p-1 rounded transition-colors ${
            spacing.linked
              ? 'text-violet-400 hover:text-violet-300 bg-violet-500/10'
              : 'text-slate-500 hover:text-white bg-white/5'
          }`}
          title={spacing.linked ? 'Unlink sides' : 'Link all sides'}
        >
          {spacing.linked
            ? <Link2 className="w-3.5 h-3.5" />
            : <Link2Off className="w-3.5 h-3.5" />
          }
        </button>
      </label>

      {/* 4-side editor grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {SIDE_ORDER.map(side => {
          const info = SIDE_LABELS[side]
          const val = spacing[side]
          return (
            <div key={side} className="relative">
              <input
                type="number"
                value={val}
                min={0}
                max={500}
                onChange={e => handleSideChange(side, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2
                           text-sm text-white text-center font-mono
                           focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30
                           [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                           [&::-webkit-inner-spin-button]:appearance-none
                           transition-all"
              />
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2
                             text-[9px] font-semibold text-slate-600 uppercase tracking-wider">
                {info.short}
              </span>
            </div>
          )
        })}
      </div>

      {/* Error message */}
      {displayError && (
        <p className="text-[11px] text-red-400 mt-1">{displayError}</p>
      )}

      {/* Description */}
      {schema.description && !displayError && (
        <p className="text-[11px] text-slate-600 mt-1">{schema.description}</p>
      )}
    </div>
  )
}

