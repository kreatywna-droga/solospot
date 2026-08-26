/**
 * MaskModel.ts — Sprint S20 Mask Domain Model (ETAP 1)
 *
 * Defines pure DTO data structures for AlphaMask, ClippingMask, ShapeMask, TextMask,
 * MaskMode, MaskOpacity, MaskTransform, and MaskReference.
 *
 * Headless model: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Transform2D, DEFAULT_LAYER_TRANSFORM } from '../scene/SceneGraphModel';

export type MaskMode =
  | 'alpha'
  | 'inverted-alpha'
  | 'luminance'
  | 'inverted-luminance'
  | 'clipping'
  | 'shape'
  | 'text';

export type MaskOpacity = number; // 0.0 - 1.0

export type MaskTransform = Transform2D;

export interface MaskReference {
  readonly id: string;
  readonly targetLayerId?: string;
  readonly sourceLayerId?: string;
  readonly maskMode: MaskMode;
}

export interface BaseMask {
  readonly id: string;
  readonly name: string;
  readonly type: 'alpha' | 'clipping' | 'shape' | 'text';
  readonly enabled: boolean;
  readonly opacity: MaskOpacity;
  readonly mode: MaskMode;
  readonly transform?: MaskTransform;
}

export interface AlphaMask extends BaseMask {
  readonly type: 'alpha';
  readonly sourceLayerId?: string;
  readonly imageSrc?: string;
}

export interface ClippingMask extends BaseMask {
  readonly type: 'clipping';
  readonly maskLayerId: string;
  readonly clipPath?: string;
}

export interface ShapeMask extends BaseMask {
  readonly type: 'shape';
  readonly shapeType: 'rectangle' | 'ellipse' | 'polygon' | 'path';
  readonly pathData?: string;
  readonly bounds?: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
}

export interface TextMask extends BaseMask {
  readonly type: 'text';
  readonly text: string;
  readonly font?: string;
  readonly fontSize?: number;
}

export type Mask = AlphaMask | ClippingMask | ShapeMask | TextMask;

export function createAlphaMask(params: {
  id: string;
  name?: string;
  enabled?: boolean;
  opacity?: number;
  mode?: MaskMode;
  sourceLayerId?: string;
  imageSrc?: string;
  transform?: Partial<MaskTransform>;
}): AlphaMask {
  return {
    id: params.id,
    name: params.name ?? `AlphaMask_${params.id}`,
    type: 'alpha',
    enabled: params.enabled ?? true,
    opacity: params.opacity ?? 1.0,
    mode: params.mode ?? 'alpha',
    sourceLayerId: params.sourceLayerId,
    imageSrc: params.imageSrc,
    transform: params.transform ? { ...DEFAULT_LAYER_TRANSFORM, ...params.transform } : undefined,
  };
}

export function createClippingMask(params: {
  id: string;
  maskLayerId: string;
  name?: string;
  enabled?: boolean;
  opacity?: number;
  clipPath?: string;
}): ClippingMask {
  return {
    id: params.id,
    name: params.name ?? `ClippingMask_${params.id}`,
    type: 'clipping',
    enabled: params.enabled ?? true,
    opacity: params.opacity ?? 1.0,
    mode: 'clipping',
    maskLayerId: params.maskLayerId,
    clipPath: params.clipPath,
  };
}

export function createShapeMask(params: {
  id: string;
  shapeType: 'rectangle' | 'ellipse' | 'polygon' | 'path';
  name?: string;
  enabled?: boolean;
  opacity?: number;
  pathData?: string;
  bounds?: { x: number; y: number; width: number; height: number };
  transform?: Partial<MaskTransform>;
}): ShapeMask {
  return {
    id: params.id,
    name: params.name ?? `ShapeMask_${params.id}`,
    type: 'shape',
    enabled: params.enabled ?? true,
    opacity: params.opacity ?? 1.0,
    mode: 'shape',
    shapeType: params.shapeType,
    pathData: params.pathData,
    bounds: params.bounds,
    transform: params.transform ? { ...DEFAULT_LAYER_TRANSFORM, ...params.transform } : undefined,
  };
}

export function createTextMask(params: {
  id: string;
  text: string;
  name?: string;
  enabled?: boolean;
  opacity?: number;
  font?: string;
  fontSize?: number;
  transform?: Partial<MaskTransform>;
}): TextMask {
  return {
    id: params.id,
    name: params.name ?? `TextMask_${params.id}`,
    type: 'text',
    enabled: params.enabled ?? true,
    opacity: params.opacity ?? 1.0,
    mode: 'text',
    text: params.text,
    font: params.font,
    fontSize: params.fontSize,
    transform: params.transform ? { ...DEFAULT_LAYER_TRANSFORM, ...params.transform } : undefined,
  };
}
