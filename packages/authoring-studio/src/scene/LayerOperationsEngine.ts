/**
 * LayerOperationsEngine.ts — Sprint S19 Layer Operations Engine (ETAP 2)
 *
 * Implements pure headless operations for layer management:
 * - create layer, rename, duplicate, delete
 * - reorder (bring to front, send to back, bring forward, send backward)
 * - move into group, move out of group, group, ungroup
 * - lock/unlock, hide/show, solo, isolate
 * - set blend mode, set opacity, clipping groups
 *
 * Pure logic: Returns new Scene references. NO DOM, NO React, ZERO side effects.
 */

import {
  BlendMode,
  Layer,
  LayerGroup,
  Scene,
  createLayerGroup,
} from './SceneGraphModel';

export type LayerReorderAction = 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward' | 'index';

export class LayerOperationsEngine {
  /**
   * Adds a new layer to the scene (optionally into a parent group or specific index).
   */
  public static createLayer(
    scene: Scene,
    layer: Layer,
    parentId?: string,
    targetIndex?: number
  ): Scene {
    const updatedLayers = { ...scene.layers, [layer.id]: layer };

    if (parentId && scene.layers[parentId]) {
      const parent = scene.layers[parentId];
      const childIds = [...parent.childIds];
      if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= childIds.length) {
        childIds.splice(targetIndex, 0, layer.id);
      } else {
        childIds.push(layer.id);
      }

      const updatedParent: LayerGroup = {
        ...(parent as LayerGroup),
        childIds,
      };

      updatedLayers[parentId] = updatedParent;
      updatedLayers[layer.id] = { ...layer, parentId };

      return {
        ...scene,
        layers: updatedLayers,
      };
    } else {
      const rootLayerIds = [...scene.rootLayerIds];
      if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= rootLayerIds.length) {
        rootLayerIds.splice(targetIndex, 0, layer.id);
      } else {
        rootLayerIds.push(layer.id);
      }

