# SOLOSPOT — CONTEXTUAL MINI INSPECTOR AI / ANCHOR-TO-SELECTED-COMPONENT REPAIR GATE v1.0

**Status:** **PASS** (local + prod)
**Date:** 2026-09-24
**Charakter:** CRITICAL UI FIX — NO NEW AI FEATURES
**Baseline:** `docs/MINI_INSPECTOR_AI_REAL_PRODUCT_GATE_V1_REPORT.md` (PASS, `43be053`, prod 14/0)
**Gate commits:** `1cf91f5` (anchor) · `134dca9` (avoidOverlap) · `3df8cd5` (re-measure safety net + E2E harden)
**Prod deploy:** `solospot-io03vgidi-kreatywna-droga` → https://www.solospot.pl (Ready) · **Prod E2E:** 14 PASS / 0 FAIL

---

## 1. Gate identity

| Field | Value |
|-------|-------|
| Gate name | CONTEXTUAL MINI INSPECTOR AI / ANCHOR-TO-SELECTED-COMPONENT REPAIR GATE v1.0 |
| Character | MANDATORY / BLOCKING — AI window must anchor to selected component bounding rect; never stale bottom-right |
| Proof dir | `scratch/mini-inspector-ai-positioning-proof/` |
| E2E script | `scratch/mini-inspector-ai-positioning-e2e.js` |
| Report | `docs/MINI_INSPECTOR_AI_CONTEXTUAL_POSITIONING_GATE_V1_REPORT.md` |

---

## 2. FIRST BREAK (forensic)

| Klasa | Result |
|-------|--------|
| **Static viewport corner** | **CONFIRMED** — `MiniInspectorAI.tsx:300` had `className="fixed bottom-6 right-6 ..."` |
| `elementRect` prop | **MISSING** on MiniInspectorAI before this gate |
| `usePanelPosition` wiring | **MISSING** — panel never used shared collision engine |
| Scroll/zoom/resize follow | **MISSING** — no listeners, no live DOM measure |
| Hosts (QuickToolbar / ContextualSettingsPanel) | Did not pass selected-node rect into AI |

**ROOT CAUSE:** AI window rested at fixed `bottom-6 right-6` regardless of selection. Wide nodes (e.g. `sec-hero-init`) were covered; small viewports put the panel off the useful area; selection changes did not re-anchor.

---

## 3. POSITIONING ARCHITECTURE (§2 REUSE)

```
SelectionOverlay.selectedElementRect  ──┐
ContextualSettingsPanel.elementRect   ──┼→ MiniInspectorAI.elementRect (fallback)
                                        │
MiniInspectorAI.measureAnchor()        ──┘  live [data-node-id]/[data-section-id]
        │                                     getBoundingClientRect (preferred)
        ▼
usePanelPosition(anchorRect, open, {
  panelWidth: 360, panelMinHeight: 220,
  gap: 12, viewportMargin: 16,
  avoidOverlap: true,          // AI only; CSP keeps default false (clamp contract)
})
        │
        ▼
computePanelPosition → { x, y, placement, maxHeight }
  order: RIGHT → LEFT → (avoidOverlap: ABOVE → BELOW) → clamp
        │
        ▼
style={{ left, top, maxHeight }}  +  data-ai-placement={placement|fallback}
  fallback { right:24, bottom:24 } ONLY when node unmeasurable (removed from DOM)
```

No second geometry system — AI and ContextualSettingsPanel share `computePanelPosition` / `getWorkspaceBounds` / `intersectBounds`.

---

## 4. ANCHOR (live DOM measure)

- Query `[data-node-id="${sectionId}"]` then `[data-section-id="${sectionId}"]`.
- `getBoundingClientRect()` → `ElementRect { x, y, width, height }` (viewport space, same as workspace bounds).
- Prefer live measure over prop `elementRect` so scroll/zoom reflow is tracked without parent re-render.
- `elementRect` from SelectionOverlay / CSP is fallback when live query fails.

**Proof attr:** `data-ai-placement` = `right | left | above | below | fallback`.

