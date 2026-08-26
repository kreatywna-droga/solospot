# Professional Text & Typography Architecture — Sprint S17

## Overview

Sprint S17 expands the Web Factor Authoring Studio with a **Professional Text & Typography System**. It introduces headless `TextNode` DTOs, typography metric calculations (word wrap, line height, baseline, alignment), text editing operations (create, edit, style, duplicate, resize), S13 Motion System text property keyframe integration, and text rendering bridge integration—without creating secondary renderers, secondary document models, or duplicate history stacks.

---

## Architectural Principles

1. **Single Source of Truth**: All `TextNode` instances remain 100% inside `BuilderDocument` as standard document nodes.
2. **Single History Stack**: All text edits (content, font size, weight, letter spacing, alignment) emit standard commands to `BuilderDocument` and tie into the single existing `HistoryStack` (`Ctrl+Z`/`Ctrl+Shift+Z`).
3. **Headless Typography Core**: Line breaking, word wrapping, character spacing, line height, and baseline calculations are pure headless math without DOM/Canvas API dependencies.
4. **Single Motion System**: Text property keyframing (font size, letter spacing, opacity, fill color) delegates strictly to existing S13 Motion System (`AnimationTimeline` / `PlaybackSession`). Zero 2nd animation system.
5. **Text Rendering Bridge Boundary**: Text rendering converts `TextNode` metrics into render instructions for `RenderingEngine` & `CanvasRenderer`. Zero 2nd renderer.

---

## Architecture Flow

```
User (Text Tool & Inspector)
       ↓
TextEditingEngine (Commands)
       ↓
BuilderDocument (SSOT) & HistoryStack
       ↓
TypographyEngine (Headless Layout Metrics)
       ↓
TextAnimationEngine (S13 Motion System Integration)
       ↓
TextRenderingBridge
       ↓
RenderingEngine → CanvasRenderer
```
