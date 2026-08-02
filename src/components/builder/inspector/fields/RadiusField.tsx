'use client'

/**
 * RadiusField — C16.5B.4 Radius Property Editor (Sprint 5B.4)
 *
 * Custom field renderer for CSS border-radius properties.
 * Registered as type 'radius' in PropertyRegistry.
 *
 * Features:
 *   - Uniform mode: single value for all 4 corners
 *   - Per-corner mode: individual values for TL, TR, BR, BL
 *   - Toggle between uniform / per-corner
 *   - CSS preview (informational)
 *   - Smart CSS: skip output for zero/undefined values
 *
 * Architecture:
 *   RadiusField → onChange(key, RadiusProps)
 *     → dispatch(UPDATE_PROPS) via InspectorPanel
 *
 * DESIGN DECISIONS:
 *   - No business logic (validation, CSS mapping) — all in RadiusTypes.ts
 *   - Uses existing dispatch mechanism (UPDATE_PROPS)
 *   - Zero changes to PropertyField.tsx (registry-based dispatch)
 *   - Responsive-ready: all values are JSON-serializable objects
 *   - Category: Visual (ADR-VISUAL-001)
 */

import { useState, useCallback } from 'react'
import type { FieldRendererProps } from '../../../../../packages/builder-core/src/PropertyRegistry'
import type { RadiusMode, RadiusValue, RadiusProps } from '../../../../../packages/builder-core/src/RadiusTypes'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RADIUS_UNITS = ['px', '%'] as const

interface CornerInputProps {
  label: string
  value?: RadiusValue
  onChange: (value: RadiusValue | undefined) => void
}

// ---------------------------------------------------------------------------
// CornerInput — single radius value input (number + unit)
// ---------------------------------------------------------------------------

function CornerInput({ label, value, onChange }: CornerInputProps) {
  const currentValue = value?.value ?? 0
  const currentUnit = value?.unit ?? 'px'

  const handleValueChange = (newVal: number) => {
    if (newVal === 0) {
      onChange(undefined)
    } else {
      onChange({ value: newVal, unit: currentUnit })
    }
  }

  const handleUnitChange = (newUnit: string) => {
    onChange({ value: currentValue, unit: newUnit as 'px' | '%' })
  }

  return (
    <div className="flex items-center gap-1">
      <label className="text-[10px] text-slate-600 font-mono w-14 flex-shrink-0">{label}</label>
      <input
        type="number"
        value={currentValue}
        min={0}
        max={999}
        onChange={e => handleValueChange(parseFloat(e.target.value) || 0)}
        className="w-14 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white text-center focus:outline-none focus:border-violet-500/50 transition-all"
      />
      <select
        value={currentUnit}
        onChange={e => handleUnitChange(e.target.value)}
        className="bg-[#0a0a14] border border-white/10 rounded px-1.5 py-1 text-[11px] text-slate-400 focus:outline-none focus:border-violet-500/50 transition-all"
      >
        {RADIUS_UNITS.map(unit => (
          <option key={unit} value={unit}>{unit}</option>
        ))}
      </select>
    </div>
  )
}

// ---------------------------------------------------------------------------
// RadiusField Component
// ---------------------------------------------------------------------------

