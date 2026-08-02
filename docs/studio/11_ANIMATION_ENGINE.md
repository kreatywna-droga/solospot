# C16.11 — WEB FACTOR Studio Animation Engine

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 11_ANIMATION_ENGINE.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 03_CANVAS_ENGINE.md

---

## 1. Cel

Animation Engine umożliwia dodawanie animacji do sekcji i elementów na stronie. Od prostych efektów (fade, slide) po zaawansowane timeline'y i animacje scrollowane.

---

## 2. Typy animacji

### 2.1 Entrance Animations (przy wejściu)

```typescript
type EntranceAnimation =
  | 'FADE_IN'
  | 'FADE_UP'
  | 'FADE_DOWN'
  | 'FADE_LEFT'
  | 'FADE_RIGHT'
  | 'SLIDE_UP'
  | 'SLIDE_DOWN'
  | 'SLIDE_LEFT'
  | 'SLIDE_RIGHT'
  | 'ZOOM_IN'
  | 'ZOOM_OUT'
  | 'FLIP'
  | 'SCALE'
  | 'BOUNCE'
  | 'STAGGER';       // dla children (kolejno)

interface EntranceConfig {
  animation: EntranceAnimation;
  duration: number;        // sekundy (0.1 - 5)
  delay: number;           // sekundy (0 - 5)
  easing: EasingFunction;
  staggerDelay?: number;   // dla STAGGER (ms między dziećmi)
  once: boolean;           // animuj tylko raz (czy za każdym razem przy scroll)
}
```

### 2.2 Hover Animations

```typescript
type HoverAnimation =
  | 'SCALE'
  | 'LIFT'
  | 'GLOW'
  | 'BORDER'
  | 'COLOR_SHIFT'
  | 'ROTATE'
  | 'TILT'
  | 'RIPPLE'
  | 'UNDERLINE';

interface HoverConfig {
  animation: HoverAnimation;
  scale?: number;          // 1.0 - 1.2
  lift?: number;           // px
  duration: number;
  easing: EasingFunction;
}
```

### 2.3 Scroll Animations

```typescript
type ScrollAnimation =
  | 'FADE_IN'
  | 'FADE_UP'
  | 'FADE_DOWN'
  | 'ZOOM_IN'
  | 'PARALLAX'
  | 'REVEAL'
  | 'FLIP_SCROLL';

interface ScrollConfig {
  animation: ScrollAnimation;
  trigger: 'ENTER_VIEWPORT' | 'LEAVE_VIEWPORT' | 'PROGRESS';
  threshold: number;          // 0.0 - 1.0 (kiedy start)
  duration: number;
  parallaxSpeed?: number;     // dla PARALLAX (0.1 - 2.0)
  revealDirection?: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN'; // dla REVEAL
}
```

### 2.4 Continuous Animations

```typescript
type ContinuousAnimation =
  | 'FLOATING'
  | 'PULSE'
  | 'ROTATE'
  | 'SHIMMER'
  | 'WAVE'
  | 'BREATHING';

interface ContinuousConfig {
  animation: ContinuousAnimation;
  duration: number;
  intensity: number;      // 0.1 - 2.0
  delay?: number;
}
```

---

## 3. Timeline (C16.13)

Timeline to zaawansowany edytor animacji jak w After Effects.

### 3.1 Koncepcja

```
0s          1s          2s          3s          4s
├────────────┼────────────┼────────────┼────────────┤
│ Hero       │ ████████████░░░░░░░░░░░░░░░░░░░░░░│
│   Fade In  │ ■■■■■■■■■■■■                        │
├────────────┼────────────┼────────────┼────────────┤
│ Button     │ ░░░░░░░░░░░░████████████░░░░░░░░░░░░│
│   Slide Up │             ■■■■■■■■■■■■             │
├────────────┼────────────┼────────────┼────────────┤
│ Cards      │ ░░░░░░░░░░░░░░░░░░░░░░████████████░░│
│   Stagger  │                         ■■■■■■■■■■■■│
├────────────┼────────────┼────────────┼────────────┤
│ Footer     │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│   Fade     │                                      │
└────────────┴────────────┴────────────┴────────────┘
           Playhead →
```

### 3.2 Timeline UI

