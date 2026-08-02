/**
 * InspectorRuntime — C16.7 Inspector Foundation (Sprint 4A)
 *
 * Pure, framework-agnostic inspector engine that bridges:
 *   ComponentRegistry (schema) → Validation → Command binding
 *
 * Architecture:
 *   InspectorRuntime
 *     ├── PropertyValidator: validates values against PropSchema
 *     ├── PropertyBinder:    schema value → BuilderCommand
 *     └── CategoryOrganizer: groups PropSchema by category/group
 *
 * DESIGN DECISIONS:
 *   - Zero React dependency — pure TypeScript
 *   - Validation is separate from rendering
 *   - Binding produces commands compatible with BuilderCommands
 *   - Categories are derived from schema.group, not hardcoded
 */

import type { PropSchema } from './ComponentRegistry';
import type { BuilderCommand } from './BuilderCommands';

// ---------------------------------------------------------------------------
// Validation types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: ReadonlyArray<ValidationError>;
}

export interface ValidationError {
  readonly key: string;
  readonly message: string;
  readonly code: ValidationErrorCode;
}

export type ValidationErrorCode =
  | 'REQUIRED'
  | 'MIN_VALUE'
  | 'MAX_VALUE'
  | 'MIN_LENGTH'
  | 'MAX_LENGTH'
  | 'INVALID_OPTION'
  | 'INVALID_FORMAT'
  | 'CUSTOM';

// ---------------------------------------------------------------------------
// Category organization
// ---------------------------------------------------------------------------

export interface InspectorCategory {
  readonly id: string;
  readonly label: string;
  readonly groups: ReadonlyArray<InspectorGroup>;
}

export interface InspectorGroup {
  readonly id: string;
  readonly label: string;
  readonly fields: ReadonlyArray<PropSchema>;
}

// ---------------------------------------------------------------------------
// Property Binder
// ---------------------------------------------------------------------------

export interface PropertyBinding {
  /** The BuilderCommand to dispatch when this property changes */
  readonly command: BuilderCommand | null;
  /** Validated value (with defaults applied) */
  readonly validatedValue: unknown;
  /** Validation result */
  readonly validation: ValidationResult;
}

// ---------------------------------------------------------------------------
// InspectorRuntime
// ---------------------------------------------------------------------------

export class InspectorRuntime {
  /**
   * Validate a single value against its schema.
   */
  static validateValue(schema: PropSchema, value: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    // Required check
    if (schema.required && (value === undefined || value === null || value === '')) {
      errors.push({
        key: schema.key,
        message: `${schema.label} jest wymagane`,
        code: 'REQUIRED',
      });
      return { valid: false, errors };
    }

    // Skip further validation if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return { valid: true, errors: [] };
    }

