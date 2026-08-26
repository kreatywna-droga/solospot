/**
 * ComponentPresetModel.ts — Sprint S32 Component Presets & Slot Composition Models
 *
 * Defines pure DTO data structures for ComponentPresets, ComponentVariants, ComponentSlotDefinitions,
 * and pre-configured template presets.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { ComponentCategory } from '../../../component-runtime/src/ComponentTypes';
import type { LayoutStyle } from '../layout/LayoutModel';
import type { LayoutConstraints } from '../layout/ConstraintModel';

export interface ComponentVariant {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly overrideProps: Record<string, unknown>;
  readonly overrideLayoutStyle?: Partial<LayoutStyle>;
  readonly overrideLayoutConstraints?: Partial<LayoutConstraints>;
}

export interface ComponentSlotDefinition {
  readonly name: string;
  readonly label: string;
  readonly allowedTypes: ReadonlyArray<string>;
  readonly minChildren?: number;
  readonly maxChildren?: number;
}

export interface ComponentPreset {
  readonly id: string;
  readonly category: ComponentCategory;
  readonly name: string;
  readonly description?: string;
  readonly defaultProps: Record<string, unknown>;
  readonly defaultLayoutStyle?: Partial<LayoutStyle>;
  readonly defaultLayoutConstraints?: Partial<LayoutConstraints>;
  readonly defaultResponsiveOverrides?: Record<string, unknown>;
  readonly variants: ReadonlyArray<ComponentVariant>;
  readonly defaultVariantId: string;
  readonly slots: ReadonlyArray<ComponentSlotDefinition>;
}

export function createComponentPreset(params: {
  id: string;
  category: ComponentCategory;
  name: string;
  description?: string;
  defaultProps?: Record<string, unknown>;
  defaultLayoutStyle?: Partial<LayoutStyle>;
  defaultLayoutConstraints?: Partial<LayoutConstraints>;
  defaultResponsiveOverrides?: Record<string, unknown>;
  variants?: ReadonlyArray<ComponentVariant>;
  defaultVariantId?: string;
  slots?: ReadonlyArray<ComponentSlotDefinition>;
}): ComponentPreset {
  const variants = params.variants ?? [
    {
      id: 'default',
      name: 'Default Variant',
      overrideProps: {},
    },
  ];

  return {
    id: params.id,
    category: params.category,
    name: params.name,
    description: params.description,
    defaultProps: params.defaultProps ?? {},
    defaultLayoutStyle: params.defaultLayoutStyle,
    defaultLayoutConstraints: params.defaultLayoutConstraints,
    defaultResponsiveOverrides: params.defaultResponsiveOverrides,
    variants,
    defaultVariantId: params.defaultVariantId ?? variants[0].id,
    slots: params.slots ?? [],
  };
}
