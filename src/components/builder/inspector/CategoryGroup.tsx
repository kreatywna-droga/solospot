'use client'

/**
 * CategoryGroup — C16.7 Inspector Category Group
 *
 * Collapsible section for a group of related properties.
 *
 * Architecture:
 *   InspectorCategory → CategoryGroup → PropertyField[]
 *
 * Pure render component — no business logic.
 * Collapse state is local UI state only.
 */

import { useState, useCallback } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { PropSchema } from '../../../../packages/builder-core/src'
import { PropertyField } from './PropertyField'

// ---------------------------------------------------------------------------
// CategoryGroup
// ---------------------------------------------------------------------------

interface CategoryGroupProps {
  /** Category/group ID */
  id: string
  /** Display label */
  label: string
  /** Fields in this group */
  fields: ReadonlyArray<PropSchema>
  /** Field values */
  values: Record<string, unknown>
  /** Called when a field value changes */
  onChange: (key: string, value: unknown) => void
  /** Optional: validation errors keyed by field key */
  errors?: Record<string, string>
  /** Default collapsed state */
  defaultCollapsed?: boolean
  /** Whether to show the collapse toggle */
  collapsible?: boolean
  /** Section type badge */
  sectionType?: string
}

export function CategoryGroup({
  id,
  label,
  fields,
  values,
  onChange,
  errors = {},
  defaultCollapsed = false,
  collapsible = true,
  sectionType,
}: CategoryGroupProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  const toggle = useCallback(() => {
    if (collapsible) setCollapsed(v => !v)
  }, [collapsible])

  if (fields.length === 0) return null

  return (
    <div className="border-b border-white/5 last:border-b-0">
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left
                   hover:bg-white/5 transition-colors group"
      >
        {collapsible ? (
          collapsed
            ? <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
            : <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
        ) : (
          <div className="w-3.5 h-3.5 flex-shrink-0" />
        )}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500
                         group-hover:text-white transition-colors">
          {label}
        </span>
        {sectionType && (
          <span className="text-[10px] font-mono text-slate-600 ml-auto">{sectionType}</span>
        )}
      </button>

      {/* Fields */}
      {!collapsed && (
        <div className="px-4 pb-3 space-y-3">
          {fields.map(field => (
            <PropertyField
              key={field.key}
              schema={field}
              value={values[field.key]}
              onChange={onChange}
              error={errors[field.key] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}

