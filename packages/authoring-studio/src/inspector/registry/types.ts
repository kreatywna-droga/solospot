import type { FC } from 'react';

/**
 * Property Registry Types — Sprint 7.1 Inspector 2.0 Foundation
 *
 * Single source of truth for all property field definitions.
 * Each field MUST contain: id, label, description, defaultValue, validation, widget, category.
 *
 * @agent Agent 1 — Inspector Core Engineer
 * @status DRAFT — PENDING PM26
 */

// ---------------------------------------------------------------------------
// Breakpoint
// ---------------------------------------------------------------------------

export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

// ---------------------------------------------------------------------------
// Responsive Value
// ---------------------------------------------------------------------------

export interface ResponsiveValue<T> {
    desktop?: T;
    tablet?: T;
    mobile?: T;
}

export function resolveResponsiveValue<T>(
    value: T | ResponsiveValue<T>,
    breakpoint: Breakpoint
): T {
    if (!isResponsiveValue<T>(value)) {
        return value as T;
    }
    const rv = value as ResponsiveValue<T>;
    switch (breakpoint) {
        case 'desktop':
            return (rv.desktop !== undefined ? rv.desktop : value as T);
        case 'tablet':
            return (rv.tablet !== undefined ? rv.tablet : rv.desktop !== undefined ? rv.desktop : value as T);
        case 'mobile':
            return (rv.mobile !== undefined ? rv.mobile : rv.tablet !== undefined ? rv.tablet : rv.desktop !== undefined ? rv.desktop : value as T);
        default:
            return (rv.desktop !== undefined ? rv.desktop : value as T);
    }
}

export function isResponsiveValue<T>(value: unknown): value is ResponsiveValue<T> {
    return (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        ('desktop' in value || 'tablet' in value || 'mobile' in value)
    );
}

export function updateResponsiveValue<T>(
    current: T | ResponsiveValue<T>,
    breakpoint: Breakpoint,
    newValue: T
): ResponsiveValue<T> {
    const base: ResponsiveValue<T> = isResponsiveValue<T>(current)
        ? { ...current }
        : { desktop: current as T };
    base[breakpoint] = newValue;
    return base;
}

// ---------------------------------------------------------------------------
// Panel Category
// ---------------------------------------------------------------------------

export type PanelCategory =
    | 'layout'
    | 'typography'
    | 'appearance'
    | 'spacing'
    | 'border'
    | 'shadow'
    | 'animation'
    | 'advanced';

// ---------------------------------------------------------------------------
// Widget Types
// ---------------------------------------------------------------------------

export type WidgetType =
    | 'text'
    | 'textarea'
    | 'number'
    | 'range'
    | 'color'
    | 'select'
    | 'boolean'
    | 'radio'
    | 'spacing'
    | 'border'
    | 'shadow'
    | 'typography'
    | 'link'
    | 'image';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type ValidationResult = { valid: true } | { valid: false; error: string };

export type ValidationFn = (value: unknown) => ValidationResult;

// ---------------------------------------------------------------------------
// Property Field Definition
// ---------------------------------------------------------------------------

export interface PropertyFieldDefinition {
    id: string;
    label: string;
    description: string;
    defaultValue: unknown;
    validation: ValidationFn;
    widget: WidgetType;
    category: PanelCategory | (string & {});
    responsive?: boolean;
    options?: Array<{ value: unknown; label: string }>;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    unit?: string;
}

// ---------------------------------------------------------------------------
// Widget Component Contract
// ---------------------------------------------------------------------------

export interface WidgetProps<T = unknown> {
    value: T;
    onChange: (value: T) => void;
    field: PropertyFieldDefinition;
    breakpoint: Breakpoint;
}

export type WidgetComponent = FC<WidgetProps>;