```
┌──────────────────────────────────────────────────────────┐
│  ANIMATION TIMELINE                                      │
│  [▶ Play] [■ Stop] [⏹ Snap] [🐌 Speed: 1x]            │
├──────────────────────────────────────────────────────────┤
│ 0s    0.5s    1s    1.5s    2s    2.5s    3s          │
│ ├──────┼──────┼──────┼──────┼──────┼──────┼──────────┤│
│ │                                                       ││
│ │ Hero                                                 ││
│ │   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│││
│ │   ├── Fade In ──┼─── Pause ──┼─── Scale ──────────┤││
│ │                                                       ││
│ │ Button                                               ││
│ │   │░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░│││
│ │   └───────────────┼─── Slide Up ─────────────────┘││
│ │                                                       ││
│ │ Features (3 items, stagger 0.2s)                     ││
│ │   │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓░░░░░░│││
│ │   └───────────────────────┼─── Fade Up (stagger) ─┘││
│ │                                                       ││
│ └───────────────────────────────────────────────────────┘│
│  [+ Add Track]  [Import from Library]                   │
└──────────────────────────────────────────────────────────┘
```

### 3.3 Track Operations

- **Drag** — przesuwanie klatek w czasie
- **Trim** — skracanie/wydłużanie klatek (przeciągnij krawędź)
- **Split** — podziel klatkę na dwie
- **Copy/Paste** — kopiuj animacje między elementami
- **Stagger** — automatyczne rozłożenie children

---

## 4. Parallax

### 4.1 Typy parallax

```typescript
interface ParallaxConfig {
  type: 'SCROLL' | 'MOUSE' | 'TILT';
  speed: number;             // 0.1 - 2.0 (1.0 = normal scroll)
  direction: 'VERTICAL' | 'HORIZONTAL' | 'BOTH';
  perspective: number;       // dla TILT (default 1000px)
  maxTilt: number;           // dla TILT (stopnie, default 10)
}
```

### 4.2 Scroll Parallax

```typescript
// Element przesuwa się wolniej niż scroll
// Tworzy głębię (efekt parallax mountain)
```

---

## 5. Implementacja

### 5.1 Silnik animacji

```typescript
// packages/builder-core/src/AnimationEngine.ts

interface AnimationState {
  timeline: TimelineTrack[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
}

class AnimationEngine {
  private animations: Map<string, AnimationInstance> = new Map();
  
  createAnimation(sectionId: string, config: AnimationConfig): void {
    // Intersection Observer dla scroll animacji
    // GSAP lub Framer Motion dla wykonania
    // CSS animations dla prostych efektów
  }
  
  play(): void { /* ... */ }
  pause(): void { /* ... */ }
  stop(): void { /* ... */ }
  seek(time: number): void { /* ... */ }
}
```

### 5.2 Pliki

```
src/components/builder/animation/
├── AnimationPanel.tsx           — panel animacji w Inspectorze
├── AnimationSelector.tsx        — dropdown wyboru animacji
├── AnimationConfig.tsx          — konfiguracja parametrów
├── Timeline.tsx                 — pełny timeline
├── TimelineTrack.tsx            — pojedynczy track
├── TimelinePlayhead.tsx         — playhead
├── TimelineControls.tsx         — play/pause/stop/speed
├── ParallaxConfig.tsx           — konfiguracja parallax
├── HoverAnimationConfig.tsx     — konfiguracja hover
├── ScrollAnimationConfig.tsx    — konfiguracja scroll
├── ContinuousAnimationConfig.tsx— konfiguracja continuous
└── AnimationLibrary.tsx         — biblioteka presetów animacji
```

### 5.3 Istniejący kod

```typescript
// packages/builder-core/src/BuilderUX.ts
// - Już istnieje z podstawowymi efektami
// - Wymaga rozszerzenia o pełny AnimationEngine
```

---

## 6. Easing Functions

```typescript
type EasingFunction =
  | 'LINEAR'
  | 'EASE_IN'
  | 'EASE_OUT'
  | 'EASE_IN_OUT'
  | 'EASE_IN_BACK'
  | 'EASE_OUT_BACK'
  | 'EASE_IN_OUT_BACK'
  | 'EASE_IN_ELASTIC'
  | 'EASE_OUT_ELASTIC'
  | 'EASE_IN_OUT_ELASTIC'
  | 'EASE_IN_BOUNCE'
  | 'EASE_OUT_BOUNCE'
  | 'CUSTOM_BEZIER';   // [0.25, 0.1, 0.25, 1.0]

interface CustomEasing {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// UI: Cubic Bezier Editor
// ┌───────────────────┐
// │  •               │  ← handle 1
// │     ────         │
// │         •        │  ← handle 2
// └───────────────────┘
```

---

## 7. Performance

- GPU-accelerated animations (transform, opacity)
- will-change hint dla animowanych elementów
- Intersection Observer (nie scroll listener)
- Reduced motion respect (prefers-reduced-motion)
- Lazy loading timeline