export function RadiusField({ schema, value, onChange, error }: FieldRendererProps) {
  // Parse the current value from props
  const props = (value as RadiusProps) ?? { mode: 'uniform' as RadiusMode }

  const currentMode = props.mode ?? 'uniform'
  const currentRadius = props.radius
  const currentTopLeft = props.topLeft
  const currentTopRight = props.topRight
  const currentBottomRight = props.bottomRight
  const currentBottomLeft = props.bottomLeft

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleModeToggle = useCallback(() => {
    if (currentMode === 'uniform') {
      // Switch to per-corner — copy uniform value to all corners
      const value = currentRadius ?? { value: 0, unit: 'px' }
      onChange(schema.key, {
        mode: 'per-corner' as RadiusMode,
        topLeft: value,
        topRight: value,
        bottomRight: value,
        bottomLeft: value,
      })
    } else {
      // Switch to uniform — use topLeft (or first defined corner)
      const firstCorner = currentTopLeft ?? currentTopRight ?? currentBottomRight ?? currentBottomLeft ?? { value: 0, unit: 'px' }
      onChange(schema.key, {
        mode: 'uniform' as RadiusMode,
        radius: firstCorner,
      })
    }
  }, [currentMode, currentRadius, currentTopLeft, currentTopRight, currentBottomRight, currentBottomLeft, schema.key, onChange])

  const handleUniformChange = useCallback((newRadius: RadiusValue | undefined) => {
    onChange(schema.key, {
      mode: 'uniform',
      radius: newRadius,
    })
  }, [schema.key, onChange])

  const handleCornerChange = useCallback((corner: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft', newValue: RadiusValue | undefined) => {
    onChange(schema.key, {
      mode: 'per-corner',
      topLeft: corner === 'topLeft' ? newValue : currentTopLeft,
      topRight: corner === 'topRight' ? newValue : currentTopRight,
      bottomRight: corner === 'bottomRight' ? newValue : currentBottomRight,
      bottomLeft: corner === 'bottomLeft' ? newValue : currentBottomLeft,
    })
  }, [schema.key, onChange, currentTopLeft, currentTopRight, currentBottomRight, currentBottomLeft])

  // -------------------------------------------------------------------------
  // CSS Preview
  // -------------------------------------------------------------------------

  const renderCSSPreview = () => {
    if (currentMode === 'uniform') {
      if (!currentRadius || currentRadius.value === 0) {
        return <span className="text-slate-700">/* no radius — no CSS */</span>
      }
      return <span>border-radius: {currentRadius.value}{currentRadius.unit};</span>
    }

    const corners: string[] = []
    if (currentTopLeft && currentTopLeft.value > 0) corners.push(`border-top-left-radius: ${currentTopLeft.value}${currentTopLeft.unit}`)
    if (currentTopRight && currentTopRight.value > 0) corners.push(`border-top-right-radius: ${currentTopRight.value}${currentTopRight.unit}`)
    if (currentBottomRight && currentBottomRight.value > 0) corners.push(`border-bottom-right-radius: ${currentBottomRight.value}${currentBottomRight.unit}`)
    if (currentBottomLeft && currentBottomLeft.value > 0) corners.push(`border-bottom-left-radius: ${currentBottomLeft.value}${currentBottomLeft.unit}`)

    if (corners.length === 0) {
      return <span className="text-slate-700">/* no radius — no CSS */</span>
    }
    return <span>{corners.join('; ')};</span>
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {schema.label}
        </label>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-2 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.05]">
        <button
          onClick={currentMode === 'uniform' ? undefined : handleModeToggle}
          className={`flex-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
            currentMode === 'uniform'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Uniform
        </button>
        <button
          onClick={currentMode === 'per-corner' ? undefined : handleModeToggle}
          className={`flex-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
            currentMode === 'per-corner'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Per Corner
        </button>
      </div>

      {/* Uniform mode — single input */}
      {currentMode === 'uniform' && (
        <CornerInput
          label="Radius"
          value={currentRadius}
          onChange={handleUniformChange}
        />
      )}

      {/* Per-corner mode — 4 inputs */}
      {currentMode === 'per-corner' && (
        <div className="space-y-1.5 pl-1">
          <CornerInput
            label="Top Left"
            value={currentTopLeft}
            onChange={(v) => handleCornerChange('topLeft', v)}
          />
          <CornerInput
            label="Top Right"
            value={currentTopRight}
            onChange={(v) => handleCornerChange('topRight', v)}
          />
          <CornerInput
            label="Bottom Right"
            value={currentBottomRight}
            onChange={(v) => handleCornerChange('bottomRight', v)}
          />
          <CornerInput
            label="Bottom Left"
            value={currentBottomLeft}
            onChange={(v) => handleCornerChange('bottomLeft', v)}
          />
        </div>
      )}

      {/* CSS preview (informational) */}
      <div className="mt-1.5 text-[10px] text-slate-700 font-mono">
        {renderCSSPreview()}
      </div>

      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
      {schema.description && !error && (
        <p className="text-[10px] text-slate-600 mt-0.5">{schema.description}</p>
      )}
    </div>
  )
}

