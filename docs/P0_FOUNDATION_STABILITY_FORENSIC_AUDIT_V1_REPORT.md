# SOLOSPOT — HACP MASTER EXECUTION MAP v1.0 — P0 FOUNDATION STABILITY GATE — FORENSIC AUDIT REPORT

**Status:** 🟡 P0 = **IN_PROGRESS** (forensic audit COMPLETE; repair AWAITING APPROVAL per map: "Dopiero po zatwierdzeniu zakresu wykonaj repair")
**Branch:** `main` · HEAD `364b35c` (= `origin/main`, deployed to production)
**Constraint honoured:** READ-ONLY audit — **no product file was changed** by this gate. No commit, no deployment.

---

## 1. SCOPE (P0 verify list → evidence)

| P0 verification item | Result | Evidence |
|---|---|---|
| build | ✅ PASS (baseline) | `scratch/p0-build.log` EXIT 0, "Compiled successfully in 16.8s" (16:47) |
| typecheck | ✅ PASS at baseline / ⚠️ moving target | 16:45 → **28 errors** (baseline, 4 foreign test files); 17:18 → **30 errors** (+2 in *concurrent WIP* test, see §3) |
| tests | ✅ PASS = baseline | `scratch/p0-baseline-tests.json` (16:46): 861 files, **36 failed files / 224 failed / 33 882 passed** — exactly the AGENTS baseline |
| lint | ✅ PASS = baseline | `scratch/p0-lint.log`: **15 errors / 42 warnings** (baseline) |
| production | ✅ PASS | `https://www.solospot.pl` serves HEAD `364b35c` (font-gate deploy, verified earlier today) |
| Builder (select/edit/render) | ✅ PASS | probe A: studio load, hero select, viewport switch — 0 JS errors (`scratch/p0-foundation-prod2.json`) |
| HACP | ✅ PASS | probe A: `zmień kolor na zielony` → `FAST_PATH` → SUCCESS, canvas bg `transparent → rgb(0,255,0)` |
| Mini Inspector | ✅ PASS | probe A: panel EXECUTED with real canvas mutation; honest-CLARIFY behavior verified earlier today (font gate §9) |
| Design System (apply→doc→canvas) | ✅ PASS | probe B: DS catalog → fonts → **Space Grotesk** Apply → `theme.font` mutated + saved → canvas `<section>` font live `"Space Grotesk"`; **UNDO** reverted doc+canvas; **REDO** restored; **RELOAD** kept `Space Grotesk` (`scratch/p0-ds-c.json`) |
| persistence | ✅ PASS | probe B (theme font survives save+reload) + probe C (node styles + responsive survive save+reload) + font-gate PERSIST earlier today |
| undo/redo | ✅ PASS | probe B DS apply ↔ undo ↔ redo round-trip on doc AND canvas; font-gate undo/redo earlier today |
| responsive | 🟡 write-path PASS / **render of saved offsets = FIRST BREAK** | probe C: DESKTOP drag → `styles.{translateX:100px,translateY:40px}` ✓; TABLET drag → `responsive.tablet.{translateX:20px,translateY:101px}` ✓ (bp-scoped); persistence ✓; viewport buttons switch state, 0 JS errors; **but saved translates are never rendered by the canvas (§4)** |
| Canvas / BuilderDocument / Mutation Engine | 🟡 PASS for command mutations, **FIRST BREAK for translate rendering** | font gate (earlier): `set_node_styles` → doc → canvas ✓ verified; translate path broken (§4) |
| AI execution pipeline | ✅ PASS (baseline) | fast path + AI path verified earlier today (font gate A—F + AI probe: EXECUTED/CLARIFY honest, 0 fake SUCCESS) |
| Experience Library / Asset System | ✅ PASS at unit level | catalog/insertion tests green in baseline; asset `Real*Flow` failures are pre-existing baseline (§2) |

**Console:** 0 JavaScript/page errors across all probes; only fixture-time `401/404` resource responses (unauthenticated `/api/stores/s-demo`, known).

---

## 2. BASELINE (Phase reference — AGENTS, re-confirmed 16:45—16:47)

| Check | Baseline value | Delta vs AGENTS |
|---|---|---|
| Full `vitest run` | 36 failed files / 224 failed / 33 882 passed (861 files) | = baseline (+4 = font-gate tests already counted) |
| Failed files by area | authoring-studio 26, api 4, asset-manager-core 2, builder-core rendering 2, design-system catalog routing 1, hacp 1 (known **T37**) | pre-existing, untouched |
| `npx tsc --noEmit` | 28 errors in 4 files (`apply-pipeline-all-categories`, `visual-effectiveness`, `CompositionIntelligence`, `HacpLiveDispatch`) | = baseline |
| `npx eslint .` | 15 errors / 42 warnings | = baseline |
| `npm run build` | EXIT 0 | = baseline |

