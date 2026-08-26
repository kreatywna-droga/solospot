/**
 * schemaAdapter — Sprint 7 Recovery (P1)
 *
 * Maps builder-core `PropSchema` (schema-driven component definitions from
 * ComponentRegistry) to authoring-studio `PropertyFieldDefinition` (the
 * contract consumed by the Inspector 2.0 widgets and panels).
 *
 * This adapter is the ONLY place where the PropSchema→PropertyFieldDefinition
 * mapping lives. It is a pure function — no React, no Registry, no state.
 *
 * The widget resolution happens AFTER this mapping, exclusively via
 * `propertyFieldRegistry.getWidget(field.widget)`. There is NO switch/case on
 * field type in the rendering layer.
 *
 * @agent Agent 1 — Inspector Core Engineer (Sprint 7 Recovery)
 * @status IN PROGRESS — READY FOR PM26 REVIEW
 */

import type { PropSchema } from '../../../../builder-core/src/ComponentRegistry';
import type { PropertyFieldDefinition, WidgetType } from '../registry/types';

/**
 * Map a builder-core PropSchemaType to an authoring-studio WidgetType.
 * Pure lookup table — no switch/case.
 */
const WIDGET_BY_SCHEMA_TYPE: Readonly<Record<string, WidgetType>> = {
  string: 'text',
  text: 'textarea',
  number: 'number',
  boolean: 'boolean',
  color: 'color',
  select: 'select',
  multiselect: 'select',
  range: 'range',
  image: 'image',
  asset: 'image',
  // Complex types fall back to a text editor until dedicated widgets exist.
  array: 'text',
  object: 'text',
};

/**
 * Map a single PropSchema to a PropertyFieldDefinition.
 * Only emits stable, registry-consumable metadata.
 */
export function toPropertyFieldDefinition(schema: PropSchema): PropertyFieldDefinition {
  const widget: WidgetType = WIDGET_BY_SCHEMA_TYPE[schema.type] ?? 'text';

  const definition: PropertyFieldDefinition = {
    id: schema.key,
    label: schema.label,
    description: schema.description ?? '',
    defaultValue: schema.defaultValue,
    validation: () => ({ valid: true }),
    widget,
    category: schema.group ?? 'general',
  };

  // Select options
  if ('options' in schema && Array.isArray(schema.options)) {
    definition.options = (schema.options as ReadonlyArray<{ label: string; value: unknown }>).map(
      (opt) => ({ label: opt.label, value: opt.value })
    );
  }

  // Number bounds — narrow via type guard to NumberPropSchema.
  if (schema.type === 'number') {
    const numberSchema = schema as PropSchema & { min?: number; max?: number; step?: number; unit?: string };
    if (numberSchema.min !== undefined) definition.min = numberSchema.min;
    if (numberSchema.max !== undefined) definition.max = numberSchema.max;
    if (numberSchema.step !== undefined) definition.step = numberSchema.step;
    if (numberSchema.unit !== undefined) definition.unit = numberSchema.unit;
  }

  // Placeholder for string-like schemas
  if ((schema.type === 'string' || schema.type === 'text') && 'placeholder' in schema) {
    definition.placeholder = (schema as { placeholder?: string }).placeholder;
  }

  return definition;
}

/**
 * Map an array of PropSchema to PropertyFieldDefinition[].
 */
export function toPropertyFieldDefinitions(
  schemas: ReadonlyArray<PropSchema>
): PropertyFieldDefinition[] {
  return schemas.map(toPropertyFieldDefinition);
}
