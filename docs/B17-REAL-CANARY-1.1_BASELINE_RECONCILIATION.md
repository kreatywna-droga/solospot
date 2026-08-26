# B17-REAL-CANARY-1.1 — BASELINE FORENSIC RECONCILIATION

## 1. Environment & Repository Baseline
- **Repository Root**: `c:\Users\HP\Documents\GOOGLE ANTIGRAVITY APK\WEB FACTOR`
- **Baseline Git SHA**: `8d9f45a1b2a30546afc44ab7d3fb214ec6296897`
- **Runner**: `Vitest v4.1.10`
- **Node Runtime**: `v24.15.0`
- **Package Manager**: `npm 11.12.1`

---

## 2. Baseline Test Inventory Reconciliation

| Metric | Baseline Claim | Forensic Reality | Status |
|---|---|---|---|
| Discovered Test Files | 546 | 546 | **VERIFIED** |
| Passed Test Files | 522 | 522 | **VERIFIED** |
| Failed Test Files | 24 | 24 | **VERIFIED** |
| Total Executed Test Cases | 3367 | 3367 | **VERIFIED** |
| Passed Test Cases | 3330 | 3330 | **VERIFIED** |
| Failed Test Cases | 37 | 37 | **VERIFIED** |
| Skipped / Todo Test Cases | 0 | 0 | **VERIFIED** |

---

## 3. Forensic Analysis of Pre-Existing Failures (24 Files / 37 Tests)
The 24 failing test files and 37 failing test cases pre-existed in the workspace prior to B17-1. They are exclusively located in:
1. `packages/authoring-studio/src/ui/components/preview/__tests__/*.tsx` (JSDOM / `document is not defined` environment issues)
2. `packages/authoring-studio/src/ui/components/timeline/__tests__/*.tsx` (JSDOM environment issues)
3. `packages/authoring-studio/src/timeline/__tests__/TimelinePlaybackSession.test.ts` (Legacy timeline loop tick assertions)
4. `packages/authoring-studio/src/vector/__tests__/*.ts` (Legacy coordinate offset math in ShapeGrouping / ShapeTransform)
5. `packages/builder-core/src/rendering/__tests__/*.ts` (Legacy frameIndex and SceneComposer transform expectations)

None of the 24 failing files reside in `packages/commerce-engine/` or were impacted by B17-1.

---

## 4. Conclusion
Baseline reproduction status is **FULL & 100% VERIFIED**.
