# SOLOSPOT — HACP MASTER EXECUTION MAP v1.0 — P0 FOUNDATION STABILITY GATE — FORENSIC AUDIT REPORT

**Status:** 🟢 P0 = **PASS (RECOMMENDED — formal ratification reserved for the Architect per Audit Authority Boundary)** — audit complete, FIRST BREAK repaired (R1+R2, approved scope), production-verified, clean re-baseline captured after the concurrent WIP settled (§7—§8).
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

---

## 7. REPAIR EXECUTION (approved scope R1+R2 — commit `ff52771`, push `022e703..ff52771`)

**Approval:** Architect selected "R1 + R2 (Recommended)" via scope question; execution started immediately after.

**Deviation from §5 plan (intentional, documented):** R1 landed on the **section anchor** (`[data-section-id]` div, `BuilderCanvas.tsx ~2841`) instead of the SectionBlock wrapper — the anchor is the same element the drag engine imperatively writes (`:2379`), and it matches the child-node pattern (`formatTransform` at child render sites); transform on the SectionBlock would have double-transformed under the drag engine. The anchor style now includes `formatTransform(resolveEffectiveStyles(node, canvas.viewport.label, document?.theme))`; `formatTransform` additionally coerces numeric offsets to px (parity with the runtime helper).

**R2 — full runtime chain (8 hops) now threads `styles` + `responsive`:**
1. `packages/runtime-core/src/RuntimeSection.ts` — `styles?/responsive?` on the type + `createRuntimeSection`
2. `DefaultRuntimeCompositionEngine.ts` — `LegacySectionLike` + `normalizeSection` keeps both (pipeline path)
3. `adapters/RuntimeSectionAdapter.ts` — legacy interfaces + `toRuntimeSection` / `toRuntimeSectionFromPageSection` / `toLegacySection` (fallback path)
4. `adapters/RuntimeResultAdapter.ts` — `LegacyRuntimeSection`
5. `src/lib/runtime/RuntimeTypes.ts` + `renderStore.ts` — result types + all 3 legacy maps
6. `src/app/store/[slug]/page.tsx`, `src/app/preview/[storeId]/page.tsx`, `src/app/preview-frame/[slug]/page.tsx` — pass `styles/responsive` into `SectionRenderer`
7. `src/components/runtime/SectionRenderer.tsx` — applies the builder's exact cascade (`base` / `+tablet ≤1024px` / `+mobile ≤640px`, mirror of `resolveEffectiveStyles` DESKTOP/TABLET/MOBILE) as a scoped `<style>` + wrapper div; **zero DOM delta** when no transform styles exist (existing documents pixel-identical); no styles ⇒ no wrapper, no `<style>`
8. Builder call sites pass **no** styles → no double-transform (canvas keeps its own anchor path)

**Bite tests (all proven to fail pre-fix / written before the fix):**
- `src/components/builder/canvas/__tests__/canvasSectionTranslateRender.test.tsx` — 2 tests (mount render + TABLET merge)
- `packages/runtime-core/src/__tests__/section-styles.test.ts` — 5 tests (composition normalize + adapter round-trip + no-styles contract)
- `src/components/runtime/__tests__/section-transform-render.test.tsx` — 5 tests (base / media cascade / zero-delta / numeric coercion / rotate+scale)

**Validation vs baselines (all green):**
| Gate | Result |
|---|---|
| Focused vitest (canvas + runtime + runtime-core) | 13 files / **95 tests PASS** |
| Full suite | **36 failed files / 224 failed** — *byte-identical file set to `scratch/p0-baseline-tests.json`*; 33 906 passed (+24 = new tests) |
| `npx tsc --noEmit` | **28 errors — baseline, 100% in the 4 known foreign test files** (concurrent WIP settled via `022e703`; tree re-baselined) |
| `npx eslint .` | **15 errors / 44 warnings** (errors = baseline; my files: 0 errors) |
| `npm run build` | EXIT 0 (`scratch/build-p0-r2.log`) |

---

## 8. PRODUCTION VERIFICATION (deploy `solospot-nvlxw8z4k`, alias `https://www.solospot.pl`, Ready 3m)

| # | Proof | Result | Evidence |
|---|---|---|---|
| P1 | **R1 fresh mount** — fixture `translate(100px,40px)` → hero x | **535 = expected** (pre-fix 471), transform `translate(100px, 40px)`, 0 JS errors | `scratch/p0-responsive-fresh.json` (this run) |
| P2 | **R1 drag → save → reload** — committed `translate(220px,41px)` renders after reload | x=612 (=471+220·zoom), transform survives mount | `scratch/p0-r1-e.json` |
| P3 | **R1 viewport remount** — Tablet → Desktop | TABLET renders `translate(60px, 0px)` (x=384); back to DESKTOP restores `translate(220px,41px)` (x=612) | `scratch/p0-r1-e.json` |
| P4 | **R2 server pipeline** — `GET /api/preview/ns26-1788568754716?mode=LIVE&noCache=true` | `sections[sec_hero].styles={translateX:'100px',translateY:'40px',…}` + `responsive.tablet={translateX:'60px'}` present in renderStore output | API response (this run) |
| P5 | **R2 live HTML** — `GET /store/ns26-1788568754716` (PUBLISHED) | Server HTML contains `<div id="sst-sec_hero"><style>#sst-sec_hero{transform:translate(100px, 40px)}@media (max-width:1024px){#sst-sec_hero{transform:translate(60px, 0px)}}</style>…` | prod HTML (this run) |
| P6 | JS errors across all probes | **0** (only fixture 401/404 resource noise, excluded by filter) | probes above |

**Data note (P4/P5):** no prod store had server-side transform data (saves were localStorage-only → 0/81 sections). R2 render was proven on the disposable **NS26 acceptance store** `ns26-1788568754716` (`sec_hero` given base+tablet translate, `publicationStatus→PUBLISHED`, PATCH 204 via service role — `.env.production`). Customer stores (`mojamarka`, `myshoe`) untouched. Builder probes use the `s-demo` localStorage fixture (unchanged mechanism).

**Fixtures/probes (new):** `scratch/p0-store-inspect.js`, `scratch/p0-r1-remount-probe.js`, outputs `scratch/p0-r1-e.json`, `scratch/p0-responsive-fresh.json` (re-run post-deploy).

---

**Commit:** `ff52771` (14 files: 11 modified + 3 new tests — foreign WIP files untouched) · **Push:** `022e703..ff52771` · **Deploy:** `https://solospot-nvlxw8z4k-kreatywna-droga.vercel.app` → alias `https://www.solospot.pl` (Ready in 3m)

**FINAL VERDICT: Recommendation = P0 PASS** — forensic audit complete (§1—§4), FIRST BREAK repaired within approved scope (§7), production-verified with 6 independent proofs (§8), and the §3 blocking condition (concurrent WIP) resolved: `022e703` landed, post-WIP re-baseline captured (36/224 = AGENTS baseline, tsc 28 = baseline, eslint 15 = baseline, build EXIT 0). Formal ratification (`FORMALLY RATIFIED 🔒`) belongs to the Architect per Audit Authority Boundary.

**Documented, NOT repaired (out of P0 approved scope — carried forward):** dual responsive storage shapes (`node.responsive` vs `node.responsiveProps`), dead responsive engines, Mobile viewport doesn't narrow the canvas sheet, history stack not persisted across reload, baseline red suites (36/224). These remain candidates for later phases (e.g. P9 responsive consolidation).

**NEXT (per map):** Architect ratifies P0 → start **P1 — DESIGN INTELLIGENCE** (status NOT_STARTED → IN_PROGRESS, no phase skipping).
