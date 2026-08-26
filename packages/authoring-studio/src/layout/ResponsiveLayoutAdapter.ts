/**
 * ResponsiveLayoutAdapter.ts — Sprint S29 ↔ S28 Responsive Integration Boundary
 *
 * Resolves effective layout data for a SectionNode at a given breakpoint by reusing
 * the real S28 pipeline (BreakpointRegistry + resolveEffectiveNodeProperty). S29 NEVER
 * re-derives breakpoints; it receives already-resolved values from S28.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { SectionNode } from '../../../builder-core/src/BuilderDocument';
import { BreakpointRegistry } from '../responsive/BreakpointRegistry';
import { resolveEffectiveNodeProperty } from '../responsive/ResponsiveOverrideEngine';
import type { BreakpointId } from '../responsive/ResponsiveValueModel';
import {
  DEFAULT_LAYOUT_STYLE,
  createLayoutSize,
  type LayoutSize,
  type LayoutStyle,
} from './LayoutModel';
import {
  createLayoutConstraints,
  numericLength,
  type LayoutConstraints,
  type LayoutSizing,
} from './ConstraintModel';

export interface EffectiveNodeLayout {
  readonly style: LayoutStyle;
  readonly constraints: LayoutConstraints;
  readonly intrinsic: LayoutSize;
  /** True when the effective responsive `display` resolves to `none`. */
  readonly excluded: boolean;
}

/**
 * Resolves the breakpoint id for a numeric viewport width using the REAL S28
 * BreakpointRegistry built-ins (desktop 1440, laptop 1024, tablet 768, mobile 375, …).
 */
export function resolveBreakpointForViewport(viewportWidthPx: number): BreakpointId {
  return new BreakpointRegistry().resolveBreakpointForWidth(viewportWidthPx);
}

type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

/**
 * Builds the effective layout description of a node at a breakpoint.
 *
 * Storage contract (SSOT = BuilderDocument):
 *   - static S29 data stored in `node.props.layoutStyle` / `node.props.layoutConstraints`
 *   - responsive S28 overrides stored in `node.props.responsiveOverrides`
 */
export function buildEffectiveNodeLayout(
  node: SectionNode,
  breakpointId: BreakpointId
): EffectiveNodeLayout {
  const props = (node.props as Record<string, unknown> | undefined) ?? {};
  const storedStyle = props.layoutStyle as Partial<LayoutStyle> | undefined;
  const storedConstraints = props.layoutConstraints as
    | Partial<Omit<LayoutConstraints, 'sizing'> & { sizing?: Partial<LayoutSizing> }>
    | undefined;

  const style: Mutable<LayoutStyle> = {
    ...DEFAULT_LAYOUT_STYLE,
    ...(storedStyle ?? {}),
  };

  const constraints: Mutable<LayoutConstraints> = createLayoutConstraints(storedConstraints);

  // -- S28 responsive overlays (real cascade via resolveEffectiveNodeProperty) --
  const responsiveGap = resolveEffectiveNodeProperty(node, 'gap', breakpointId);
  if (responsiveGap !== undefined) {
    style.gap = responsiveGap;
  }

  const responsivePadding = resolveEffectiveNodeProperty(node, 'padding', breakpointId);
  if (responsivePadding !== undefined) {
    style.paddingTop = responsivePadding;
    style.paddingRight = responsivePadding;
    style.paddingBottom = responsivePadding;
    style.paddingLeft = responsivePadding;
  }

  const responsiveFlexDirection = resolveEffectiveNodeProperty(node, 'flexDirection', breakpointId);
  if (responsiveFlexDirection !== undefined) {
    style.direction = responsiveFlexDirection === 'column' ? 'vertical' : 'horizontal';
  }

  const responsiveDisplay = resolveEffectiveNodeProperty(node, 'display', breakpointId);
  const excluded = responsiveDisplay === 'none';

  const responsiveWidth = resolveEffectiveNodeProperty(node, 'width', breakpointId);
  if (responsiveWidth !== undefined) {
    constraints.width = responsiveWidth;
  }

  const responsiveHeight = resolveEffectiveNodeProperty(node, 'height', breakpointId);
  if (responsiveHeight !== undefined) {
    constraints.height = responsiveHeight;
  }

  const responsiveX = resolveEffectiveNodeProperty(node, 'x', breakpointId);
  if (responsiveX !== undefined) {
    constraints.left = responsiveX;
  }

  const responsiveY = resolveEffectiveNodeProperty(node, 'y', breakpointId);
  if (responsiveY !== undefined) {
    constraints.top = responsiveY;
  }

  // -- Intrinsic measurement fallback from base node props -------------------
  const intrinsic = createLayoutSize({
    width: numericLength(props.width as number | string | undefined) ?? 0,
    height: numericLength(props.height as number | string | undefined) ?? 0,
  });

  return { style, constraints, intrinsic, excluded };
}