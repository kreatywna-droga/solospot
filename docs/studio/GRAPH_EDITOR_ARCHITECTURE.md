# Graph Editor Architecture — Sprint S14

## Overview

The Graph Editor provides visual curve editing for animation tracks in the Authoring Studio.

---

## Modes

1. **Value Graph**: Plots property values $f(t)$ vs time $t$.
2. **Speed Graph**: Plots absolute velocity $|df/dt|$ vs time $t$ using S13 `AdvancedMotionCurves.evaluateVelocity`.

---

## Interpolation & Tangent Handles

- **Auto**: Computes Catmull-Rom smooth slopes from neighboring keyframes.
- **Smooth**: Maintains continuous tangent angles across keyframe node.
- **Linear**: Straight line segments ($y = mx + c$).
- **Step**: Hold values (`step-start` / `step-end`).

---

## Viewport Controls

- **Zoom**: Adjusts time range window ($t_{\text{start}}, t_{\text{end}}$).
- **Pan**: Shifts time window origin.
- **Multi-Curve Selection**: Renders multiple track plots simultaneously with distinct color coding.