      return {
        ...scene,
        layers: updatedLayers,
        rootLayerIds,
      };
    }
  }

  /**
   * Renames a layer.
   */
  public static renameLayer(scene: Scene, layerId: string, name: string): Scene {
    const layer = scene.layers[layerId];
    if (!layer) return scene;

    return {
      ...scene,
      layers: {
        ...scene.layers,
        [layerId]: { ...layer, name },
      },
    };
  }

  /**
   * Duplicates a layer (and its children if it is a group).
   */
  public static duplicateLayer(scene: Scene, layerId: string): { scene: Scene; duplicatedId: string } {
    const original = scene.layers[layerId];
    if (!original) return { scene, duplicatedId: '' };

    const newId = `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const clonedLayers: Record<string, Layer> = {};

    const cloneRecursive = (srcId: string, parentId?: string): string => {
      const src = scene.layers[srcId];
      if (!src) return '';

      const clonedId = srcId === layerId ? newId : `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const childIds: string[] = [];

      if (src.childIds && src.childIds.length > 0) {
        for (const childId of src.childIds) {
          const clonedChildId = cloneRecursive(childId, clonedId);
          if (clonedChildId) childIds.push(clonedChildId);
        }
      }

      clonedLayers[clonedId] = {
        ...src,
        id: clonedId,
        name: srcId === layerId ? `${src.name}_copy` : src.name,
        parentId,
        childIds,
        transform: {
          ...src.transform,
          x: src.transform.x + 20,
          y: src.transform.y + 20,
        },
      };

      return clonedId;
    };

    cloneRecursive(layerId, original.parentId);

    let updatedScene: Scene = {
      ...scene,
      layers: {
        ...scene.layers,
        ...clonedLayers,
      },
    };

    if (original.parentId && updatedScene.layers[original.parentId]) {
      const parent = updatedScene.layers[original.parentId];
      const idx = parent.childIds.indexOf(layerId);
      const newChildIds = [...parent.childIds];
      newChildIds.splice(idx + 1, 0, newId);

      updatedScene = {
        ...updatedScene,
        layers: {
          ...updatedScene.layers,
          [original.parentId]: {
            ...parent,
            childIds: newChildIds,
          },
        },
      };
    } else {
      const idx = updatedScene.rootLayerIds.indexOf(layerId);
      const newRootIds = [...updatedScene.rootLayerIds];
      newRootIds.splice(idx + 1, 0, newId);

      updatedScene = {
        ...updatedScene,
        rootLayerIds: newRootIds,
      };
    }

    return { scene: updatedScene, duplicatedId: newId };
  }

  /**
   * Deletes a layer and all its descendants.
   */
  public static deleteLayer(scene: Scene, layerId: string): Scene {
    const layer = scene.layers[layerId];
    if (!layer) return scene;

    const idsToDelete = new Set<string>();
    const collectIds = (id: string) => {
      idsToDelete.add(id);
      const node = scene.layers[id];
      if (node && node.childIds) {
        node.childIds.forEach(collectIds);
      }
    };
    collectIds(layerId);

    const updatedLayers = { ...scene.layers };
    idsToDelete.forEach((id) => delete updatedLayers[id]);

    let rootLayerIds = scene.rootLayerIds.filter((id) => !idsToDelete.has(id));
    let soloLayerIds = scene.soloLayerIds.filter((id) => !idsToDelete.has(id));
    let isolatedLayerId = idsToDelete.has(scene.isolatedLayerId ?? '') ? undefined : scene.isolatedLayerId;

    if (layer.parentId && updatedLayers[layer.parentId]) {
      const parent = updatedLayers[layer.parentId];
      updatedLayers[layer.parentId] = {
        ...parent,
        childIds: parent.childIds.filter((id) => !idsToDelete.has(id)),
      };
    }

    return {
      ...scene,
      layers: updatedLayers,
      rootLayerIds,
      soloLayerIds,
      isolatedLayerId,
    };
  }

  /**
   * Reorders a layer among its siblings.
   */
  public static reorderLayer(
    scene: Scene,
    layerId: string,
    action: LayerReorderAction,
    targetIndex?: number
  ): Scene {
    const layer = scene.layers[layerId];
    if (!layer) return scene;

    const siblings = layer.parentId && scene.layers[layer.parentId]
      ? [...scene.layers[layer.parentId].childIds]
      : [...scene.rootLayerIds];

    const index = siblings.indexOf(layerId);
    if (index === -1) return scene;

    siblings.splice(index, 1);

    switch (action) {
      case 'bringToFront':
        siblings.push(layerId);
        break;
      case 'sendToBack':
        siblings.unshift(layerId);
        break;
      case 'bringForward':
        siblings.splice(Math.min(siblings.length, index + 1), 0, layerId);
        break;
      case 'sendBackward':
        siblings.splice(Math.max(0, index - 1), 0, layerId);
        break;
      case 'index':
        if (targetIndex !== undefined) {
          const clamped = Math.max(0, Math.min(siblings.length, targetIndex));
          siblings.splice(clamped, 0, layerId);
        } else {
          siblings.splice(index, 0, layerId);
        }
        break;
    }

    if (layer.parentId && scene.layers[layer.parentId]) {
      const parent = scene.layers[layer.parentId];
      return {
        ...scene,
        layers: {
          ...scene.layers,
          [layer.parentId]: {
            ...parent,
            childIds: siblings,
          },
        },
      };
    } else {
      return {
        ...scene,
        rootLayerIds: siblings,
      };
    }
  }

  /**
   * Moves a layer into a target group.
   */
  public static moveIntoGroup(
    scene: Scene,
    layerId: string,
    targetGroupId: string,
    targetIndex?: number
  ): Scene {
    const layer = scene.layers[layerId];
    const targetGroup = scene.layers[targetGroupId];
    if (!layer || !targetGroup || targetGroup.type !== 'group' || layerId === targetGroupId) {
      return scene;
    }

    // Prevent moving parent into descendant
    let curr: Layer | undefined = targetGroup;
    while (curr && curr.parentId) {
      if (curr.parentId === layerId) return scene;
      curr = scene.layers[curr.parentId];
    }

    // Remove from old location
    let updatedScene = this.removeFromParent(scene, layerId);

    // Insert into target group
    const parentGroup = updatedScene.layers[targetGroupId];
    const newChildIds = [...parentGroup.childIds];
    if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= newChildIds.length) {
      newChildIds.splice(targetIndex, 0, layerId);
    } else {
      newChildIds.push(layerId);
    }

    return {
      ...updatedScene,
      layers: {
        ...updatedScene.layers,
        [targetGroupId]: {
          ...parentGroup,
          childIds: newChildIds,
        },
        [layerId]: {
          ...updatedScene.layers[layerId],
          parentId: targetGroupId,
        },
      },
    };
  }

  /**
   * Moves a layer out of its current group to its parent's parent level.
   */
  public static moveOutOfGroup(scene: Scene, layerId: string): Scene {
    const layer = scene.layers[layerId];
    if (!layer || !layer.parentId) return scene;

    const currentParent = scene.layers[layer.parentId];
    if (!currentParent) return scene;

    const grandParentId = currentParent.parentId;
    const updatedScene = this.removeFromParent(scene, layerId);

    if (grandParentId && updatedScene.layers[grandParentId]) {
      const grandParent = updatedScene.layers[grandParentId];
      const currentParentIndex = grandParent.childIds.indexOf(currentParent.id);
      const newChildIds = [...grandParent.childIds];
      newChildIds.splice(currentParentIndex + 1, 0, layerId);

      return {
        ...updatedScene,
        layers: {
          ...updatedScene.layers,
          [grandParentId]: {
            ...grandParent,
            childIds: newChildIds,
          },
          [layerId]: {
            ...updatedScene.layers[layerId],
            parentId: grandParentId,
          },
        },
      };
    } else {
      const currentParentIndex = updatedScene.rootLayerIds.indexOf(currentParent.id);
      const newRootIds = [...updatedScene.rootLayerIds];
      newRootIds.splice(currentParentIndex + 1, 0, layerId);

      return {
        ...updatedScene,
        layers: {
          ...updatedScene.layers,
          [layerId]: {
            ...updatedScene.layers[layerId],
            parentId: undefined,
          },
        },
        rootLayerIds: newRootIds,
      };
    }
  }

  /**
   * Groups multiple selected layers into a new LayerGroup.
   */
  public static groupLayers(
    scene: Scene,
    groupId: string,
    layerIds: string[],
    groupName?: string
  ): Scene {
    if (layerIds.length === 0) return scene;

    const validIds = layerIds.filter((id) => scene.layers[id]);
    if (validIds.length === 0) return scene;

    const firstLayer = scene.layers[validIds[0]];
    const commonParentId = firstLayer.parentId;

    const newGroup = createLayerGroup({
      id: groupId,
      name: groupName ?? `Group_${groupId}`,
      parentId: commonParentId,
      childIds: validIds,
    });

    let updatedScene = { ...scene };

    // Remove selected layers from their current sibling order
    for (const id of validIds) {
      updatedScene = this.removeFromParent(updatedScene, id);
    }

    // Insert newGroup where first selected layer was
    if (commonParentId && updatedScene.layers[commonParentId]) {
      const parent = updatedScene.layers[commonParentId];
      const newChildIds = [...parent.childIds, groupId];
      updatedScene = {
        ...updatedScene,
        layers: {
          ...updatedScene.layers,
          [commonParentId]: {
            ...parent,
            childIds: newChildIds,
          },
        },
      };
    } else {
      updatedScene = {
        ...updatedScene,
        rootLayerIds: [...updatedScene.rootLayerIds, groupId],
      };
    }

    // Add group and update children's parentId
    const updatedLayers = { ...updatedScene.layers, [groupId]: newGroup };
    for (const id of validIds) {
      if (updatedLayers[id]) {
        updatedLayers[id] = { ...updatedLayers[id], parentId: groupId };
      }
    }

    return {
      ...updatedScene,
      layers: updatedLayers,
    };
  }

  /**
   * Ungroups a LayerGroup, promoting all children to group's parent level.
   */
  public static ungroupLayers(scene: Scene, groupId: string): Scene {
    const group = scene.layers[groupId];
    if (!group || group.type !== 'group') return scene;

    const children = group.childIds.map((id) => scene.layers[id]).filter(Boolean);
    const parentId = group.parentId;

    let updatedScene = this.deleteLayer(scene, groupId);

    const updatedLayers = { ...updatedScene.layers };
    const promotedChildIds: string[] = [];

    for (const child of children) {
      updatedLayers[child.id] = {
        ...child,
        parentId,
      };
      promotedChildIds.push(child.id);
    }

    updatedScene = {
      ...updatedScene,
      layers: updatedLayers,
    };

    if (parentId && updatedScene.layers[parentId]) {
      const parent = updatedScene.layers[parentId];
      return {
        ...updatedScene,
        layers: {
          ...updatedScene.layers,
          [parentId]: {
            ...parent,
            childIds: [...parent.childIds, ...promotedChildIds],
          },
        },
      };
    } else {
      return {
        ...updatedScene,
        rootLayerIds: [...updatedScene.rootLayerIds, ...promotedChildIds],
      };
    }
  }

  /**
   * Toggles lock state of a layer.
   */
  public static toggleLock(scene: Scene, layerId: string, locked?: boolean): Scene {
    const layer = scene.layers[layerId];
    if (!layer) return scene;

    const nextLocked = locked !== undefined ? locked : !layer.locked;
    return {
      ...scene,
      layers: {
        ...scene.layers,
        [layerId]: { ...layer, locked: nextLocked },
      },
    };
  }

  /**
   * Toggles visibility state of a layer.
   */
  public static toggleVisibility(scene: Scene, layerId: string, visible?: boolean): Scene {
    const layer = scene.layers[layerId];
    if (!layer) return scene;

    const nextVisible = visible !== undefined ? visible : !layer.visible;
    return {
      ...scene,
      layers: {
        ...scene.layers,
        [layerId]: { ...layer, visible: nextVisible },
      },
    };
  }

  /**
   * Toggles solo state of a layer.
   */
  public static toggleSolo(scene: Scene, layerId: string, solo?: boolean): Scene {
    const layer = scene.layers[layerId];
    if (!layer) return scene;

    const nextSolo = solo !== undefined ? solo : !layer.solo;
    const soloSet = new Set(scene.soloLayerIds);

    if (nextSolo) {
      soloSet.add(layerId);
    } else {
      soloSet.delete(layerId);
    }

    return {
      ...scene,
      soloLayerIds: Array.from(soloSet),
      layers: {
        ...scene.layers,
        [layerId]: { ...layer, solo: nextSolo },
      },
    };
  }

  /**
   * Toggles isolation mode for a specific layer.
   */
  public static toggleIsolate(scene: Scene, layerId: string, isolate?: boolean): Scene {
    const layer = scene.layers[layerId];
    if (!layer) return scene;

    const nextIsolate = isolate !== undefined ? isolate : !layer.isolate;
    const isolatedLayerId = nextIsolate ? layerId : (scene.isolatedLayerId === layerId ? undefined : scene.isolatedLayerId);

    // Turn off isolate on all other layers if activating
    const updatedLayers: Record<string, Layer> = {};
    for (const key of Object.keys(scene.layers)) {
      const node = scene.layers[key];
      updatedLayers[key] = {
        ...node,
        isolate: key === layerId ? nextIsolate : (nextIsolate ? false : node.isolate),
      };
    }

    return {
      ...scene,
      isolatedLayerId,
      layers: updatedLayers,
    };
  }

  /**
   * Sets blend mode of a layer.
   */
  public static setBlendMode(scene: Scene, layerId: string, blendMode: BlendMode): Scene {
    const layer = scene.layers[layerId];
    if (!layer) return scene;

    return {
      ...scene,
      layers: {
        ...scene.layers,
        [layerId]: { ...layer, blendMode },
      },
    };
  }

  /**
   * Sets opacity of a layer.
   */
  public static setOpacity(scene: Scene, layerId: string, opacity: number): Scene {
    const layer = scene.layers[layerId];
    if (!layer) return scene;

    const clamped = Math.max(0, Math.min(1, opacity));
    return {
      ...scene,
      layers: {
        ...scene.layers,
        [layerId]: { ...layer, opacity: clamped },
      },
    };
  }

  /**
   * Sets clipping group for a mask layer and its clipped target layers.
   */
  public static setClippingGroup(
    scene: Scene,
    maskLayerId: string,
    clippedLayerIds: string[],
    clipPath?: string
  ): Scene {
    const maskLayer = scene.layers[maskLayerId];
    if (!maskLayer) return scene;

    const clippingGroup = {
      maskLayerId,
      clippedLayerIds,
      clipPath,
    };

    return {
      ...scene,
      layers: {
        ...scene.layers,
        [maskLayerId]: { ...maskLayer, clippingGroup },
      },
    };
  }

  /**
   * Helper to remove a layer ID from its parent's childIds or rootLayerIds.
   */
  private static removeFromParent(scene: Scene, layerId: string): Scene {
    const layer = scene.layers[layerId];
    if (!layer) return scene;

    if (layer.parentId && scene.layers[layer.parentId]) {
      const parent = scene.layers[layer.parentId];
      return {
        ...scene,
        layers: {
          ...scene.layers,
          [layer.parentId]: {
            ...parent,
            childIds: parent.childIds.filter((id) => id !== layerId),
          },
        },
      };
    } else {
      return {
        ...scene,
        rootLayerIds: scene.rootLayerIds.filter((id) => id !== layerId),
      };
    }
  }
}
