# TODO — PM31 Animation Interpolation Engine (Agent 1)

> Status: ✅ IMPLEMENTED — READY FOR ARCHITECT REVIEW (po Quality Gates)
> Decyzja Architekta: ✅ PM31 APPROVED (Revision 1)
> Korekta 1: `AnimationInterpolation.ts` pozostaje WYŁĄCZNIE jako compatibility facade (@deprecated), delegując 100% wywołań do nowych modułów — bez drugiej implementacji.

## Zakres PM31 (zatwierdzony)

### ETAP 1 — AnimationInterpolator
- [x] `packages/builder-core/src/animation/AnimationInterpolator.ts` — number, opacity, px, rem, %, deg; deterministyczny, bezstanowy

### ETAP 2 — Color Interpolation
- [x] `packages/builder-core/src/animation/AnimationColorInterpolator.ts` — RGB, RGBA (bez HSL/LAB/OKLAB/gradientów)

### ETAP 3 — Transform Interpolation
- [x] `packages/builder-core/src/animation/AnimationTransformInterpolator.ts` — translateX, translateY, scale, rotate (bez matrix()/matrix3d()/perspective()/skew())

### ETAP 4 — Unit Normalization
- [x] `packages/builder-core/src/animation/AnimationUnitParser.ts` — px, rem, %, deg; walidacja zgodności jednostek

### ETAP 5 — Interpolation Contracts
- [x] Rozszerzyć `AnimationRuntimeTypes.ts` — `InterpolationType`, `InterpolationResult`, `PropertyInterpolator`, `RuntimeInterpolationContext` (bez zmian w API PM30)

### ETAP 6 — Testy (Node, bez jsdom)
- [x] `animation/__tests__/AnimationInterpolator.test.ts`
- [x] `animation/__tests__/AnimationColorInterpolator.test.ts`
- [x] `animation/__tests__/AnimationTransformInterpolator.test.ts`
- [x] `animation/__tests__/AnimationUnitParser.test.ts`

### ETAP 7 — Eksporty
- [x] `packages/builder-core/src/index.ts` — eksport modułów PM31

### ETAP 8 — Compatibility Facade
- [x] `AnimationInterpolation.ts` → `@deprecated` compatibility facade delegujący do nowych modułów (Korekta 1)

### ETAP 9 — Quality Gates
- [x] `npx tsc --noEmit`
- [x] `npx vitest run packages/builder-core/src/animation`
- [x] `npm run build`

## Zakazy
- requestAnimationFrame, Playback Loop, Runtime Bridge, Runtime Preview, Inspector UI, Timeline UI, Keyframe Editor, Canvas Integration, Responsive Animation UI, Commerce Engine, Platform Core, Runtime Pipeline, DOM, CSS Animations.
- Żadna druga niezależna implementacja interpolacji (Korekta 1).
- Raport końcowy: wyłącznie PM31 DELTA IMPLEMENTATION REPORT (Revision 1).
