/**
 * MaskStackEngine.ts — Sprint S20 / G1-21 Mask Stack Operations Engine
 *
 * Implements pure, headless, immutable operations for:
 * Layer → Mask Stack → Effect Stack → Compositing → RenderingEngine
 *
 * Provides deterministic mask stack ordering, add, remove, reorder, toggle, update,
 * duplicate, reset, copy/paste, clipping hierarchy generation, bounds resolution,
 * and animated property evaluation.
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Layer, Transform2D, ClippingGroup, DEFAULT_LAYER_TRANSFORM } from '../scene/SceneGraphModel';
import {
  Mask,
  AlphaMask,
  ClippingMask,
  ShapeMask,
  TextMask,
  MaskMode,
  createAlphaMask,
  createClippingMask,
  createShapeMask,
  createTextMask,
} from './MaskModel';

export interface MaskAnimatableProperties {
  readonly opacity?: number;
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly rotationDeg?: number;
  readonly scaleX?: number;
  readonly scaleY?: number;
  readonly skewX?: number;
  readonly skewY?: number;
}

export interface MaskBounds2D {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export class MaskStackEngine {
  /**
   * Adds a mask to the layer's mask stack immutably.
   */
  public static addMask(layer: Layer, mask: Mask): Layer {
    const currentStack = layer.maskStack ?? [];
    return {
      ...layer,
      maskStack: [...currentStack, mask],
    };
  }

  /**
   * Removes a mask by ID from the layer's mask stack.
   */
  public static removeMask(layer: Layer, maskId: string): Layer {
    const currentStack = layer.maskStack ?? [];
    return {
      ...layer,
      maskStack: currentStack.filter((m) => m.id !== maskId),
    };
  }

  /**
   * Reorders a mask within the stack to a target index.
   */
  public static reorderMask(layer: Layer, maskId: string, targetIndex: number): Layer {
    const currentStack = [...(layer.maskStack ?? [])];
    const currentIndex = currentStack.findIndex((m) => m.id === maskId);
    if (currentIndex === -1) return layer;

    const [removed] = currentStack.splice(currentIndex, 1);
    const validIndex = Math.max(0, Math.min(targetIndex, currentStack.length));
    currentStack.splice(validIndex, 0, removed);

    return {
      ...layer,
      maskStack: currentStack,
    };
  }

  /**
   * Toggles a mask enabled/disabled status.
   */
  public static toggleMask(layer: Layer, maskId: string, enabled?: boolean): Layer {
    const currentStack = layer.maskStack ?? [];
    return {
      ...layer,
      maskStack: currentStack.map((m) => {
        if (m.id === maskId) {
          const nextEnabled = enabled !== undefined ? enabled : !m.enabled;
          return { ...m, enabled: nextEnabled };
        }
        return m;
      }),
    };
  }

  /**
   * Updates mask properties by ID.
   */
  public static updateMask(layer: Layer, maskId: string, updates: Partial<Mask>): Layer {
    const currentStack = layer.maskStack ?? [];
    return {
      ...layer,
      maskStack: currentStack.map((m) => {
        if (m.id === maskId) {
          return { ...m, ...updates } as Mask;
        }
        return m;
      }),
    };
  }

  /**
   * Duplicates a mask in the layer stack with a new unique ID.
   */
  public static duplicateMask(layer: Layer, maskId: string, newId?: string): Layer {
    const currentStack = layer.maskStack ?? [];
    const target = currentStack.find((m) => m.id === maskId);
    if (!target) return layer;

    const generatedId = newId ?? `${target.id}_copy_${Date.now()}`;
    const clonedMask: Mask = {
      ...target,
      id: generatedId,
      name: `${target.name} (Copy)`,
    };

    return {
      ...layer,
      maskStack: [...currentStack, clonedMask],
    };
  }

  /**
   * Resets (clears) all masks on a layer.
   */
  public static resetMasks(layer: Layer): Layer {
    return {
      ...layer,
      maskStack: [],
    };
  }

  /**
   * Copies the mask stack from sourceLayer and applies to targetLayer.
   */
  public static copyPasteMasks(sourceLayer: Layer, targetLayer: Layer): Layer {
    const sourceStack = sourceLayer.maskStack ?? [];
    const clonedStack = sourceStack.map((mask, index) => ({
      ...mask,
      id: `${targetLayer.id}_mask_${index + 1}_${Date.now()}`,
    }));

    return {
      ...targetLayer,
      maskStack: [...(targetLayer.maskStack ?? []), ...clonedStack],
    };
  }

  /**
   * Creates a ClippingGroup linking a mask layer to one or more clipped child layers.
   */
  public static createClippingGroup(
    maskLayer: Layer,
    clippedLayerIds: ReadonlyArray<string>,
    clipPath?: string
  ): ClippingGroup {
    return {
      maskLayerId: maskLayer.id,
      clippedLayerIds: [...clippedLayerIds],
      clipPath,
    };
  }

  /**
   * Resolves the effective 2D bounding box of a mask, considering layer transform.
   */
  public static resolveEffectiveMaskBounds(
    mask: Mask,
    layerTransform: Transform2D = DEFAULT_LAYER_TRANSFORM
  ): MaskBounds2D {
    const maskTransform = mask.transform ?? DEFAULT_LAYER_TRANSFORM;
    const combinedX = layerTransform.x + maskTransform.x;
    const combinedY = layerTransform.y + maskTransform.y;
    const combinedWidth = maskTransform.width * layerTransform.scaleX * maskTransform.scaleX;
    const combinedHeight = maskTransform.height * layerTransform.scaleY * maskTransform.scaleY;

    if (mask.type === 'shape' && mask.bounds) {
      return {
        x: combinedX + mask.bounds.x,
        y: combinedY + mask.bounds.y,
        width: mask.bounds.width * maskTransform.scaleX,
        height: mask.bounds.height * maskTransform.scaleY,
      };
    }

    return {
      x: combinedX,
      y: combinedY,
      width: Math.max(0, combinedWidth),
      height: Math.max(0, combinedHeight),
    };
  }

  /**
   * Evaluates animatable properties on a mask DTO at playhead time t.
   */
  public static evaluateMaskAtTime(
    mask: Mask,
    animProps: MaskAnimatableProperties
  ): Mask {
    const currentTransform = mask.transform ?? DEFAULT_LAYER_TRANSFORM;
    const updatedTransform: Transform2D = {
      ...currentTransform,
      x: animProps.x ?? currentTransform.x,
      y: animProps.y ?? currentTransform.y,
      width: animProps.width !== undefined ? Math.max(1, animProps.width) : currentTransform.width,
      height: animProps.height !== undefined ? Math.max(1, animProps.height) : currentTransform.height,
      rotationDeg: animProps.rotationDeg ?? currentTransform.rotationDeg,
      scaleX: animProps.scaleX ?? currentTransform.scaleX,
      scaleY: animProps.scaleY ?? currentTransform.scaleY,
      skewX: animProps.skewX ?? currentTransform.skewX,
      skewY: animProps.skewY ?? currentTransform.skewY,
    };

    const updatedOpacity = animProps.opacity !== undefined
      ? Math.max(0, Math.min(1, animProps.opacity))
      : mask.opacity;

    return {
      ...mask,
      opacity: updatedOpacity,
      transform: updatedTransform,
    } as Mask;
  }
}
