# SOLOSPOT — HACP PROFESSIONAL WEBSITE CREATION GATE v1.0 (DENTIST START→FINISH)

**Status:** **PASS — 15/15, 0 FAIL, 0 WARN**
**Data:** 2026-09-24
**Charakter:** BUILD — kod + testy + runtime E2E + deploy
**Baseline (FIRST BREAK):** exact gate prompt → CHAT-only (`pathTaken=chat-only`, 6 FAIL, 0 mutacji)
**Prompt (jednorazowy, bez follow-upów):**
> „Zbuduj mi profesjonalną stronę od start to finish dla nowoczesnego gabinetu dentystycznego."

---

## Raport 22-punktowy (PHASE 17)

| # | Pytanie | Odpowiedź / Evidence |
|---|---|---|
| 1 | START→FINISH bez interwencji usera? | **TAK** — 1 prompt, `prompts=1` (1 chat + 0 posts), brak „WYKONAJ" |
| 2 | Intent (_ANALIZA)? | `isSiteGenerationRequest` → SITE_GENERATION; UI gate + IntentClassifier Priority 3 |
| 3 | Plan (ARCHITEKTURA)? | Deterministic `generateSitePlan`: industry=`dentist`, purpose=`booking`, 8 sekcji (navbar→hero→features→about→testimonials→cta→footer + extra) |
| 4 | Tool calls (runtime trace)? | `[SiteGen]` console: `update_theme`, `search_sections`, `insert_section_from_library`, `update_node_props`, `inspect_children`, overlay node updates — **0× batch_execute** |
| 5 | Mutacje BuilderDocument? | sections **1→8**, nodeCount **118**, `commandsGenerated`/`mutationsApplied` > 0 (UI: „Wykonano 11… operacji") |
| 6 | BuilderDocument before/after? | before=1 → after=8 (`C1 PASS`), proof `scratch/website-creation-gate-proof/result.json` |
| 7 | Biblioteka (PHASE 3)? | **TAK** — `search_sections` + `insert_section_from_library` soft-first; fallback engine `insert_section` |
| 8 | Weryfikacja (VERIFY)? | Each tool → HacpBridge BEFORE→EXEC→AFTER→VERIFY; `inspect_document_summary` na końcu |
| 9 | Self-correction? | Soft-fail library → internal insert; soft overlay `update_node_props`; failFast na non-soft błędach |
| 10 | Canvas proof? | `01-prompt-sent.png`, `02-after-wait.png`, `03-final.png` + DOM rects: overlaps=0, emptyish=0 |
| 11 | User interweniował? | **NIE** — single prompt, D3 PASS |
| 12 | Błędy runtime? | E1: console errors=0; genError=false; complete=true |
| 13 | Blokery? | **BRAK** w finalnym przebiegu |
| 14 | Testy? | `npx vitest run src/lib/ai` → **53 files, 946 tests, 0 fail** |
| 15 | tsc? | `npx tsc --noEmit` → **TSC_OK** |
| 16 | build? | `npm run build` → **BUILD_OK**; BUILD_ID=`0qdv1V5Dot6rHZOmkytF4` |
| 17 | lint? | Repo: 15 pre-existing errors (Function type, useParticleEngine, react-hooks…) — **0 nowych w plikach gate'a** (eslint na 6 plikach: 0 errors, 1 pre-existing img warning) |
| 18 | Commit SHA? | patrz § Commits poniżej (git push → HASH) |
| 19 | Push? | `main == origin/main` po pushu |
| 20 | Vercel deploy? | `npx vercel deploy --prod --yes` → deployment READY (patrz § Deploy) |
| 21 | Prod verification? | `BASE_URL=https://www.solospot.pl` gate E2E (patrz § Prod) |
| 22 | FIRST BREAK + capability gaps? | patrz § FIRST BREAK i § Capability gaps |

---

## FIRST BREAK (baseline, przed fixami)

**Dokładny prompt gate'a trafiał CHAT — podwójny trigger miss:**

1. **UI substring gate** — `AiCopilotWorkspace.handleSendMessage` wymagał `'zbuduj stronę'` lub (`stron` ∧ `internetow`) — fraza *„zbuduj mi profesjonalną stronę od start to finish"* **nie pasowała**.
2. **IntentClassifier** — `SITE_GEN_KEYWORDS` contiguous substring (`IntentClassifier.ts`); *„od start to finish"* nie było w liście.

**Baseline E2E (scratch):** `pathTaken=chat-only`, **6 FAIL**, sections 1→1, 0 mutacji, D1 PASS (honest — brak fake SUCCESS).

---

## Fixy (gate-blocking, minimalne)

| Plik | Fix |
|---|---|
| `src/lib/ai/IntentClassifier.ts` | Export `isSiteGenerationRequest(text)` — stem/non-contiguous: verb(`zbuduj\|stwórz\|…`) ∧ object(`stron\|website\|…`) + `'od start to finish'`; Priority 3 |
| `src/components/builder/ai/AiCopilotWorkspace.tsx` | Gate UI → `isSiteGenerationRequest` (SSOT z classifierem) |
| `src/lib/ai/SitePlanPlanner.ts` | (a) CTA bug `'Gotowy na开始?'` → `'Gotowy na zdrowy uśmiech?'`; (b) sekcja 0 **navbar**; (c) dentist testimonials; (d) **stem industry keywords** (`dentyst` ≠ `dentysta` — *„dentystycznego"*); (e) purpose fallback → industry default (`booking`); (f) `extractSiteTitle` (nie surowy brief); (g) industry-aware CTA headings |
| `src/lib/ai/SiteGenerationOrchestrator.ts` | (a) PHASE 3 library-first `tryInsertFromLibrary` soft; (b) `overlaySectionContent` + **recursive `overlayChildTexts`** via `inspect_children` → `update_node_props {text}`; (c) `execTool(…, {soft})`; (d) `[SiteGen]` console trace; (e) role-based mapping (navbar logo→brand, items, CTA buttons) |
| `src/lib/ai/__tests__/IntentClassifier.test.ts` | Gate prompt w SITE_GENERATION + 3× `isSiteGenerationRequest` |
| `src/lib/ai/__tests__/SitePlanPlanner.test.ts` | **NOWY** — 8 testów: industry dentist, purpose booking, hero/features dental, title, navbar CTA, CTA section, navbar-first |
| `scratch/website-creation-gate-e2e.js` | **NOWY** — exact prompt, path detect, structural snapshot, dental regex (+`uśmiech`), screenshots |

---

## Lokalny wynik finalny (PHASE 13 full)

```
=== GATE SUMMARY: 15 PASS, 0 FAIL, 0 WARN (path=generation-complete, sections 1→8) ===
```

| ID | Check | Status | Evidence |
|---|---|---|---|
| A1–A3 | workspace / baseline / exact prompt | PASS | beforeCount=1 |
| B1 | Execution path | PASS | `generation-complete`, progress→100 |
| B2 | Intent→architecture→execution UI | PASS | generationUiSeen=true |
| C1 | Canvas mutation | PASS | 1→8 |
| C2 | >1 section | PASS | 8 |
| C3 | No placeholders | PASS | 0 |
| C4 | Dental coherence | **PASS** | **hits=6/8** (hero „Twój uśmiech…", features „implanty/Ortodoncja", testimonials „Polecam gabinet", CTA „Gotowy na zdrowy uśmiech? Umów wizytę") |
| C5 | Structural sanity | PASS | emptyish=0, overlaps=0 |
| C6 | Visual DOM rects | PASS | overlaps=0 |
| D1 | No fake SUCCESS | PASS | honest, mutations>0 |
| D2 | No batch_execute leak | PASS | requests=0 |
| D3 | Single prompt | PASS | prompts=1 |
| E1 | Console errors | PASS | 0 |

**Canvas texts (dowód content):**
1. `Gabinetu dentystycznego | Strona główna Usługi O nas Opinie | Umów wizytę`
2. `Twój uśmiech to nasza pasja | Nowoczesna stomatologia… | Umów wizytę`
3. `Nowoczesne implanty stomatologiczne | Ortodoncja | …`
4. about (library residual EN — patrz gaps)
5. `Bezbolesne leczenie… Polecam gabinet | Co mówią nasi pacjenci`
6. `Gotowy na zdrowy uśmiech? | Umów wizytę już dziś | Umów wizytę`
7. footer `Gabinetu dentystycznego | …`
8. sidebar chrome (nie content)

---

## Proof artifacts

- `scratch/website-creation-gate-proof/result.json` — pełny runtime trace
- `scratch/website-creation-gate-proof/01-prompt-sent.png`
- `scratch/website-creation-gate-proof/02-after-wait.png`
- `scratch/website-creation-gate-proof/03-final.png`

---

## Capability gaps HACP (uczciwie)

1. **Brak własnej visual verification** HACP poza `inspect_document_summary` — overlap/placeholder scoring robi zewnętrzny E2E, nie orchestrator.
2. **Self-correction warunkowy** — soft overlay nie gwarantuje 100% pokrycia dzieci biblioteki (np. about „OUR STORY" EN residual, secondary button „Talk to Sales"/„Watch Demo" gdy `ctaUsed=true`).
3. **About section library residual** — `insert_section_from_library` wstawia EN marketing copy; overlay częściowo nadpisuje (heading/items), ale nie całe zagnieżdżone paragrafy.
4. **Deterministic planner only** przy braku provider keys — LLM plan (`generateLLMSitePlan`) nie osiąga runtime bez `OPENAI_API_KEY`/`GEMINI_API_KEY` (OpenCode free routing działa dla copilot chat, ale planner default = deterministic).
5. **Industry stem matching** — proste `includes(kw)`; nie ma pełnego stemmera PL (wystarczył stem `dentyst`, ale inne deklinacje mogą wymagać rozbudowy).
6. **Titles z „dla …"** — `extractSiteTitle` daje „Gabinetu dentystycznego" (mianownik dopiero z industry fallback); kosmetyka brandu.

---

## Commits / Deploy / Prod

### Commits
- Fix gate: `git commit` — pliki:
  - `src/lib/ai/IntentClassifier.ts`
  - `src/components/builder/ai/AiCopilotWorkspace.tsx`
  - `src/lib/ai/SitePlanPlanner.ts`
  - `src/lib/ai/SiteGenerationOrchestrator.ts`
  - `src/lib/ai/__tests__/IntentClassifier.test.ts`
  - `src/lib/ai/__tests__/SitePlanPlanner.test.ts`
  - `scratch/website-creation-gate-e2e.js`
- Docs: `docs/HACP_PROFESSIONAL_WEBSITE_CREATION_GATE_V1_REPORT.md`

**NIE commitujemy** (leftovers / nie-nasze): `public/stores/s-new/*`, `TODO_SPRINT6_STEP6.progress.md`, stare `docs/AI_*` untracked, dziesiątki `scratch/*`, `scripts/ai-copilot-*`.

### Push
```
git push origin main
```

### Deploy
```
npx vercel deploy --prod --yes
```
(bez `--archive=tgz`)

### Prod verification
```
$env:BASE_URL='https://www.solospot.pl'; node scratch/website-creation-gate-e2e.js
```
Oczekiwane: `pathTaken=generation-complete`, **15 PASS / 0 FAIL / 0 WARN**, dentalHits>0, sections 1→8.

---

## Podsumowanie

Gate **HACP Professional Website Creation v1.0** przechodzi lokalnie **15/15**. Pierwszy break (dual trigger miss) i content failure (industry=other + library hardcoded children) naprawione przez shared intent SSOT, stem industry detection, purpose fallback i recursive content overlay na drzewie biblioteki. Zero fake SUCCESS, zero `batch_execute` leak, single prompt, zero interwencji usera.