---

## 3. WORKING TREE — CONCURRENT (FOREIGN) WIP — GOVERNANCE FINDING

A **concurrent session is actively editing core files** during this audit (uncommitted; not staged, not touched, not judged by this gate):

| File | State | Last edit observed |
|---|---|---|
| `src/lib/hacp/HacpBridge.ts` | `M` (+32: "REPAIR GATE v3.0 — FONT PERSISTENCE" font fan-out on design applies) | **17:16** (during audit) |
| `src/components/builder/design-system/DesignSystemCatalog.tsx` | `M` (+41: same font fan-out on DS apply) | 16:52 |
| `src/lib/design-brain/index.ts` | `M` (+18: re-exports) | 16:51 |
| `src/lib/design-brain/DesignApplyRepair.ts`, `DesignQualityRules.ts` | `??` new | 16:51–16:56 |
| `src/lib/design-brain/__tests__/DesignApplyRepair.test.ts`, `DesignSystemCatalog.apply.test.tsx`, `src/lib/hacp/__tests__/HacpLiveDispatch.test.ts` | `??`/`M` | 16:54–17:16 |

- The WIP targets a **stale premise** (its comments claim canvas ignores theme fonts — disproved on production today: DS apply → canvas changed, probe B), and **duplicates font fan-out in 3 places** instead of the shipped root-cause fix (`2366314`).
- Current-tree typecheck is RED because of it: **30 errors** = baseline 28 + 2 in `DesignApplyRepair.test.ts`.
- **Consequence:** the 16:45—16:47 baselines are the valid P0 reference; a final green re-baseline is only possible **after this WIP lands or is discarded**. This is the only reason P0 cannot be declared PASS now even if §4 were repaired.

---

## 4. FIRST BREAK / ROOT CAUSE

### FIRST BREAK (proven, 3 independent proofs)

**Saved section position offsets (`styles.translateX/translateY`, `responsive[bp].translate*`) are written to BuilderDocument and persisted — but the Canvas NEVER renders them on mount. The user's drag is only visible via a temporary imperative style that disappears on any re-mount (viewport switch, reload).**

Proofs (production, `https://www.solospot.pl`):

1. **Fresh-load fixture:** document with `styles: { translateX: '100px', translateY: '40px' }` → hero renders at **x = 471 = natural position** (rendered would be x = 535). Data present in BuilderDocument (`scratch/p0-responsive-fresh.json`).
2. **Remount loss:** drag +100/+40 at DESKTOP → visible x 471→535 ✓, doc committed ✓; switch TABLET→MOBILE→DESKTOP (frame remount `key={canvas.viewport.label}`) → x back to **471** (offset gone visually, doc intact) (`scratch/p0-responsive-prod3.json`).
3. **Code:** the section wrapper applies `resolvedStyles` for backgroundColor/padding/margin/zIndex… but **no `transform`** — `BuilderCanvas.tsx:1648–1670` (SectionBlock wrapper) and anchor `BuilderCanvas.tsx:2841–2850`. The only transform source during drag is the drag engine's imperative `domEl.style.transform` (`BuilderCanvas.tsx:2379`), wiped on React re-mount. Child nodes DO apply it (`formatTransform` at `BuilderCanvas.tsx:539…1205`); **sections alone are skipped**. The runtime site has **zero** `translateX` consumption (`src/lib/runtime`, `src/components/runtime` — grep empty), so the live store page ignores it too.

### ROOT CAUSE

`SectionBlock`'s wrapper `style` object (`BuilderCanvas.tsx:1648–1670`) omits `transform: formatTransform(resolvedStyles)` even though `resolvedStyles = resolveEffectiveStyles(node, viewport, theme)` already merges base + breakpoint translates (`BuilderCanvas.tsx:1336`). Persisted offsets therefore exist in the SSOT but have no render consumer — exactly the "BuilderDocument has X, Canvas lacks X" failure class of the Font Gate.

### RELATED OBSERVATIONS (documented, NOT in minimal repair scope)

