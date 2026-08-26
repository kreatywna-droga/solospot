# S20 — Professional Masks, Effects & Advanced Compositing Architecture

## Architectural Vision & Scope

Sprint S20 builds upon the S19 Scene Graph + Layer Hierarchy + Compositing engine, introducing professional visual effects (Blur, Drop Shadow, Inner Shadow, Glow, Color Adjustment, Opacity) and masking models (AlphaMask, ClippingMask, ShapeMask, TextMask) into the Web Factor Authoring Studio pipeline.

Crucially, **no secondary renderer, WebGL/WebGPU backend, separate compositor engine, or second animation engine** has been introduced. All masks and visual effects are expressed as declarative TS DTO command descriptors and evaluated inside `SceneCompositor` and `SceneRenderingBridge` for native execution on the existing `CanvasRenderer`.

---

## Architectural Pipeline Integration

```
  +-----------------------+
  |    BuilderDocument    |
  +-----------------------+
              |
              v
  +-----------------------+
  |      SceneGraph       |
  | (Layers + Mask Stack  |
  |   + Effect Stack)     |
  +-----------------------+
              |
              v
  +-----------------------+
  | Mask / Effect         |
  | Evaluation            |
  | (EffectStackEngine)   |
  +-----------------------+
              |
              v
  +-----------------------+
  |    SceneCompositor    |
  | (CompositedLayerNode) |
  +-----------------------+
              |
              v
  +-----------------------+
  | SceneRenderingBridge  |
  +-----------------------+
              |
              v
  +-----------------------+
  |   RendererCommand[]   |
  | (APPLY_FILTER / SHADOW|
  |  CLEAR_EFFECTS)       |
  +-----------------------+
              |
              v
  +-----------------------+
  |    CanvasRenderer     |
  +-----------------------+
```

---

## Data Model Architecture

### 1. Mask Domain Model (`MaskModel.ts`)
- **AlphaMask**: Mask based on alpha / luminance channels of an image or layer source.
- **ClippingMask**: Mask referencing a parent or sibling layer contour.
- **ShapeMask**: Geometric vector mask (Rectangle, Ellipse, Polygon, Path).
- **TextMask**: Typographic vector mask using font contours.
- **MaskMode**: `'alpha' | 'inverted-alpha' | 'luminance' | 'inverted-luminance' | 'clipping' | 'shape' | 'text'`.

### 2. Effects Model (`EffectModel.ts`)
- **BlurEffect**: Gaussian blur radius.
- **DropShadowEffect**: Outer shadow (color, blur, offset, spread, opacity).
- **InnerShadowEffect**: Inner inset shadow.
- **GlowEffect**: Radial glow (color, radius, intensity, inner toggle).
- **ColorAdjustmentEffect**: Color grading (brightness, contrast, saturation, hue rotate).
- **OpacityEffect**: Layer opacity modifier.

### 3. Layer Evaluation Stack Order
Determinism is strictly enforced:
$$\text{Layer} \longrightarrow \text{Mask Stack} \longrightarrow \text{Effect Stack} \longrightarrow \text{Compositing} \longrightarrow \text{RenderingEngine}$$

---

## Governance & Architecture Compliance

1. **ADR-042 / ADR-045 Compliance**: `EffectAnimationBridge` delegates property track generation directly to standard S13 Motion System timelines. Zero custom playback controllers or schedulers exist in `authoring-studio`.
2. **ADR-043 / ADR-044 Compliance**: `BuilderDocument` and `SceneGraphModel` remain the sole Single Source of Truth (SSOT). UI components (`EffectsPanel`, `MaskPanel`) only mutate configuration.
3. **Audit Protocol v2.8 Boundary**: Zero imports of `requestAnimationFrame`, `PlaybackController`, or runtime schedulers exist in `packages/authoring-studio`.
