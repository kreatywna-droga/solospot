# G1-18 CLUSTER 02 IDENTIFICATION REPORT

**CLUSTER ID:** G1-18-CLUSTER-02-EASING-AND-GRAPH-EDITOR-ALIGNMENT  
**DATA:** 2026-08-16  
**BASELINE:** 271 błędów TypeScript  
**SUBSYSTEM:** `packages/authoring-studio/src/timeline/` & `packages/authoring-studio/src/motion/`  

---

## 1. OPIS BŁĘDÓW KLASTRA
1. `packages/authoring-studio/src/timeline/TimelineEasingEditor.ts` (15 błędów TS2322, TS2820, TS2353, TS2678, TS2339)
2. `packages/authoring-studio/src/motion/GraphEditorEngine.ts` (13 błędów TS2305, TS2345, TS2339)
3. `packages/authoring-studio/src/timeline/__tests__/EasingEditor.test.ts` (1 błąd dopasowania sygnatury `controlPoints`)

---

## 2. ROOT CAUSE
* **SSOT `AnimationTypes.ts`:**
  `EasingCurve` jest zdefiniowany jako:
  `{ type: 'linear' | 'ease-in' | 'ease-out' | 'cubic-bezier' | 'spring'; controlPoints?: [number, number, number, number]; stiffness?: number; damping?: number; }`.
  `TimelineEasingEditor.ts` odwoływał się bezpośrednio do właściwości `x1, y1, x2, y2` oraz typów `'ease'` i `'ease-in-out'`.
* **Silnik `GraphEditorEngine.ts`:**
  Importował nieistniejące nazwy `Keyframe`, `Track`, `CubicBezierParams` zamiast `AnimationKeyframe` i `PropertyAnimationTrack` oraz wywoływał nieistniejące metody statyczne `AdvancedMotionCurves` zamiast `evaluateProgression(t, kf.easing)`.

---

## 3. PLAN NAPRAWY
1. W `TimelineEasingEditor.ts` dostosować DTO `EasingCurve` do `controlPoints: [x1, y1, x2, y2]` oraz poprawnych literałów typów.
2. W `EasingEditor.test.ts` dostosować fixture wywołania `extractBezierControlPoints`.
3. W `GraphEditorEngine.ts` zaktualizować importy typów do `AnimationKeyframe` / `PropertyAnimationTrack` i zintegrować wywołania z `AdvancedMotionCurves.evaluateProgression`.
4. Chronić SSOT `AnimationTypes.ts` i `AdvancedMotionCurves.ts`.

---

## 4. PRZEWIDYWANA DELTA
* `TimelineEasingEditor.ts`: -15 błędów
* `GraphEditorEngine.ts`: -13 błędów
* **Przewidywana delta klastra:** -28 błędów (271 $\rightarrow$ 243 błędów)