    switch (schema.type) {
      case 'string':
      case 'text': {
        const strVal = String(value);
        if ('maxLength' in schema && schema.maxLength && strVal.length > schema.maxLength) {
          errors.push({
            key: schema.key,
            message: `Maksymalna długość to ${schema.maxLength} znaków`,
            code: 'MAX_LENGTH',
          });
        }
        if ('minLength' in schema && (schema as any).minLength && strVal.length < (schema as any).minLength) {
          errors.push({
            key: schema.key,
            message: `Minimalna długość to ${(schema as any).minLength} znaków`,
            code: 'MIN_LENGTH',
          });
        }
        break;
      }

      case 'number': {
        const numVal = Number(value);
        if (isNaN(numVal)) {
          errors.push({
            key: schema.key,
            message: 'Wartość musi być liczbą',
            code: 'INVALID_FORMAT',
          });
        } else {
          if ('min' in schema && schema.min !== undefined && numVal < schema.min) {
            errors.push({
              key: schema.key,
              message: `Minimalna wartość to ${schema.min}`,
              code: 'MIN_VALUE',
            });
          }
          if ('max' in schema && schema.max !== undefined && numVal > schema.max) {
            errors.push({
              key: schema.key,
              message: `Maksymalna wartość to ${schema.max}`,
              code: 'MAX_VALUE',
            });
          }
        }
        break;
      }

      case 'select':
      case 'multiselect': {
        if ('options' in schema) {
          const validValues = schema.options.map(o => o.value);
          const valToCheck = Array.isArray(value) ? value : [value];
          for (const v of valToCheck) {
            if (!validValues.includes(v)) {
              errors.push({
                key: schema.key,
                message: `"${String(v)}" nie jest prawidłową opcją`,
                code: 'INVALID_OPTION',
              });
            }
          }
        }
        break;
      }

      case 'color': {
        const colorStr = String(value);
        const hexColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
        if (!hexColor.test(colorStr)) {
          errors.push({
            key: schema.key,
            message: 'Nieprawidłowy format koloru (oczekiwano #hex)',
            code: 'INVALID_FORMAT',
          });
        }
        break;
      }

      default:
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Organize PropSchema[] into categories and groups.
   * Categories come from schema.group (e.g. "Typography", "Spacing").
   * Fields without a group go into "General" category.
   */
  static organizeByCategory(
    schema: ReadonlyArray<PropSchema>
  ): ReadonlyArray<InspectorCategory> {
    const categoryMap = new Map<string, PropSchema[]>();

    for (const field of schema) {
      const groupId = field.group ?? 'general';
      const existing = categoryMap.get(groupId) ?? [];
      existing.push(field);
      categoryMap.set(groupId, existing);
    }

    const categoryOrder = [
      'general', 'content', 'layout', 'spacing', 'typography',
      'background', 'border', 'shadow', 'effects', 'animation',
      'responsive', 'seo', 'accessibility', 'advanced',
    ];

    const categories: InspectorCategory[] = [];

    // Ordered categories first
    for (const catId of categoryOrder) {
      const fields = categoryMap.get(catId);
      if (!fields || fields.length === 0) continue;
      categoryMap.delete(catId);

      categories.push({
        id: catId,
        label: this.categoryLabel(catId),
        groups: [{
          id: catId,
          label: this.categoryLabel(catId),
          fields,
        }],
      });
    }

    // Remaining (custom) categories
    for (const [catId, fields] of categoryMap) {
      categories.push({
        id: catId,
        label: this.categoryLabel(catId),
        groups: [{
          id: catId,
          label: this.categoryLabel(catId),
          fields,
        }],
      });
    }

    return categories;
  }

  /**
   * Create a BuilderCommand from a property change.
   * Returns null if validation fails.
   */
  static createPropertyCommand(
    pageId: string,
    sectionId: string,
    schema: PropSchema,
    value: unknown
  ): BuilderCommand | null {
    // Validate
    const validation = this.validateValue(schema, value);
    if (!validation.valid) {
      return null;
    }

    // Return UPDATE_PROPS command
    return {
      type: 'UPDATE_PROPS',
      pageId,
      sectionId,
      props: { [schema.key]: value },
    } as BuilderCommand;
  }

  /**
   * Apply default values for missing props based on schema.
   */
  static applyDefaults(
    schema: ReadonlyArray<PropSchema>,
    currentProps: Record<string, unknown>
  ): Record<string, unknown> {
    const result = { ...currentProps };

    for (const field of schema) {
      if (field.defaultValue !== undefined && !(field.key in result)) {
        result[field.key] = field.defaultValue;
      }
    }

    return result;
  }

  /**
   * Get a human-readable label for a category ID.
   */
  static categoryLabel(categoryId: string): string {
    const labels: Record<string, string> = {
      general: 'Ogólne',
      content: 'Treść',
      layout: 'Układ',
      spacing: 'Odstępy',
      typography: 'Typografia',
      background: 'Tło',
      border: 'Obramowanie',
      shadow: 'Cień',
      effects: 'Efekty',
      animation: 'Animacja',
      responsive: 'Responsywność',
      seo: 'SEO',
      accessibility: 'Dostępność',
      advanced: 'Zaawansowane',
      custom: 'CSS',
    };
    return labels[categoryId] ?? categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
  }
}

