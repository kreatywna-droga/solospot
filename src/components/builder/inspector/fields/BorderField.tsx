'use client'

/**
 * BorderField — C16.49 Border Property Editor (Sprint 5B.3)
 *
 * Custom field renderer for CSS Border properties.
 * Registered as type 'border-width' in PropertyRegistry.
 * Style and Color use built-in 'select' and 'color' renderers.
 *
 * Features:
 *   - Border style selector (solid, dashed, dotted)
 *   - Border width input (number + px unit)
 *   - Border color picker
 *   - Smart CSS: no output when style is undefined
 *
 * Architecture:
 *   BorderField → onChange(key, BorderProps)
 *     → dispatch(UPDATE_PROPS) via InspectorPanel
 *
 * DESIGN DECISIONS:
 *   - No business logic (validation, CSS mapping) — all in BorderTypes.ts
 *   - Uses existing dispatch mechanism (UPDATE_PROPS)
 *   - Zero changes to PropertyField.tsx (registry-based dispatch)
 *   - Responsive-ready: all values are JSON-serializable objects
 *   - MVPs: uniform border only — per-edge prepared as future extension
 */

import { useCallback } from 'react'
import { Square } from 'lucide-react'
import type { FieldRendererProps } from '../../../../../packages/builder-core/src/PropertyRegistry'
import type { BorderStyle, BorderWidthValue } from '../../../../../packages/builder-core/src/BorderTypes'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BORDER_STYLES: Array<{ label: string; value: BorderStyle; cssPreview: string }> = [
  { label: 'Solid', value: 'solid', cssPreview: '──────' },
  { label: 'Dashed', value: 'dashed', cssPreview: '─ ─ ─ ─' },
  { label: 'Dotted', value: 'dotted', cssPreview: '· · · ·' },
]

const DEFAULT_WIDTH: BorderWidthValue = { value: 1, unit: 'px' }

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Style selector — pill-style buttons for border style.
 * Prepared for future per-edge extension (accept optional edge label).
 */
function BorderStyleSelector({
  value,
  onChange,
}: {
  value: BorderStyle | undefined
  onChange: (style: BorderStyle | undefined) => void
}) {
  return (
    <div>
      <label className="block text-[10px] text-slate-600 font-mono mb-1">Style</label>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(undefined)}
          className={`flex-1 px-2 py-1.5 rounded text-[11px] font-medium transition-all ${
            !value
              ? 'bg-white/5 text-slate-500 border border-white/10'
              : 'bg-white/5 text-slate-600 border border-transparent hover:bg-white/10'
          }`}
        >
          None
        </button>
        {BORDER_STYLES.map(style => (
          <button
            key={style.value}
            onClick={() => onChange(style.value)}
            className={`flex-1 px-2 py-1.5 rounded text-[11px] font-medium transition-all ${
              value === style.value
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-slate-300'
            }`}
            title={style.cssPreview}
          >
            {style.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Width editor — number input with px unit.
 */
function BorderWidthEditor({
  value,
  onChange,
}: {
  value: BorderWidthValue | undefined
  onChange: (width: BorderWidthValue | undefined) => void
}) {
  const currentValue = value?.value ?? 1

  return (
    <div>
      <label className="block text-[10px] text-slate-600 font-mono mb-1">Width</label>
      <div className="flex gap-1.5 items-center">
        <input
          type="number"
          value={currentValue}
          min={0}
          max={100}
          step={1}
          onChange={e => {
            const numVal = parseFloat(e.target.value)
            if (isNaN(numVal) || numVal <= 0) {
              onChange(undefined)
            } else {
              onChange({ value: numVal, unit: 'px' })
            }
          }}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono text-right focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
        />
        <span className="text-[11px] text-slate-600 font-mono w-6">px</span>
      </div>
    </div>
  )
}

/**
 * Color editor — native color input + hex text.
 */
function BorderColorEditor({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (color: string | undefined) => void
}) {
  const currentColor = value || '#000000'

  return (
    <div>
      <label className="block text-[10px] text-slate-600 font-mono mb-1">Color</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={currentColor}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent flex-shrink-0"
        />
        <input
          type="text"
          value={currentColor}
          onChange={e => onChange(e.target.value || undefined)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CSS Preview
// ---------------------------------------------------------------------------

function BorderCSSPreview({ style, width, color }: { style?: string; width?: string; color?: string }) {
  const parts: string[] = []
  if (style) parts.push(`border-style: ${style}`)
  if (width) parts.push(`border-width: ${width}`)
  if (color) parts.push(`border-color: ${color}`)

  return (
    <div className="mt-1.5 text-[10px] text-slate-700 font-mono">
      {parts.length === 0
        ? '/* no border CSS emitted */'
        : parts.join(';\n') + ';'}
    </div>
  )
}

// ---------------------------------------------------------------------------
// BorderField — main component
// ---------------------------------------------------------------------------

export function BorderField({ schema, value, onChange, error }: FieldRendererProps) {
  // Parse current border props
  const props = value as { borderStyle?: BorderStyle; borderWidth?: BorderWidthValue; borderColor?: string } | undefined

  const currentStyle = props?.borderStyle
  const currentWidth = props?.borderWidth
  const currentColor = props?.borderColor

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleStyleChange = useCallback((style: BorderStyle | undefined) => {
    onChange(schema.key, {
      ...(props || {}),
      borderStyle: style,
    })
  }, [schema.key, onChange, props])

  const handleWidthChange = useCallback((width: BorderWidthValue | undefined) => {
    onChange(schema.key, {
      ...(props || {}),
      borderWidth: width,
    })
  }, [schema.key, onChange, props])

  const handleColorChange = useCallback((color: string | undefined) => {
    onChange(schema.key, {
      ...(props || {}),
      borderColor: color,
    })
  }, [schema.key, onChange, props])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        <Square className="w-3 h-3" />
        {schema.label}
      </label>

      {/* Style selector */}
      <BorderStyleSelector
        value={currentStyle}
        onChange={handleStyleChange}
      />

      {/* Width (only shown when style is set) */}
      <BorderWidthEditor
        value={currentWidth}
        onChange={handleWidthChange}
      />

      {/* Color */}
      <BorderColorEditor
        value={currentColor}
        onChange={handleColorChange}
      />

      {/* CSS Preview */}
      <BorderCSSPreview
        style={currentStyle}
        width={currentWidth ? `${currentWidth.value}${currentWidth.unit}` : undefined}
        color={currentColor}
      />

      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

