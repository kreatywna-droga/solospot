/**
 * LayoutModel.ts — Sprint S29 Layout DTO & Default Models
 *
 * Pure-domain layout DTOs: LayoutMode, LayoutDirection, Alignment, Distribution,
 * SizingMode, LayoutRect, LayoutSize, LayoutPosition, LayoutEdgeInsets, LayoutStyle.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

export type LayoutMode = 'auto' | 'free';

export type LayoutDirection = 'horizontal' | 'vertical';

export type Alignment = 'start' | 'center' | 'end' | 'stretch';

export type Distribution =
  | 'start'
  | 'center'
  | 'end'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

export type SizingMode = 'fixed' | 'fill' | 'fit' | 'stretch';

export interface LayoutPosition {
  readonly x: number;
  readonly y: number;
}

export interface LayoutSize {
  readonly width: number;
  readonly height: number;
}

export interface LayoutRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface LayoutEdgeInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export const ZERO_EDGE_INSETS: LayoutEdgeInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export function createLayoutRect(params: {
  x: number;
  y: number;
  width: number;
  height: number;
}): LayoutRect {
  return {
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height,
  };
}

export function createLayoutSize(params?: {
  width?: number;
  height?: number;
}): LayoutSize {
  return {
    width: params?.width ?? 0,
    height: params?.height ?? 0,
  };
}

/**
 * LayoutStyle — container-level auto layout configuration, stored immutably
 * under `node.props.layoutStyle`.
 */
export interface LayoutStyle {
  readonly mode: LayoutMode;
  readonly direction: LayoutDirection;
  readonly gap: number;
  readonly paddingTop: number;
  readonly paddingRight: number;
  readonly paddingBottom: number;
  readonly paddingLeft: number;
  readonly alignItems: Alignment;
  readonly justifyContent: Distribution;
  readonly wrap: boolean;
}

export const DEFAULT_LAYOUT_STYLE: LayoutStyle = {
  mode: 'auto',
  direction: 'vertical',
  gap: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  alignItems: 'start',
  justifyContent: 'start',
  wrap: false,
};

/**
 * Creates an immutable LayoutStyle DTO with defaults, merging a uniform `padding`
 * before per-side overrides where provided.
 */
export function createLayoutStyle(params?: Partial<LayoutStyle> & {
  padding?: number;
}): LayoutStyle {
  return {
    ...DEFAULT_LAYOUT_STYLE,
    ...(params == null ? {} : params),
    paddingTop: params?.paddingTop ?? params?.padding ?? DEFAULT_LAYOUT_STYLE.paddingTop,
    paddingRight: params?.paddingRight ?? params?.padding ?? DEFAULT_LAYOUT_STYLE.paddingRight,
    paddingBottom: params?.paddingBottom ?? params?.padding ?? DEFAULT_LAYOUT_STYLE.paddingBottom,
    paddingLeft: params?.paddingLeft ?? params?.padding ?? DEFAULT_LAYOUT_STYLE.paddingLeft,
  };
}

/**
 * Default rect of the root (page) canvas for a resolved layout tree.
 * Deterministic constant — the page container always starts at (0,0).
 */
export const PAGE_DEFAULT_HEIGHT = 900;

/** Insets a LayoutRect by uniform per-side padding. */
export function insetRect(rect: LayoutRect, insets: LayoutEdgeInsets): LayoutRect {
  return createLayoutRect({
    x: rect.x + insets.left,
    y: rect.y + insets.top,
    width: Math.max(0, rect.width - insets.left - insets.right),
    height: Math.max(0, rect.height - insets.top - insets.bottom),
  });
}