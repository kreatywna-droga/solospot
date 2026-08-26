# Motion System API Reference — Sprint S13

## Module: `packages/authoring-studio/src/motion`

### Classes & Utility Modules

#### `AdvancedMotionCurves`
- `evaluateProgression(t: number, curve?: EasingCurve): number`: Evaluates Bézier, spring, bounce, elastic, step, and linear easing curves into $u \in [0, 1]$.
- `applyTemporalModifier(t: number, mode?: TemporalMode): number`: Applies normal, reverse, loop, ping-pong, and hold temporal modifiers.
- `evaluateVelocity(t, curve, durationMs, dt): number`: Computes velocity $v(t) = \frac{f(t+\Delta t) - f(t-\Delta t)}{2\Delta t}$ in units/sec.
- `evaluateAcceleration(t, curve, durationMs, dt): number`: Computes acceleration $a(t) = \frac{v(t+\Delta t) - v(t-\Delta t)}{2\Delta t}$ in units/sec$^2$.

#### `Transform2DAnimation`
- `computeLocalMatrix(state: Partial<Transform2DState>): Matrix2DAffine`: Computes complete 2D transformation matrix including Pos X/Y, Scale X/Y, Rotation Z, Skew X/Y, and Anchor Point (Pivot).
- `multiplyAffineMatrices(a, b)`: Multiplies two 2D affine matrices `[a, b, c, d, e, f]`.

#### `MotionPathEvaluator`
- `evaluatePath(path: MotionPath, progress: number): MotionPathSample`: Evaluates position $(x, y)$, tangent vector, arc-length, and tangent angle $\theta$ for `orientToPath`.

#### `AnimationConstraintsEvaluator`
- `evaluateConstraint(currentX, currentY, currentRotationDeg, constraint, targetBounds?, nodeBounds?): ConstrainedTransformResult`: Evaluates declarative constraints (follow with lag, align edges, look-at target, position clamp, rotation clamp).

#### `MotionPresetBridge`
- `createPresetTimeline(presetId, options): AnimationTimeline`: Generates immutable `AnimationTimeline` DTOs for built-in presets (`fade-in`, `bounce-in`, `slide-in-right`, `spin`, `pulse`).

#### `MotionPreviewConnector`
- `renderMotionFrame(timestampMs, timelines): PreviewRenderResult`: Integrates motion paths, constraints, and motion curves into S12 `RealtimeEditingSession` and S11 `CanvasRenderer`.
