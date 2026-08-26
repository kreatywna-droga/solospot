import * as React from 'react';
import type { InspectorGroup } from '../../../../builder-core/src/InspectorRuntime';
import type { PropSchema } from '../../../../builder-core/src/ComponentRegistry';
import { propertyFieldRegistry } from '../registry/propertyFieldRegistry';
import { toPropertyFieldDefinition } from './schemaAdapter';
import { WidgetField } from '../widgets/WidgetField';
import type { Breakpoint, PropertyFieldDefinition } from '../registry/types';

export interface DynamicPropertyPanelProps {
  group: InspectorGroup;
  currentProps: Record<string, unknown>;
  onPropChange: (key: string, value: unknown) => void;
  breakpoint: 'desktop' | 'tablet' | 'mobile';
}

/**
 * DynamicPropertyPanel — Sprint 7 Recovery (P1)
 *
 * Refactored to resolve widgets EXCLUSIVELY via the PropertyRegistry.
 * The previous implementation used a switch/case on field.type — that
 * has been removed. Field metadata is produced by the schemaAdapter
 * (PropSchema → PropertyFieldDefinition), and the widget component is
 * looked up through `propertyFieldRegistry.getWidget(field.widget)`.
 *
 * There is NO switch/case, NO local field definitions, NO hardcoded inputs.
 *
 * @agent Agent 1 — Inspector Core Engineer (Sprint 7 Recovery)
 * @status IN PROGRESS — READY FOR PM26 REVIEW
 */

export const DynamicPropertyPanel: React.FC<DynamicPropertyPanelProps> = ({
  group,
  currentProps,
  onPropChange,
  breakpoint
}) => {
  const renderField = (schema: PropSchema, breakpointKey: Breakpoint) => {
    // Map PropSchema → PropertyFieldDefinition (pure adapter, no switch).
    const definition = toPropertyFieldDefinition(schema);

    // Resolve the widget component exclusively from the registry.
    const Widget = propertyFieldRegistry.getWidget(definition.widget);
    if (!Widget) {
      return (
        <span className="text-[11px] text-slate-600 italic">
          Unsupported field type: {definition.widget}
        </span>
      );
    }

    // Resolve value (respecting responsive overrides).
    const rawValue = currentProps[schema.key] ?? schema.defaultValue ?? '';
    const isResponsive =
      typeof rawValue === 'object' && rawValue !== null && 'desktop' in rawValue;
    const value = isResponsive
      ? (rawValue as Record<string, unknown>)[breakpointKey] ?? ''
      : rawValue;

    const handleChange = (newVal: unknown) => {
      if (isResponsive) {
        onPropChange(schema.key, {
          ...(rawValue as Record<string, unknown>),
          [breakpointKey]: newVal,
        });
      } else {
        onPropChange(schema.key, newVal);
      }
    };

    return (
      <WidgetField field={definition}>
        <Widget
          value={value}
          onChange={handleChange}
          field={definition}
          breakpoint={breakpointKey}
        />
      </WidgetField>
    );
  };

  return (
    <div className="dynamic-property-panel">
      {group.fields.map(field => (
        <div className="property-field" key={String(field.key)}>
          {renderField(field, breakpoint)}
        </div>
      ))}
    </div>
  );
};
