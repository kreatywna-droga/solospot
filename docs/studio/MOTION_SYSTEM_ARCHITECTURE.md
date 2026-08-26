# Advanced Animation & Motion System Architecture — Sprint S13

## Overview

Sprint S13 introduces the Advanced Animation & Motion System for the Authoring Studio. It enhances the visual animation pipeline with advanced Bézier motion curves, velocity/acceleration numerical derivatives, full 2D affine matrix transformations (Pos X/Y, Scale X/Y, Rotation Z, Skew X/Y, Anchor Point), path-based motion interpolation with arc-length reparameterization and orient-to-path, declarative animation constraints, preset library integration, and seamless motion preview connector.

---

## Architectural Flow & Principles

```
AnimationTimeline / MotionPath / Constraints
                      │
                      ▼
        Advanced Motion Evaluator (S13)
  (Bézier curves, Velocity/Accel, Skew, Anchor Point, Motion Paths, Constraints)
                      │
                      ▼
           BuilderDocument (SSOT)
                      │
                      ▼
            RenderingEngine (S10)
                      │
                      ▼
               RenderFrame DTO
                      │
                      ▼
        RenderCommandCompiler & CanvasRenderer (S11/S12) -> Canvas
```

---

## Key Guarantees & Constraints

1. **Single Source of Truth (SSOT)**: `BuilderDocument` remains the ONLY state model. Motion evaluation operates via pure DTO transformations.
2. **Zero Duplicate Timeline Engine**: S13 extends existing S10 `RenderingEngine`, S10 `CurveEvaluator`, PM37 `TimelinePlaybackSession`, and S12 `RealtimeEditingSession`.
3. **Pure Matrix Transformation**: Complete 2D transformation matrix equation incorporating anchor points and skew:
   $$M = T(px, py) \cdot R(\theta) \cdot Skew(\phi_x, \phi_y) \cdot S(s_x, s_y) \cdot T(-px, -py)$$
4. **Decoupled Architecture**: Zero DOM/Canvas dependencies in motion evaluation math.
