# Motion Path Editor Architecture — Sprint S14

## Overview

The Motion Path Editor renders and manipulates spatial 2D motion paths on the Canvas preview stage.

---

## Data Pipeline

```
User Gesture (Drag Waypoint / Handle / Reverse / Split)
       ↓
Command Dispatch
       ↓
BuilderDocument (SSOT)
       ↓
S13 MotionPathEvaluator
       ↓
RenderingEngine (S10)
       ↓
CanvasRenderer (S11)
```

---

## Core Operations

1. **Drag Waypoints**: Interactive repositioning of spatial path nodes $(x, y)$.
2. **Tangent Handles**: Adjusting `handleIn` / `handleOut` vectors for curvature control.
3. **Reverse Path**: Reverses waypoint order ($0..N \rightarrow N..0$) and flips handle vectors.
4. **Split Path**: Inserts a new midpoint waypoint into selected path segment.
5. **Path Preview**: Animated pose indicator sliding along path as playhead time scrubs.
