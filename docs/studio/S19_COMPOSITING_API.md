# Professional Layers & Compositing API Reference — Sprint S19

## Overview

This document provides a comprehensive API reference for the **Scene Graph, Layer Operations, Compositing Engine, Rendering Integration, and Animation Integration** modules introduced in Sprint S19.

---

## 1. Scene Graph Domain API (`SceneGraphModel.ts`)

### Data Interfaces
- `Scene`: Root DTO holding layer map, root IDs, active selection, solo set, and isolation target.
- `Layer`: Base layer interface containing `id`, `name`, `type`, `parentId`, `childIds`, `visible`, `locked`, `solo`, `isolate`, `opacity`, `blendMode`, `transform`, `clippingGroup`.
- `LayerGroup`: Extends `Layer` with `type: 'group'` and expansion state.
- `ClippingGroup`: Interface with `maskLayerId`, `clippedLayerIds`, `clipPath`.
- `Transform2D`: 2D transformation descriptor (`x`, `y`, `width`, `height`, `rotationDeg`, `scaleX`, `scaleY`, `skewX`, `skewY`).
- `BlendMode`: CSS & Canvas composite blend modes ('normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', etc.).

### Factory Methods
```typescript
createScene(params: { id: string; name?: string; viewportWidth?: number; viewportHeight?: number }): Scene;
createLayer(params: { id: string; name?: string; type?: LayerType; parentId?: string; transform?: Partial<Transform2D> }): Layer;
createLayerGroup(params: { id: string; name?: string; parentId?: string; childIds?: string[] }): LayerGroup;
```

---

## 2. Layer Operations Engine (`LayerOperationsEngine.ts`)

Pure functional layer mutation engine:

```typescript
// Creation & Deletion
createLayer(scene: Scene, layer: Layer, parentId?: string, targetIndex?: number): Scene;
duplicateLayer(scene: Scene, layerId: string): { scene: Scene; duplicatedId: string };
deleteLayer(scene: Scene, layerId: string): Scene;
renameLayer(scene: Scene, layerId: string, name: string): Scene;

// Reordering & Hierarchy
reorderLayer(scene: Scene, layerId: string, action: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward' | 'index'): Scene;
moveIntoGroup(scene: Scene, layerId: string, targetGroupId: string): Scene;
moveOutOfGroup(scene: Scene, layerId: string): Scene;
groupLayers(scene: Scene, groupId: string, layerIds: string[], groupName?: string): Scene;
ungroupLayers(scene: Scene, groupId: string): Scene;

// Layer State Flags
toggleLock(scene: Scene, layerId: string, locked?: boolean): Scene;
toggleVisibility(scene: Scene, layerId: string, visible?: boolean): Scene;
toggleSolo(scene: Scene, layerId: string, solo?: boolean): Scene;
toggleIsolate(scene: Scene, layerId: string, isolate?: boolean): Scene;
setBlendMode(scene: Scene, layerId: string, blendMode: BlendMode): Scene;
setOpacity(scene: Scene, layerId: string, opacity: number): Scene;
setClippingGroup(scene: Scene, maskLayerId: string, clippedLayerIds: string[], clipPath?: string): Scene;
```

---

## 3. Compositing Engine (`SceneCompositor.ts`)

Pure mathematical evaluation for compositing and 2D matrix accumulation:

```typescript
computeInheritedOpacity(scene: Scene, layerId: string): number;
computeEffectiveVisibility(scene: Scene, layerId: string): boolean;
computeEffectiveLock(scene: Scene, layerId: string): boolean;
computeWorldMatrix(scene: Scene, layerId: string): Matrix2D;
computeWorldBounds(scene: Scene, layerId: string): { x: number; y: number; width: number; height: number };
computeClipping(scene: Scene, layerId: string): { isClipped: boolean; maskLayerId?: string; clipPath?: string };
compositedNode(scene: Scene, layerId: string, depth?: number): CompositedLayerNode | null;
traverseCompositedScene(scene: Scene): CompositedLayerNode[];
```

---

## 4. Rendering Integration (`SceneRenderingBridge.ts`)

Extends rendering pipeline without a secondary renderer:

```typescript
compileSceneToCommands(scene: Scene, clearColor?: string): RendererCommand[];
```

---

## 5. Animation Integration (`SceneAnimationBridge.ts`)

Integrates with S13 Motion System keyframes:

```typescript
createLayerTimeline(layerId: string, tracks: PropertyAnimationTrack[], clipName?: string): AnimationTimeline;
createPropertyTrack(propertyKey: LayerAnimatableProperty, keyframes: AnimationKeyframe[]): PropertyAnimationTrack;
applyEvaluatedProperties(scene: Scene, layerId: string, evaluatedValues: Record<string, unknown>): Scene;
```

---

## 6. History Binding (`SceneHistoryBinding.ts`)

Integrates with `HistoryStack` and `BuilderDocument`:

```typescript
const binding = new SceneHistoryBinding(doc, scene);
binding.executeMutation('Operation Name', (scene) => LayerOperationsEngine.createLayer(scene, newLayer));
binding.undo();
binding.redo();
```
