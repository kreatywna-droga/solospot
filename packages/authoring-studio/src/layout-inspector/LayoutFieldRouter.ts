/**
 * LayoutFieldRouter.ts — Sprint S30 Field Routing Engine
 *
 * Routes Inspector fieldIds (e.g. 'layout.gap', 'layout.left') to S29 DTO keys
 * or S28 responsive override keys based on target breakpoint and property capability.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { NodePropertyOverride } from '../responsive/ResponsiveOverrideEngine';

export interface FieldRoute {
  readonly kind: 'style' | 'constraint' | 'sizing';
  readonly key: string;
  readonly responsive?: {
    readonly breakpointKey: keyof NodePropertyOverride;
    readonly uniformSides?: boolean;
  };
}

const ROUTE_TABLE: Record<string, FieldRoute> = {
  'layout.mode': { kind: 'style', key: 'mode' },
  'layout.direction': {
    kind: 'style',
    key: 'direction',
    responsive: { breakpointKey: 'flexDirection' },
  },
  'layout.gap': {
    kind: 'style',
    key: 'gap',
    responsive: { breakpointKey: 'gap' },
  },
  'layout.paddingTop': {
    kind: 'style',
    key: 'paddingTop',
    responsive: { breakpointKey: 'padding', uniformSides: true },
  },
  'layout.paddingRight': {
    kind: 'style',
    key: 'paddingRight',
    responsive: { breakpointKey: 'padding', uniformSides: true },
  },
  'layout.paddingBottom': {
    kind: 'style',
    key: 'paddingBottom',
    responsive: { breakpointKey: 'padding', uniformSides: true },
  },
  'layout.paddingLeft': {
    kind: 'style',
    key: 'paddingLeft',
    responsive: { breakpointKey: 'padding', uniformSides: true },
  },
  'layout.alignItems': { kind: 'style', key: 'alignItems' },
  'layout.justifyContent': { kind: 'style', key: 'justifyContent' },
  'layout.wrap': { kind: 'style', key: 'wrap' },

  'layout.left': {
    kind: 'constraint',
    key: 'left',
    responsive: { breakpointKey: 'x' },
  },
  'layout.right': { kind: 'constraint', key: 'right' },
  'layout.top': {
    kind: 'constraint',
    key: 'top',
    responsive: { breakpointKey: 'y' },
  },
  'layout.bottom': { kind: 'constraint', key: 'bottom' },
  'layout.centerX': { kind: 'constraint', key: 'centerX' },
  'layout.centerY': { kind: 'constraint', key: 'centerY' },
  'layout.width': {
    kind: 'constraint',
    key: 'width',
    responsive: { breakpointKey: 'width' },
  },
  'layout.height': {
    kind: 'constraint',
    key: 'height',
    responsive: { breakpointKey: 'height' },
  },
  'layout.minWidth': { kind: 'constraint', key: 'minWidth' },
  'layout.maxWidth': { kind: 'constraint', key: 'maxWidth' },
  'layout.minHeight': { kind: 'constraint', key: 'minHeight' },
  'layout.maxHeight': { kind: 'constraint', key: 'maxHeight' },
  'layout.aspectRatio': { kind: 'constraint', key: 'aspectRatio' },

  'layout.sizingWidth': { kind: 'sizing', key: 'width' },
  'layout.sizingHeight': { kind: 'sizing', key: 'height' },
};

/**
 * Returns the FieldRoute for a given layout fieldId.
 */
export function routeFieldChange(fieldId: string): FieldRoute | undefined {
  return ROUTE_TABLE[fieldId];
}
