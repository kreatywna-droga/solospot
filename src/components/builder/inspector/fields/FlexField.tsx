'use client'

/**
 * FlexField — C16.31 Flex Container Editor (Sprint 5A)
 *
 * Custom field renderer for flex container properties.
 * Registered as type 'flex' in PropertyRegistry.
 *
 * Features:
 *   - Display mode select (BLOCK, FLEX, GRID, ABSOLUTE, NONE)
 *   - Flex direction (row, column, row-reverse, column-reverse)
 *   - Flex wrap (nowrap, wrap, wrap-reverse)
 *   - Justify content + Align items (with icons)
 *   - Gap input
 *
 * Architecture:
 *   FlexField → onChange('display', value) / onChange('flexDirection', value)
 *     → dispatch(UPDATE_PROPS)
 *
 * Each property is registered separately in the Layout section schema,
 * not as one monolithic 'flex' type. This component is NOT currently
 * registered — the individual properties use standard select/number fields.
 *
 * However! We provide FlexField as a registered 'flex' renderer for
 * future use when a compact "Flex Config" widget is desired (combining
 * multiple flex props into one visual block).
 *
 * DESIGN DECISIONS:
 *   - Display mode controls which sub-controls are visible
 *   - FlexDirection shows icons (→ ↓ ← ↑) for quick recognition
 *   - Gap separate from margin (DR-LAYOUT-005)
 */

import { useCallback, useMemo } from 'react'
import { Layout, GripHorizontal } from 'lucide-react'
import type { FieldRendererProps } from '../../../../../packages/builder-core/src/PropertyRegistry'
import type {
  DisplayMode,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  AlignItems,
} from '../../../../../packages/builder-core/src/LayoutTypes'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DISPLAY_OPTIONS: Array<{ label: string; value: DisplayMode }> = [
  { label: 'Block', value: 'BLOCK' },
  { label: 'Flex', value: 'FLEX' },
  { label: 'Grid', value: 'GRID' },
  { label: 'Absolute', value: 'ABSOLUTE' },
  { label: 'None', value: 'NONE' },
]

const DIRECTION_OPTIONS: Array<{ label: string; value: FlexDirection }> = [
  { label: '→ Row', value: 'row' },
  { label: '↓ Column', value: 'column' },
  { label: '← Row Reverse', value: 'row-reverse' },
  { label: '↑ Column Reverse', value: 'column-reverse' },
]

const WRAP_OPTIONS: Array<{ label: string; value: FlexWrap }> = [
  { label: 'No Wrap', value: 'nowrap' },
  { label: 'Wrap', value: 'wrap' },
  { label: 'Wrap Reverse', value: 'wrap-reverse' },
]

const JUSTIFY_OPTIONS: Array<{ label: string; value: JustifyContent }> = [
  { label: 'Start', value: 'flex-start' },
  { label: 'Center', value: 'center' },
  { label: 'End', value: 'flex-end' },
  { label: 'Space Between', value: 'space-between' },
  { label: 'Space Around', value: 'space-around' },
  { label: 'Space Evenly', value: 'space-evenly' },
]

const ALIGN_OPTIONS: Array<{ label: string; value: AlignItems }> = [
  { label: 'Stretch', value: 'stretch' },
  { label: 'Start', value: 'flex-start' },
  { label: 'Center', value: 'center' },
  { label: 'End', value: 'flex-end' },
  { label: 'Baseline', value: 'baseline' },
]

// ---------------------------------------------------------------------------
// FlexField
// ---------------------------------------------------------------------------

export function FlexField({ schema, value, onChange, error }: FieldRendererProps) {
  // This flex field handles a single property at a time (e.g., display, flexDirection, etc.)
  // It's registered for type 'flex' and the schema.key tells us which property we're editing

  const currentValue = typeof value === 'string' ? value : ''

  // Which type of control to render based on schema.key
  const controlType = useMemo(() => {
    const key = schema.key.toLowerCase()
    if (key === 'display') return 'display'
    if (key.includes('direction')) return 'direction'
    if (key.includes('wrap')) return 'wrap'
    if (key.includes('justify')) return 'justify'
    if (key.includes('align')) return 'align'
    if (key === 'gap' || key === 'rowgap' || key === 'columngap') return 'gap'
    return 'select' // fallback
  }, [schema.key])

  // Shared select wrapper
  const renderSelect = useCallback((
    options: Array<{ label: string; value: string }>,
    current: string,
    placeholder?: string
  ) => {
    return (
      <select
        value={current}
        onChange={e => onChange(schema.key, e.target.value)}
        className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2
                   text-sm text-white font-mono
                   focus:outline-none focus:border-violet-500/50 transition-all"
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }, [schema.key, onChange])

  // Gap input (number)
  if (controlType === 'gap') {
    const numVal = typeof value === 'number' ? value : 0
    return (
      <div>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          <GripHorizontal className="w-3 h-3" />
          {schema.label}
        </label>
        <div className="flex gap-1.5 items-center">
          <input
            type="number"
            value={numVal}
            min={0}
            max={200}
            step={1}
            onChange={e => onChange(schema.key, e.target.value === '' ? 0 : parseFloat(e.target.value))}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2
                       text-sm text-white font-mono text-right
                       focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                       [&::-webkit-inner-spin-button]:appearance-none transition-all"
          />
          <span className="text-[11px] text-slate-600 font-mono w-6">px</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        <Layout className="w-3 h-3" />
        {schema.label}
      </label>

      {controlType === 'display' && renderSelect(DISPLAY_OPTIONS, currentValue)}
      {controlType === 'direction' && renderSelect(DIRECTION_OPTIONS, currentValue)}
      {controlType === 'wrap' && renderSelect(WRAP_OPTIONS, currentValue)}
      {controlType === 'justify' && renderSelect(JUSTIFY_OPTIONS, currentValue)}
      {controlType === 'align' && renderSelect(ALIGN_OPTIONS, currentValue)}
      {controlType === 'select' && renderSelect([], currentValue, 'Select...')}

      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

