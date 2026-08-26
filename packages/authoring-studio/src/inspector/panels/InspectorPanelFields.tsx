'use client';

import * as React from 'react';
import type { PropertyFieldDefinition } from '../registry/types';

/**
 * InspectorPanelFields — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Renders a list of PropertyField components for a set of field definitions.
 * This is a presentation-only helper used by all panels.
 * It does NOT import PropertyField directly — that's Agent 1's responsibility.
 * Instead, it accepts a renderField render-prop to decouple from the registry.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

export interface InspectorPanelFieldsProps {
  /** Field definitions from the Registry for this category. */
  fields: PropertyFieldDefinition[];
  /** Current property values keyed by field ID. */
  values: Record<string, unknown>;
  /** Called when a property value changes. */
  onChange: (key: string, value: unknown) => void;
/**
   * Render function for a single field.
   * Agent 1 provides this to connect to PropertyField.
   * When omitted, the receiving panel supplies its own registry-based
   * resolution (e.g. AnimationPanel resolves via Property Registry).
   */
  renderField?: (
    field: PropertyFieldDefinition,
    value: unknown,
    onChange: (val: unknown) => void,
  ) => React.ReactNode;
}

/**
 * Pure presentation component that maps fields to renderField.
 * No business logic, no switch statements.
 */
export const InspectorPanelFields: React.FC<InspectorPanelFieldsProps> = ({
  fields,
  values,
  onChange,
  renderField,
}) => {
  return (
    <div className="inspector-panel-fields space-y-3">
{fields.map((field) => {
        const value = values[field.id] ?? field.defaultValue;
        return (
          <div key={field.id} className="inspector-field">
            {renderField?.(field, value, (val) => onChange(field.id, val))}
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(InspectorPanelFields);

