/**
 * EffectStackEngine.ts — Sprint S20 Effect Stack Operations Engine (ETAP 3)
 *
 * Implements pure headless operations for:
 * Layer → Mask Stack → Effect Stack → Compositing → RenderingEngine
 *
 * Provides deterministic stack ordering, add, remove, reorder, toggle, update, reset, and copy/paste.
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Layer, Scene } from '../scene/SceneGraphModel';
import { Mask } from '../masks/MaskModel';
import {
  EffectDescriptor,
  createBlurEffect,
  createColorAdjustmentEffect,
  createDropShadowEffect,
  createGlowEffect,
  createInnerShadowEffect,
  createOpacityEffect,
} from './EffectModel';

export class EffectStackEngine {
  /**
   * Adds an effect to the layer's effect stack.
   */
  public static addEffect(layer: Layer, effect: EffectDescriptor): Layer {
    const currentStack = layer.effectStack ?? [];
    return {
      ...layer,
      effectStack: [...currentStack, effect],
    };
  }

  /**
   * Removes an effect by ID from the layer's effect stack.
   */
  public static removeEffect(layer: Layer, effectId: string): Layer {
    const currentStack = layer.effectStack ?? [];
    return {
      ...layer,
      effectStack: currentStack.filter((fx) => fx.id !== effectId),
    };
  }

  /**
   * Reorders an effect within the stack to a target index.
   */
  public static reorderEffect(layer: Layer, effectId: string, targetIndex: number): Layer {
    const currentStack = [...(layer.effectStack ?? [])];
    const currentIndex = currentStack.findIndex((fx) => fx.id === effectId);
    if (currentIndex === -1) return layer;

    const [removed] = currentStack.splice(currentIndex, 1);
    const validIndex = Math.max(0, Math.min(targetIndex, currentStack.length));
    currentStack.splice(validIndex, 0, removed);

    return {
      ...layer,
      effectStack: currentStack,
    };
  }

  /**
   * Toggles the enabled/disabled state of an effect.
   */
  public static toggleEffect(layer: Layer, effectId: string, enabled?: boolean): Layer {
    const currentStack = layer.effectStack ?? [];
    const updatedStack = currentStack.map((fx) => {
      if (fx.id === effectId) {
        return {
          ...fx,
          enabled: enabled !== undefined ? enabled : !fx.enabled,
        };
      }
      return fx;
    });

    return {
      ...layer,
      effectStack: updatedStack,
    };
  }

  /**
   * Updates properties of a target effect within the stack.
   */
  public static updateEffect(
    layer: Layer,
    effectId: string,
    updates: Partial<EffectDescriptor>
  ): Layer {
    const currentStack = layer.effectStack ?? [];
    const updatedStack = currentStack.map((fx) => {
      if (fx.id === effectId) {
        return {
          ...fx,
          ...updates,
        } as EffectDescriptor;
      }
      return fx;
    });

    return {
      ...layer,
      effectStack: updatedStack,
    };
  }

  /**
   * Resets an effect to its default initial configuration parameters.
   */
  public static resetEffect(layer: Layer, effectId: string): Layer {
    const currentStack = layer.effectStack ?? [];
    const updatedStack = currentStack.map((fx) => {
      if (fx.id === effectId) {
        switch (fx.type) {
          case 'blur':
            return createBlurEffect({ id: fx.id, name: fx.name });
          case 'drop-shadow':
            return createDropShadowEffect({ id: fx.id, name: fx.name });
          case 'inner-shadow':
            return createInnerShadowEffect({ id: fx.id, name: fx.name });
          case 'glow':
            return createGlowEffect({ id: fx.id, name: fx.name });
          case 'color-adjustment':
            return createColorAdjustmentEffect({ id: fx.id, name: fx.name });
          case 'opacity':
            return createOpacityEffect({ id: fx.id, name: fx.name });
        }
      }
      return fx;
    });

    return {
      ...layer,
      effectStack: updatedStack,
    };
  }

  /**
   * Copies the effect stack from a layer (clones descriptors with new IDs).
   */
  public static copyEffectStack(layer: Layer): ReadonlyArray<EffectDescriptor> {
    return JSON.parse(JSON.stringify(layer.effectStack ?? []));
  }

  /**
   * Pastes an effect stack onto a target layer (assigns fresh IDs).
   */
  public static pasteEffectStack(
    layer: Layer,
    copiedStack: ReadonlyArray<EffectDescriptor>
  ): Layer {
    const freshStack: EffectDescriptor[] = copiedStack.map((fx) => ({
      ...fx,
      id: `fx_${fx.type}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    }));

    return {
      ...layer,
      effectStack: [...(layer.effectStack ?? []), ...freshStack],
    };
  }

  /**
   * Adds a mask to the layer's mask stack.
   */
  public static addMask(layer: Layer, mask: Mask): Layer {
    const currentStack = layer.maskStack ?? [];
    return {
      ...layer,
      maskStack: [...currentStack, mask],
    };
  }

  /**
   * Removes a mask from the layer's mask stack.
   */
  public static removeMask(layer: Layer, maskId: string): Layer {
    const currentStack = layer.maskStack ?? [];
    return {
      ...layer,
      maskStack: currentStack.filter((m) => m.id !== maskId),
    };
  }

  /**
   * Reorders a mask within the mask stack.
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
   * Toggles the enabled state of a mask.
   */
  public static toggleMask(layer: Layer, maskId: string, enabled?: boolean): Layer {
    const currentStack = layer.maskStack ?? [];
    const updatedStack = currentStack.map((m) => {
      if (m.id === maskId) {
        return {
          ...m,
          enabled: enabled !== undefined ? enabled : !m.enabled,
        };
      }
      return m;
    });

    return {
      ...layer,
      maskStack: updatedStack,
    };
  }

  /**
   * Updates properties of a target mask within the stack.
   */
  public static updateMask(layer: Layer, maskId: string, updates: Partial<Mask>): Layer {
    const currentStack = layer.maskStack ?? [];
    const updatedStack = currentStack.map((m) => {
      if (m.id === maskId) {
        return {
          ...m,
          ...updates,
        } as Mask;
      }
      return m;
    });

    return {
      ...layer,
      maskStack: updatedStack,
    };
  }

  /**
   * Helper to mutate a specific layer inside a Scene object.
   */
  public static mutateSceneLayer(
    scene: Scene,
    layerId: string,
    mutator: (layer: Layer) => Layer
  ): Scene {
    const target = scene.layers[layerId];
    if (!target) return scene;

    const updated = mutator(target);
    return {
      ...scene,
      layers: {
        ...scene.layers,
        [layerId]: updated,
      },
    };
  }
}