---

## 5. COLLISION / avoidOverlap

`usePanelPosition` option `avoidOverlap?: boolean` (**default `false`** — preserves ContextualSettingsPanel edge-clamp contract).

When `avoidOverlap` and horizontal side-clamp would cover the element:

1. Prefer **ABOVE** if `spaceAbove >= panelMinHeight`
2. Else **BELOW** if `spaceBelow >= panelMinHeight`
3. Else last-resort side clamp (still inside workspace)

Full side-fit (space for whole panelW) still preferred when available — wide hero with free right side stays `right`; when side clamp would overlay the node, falls to `below`.

---

## 6. SCROLL / ZOOM / RESIZE / SELECTION follow

| Event | Mechanism |
|-------|-----------|
| Scroll | `window.addEventListener('scroll', …, { capture: true })` — scroll does not bubble; capture sees inner canvas containers |
| Resize | `window.addEventListener('resize', …)` in MiniInspectorAI + usePanelPosition |
| Workspace resize | `ResizeObserver` on `[data-builder-workspace]` inside usePanelPosition |
| Zoom | `useLayoutEffect` deps include `canvas.zoom` → `measureAnchor()` |
| Selection change | `canvas.selectedSectionId` + `sectionId` prop change → re-measure + target re-resolve |
| Safety net | `setInterval(measureAnchor, 200)` while open — catches missed discrete events / CSS zoom transitions |

---

## 7. Wiring (hosts)

| File | Change |
|------|--------|
| `MiniInspectorAI.tsx` | prop `elementRect?`; live `measureAnchor`; `usePanelPosition` + `avoidOverlap: true`; `data-ai-placement`; scroll/resize/interval follow |
| `usePanelPosition.ts` | `avoidOverlap` option; capture scroll; pure `computePanelPosition` order extended |
| `ContextualSettingsPanel.tsx` | `elementRect={elementRect}` → MiniInspectorAI |
| `QuickToolbar.tsx` | new prop `elementRect` → MiniInspectorAI |
| `SelectionOverlay.tsx` | `selectedElementRect` useMemo (deps `canvas.zoom`) → QuickToolbar |

---

## 8. Tests (§6)

| Suite | Count | Focus |
|-------|-------|-------|
| `MiniInspectorAI.test.ts` | 43 + 5 positioning | source purity (uses usePanelPosition, no `bottom-6 right-6`), hosts pass `elementRect`, SelectionOverlay has `selectedElementRect` |
| `panelPosition.test.ts` | AI 360px + avoidOverlap | below/above placements, legacy side-clamp regression, wide-section overlap |
| **Combined vitest (gate files)** | **73 PASS** | green 3× during gate |

---

## 9. Anti-regression

| Check | Result |
|-------|--------|
| `npx tsc --noEmit -p tsconfig.json` | **TSC=0** |
| `npx eslint` (gate files) | **ESLINT=0** |
| `npx vitest run` (MiniInspectorAI + panelPosition) | **73 passed** |
| `npm run build` | **OK** (Next.js 16.2.9) |

---

## 10. Production deploy

| Item | Value |
|------|-------|
| Commit chain | `1cf91f5` → `134dca9` → `3df8cd5` (push origin/main) |
| Deploy | `solospot-io03vgidi-kreatywna-droga` → **Ready** · alias https://www.solospot.pl |
| `GET /` | **200** |
| `GET /api/health` | **200** |
| `OPTIONS /api/builder/copilot` | **204** |

Prior deploys this gate: `solospot-jabo4s006` (`1cf91f5`), `solospot-5vn0549ys` (`134dca9`).

---

## 11. Production E2E (§9)

Script: `scratch/mini-inspector-ai-positioning-e2e.js` · Proof: `scratch/mini-inspector-ai-positioning-proof/` · `BASE_URL=https://www.solospot.pl`

