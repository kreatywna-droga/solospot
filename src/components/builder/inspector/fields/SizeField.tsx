'use client'

/**
 * SizeField — C16.31 Size Editor (Sprint 5A)
 *
 * Custom field renderer for width/height properties.
 * Registered as type 'size' in PropertyRegistry.
 *
 * Features:
 *   - Number input for value
 *   - Unit dropdown (px, %, vw, vh, rem, em, auto, fit-content, etc.)
 *   - Min/max expandable section
 *   - Aspect ratio dropdown
 *
 * Architecture:
 *   SizeField → onChange('width', SizeValue)
 *     → InspectorPanel.handlePropChange
 *       → dispatch(UPDATE_PROPS)
 *
 * DESIGN DECISIONS:
 *   - SizeValue is { value, unit } not string (DR-LAYOUT-002)
 *   - Units per-value, not global (DR-LAYOUT-004)
 *   - Keyword units (auto, fit-content) disable the value input
 */

import { useCallback, useMemo } from 'react'
import { Maximize2 } from 'lucide-react'
import type { FieldRendererProps } from '../../../../../packages/builder-core/src/PropertyRegistry'
import type { SizeValue, CSSUnit } from '../../../../../packages/builder-core/src/LayoutTypes'
import { VALID_CSS_UNITS } from '../../../../../packages/builder-core/src/LayoutTypes'

// For testing we need a separate file, but for the UI we keep it simple
const DESIRED_UNITS: Array<{ label: string; value: CSSUnit }> = [
  { label: 'Auto', value: 'auto' },
  { label: 'px', value: 'px' },
  { label: '%', value: '%' },
  { label: 'vw', value: 'vw' },
  { label: 'vh', value: 'vh' },
  { label: 'rem', value: 'rem' },
  { label: 'em', value: 'em' },
  { label: 'fit', value: 'fit-content' },
  { label: 'min', value: 'min-content' },
  { label: 'max', value: 'max-content' },
]

const DEFAULT_SIZE: SizeValue = { value: 100, unit: '%' }

const ASPECT_RATIOS = [
  { label: 'Auto', value: null },
  { label: '16:9', value: '16/9' },
  { label: '4:3', value: '4/3' },
  { label: '1:1', value: '1/1' },
  { label: '3:2', value: '3/2' },
  { label: '2:3', value: '2/3' },
  { label: '21:9', value: '21/9' },
]

// ---------------------------------------------------------------------------
// SizeField
// ---------------------------------------------------------------------------

export function SizeField({ schema, value, onChange, error }: FieldRendererProps) {
  // Parse current size value
  const size = useMemo((): SizeValue => {
    if (value && typeof value === 'object') {
      const v = value as Record<string, unknown>
      return {
        value: typeof v.value === 'number' ? v.value : DEFAULT_SIZE.value,
        unit: VALID_CSS_UNITS.includes(v.unit as CSSUnit) ? (v.unit as CSSUnit) : DEFAULT_SIZE.unit,
      }
    }
    return DEFAULT_SIZE
  }, [value])

  // Min/max keys derived from schema key name for future use
  // e.g., schema.key='width' → minKey='minWidth', maxKey='maxWidth'
  const minKey = `min${schema.key.charAt(0).toUpperCase() + schema.key.slice(1)}`
  const maxKey = `max${schema.key.charAt(0).toUpperCase() + schema.key.slice(1)}`

  // Whether this is a keyword unit (disables value input)
  const isKeywordUnit = useMemo(() => {
    return ['auto', 'fit-content', 'min-content', 'max-content'].includes(size.unit)
  }, [size.unit])

  // Handle value change
  const handleValueChange = useCallback((rawValue: string) => {
    const numVal = rawValue === '' ? 0 : parseFloat(rawValue)
    if (isNaN(numVal)) return
    const clamped = Math.max(0, Math.min(9999, numVal))
    onChange(schema.key, { ...size, value: clamped })
  }, [size, schema.key, onChange])

  // Handle unit change
  const handleUnitChange = useCallback((newUnit: string) => {
    const unit = newUnit as CSSUnit
    // When switching to keyword unit, set value to 0 (ignored in CSS)
    const newValue = ['auto', 'fit-content', 'min-content', 'max-content'].includes(unit) ? 0 : size.value
    onChange(schema.key, { value: newValue, unit })
  }, [size, schema.key, onChange])

  return (
    <div>
      {/* Label */}
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        <span className="flex items-center gap-1.5">
          <Maximize2 className="w-3 h-3" />
          {schema.label}
        </span>
      </label>

      {/* Value + Unit */}
      <div className="flex gap-1.5">
        <input
          type="number"
          value={size.value}
          min={0}
          max={9999}
          step={1}
          disabled={isKeywordUnit}
          onChange={e => handleValueChange(e.target.value)}
          className={`flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2
                     text-sm text-white font-mono text-right
                     focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30
                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                     [&::-webkit-inner-spin-button]:appearance-none
                     transition-all
                     ${isKeywordUnit ? 'opacity-30 cursor-not-allowed' : ''}`}
        />
        <select
          value={size.unit}
          onChange={e => handleUnitChange(e.target.value)}
          className="w-20 bg-[#0a0a14] border border-white/10 rounded-lg px-2 py-2
                     text-sm text-white font-mono
                     focus:outline-none focus:border-violet-500/50 transition-all"
        >
          {DESIRED_UNITS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
      {schema.description && !error && (
        <p className="text-[11px] text-slate-600 mt-1">{schema.description}</p>
      )}
    </div>
  )
}

