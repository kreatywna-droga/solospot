# S20 — Professional Masks & Effects API Specification

## 1. Mask API Surface

### Types & Interfaces
```typescript
export type MaskMode =
  | 'alpha'
  | 'inverted-alpha'
  | 'luminance'
  | 'inverted-luminance'
  | 'clipping'
  | 'shape'
  | 'text';

export type Mask = AlphaMask | ClippingMask | ShapeMask | TextMask;
```

### Factory Functions
- `createAlphaMask(params)`: Returns `AlphaMask`
- `createClippingMask(params)`: Returns `ClippingMask`
- `createShapeMask(params)`: Returns `ShapeMask`
- `createTextMask(params)`: Returns `TextMask`

---

## 2. Effects API Surface

### Types & Descriptors
```typescript
export type EffectDescriptor =
  | BlurEffect
  | DropShadowEffect
  | InnerShadowEffect
  | GlowEffect
  | ColorAdjustmentEffect
  | OpacityEffect;
```

### Factory Functions
- `createBlurEffect(params)`
- `createDropShadowEffect(params)`
- `createInnerShadowEffect(params)`
- `createGlowEffect(params)`
- `createColorAdjustmentEffect(params)`
- `createOpacityEffect(params)`

### Evaluation Helpers
- `evaluateCSSFilter(effects: ReadonlyArray<EffectDescriptor>): string`: Computes CSS filter string (`blur(10px) brightness(120%) saturate(110%)`).
- `evaluateShadow(effects: ReadonlyArray<EffectDescriptor>)`: Computes active shadow/glow DTO.

---

## 3. Effect Stack Operations Engine (`EffectStackEngine`)

### Methods
- `addEffect(layer, effect)`: Appends an effect descriptor to stack.
- `removeEffect(layer, effectId)`: Removes effect descriptor by ID.
- `reorderEffect(layer, effectId, targetIndex)`: Moves effect to target index.
- `toggleEffect(layer, effectId, enabled?)`: Toggles enabled state.
- `updateEffect(layer, effectId, updates)`: Updates descriptor properties.
- `resetEffect(layer, effectId)`: Resets effect to default initial values.
- `copyEffectStack(layer)`: Clones effect stack for clipboard.
- `pasteEffectStack(layer, copiedStack)`: Pastes copied stack onto target layer with new IDs.
- `addMask(layer, mask)` / `removeMask` / `reorderMask` / `toggleMask` / `updateMask`.
- `mutateSceneLayer(scene, layerId, mutator)`: Helper to mutate scene layer.

---

## 4. Animation Bridge (`EffectAnimationBridge`)

### Methods
- `createEffectTrack(propertyKey, keyframes)`: Creates `PropertyAnimationTrack` for animatable effect keys.
- `createEffectTimeline(layerId, tracks, ...)`: Builds `AnimationTimeline` DTO.
- `applyEvaluatedEffectProperties(scene, layerId, evaluatedValues)`: Applies evaluated property keyframe values directly onto layer effect/mask stacks.