- **Two parallel responsive storage shapes:** drag/selection/panel write `node.responsive[bp]` (`SelectionOverlay.tsx:474`, `QuickToolbar.tsx:111`, `ContextualSettingsPanel.tsx:716`) while shell/inspector write `node.responsiveProps[bp]` (`BuilderShell.tsx:205`, `BuilderCanvas.tsx:251`, `InspectorSync.tsx:93`). Reads are split the same way → responsive edits from different UI surfaces do not see each other. (Auditor note: candidate for P9, not P0.)
- Responsive engines (`ResponsiveOverrideEngine`, `builder-core/ResponsiveEngine`) are dead code — not imported by any `src/` UI.
- Mobile (375px) viewport does not narrow the canvas sheet (frame is `width:100%`; zoom-fit only shrinks DESKTOP) — mobile *composition* preview shows container width, not 375px. Observation for P9.
- Baseline red suites (36 files/224 tests) and `HacpIntentEngine T37` remain pre-existing/known.
- History stack is not persisted across reload (undo chain lost after save+reload) — documented anomaly, not repaired here.

---

## 5. MINIMAL REPAIR PLAN (AWAITING APPROVAL)

**R1 — Canvas render (the proven break):**
- File: `src/components/builder/canvas/BuilderCanvas.tsx` ONLY (no collision with the foreign WIP files).
- Change: add `transform: formatTransform(resolvedStyles)` to the SectionBlock wrapper `style` object (`~line 1648`). `formatTransform` (`:107`) already handles translate/rotate/scale/raw transform.
- Effect: saved offsets render on mount/remount/reload; drag keeps working (drag writes the same values it imperatively sets — React re-render re-applies identical state; no conflict); viewport-responsive offsets become visible per breakpoint.
- Regression tests (new, `src/components/builder/canvas/__tests__/`):
  1. jsdom render: fixture with `translateX:'100px'` → wrapper `style.transform` contains `translate(100px, 40px)` (fails pre-fix — bite-proof, same method as Font Gate);
  2. contract: `resolvedStyles` bp-merge → transform reflects `responsive.tablet` when viewport = TABLET.

**R2 — Runtime parity (same root cause, production site):**
- Apply the same transform consumption in the runtime section render path (`src/components/runtime/` / store page wrapper) so builder-visible offsets survive to the live site, + 1 unit test.
- *(Optional — can be deferred to its own gate if you prefer R1-only scope.)*

**Verification (per map, after approval):** DIFF → focused vitest → full suite vs baseline → `tsc` (28, excluding foreign WIP) → `eslint` → `npm run build` → commit **only** `BuilderCanvas.tsx` + tests (+ R2 files if approved) → push → `npx vercel deploy --prod --yes` → production proof: fresh-load fixture x-offset, drag→reload→position survives, viewport-switch keeps offsets, 0 JS errors → report.

**Out of scope (explicitly):** `HacpBridge.ts`, `DesignSystemCatalog.tsx`, `design-brain/*` (foreign active WIP), responsive dual-storage consolidation (P9), baseline red suites, history persistence.

---

## 6. EVIDENCE INVENTORY

- Baselines: `scratch/p0-baseline-tests.json`, `scratch/p0-tsc.log`, `scratch/p0-lint.log`, `scratch/p0-build.log`, `scratch/p0-tsc-now.log`
- Production probes: `scratch/p0-foundation-prod.json`, `scratch/p0-foundation-prod2.json`, `scratch/p0-ds-prod.json`, `scratch/p0-ds-c.json`, `scratch/p0-responsive-prod.json`, `scratch/p0-responsive-prod3.json`, `scratch/p0-responsive-fresh.json`, `scratch/p0-dup-diag.js`(+output), harnesses `scratch/p0-foundation-probe.js`, `scratch/p0-ds-undo-persist.js`, `scratch/p0-responsive-probe.js`, `scratch/p0-dup-diag.js`
- Earlier same-day acceptance (referenced): font gate `scratch/font-gate-after.json`, `scratch/font-gate-ai-after2.json` (report `docs/MINI_INSPECTOR_FONT_CHANGE_REAL_EXECUTION_FORENSIC_REPAIR_GATE_V1_REPORT.md`)

**Commit:** none (read-only gate) · **Deployment:** none (prod already = HEAD `364b35c`)
**FINAL VERDICT: P0 = IN_PROGRESS** — audit complete, FIRST BREAK proven, repair plan awaits approval; final PASS also requires the concurrent WIP (§3) to settle so a clean re-baseline can be captured.

**NEXT (per map):** approve §5 scope → execute R1 (± R2) → re-baseline → P0 verdict → only then start **P1 — DESIGN INTELLIGENCE**.
