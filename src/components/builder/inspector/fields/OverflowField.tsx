'use client'

/**
 * OverflowField — C16.5B.2 Overflow Property Editor (Sprint 5B.2)
 *
 * Custom field renderer for CSS overflow properties.
 * Registered as type 'overflow' in PropertyRegistry.
 *
 * Features:
 *   - Overflow mode selector (visible, hidden, scroll, auto)
 *   - Per-axis overflow (overflowX, overflowY) via accordion expand
 *   - UX: single select for uniform axes, expand to per-axis when different
 *
 * Architecture:
 *   OverflowField → onChange(key, OverflowProps)
 *     → dispatch(UPDATE_PROPS) via InspectorPanel
 *
 * DESIGN DECISIONS:
 *   - No business logic (validation, CSS mapping) — all in LayoutTypes.ts
 *   - Uses existing dispatch mechanism (UPDATE_PROPS)
 *   - Zero changes to PropertyField.tsx (registry-based dispatch)
 *   - Responsive-ready: all values are JSON-serializable objects
 *   - Smart defaults: visible for all axes, skip CSS output when default
 */

import { useState, useCallback } from 'react'
import { Expand } from 'lucide-react'
import type { FieldRendererProps } from '../../../../../packages/builder-core/src/PropertyRegistry'
import type { OverflowMode } from '../../../../../packages/builder-core/src/LayoutTypes'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OVERFLOW_MODES: Array<{ label: string; value: OverflowMode; description: string }> = [
  { label: 'Visible', value: 'visible', description: 'Content is not clipped' },
  { label: 'Hidden', value: 'hidden', description: 'Content is clipped — no scroll' },
  { label: 'Scroll', value: 'scroll', description: 'Content is clipped — always show scrollbars' },
  { label: 'Auto', value: 'auto', description: 'Content is clipped — scrollbars only when needed' },
]

// Default overflow props — all visible
const DEFAULT_OVERFLOW: OverflowMode = 'visible'

// ---------------------------------------------------------------------------
// OverflowField Component
// ---------------------------------------------------------------------------

export function OverflowField({ schema, value, onChange, error }: FieldRendererProps) {
  // Parse the current value from props
  const props = value as { overflow?: OverflowMode; overflowX?: OverflowMode; overflowY?: OverflowMode } | undefined

  const currentOverflow = props?.overflow ?? DEFAULT_OVERFLOW
  const currentOverflowX = props?.overflowX
  const currentOverflowY = props?.overflowY

  // Are axes uniform (same value) or split?
  const x = currentOverflowX ?? currentOverflow
  const y = currentOverflowY ?? currentOverflow
  const isUniform = x === y && !currentOverflowX && !currentOverflowY

  const [showPerAxis, setShowPerAxis] = useState(!isUniform)

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleOverflowChange = useCallback((newOverflow: OverflowMode) => {
    onChange(schema.key, {
      overflow: newOverflow,
    })
  }, [schema.key, onChange])

  const handleOverflowXChange = useCallback((newX: OverflowMode) => {
    onChange(schema.key, {
      overflow: currentOverflow,
      overflowX: newX,
      overflowY: currentOverflowY,
    })
  }, [schema.key, onChange, currentOverflow, currentOverflowY])

  const handleOverflowYChange = useCallback((newY: OverflowMode) => {
    onChange(schema.key, {
      overflow: currentOverflow,
      overflowX: currentOverflowX,
      overflowY: newY,
    })
  }, [schema.key, onChange, currentOverflow, currentOverflowX])

  const togglePerAxis = useCallback(() => {
    if (showPerAxis) {
      // Collapse: reset to uniform using current X value
      onChange(schema.key, {
        overflow: currentOverflowX ?? currentOverflow,
      })
    }
    setShowPerAxis(!showPerAxis)
  }, [showPerAxis, schema.key, onChange, currentOverflowX, currentOverflow])

  const handleUniformChange = useCallback((newMode: OverflowMode) => {
    if (showPerAxis) {
      // When in per-axis mode, update both axes
      onChange(schema.key, {
        overflow: currentOverflow,
        overflowX: newMode,
        overflowY: newMode,
      })
    } else {
      handleOverflowChange(newMode)
    }
  }, [showPerAxis, handleOverflowChange, onChange, schema.key, currentOverflow])

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderModeOption = (mode: typeof OVERFLOW_MODES[number], isSelected: boolean, onSelect: () => void) => (
    <button
      key={mode.value}
      onClick={onSelect}
      className={`flex-1 px-2 py-1.5 rounded text-[11px] font-medium transition-all ${
        isSelected
          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
          : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-slate-300'
      }`}
      title={mode.description}
    >
      {mode.label}
    </button>
  )

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        <Expand className="w-3 h-3" />
        {schema.label}
        {showPerAxis && <span className="text-[10px] text-slate-600 normal-case font-normal">(split axes)</span>}
      </label>

      {/* Mode selector — uniform view (shows current overflow/X/Y value) */}
      <div className="flex gap-1 mb-1.5">
        {OVERFLOW_MODES.map(mode =>
          renderModeOption(mode, showPerAxis ? x === mode.value : currentOverflow === mode.value, () =>
            showPerAxis ? handleUniformChange(mode.value) : handleOverflowChange(mode.value)
          )
        )}
      </div>

      {/* Per-axis toggle */}
      <button
        onClick={togglePerAxis}
        className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
      >
        {showPerAxis ? '− Collapse per-axis' : '+ Per-axis'}
      </button>

      {/* Per-axis editors (expandable) */}
      {showPerAxis && (
        <div className="mt-2 space-y-2 pl-2 border-l border-white/5">
          {/* Overflow-X */}
          <div>
            <label className="block text-[10px] text-slate-600 font-mono mb-1">overflow-x</label>
            <div className="flex gap-1">
              {OVERFLOW_MODES.map(mode =>
                renderModeOption(mode, x === mode.value, () => handleOverflowXChange(mode.value))
              )}
            </div>
          </div>

          {/* Overflow-Y */}
          <div>
            <label className="block text-[10px] text-slate-600 font-mono mb-1">overflow-y</label>
            <div className="flex gap-1">
              {OVERFLOW_MODES.map(mode =>
                renderModeOption(mode, y === mode.value, () => handleOverflowYChange(mode.value))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS preview (informational) */}
      <div className="mt-1.5 text-[10px] text-slate-700 font-mono">
        {x === 'visible' && y === 'visible'
          ? '/* default — no CSS emitted */'
          : x === y
            ? `overflow: ${x};`
            : `overflow-x: ${x};\noverflow-y: ${y};`}
      </div>

      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
      {schema.description && !error && (
        <p className="text-[10px] text-slate-600 mt-0.5">{schema.description}</p>
      )}
    </div>
  )
}

