'use client'

/**
 * PropertyField — C16.7 Inspector Property Field
 *
 * Schema-driven property field renderer.
 * Uses PropertyRegistry to look up the correct UI widget based on schema.type.
 *
 * Architecture:
 *   PropSchema → PropertyField → PropertyRegistry.get(schema.type) → FieldRenderer
 *                               → onChange → dispatch(UPDATE_PROPS)
 *
 * Pure render component — no state, no business logic.
 * All validation is done by InspectorRuntime before dispatch.
 *
 * KEY DESIGN: No switch statement.
 * New field types are added by registering a renderer in PropertyRegistry,
 * not by editing this file. This is the plugin extension point.
 */

import type { PropSchema } from '../../../../packages/builder-core/src'
import { usePropertyFieldRegistry } from './propertyFieldRegistry'
import { AlertTriangle } from 'lucide-react'

// ---------------------------------------------------------------------------
// Field Props
// ---------------------------------------------------------------------------

export interface FieldProps {
  schema: PropSchema
  value: unknown
  onChange: (key: string, value: unknown) => void
  /** Optional: show validation errors inline */
  error?: string | null
}

// ---------------------------------------------------------------------------
// Fallback renderers for complex / unimplemented types
// ---------------------------------------------------------------------------

function UnimplementedField({ schema }: FieldProps) {
  return (
    <div className="text-xs text-slate-600 italic p-2 bg-white/5 rounded-lg flex items-center gap-2">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
      <span>
        {schema.label}: <span className="font-mono">{schema.type}</span> — (Sprint 5+)
      </span>
    </div>
  )
}

function UnknownField({ schema }: FieldProps) {
  return (
    <div className="text-xs text-red-400/60 italic p-2 bg-red-500/5 rounded-lg">
      Unknown field type: <span className="font-mono">{schema.type}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PropertyField — looks up renderer from registry, renders it
// ---------------------------------------------------------------------------

interface PropertyFieldProps {
  schema: PropSchema
  value: unknown
  onChange: (key: string, value: unknown) => void
  error?: string | null
}

export function PropertyField({ schema, value, onChange, error }: PropertyFieldProps) {
  // Respect schema.hidden — if metadata.hidden is set, check both
  if (schema.hidden || schema.metadata?.hidden) return null

  const registry = usePropertyFieldRegistry()
  const Renderer = registry.get(schema.type)

  if (!Renderer) {
    // Fall back to unimplemented/unknown placeholder
    // Complex types (array, object) show "Sprint 5+"
    // Unknown types show error
    if (schema.type === 'array' || schema.type === 'object' || schema.type === 'image' || schema.type === 'asset') {
      return <UnimplementedField schema={schema} value={value} onChange={onChange} error={error} />
    }
    return <UnknownField schema={schema} value={value} onChange={onChange} error={error} />
  }

  return <Renderer schema={schema} value={value} onChange={onChange} error={error} />
}

