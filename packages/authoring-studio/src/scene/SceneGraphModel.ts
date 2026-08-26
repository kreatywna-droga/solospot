/**
 * SceneGraphModel.ts — Sprint S19 Scene Graph & Domain Model (ETAP 1)
 *
 * Defines pure DTO data structures for Scene, Layer, LayerGroup, LayerOrder,
 * Parent/Child relationships, Visibility, Lock, Solo, Isolate, BlendMode,
 * and ClippingGroup models.
 *
 * Headless model, NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export type LayerType =
  | 'group'
  | 'vector'
  | 'rectangle'
  | 'ellipse'
  | 'polygon'
  | 'line'
  | 'path'
  | 'text'
  | 'image'
  | 'media'
  | 'section'
  | 'container';

export interface Transform2D {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotationDeg: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly skewX: number;
  readonly skewY: number;
}

export const DEFAULT_LAYER_TRANSFORM: Transform2D = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotationDeg: 0,
  scaleX: 1,
  scaleY: 1,
  skewX: 0,
  skewY: 0,
};

export interface ClippingGroup {
  readonly maskLayerId: string;
  readonly clippedLayerIds: ReadonlyArray<string>;
  readonly clipPath?: string;
}

import { Mask } from '../masks/MaskModel';
import { EffectDescriptor } from '../effects/EffectModel';

export interface BaseLayer {
  readonly id: string;
  readonly name: string;
  readonly type: LayerType;
  readonly parentId?: string;
  readonly childIds: ReadonlyArray<string>;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly solo: boolean;
  readonly isolate: boolean;
  readonly opacity: number; // 0.0 - 1.0
  readonly blendMode: BlendMode;
  readonly transform: Transform2D;
  readonly clippingGroup?: ClippingGroup;
  readonly maskStack?: ReadonlyArray<Mask>;
  readonly effectStack?: ReadonlyArray<EffectDescriptor>;
  readonly nodeRefId?: string; // Reference to SectionNode / VectorNode in BuilderDocument
  readonly props?: Record<string, unknown>;
}

export interface LayerGroup extends BaseLayer {
  readonly type: 'group';
  readonly isExpanded?: boolean;
}

export type Layer = BaseLayer | LayerGroup;

export interface LayerOrder {
  readonly rootIds: ReadonlyArray<string>;
  readonly zIndexMap: Readonly<Record<string, number>>;
}

export interface Scene {
  readonly id: string;
  readonly name: string;
  readonly layers: Readonly<Record<string, Layer>>;
  readonly rootLayerIds: ReadonlyArray<string>;
  readonly activeSelectionIds: ReadonlyArray<string>;
  readonly soloLayerIds: ReadonlyArray<string>;
  readonly isolatedLayerId?: string;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
}

export function createScene(params: string | {
  id: string;
  name?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  layers?: Record<string, Layer>;
  rootLayerIds?: string[];
}): Scene {
  const p = typeof params === 'string' ? { id: params } : params;
  return {
    id: p.id,
    name: p.name ?? `Scene_${p.id}`,
    layers: p.layers ?? {},
    rootLayerIds: p.rootLayerIds ?? [],
    activeSelectionIds: [],
    soloLayerIds: [],
    isolatedLayerId: undefined,
    viewportWidth: p.viewportWidth ?? 1920,
    viewportHeight: p.viewportHeight ?? 1080,
  };
}

export function createLayer(params: {
  id: string;
  name?: string;
  type?: LayerType;
  parentId?: string;
  transform?: Partial<Transform2D> & { position?: { x: number; y: number }; rotation?: number; scale?: { x: number; y: number } };
  opacity?: number;
  blendMode?: BlendMode;
  visible?: boolean;
  locked?: boolean;
  solo?: boolean;
  isolate?: boolean;
  maskStack?: Mask[];
  effectStack?: EffectDescriptor[];
  nodeRefId?: string;
  props?: Record<string, unknown>;
  bounds?: { x: number; y: number; width: number; height: number };
}): Layer {
  const t = params.transform as any;
  const resolvedTransform: Transform2D = {
    ...DEFAULT_LAYER_TRANSFORM,
    ...(params.transform ?? {}),
    x: t?.x ?? t?.position?.x ?? DEFAULT_LAYER_TRANSFORM.x,
    y: t?.y ?? t?.position?.y ?? DEFAULT_LAYER_TRANSFORM.y,
    rotationDeg: t?.rotationDeg ?? t?.rotation ?? DEFAULT_LAYER_TRANSFORM.rotationDeg,
    scaleX: t?.scaleX ?? t?.scale?.x ?? DEFAULT_LAYER_TRANSFORM.scaleX,
    scaleY: t?.scaleY ?? t?.scale?.y ?? DEFAULT_LAYER_TRANSFORM.scaleY,
  };

  return {
    id: params.id,
    name: params.name ?? `Layer_${params.id}`,
    type: params.type ?? 'vector',
    parentId: params.parentId,
    childIds: [],
    visible: params.visible ?? true,
    locked: params.locked ?? false,
    solo: params.solo ?? false,
    isolate: params.isolate ?? false,
    opacity: params.opacity ?? 1.0,
    blendMode: params.blendMode ?? 'normal',
    transform: resolvedTransform,
    maskStack: params.maskStack ?? [],
    effectStack: params.effectStack ?? [],
    nodeRefId: params.nodeRefId,
    props: params.props ?? {},
  };
}

export function createLayerGroup(params: {
  id: string;
  name?: string;
  parentId?: string;
  childIds?: string[];
  transform?: Partial<Transform2D>;
  opacity?: number;
  blendMode?: BlendMode;
  visible?: boolean;
  locked?: boolean;
  solo?: boolean;
  isolate?: boolean;
  isExpanded?: boolean;
  maskStack?: Mask[];
  effectStack?: EffectDescriptor[];
}): LayerGroup {
  return {
    id: params.id,
    name: params.name ?? `Group_${params.id}`,
    type: 'group',
    parentId: params.parentId,
    childIds: params.childIds ?? [],
    visible: params.visible ?? true,
    locked: params.locked ?? false,
    solo: params.solo ?? false,
    isolate: params.isolate ?? false,
    opacity: params.opacity ?? 1.0,
    blendMode: params.blendMode ?? 'normal',
    transform: { ...DEFAULT_LAYER_TRANSFORM, ...params.transform },
    isExpanded: params.isExpanded ?? true,
    maskStack: params.maskStack ?? [],
    effectStack: params.effectStack ?? [],
  };
}

export type SceneLayerNode = Layer;

export function findLayerNode(scene: Scene, id: string): Layer | undefined {
  return scene.layers[id];
}

export function updateLayerNode(scene: Scene, layer: Layer): Scene {
  return {
    ...scene,
    layers: {
      ...scene.layers,
      [layer.id]: layer,
    },
  };
}

export function updateLayer(
  scene: Scene,
  id: string,
  updates: Partial<Layer>
): Scene {
  const current = scene.layers[id];
  if (!current) return scene;
  return {
    ...scene,
    layers: {
      ...scene.layers,
      [id]: {
        ...current,
        ...updates,
        transform: {
          ...current.transform,
          ...(updates.transform ?? {}),
        },
      } as Layer,
    },
  };
}

export function addLayer(scene: Scene, layer: Layer | Parameters<typeof createLayer>[0]): Scene {
  const resolvedLayer: Layer =
    'childIds' in layer && 'transform' in layer && typeof (layer.transform as any).x === 'number'
      ? (layer as Layer)
      : createLayer(layer as any);

  return {
    ...scene,
    layers: {
      ...scene.layers,
      [resolvedLayer.id]: resolvedLayer,
    },
    rootLayerIds: scene.rootLayerIds.includes(resolvedLayer.id)
      ? scene.rootLayerIds
      : [...scene.rootLayerIds, resolvedLayer.id],
  };
}

export function removeLayer(scene: Scene, id: string): Scene {
  const { [id]: _, ...remaining } = scene.layers;
  return {
    ...scene,
    layers: remaining,
    rootLayerIds: scene.rootLayerIds.filter((r) => r !== id),
  };
}

export const SceneGraphModel = {
  createScene,
  createLayer,
  createLayerGroup,
  findLayerNode,
  updateLayerNode,
  updateLayer,
  addLayer,
  removeLayer,
};
