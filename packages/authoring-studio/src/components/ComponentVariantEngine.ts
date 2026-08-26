/**
 * ComponentVariantEngine.ts — Sprint S32 Component Variant Resolution Engine
 *
 * Merges base preset defaultProps, active variant overrides, node-specific props,
 * and layout style / constraint overrides into an effective ResolvedComponentProps object.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { SectionNode } from '../../../builder-core/src/BuilderDocument';
import type { LayoutStyle } from '../layout/LayoutModel';
import type { LayoutConstraints } from '../layout/ConstraintModel';
import type { ComponentPreset, ComponentVariant } from './ComponentPresetModel';
import { ComponentPresetRegistry } from './ComponentPresetRegistry';

export interface ResolvedComponentProps {
  readonly componentId: string;
  readonly activeVariantId: string;
  readonly preset: ComponentPreset;
  readonly variant: ComponentVariant;
  readonly effectiveProps: Record<string, unknown>;
  readonly effectiveLayoutStyle: Partial<LayoutStyle>;
  readonly effectiveLayoutConstraints: Partial<LayoutConstraints>;
}

export function resolveComponentVariant(
  node: SectionNode,
  registry: ComponentPresetRegistry = new ComponentPresetRegistry()
): ResolvedComponentProps | undefined {
  const componentId = (node.props?.componentId as string) ?? undefined;
  if (!componentId) {
    return undefined;
  }

  const preset = registry.getPreset(componentId);
  if (!preset) {
    return undefined;
  }

  const activeVariantId = (node.props?.variant as string) ?? preset.defaultVariantId;
  const variant = preset.variants.find((v) => v.id === activeVariantId) ?? preset.variants[0];

  // Merge order: preset defaults -> variant overrides -> node props
  const effectiveProps: Record<string, unknown> = {
    ...preset.defaultProps,
    ...variant.overrideProps,
    ...node.props,
  };

  const effectiveLayoutStyle: Partial<LayoutStyle> = {
    ...(preset.defaultLayoutStyle ?? {}),
    ...(variant.overrideLayoutStyle ?? {}),
    ...((node.props.layoutStyle as Partial<LayoutStyle>) ?? {}),
  };

  const effectiveLayoutConstraints: Partial<LayoutConstraints> = {
    ...(preset.defaultLayoutConstraints ?? {}),
    ...(variant.overrideLayoutConstraints ?? {}),
    ...((node.props.layoutConstraints as Partial<LayoutConstraints>) ?? {}),
  };

  return {
    componentId,
    activeVariantId: variant.id,
    preset,
    variant,
    effectiveProps,
    effectiveLayoutStyle,
    effectiveLayoutConstraints,
  };
}
