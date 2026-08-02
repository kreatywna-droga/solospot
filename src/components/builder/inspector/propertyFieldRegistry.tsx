'use client'

/**
 * propertyFieldRegistry — C16.7 Property Field Registry (React bridge)
 *
 * Creates a singleton PropertyFieldRegistry and registers all built-in
 * field renderers (string, text, number, boolean, color, select, range,
 * spacing, size, position, flex).
 *
 * Architecture:
 *   createPropertyFieldRegistry() (core, pure TS)
 *     → register built-in renderers (this file)
 *       → usePropertyFieldRegistry() (React hook)
 *
 * PLUGIN EXTENSION:
 *   Any plugin can import the registry singleton and call:
 *     propertyFieldRegistry.register('gradient', GradientField)
 *   No changes needed to PropertyField.tsx
 *
 * This file is the ONLY place where built-in renderers are registered.
 * It is imported and initialized by the BuilderApp on mount.
 */

import { createPropertyFieldRegistry } from '../../../../packages/builder-core/src/PropertyRegistry'
import type { FieldRendererProps } from '../../../../packages/builder-core/src/PropertyRegistry'
import { SpacingField } from './fields/SpacingField'
import { SizeField } from './fields/SizeField'
import { PositionField } from './fields/PositionField'
import { FlexField } from './fields/FlexField'
import { GridField } from './fields/GridField'
import { OverflowField } from './fields/OverflowField'
import { RadiusField } from './fields/RadiusField'
import { BorderField } from './fields/BorderField'

// ---------------------------------------------------------------------------
// Singleton registry instance
// ---------------------------------------------------------------------------

/**
 * The global singleton PropertyFieldRegistry.
 * Import this anywhere to register custom field renderers.
 *
 * Example:
 *   import { propertyFieldRegistry } from './propertyFieldRegistry'
 *   import { GradientField } from './fields/GradientField'
 *   propertyFieldRegistry.register('gradient', GradientField)
 */
export const propertyFieldRegistry = createPropertyFieldRegistry()

// ---------------------------------------------------------------------------
// React hook — returns the singleton registry
// ---------------------------------------------------------------------------

/**
 * usePropertyFieldRegistry
 *
 * Returns the singleton PropertyFieldRegistry for lookup in PropertyField.
 * This is a hook (not a module-level import) so it works within React tree
 * and can be mocked in tests if needed.
 */
export function usePropertyFieldRegistry() {
  return propertyFieldRegistry
}

// ---------------------------------------------------------------------------
// Built-in field renderers
// ---------------------------------------------------------------------------

// --- String Field ---

function StringField({ schema, value, onChange, error }: FieldRendererProps) {
  const sp = schema as unknown as Record<string, unknown>
  const placeholder = (typeof sp.placeholder === 'string') ? sp.placeholder : schema.label
  const errCls = error
    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
    : 'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/30'

  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {schema.label}
        {schema.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={typeof value === 'string' ? value : ''}
        onChange={e => onChange(schema.key, e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${errCls}`}
      />
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
      {schema.description && !error && (
        <p className="text-[11px] text-slate-600 mt-1">{schema.description}</p>
      )}
    </div>
  )
}

// --- Text Field (multi-line) ---

function TextField({ schema, value, onChange, error }: FieldRendererProps) {
  const errCls = error
    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
    : 'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/30'

  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {schema.label}
      </label>
      <textarea
        value={typeof value === 'string' ? value : ''}
        onChange={e => onChange(schema.key, e.target.value)}
        rows={3}
        className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 transition-all resize-none ${errCls}`}
      />
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

// --- Number Field ---

function NumberField({ schema, value, onChange, error }: FieldRendererProps) {
  const sp = schema as { min?: number; max?: number; step?: number; unit?: string }
  const errCls = error
    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
    : 'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/30'

  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {schema.label}
        {sp.unit && <span className="text-slate-600 normal-case font-normal ml-1">({sp.unit})</span>}
      </label>
      <input
        type="number"
        value={typeof value === 'number' ? value : ''}
        min={sp.min}
        max={sp.max}
        step={sp.step ?? 1}
        onChange={e => onChange(schema.key, e.target.value === '' ? undefined : parseFloat(e.target.value))}
        className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 transition-all ${errCls}`}
      />
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

// --- Boolean / Toggle Field ---

function BooleanField({ schema, value, onChange }: FieldRendererProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        {schema.label}
      </label>
      <button
        onClick={() => onChange(schema.key, !value)}
        className={`relative w-10 h-5 rounded-full transition-all duration-200 flex-shrink-0 ${
          value ? 'bg-violet-500' : 'bg-white/10'
        }`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          value ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  )
}

// --- Color Field ---

function ColorField({ schema, value, onChange }: FieldRendererProps) {
  const colorVal = typeof value === 'string' && value ? value : '#6366f1'

  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {schema.label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={colorVal}
          onChange={e => onChange(schema.key, e.target.value)}
          className="w-9 h-9 rounded-lg border border-white/10 cursor-pointer bg-transparent flex-shrink-0"
        />
        <input
          type="text"
          value={colorVal}
          onChange={e => onChange(schema.key, e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
        />
      </div>
    </div>
  )
}

// --- Select Field (dropdown) ---

function SelectField({ schema, value, onChange }: FieldRendererProps) {
  const sp = schema as { options?: Array<{ label: string; value: unknown }> }
  const options = sp.options ?? []

  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {schema.label}
      </label>
      <select
        value={String(value ?? '')}
        onChange={e => {
          const opt = options.find(o => String(o.value) === e.target.value)
          onChange(schema.key, opt?.value ?? e.target.value)
        }}
        className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
      >
        {options.map(opt => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// --- Range / Slider Field ---

function RangeField({ schema, value, onChange }: FieldRendererProps) {
  const sp = schema as { min?: number; max?: number; step?: number }
  const min = sp.min ?? 0
  const max = sp.max ?? 100
  const step = sp.step ?? 1
  const numVal = typeof value === 'number' ? value : min

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {schema.label}
        </label>
        <span className="text-xs text-white font-mono">{numVal}</span>
      </div>
      <input
        type="range"
        value={numVal}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(schema.key, parseFloat(e.target.value))}
        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Initialize built-in renderers
// ---------------------------------------------------------------------------

/**
 * Initialize the registry with all built-in field renderers.
 * Called once on app startup (in BuilderApp or a root layout).
 *
 * Returns the registry for chaining.
 */
export function initializeBuiltinFields() {
  return propertyFieldRegistry
    .register('string', StringField)
    .register('text', TextField)
    .register('number', NumberField)
    .register('boolean', BooleanField)
    .register('color', ColorField)
    .register('select', SelectField)
    .register('multiselect', SelectField)
    .register('range', RangeField)
    .register('spacing', SpacingField)
    .register('size', SizeField)
    .register('position', PositionField)
    .register('flex', FlexField)
    .register('grid-tracks', GridField)
    .register('grid-track', GridField)
    .register('grid-span', GridField)
    .register('overflow', OverflowField)
    .register('border-width', BorderField)
    .register('radius', RadiusField)
}

