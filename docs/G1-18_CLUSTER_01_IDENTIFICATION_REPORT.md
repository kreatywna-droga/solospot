# G1-18 CLUSTER 01 IDENTIFICATION REPORT

**CLUSTER ID:** G1-18-CLUSTER-01-TIMELINE-VIEWPORT-UI-ALIGNMENT  
**DATA:** 2026-08-16  
**BASELINE:** 285 błędów TypeScript  
**SUBSYSTEM:** `packages/authoring-studio/src/ui/components/timeline/`  

---

## 1. OPIS BŁĘDÓW KLASTRA
W plikach interfejsu osi czasu:
1. `packages/authoring-studio/src/ui/components/timeline/TimelineRulerOverlay.tsx` (12 błędów TS2339)
2. `packages/authoring-studio/src/ui/components/timeline/TimelineKeyframeViewport.tsx` (2 błędy TS2353/TS2339)

---

## 2. ROOT CAUSE
Interfejs `TimelineViewport` zdefiniowany w `packages/authoring-studio/src/timeline/TimelineViewport.ts` posiada właściwości:
* `width: number` (szerokość obszaru w pikselach),
* `pixelsPerMs: number` (skala pikseli na milisekundę),
* `scrollX: number` (przesunięcie przewijania w pikselach).

Komponenty `TimelineRulerOverlay.tsx` oraz `TimelineKeyframeViewport.tsx` odwoływały się do nieistniejących właściwości `scrollLeftMs` oraz `viewportWidthPx`.

---

## 3. PLAN NAPRAWY
1. W `TimelineRulerOverlay.tsx` zaimportować i użyć funkcji pomocniczych `timeToPixels`, `pixelsToTime`, `visibleTimeRange` z `TimelineViewport.ts` oraz odwołań `viewport.width` i `viewport.scrollX`.
2. W `TimelineKeyframeViewport.tsx` zastąpić `viewportWidthPx` przez `width` oraz użyć `timeToPixels` do kalkulacji pozycji klatek kluczowych.
3. Chronić SSOT `TimelineViewport.ts` (brak modyfikacji).

---

## 4. PRZEWIDYWANA DELTA
* `TimelineRulerOverlay.tsx`: -12 błędów
* `TimelineKeyframeViewport.tsx`: -2 błędy
* **Przewidywana delta klastra:** -14 błędów (285 $\rightarrow$ 271)