```
PASS S01 Open prod URL — https://www.solospot.pl
PASS S02 Builder workspace present
PASS S03 Select heading — section:sec-hero-init
PASS S04 Open Mini Inspector AI for heading — open
PASS S05 AI anchored next to selected heading — placement=below adjacent=true staleCorner=false gaps.belowNode=11.99
PASS S06 AI fully inside builder workspace (16px margin)
PASS S07 Anchored left/top style — left=437.77px top=431.62px right=null bottom=null placement=below
PASS S08 Follows scroll — placement=below adjacent=true nodeMoved=true aiTop 431.61→335.61
PASS S09 Follows zoom out — placement=below adjacent=true via=button
PASS S10 Follows viewport resize 1280x720 — adjacent=true inside=true placement=below stillOpen=true
PASS S11 Selection change re-anchors — target=sec-hero-init match=true adjacent=true opened=true
PASS S12 Large section/hero node — placement=below adjacent=true staleCorner=false opened=true
PASS S13 Target lock strip — TARGET:hero sec-hero-init (page page-home)
PASS S14 No console errors — 0 errors

=== POSITIONING E2E: 14 PASS / 0 FAIL (14 total) ===
```

Screenshots: `01-builder` … `09-target-lock-regression` in `scratch/mini-inspector-ai-positioning-proof/`.
Geometry dump: `geometry-final.json`, `result.json`.

**E2E fixes applied mid-gate (not product weakening):**
- No stale pre-scroll/zoom re-click after resize (deselect unmounted AI).
- `openAiForSelection` uses `el.click()` (hit-test proof) with one retry.
- Forced `dispatchEvent(new Event('resize'))` after `setViewport`.
- Zoom restore via real zoom-in button (no random "100%" text click).

---

## 12. What was NOT changed (gate constraints)

- Prompt UI, quick actions, HACP pipeline, target context — untouched except positioning host props.
- No second geometry engine — AI reuses `usePanelPosition` / `computePanelPosition`.
- CSP clamp contract preserved (`avoidOverlap` default `false`).
- Honest FAILED / undo / redo / persistence — prior gate behavior intact (S13 target lock regression green).
- Tests were not weakened for PASS — failures drove product (`200ms` safety net) and E2E robustness (stale-coord deselect, hit-testing), not assertion relaxation.

---

## 13. Pre-existing drift (not committed)

`packages/authoring-studio/src/inspector/DesignInspector.tsx`, `FontPicker.tsx`, `public/stores/s-new/*`, unrelated `scratch/*` proof churn, `$`, `TODO_SPRINT6_STEP6.progress.md`.

---

## 14. DoD checklist

- [x] 1. FIRST BREAK forensic before code change (fixed `bottom-6 right-6`)
- [x] 2. Shared engine only (`usePanelPosition` / `computePanelPosition`)
- [x] 3. Anchor = live bounding rect of selected node
- [x] 4. Collision order RIGHT → LEFT → ABOVE → BELOW → clamp
- [x] 5. `avoidOverlap` for AI only; CSP default false
- [x] 6. `data-ai-placement` proof attribute
- [x] 7. Scroll capture + resize + workspace ResizeObserver + zoom dep + selection dep
- [x] 8. 200ms safety-net re-measure while open
- [x] 9. Fallback corner only when node unmeasurable
- [x] 10. Hosts pass `elementRect` (CSP, QuickToolbar←SelectionOverlay)
- [x] 11. Unit tests: positioning + source purity + avoidOverlap (73 green)
- [x] 12. TSC=0, ESLINT=0, build OK
- [x] 13. Commits `1cf91f5` / `134dca9` / `3df8cd5` pushed
- [x] 14. Prod deploy Ready + health 200 + copilot 204
- [x] 15. Prod E2E **14/0** + screenshots + geometry-final.json
- [x] 16. Report committed
- [x] 17. Target lock / quick actions / HACP / honest status regression green

---

## 15. Final status

| Gate | Local | Prod |
|------|-------|------|
| Contextual Mini Inspector AI Anchor Repair Gate v1.0 | PASS (TSC/ESLint/build/73 tests) | **PASS — 14/0** · `solospot-io03vgidi` · https://www.solospot.pl |

**GATE: PASS**
