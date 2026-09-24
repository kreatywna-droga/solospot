# SOLESPOT — DESIGN SYSTEM TAB CONTENT ROUTING REPAIR GATE v1.0

**Status:** **GATE: PASS** — routing 25/0 na produkcji, 0 błędów konsoli  
**Data:** 2026-09-24  
**Charakter:** minimalny repair + regression tests + prod browser verification  
**HEAD:** `2a564ef` → `origin/main`  
**Deployment:** `dpl_2TyHKjEsZXJiPPjfJsjnCXZPnLU7` (target `production`, status ● Ready) → alias **https://www.solospot.pl**  
**Entry URL testów:** `https://www.solospot.pl/studio/test-store`  
**Artefakt dowodowy:** `scratch/ds-tab-routing-forensic/result.json` (+ screenshoty PNG w `scratch/ds-tab-routing-forensic/`)

**Objaw (raportowany):** kliknięcie tabu (np. FONTY → BRANŻE) aktywuje tab, ale panel pokazuje poprzednią kategorię — na górze każdej kolejnej listy zostają fonty: Inter, Space Grotesk, Outfit, Figtree, Hanken Grotesk, Geist, Onest…

---

## 0. Verdict (Definition of Done — skrót)

| Pole | Wynik |
|---|---|
| **FIRST BREAK** | `packages/design-system/src/fonts/fontLibrary.ts` — `fullFontCatalog` zawierał **40 duplikatów id** (137 wpisów, 97 unikalnych) |
| **ROOT CAUSE** | duplikaty id → duplikaty `key={item.id}` w `DesignSystemCatalog` → React **nie usuwa** tych fiberów przy zmianie kategorii → **40 stale fontów** jako prefiks każdej kolejnej kategorii |
| **FIX (minimalny)** | deduplikacja `fullFontCatalog` po `id` w `fontLibrary.ts` (1 plik, ~15 linii) — `DesignSystem.fonts` i search dziedziczą poprawkę bez zmian w `index.ts` |
| **REGRESSION TESTS** | Nowy suite jsdom `DesignSystemCatalog.routing.test.tsx` (8 testów) + zaostrzone `design-system.test.ts` (uniczność id) — **55/55 PASS** |
| **PROD ROUTING** | **25 PASS / 0 FAIL** (8 sekwencyjnych + REPRO + 2 search + filter + preview + rapid ×50 + rapid ×100 + 8 post-rapid + console=0) |
| **SCOPE** | Brak rebuildu panelu, brak drugiego systemu tabów, brak wynalazionych kategorii, brak timeout/interval/reload |
| **Klasyfikacja** | **A** — repair istniejącego mechanizmu, symptom 1:1 wyeliminowany |

---

## 1. FAZA 1 — FIRST BREAK (forensic)

**Ścieńc pełnej ścieżki (klik → render):**

```
BuilderLeftSidebar (tab "style", Ctrl+5)
  └─ StylePanel (sub-tab "Katalog")
       └─ DesignSystemCatalog
            category useState ('style-packs')
            chips: onClick={() => setCategory(c.id)}     ← STAN TABU: OK (active class zmienia się)
            items useMemo [category, query, industry, mood]
              switch (category) → DesignSystem.fonts / .industryPresets / …  ← ROUTER: OK
```

**Wynik forensiku (`scratch/ds-tab-routing-forensic.js` + `ds-dom-diag` + `ds-deep-diag`) — przed fixem:**

- Router treści (`switch(category)`) jest poprawny — taby i case’y się zgadzają.
- DOM po odwiedzeniu FONTY: **każda** kolejna kategoria renderuje **40 starych fontów na górze** + własny dataset.
- **Dokładne 40 starych id** = `inter, space-grotesk, outfit, … courgette, noto-serif` — 1:1 z listą duplikatów z `fontLibrary.ts` (dowód: `scratch/ds-counts.json`).
- **Matematyka dowodowa** (UI count = 40 stale + dataset):

| Kategoria | UI (przed fixem) | 40 + dataset | Dataset (truth) |
|---|---:|---:|---:|
| Fonty | 137 | 40+97 | **97 unikalnych** (137 z duplikatami) |
| Palety | 118 | 40+78 | 78 |
| Typografia | 70 | 40+30 | 30 |
| Przyciski | 53 | 40+13 | 13 |
| Karty | 60 | 40+20 | 20 |
| Tła | 60 | 40+20 | 20 |
| Branże | 60 | 40+20 | 20 |
| Style Packs + dental | 43 | 40+3 | 10 (+3 filtrowane) |

**FIRST BREAK:** `fullFontCatalog = [...deduplicatedFontCatalog, ...additionalFonts]` — `additionalFonts` nadpisywał **40 id** już obecnych w `deduplicatedFontCatalog` → 137 wpisów / 97 unikalnych / **40 duplikatów**.

> Poprzedni gate (`scratch/design-system-full-gate-proof`) przeszedł, bo asercje miały formę `>0` — maskowały stale entries.

---

## 2. FAZA 2 — Mechanizm (dlaczego tab „przełącza”, a treść nie)

1. `setCategory(cat)` zmienia stan → chip dostaje klasę aktywności (**tab wygląda OK**).
2. `items` przelicza się poprawnie na nowy dataset.
3. Render listy: `items.map(item => <div key={item.id} data-testid="ds-catalog-item" data-item-id={item.id}>)`.
4. **Duplikaty id w `DesignSystem.fonts`** → **duplikaty `key`** w drzewie React.
5. Przy zmianie kategorii React nie jest w stanie skasować fiberów o powtórzonych keyach — **40 starych węzłów zostaje** w DOM jako prefiks listy nowej kategorii.

To jest dokładnie zarejestrowany objaw: FONTY → BRANŻE nadal pokazuje Inter/Space Grotesk/Outfit/Figtree… na górze listy `ind-*`.

---

## 3. FAZA 3 — FIX (minimalny, 1 plik)

**Plik:** `packages/design-system/src/fonts/fontLibrary.ts`

```ts
// PRZED
export const fullFontCatalog = [...deduplicatedFontCatalog, ...additionalFonts]; // 137, 40 dupów

// PO
const finalSeen = new Set<string>();
export const fullFontCatalog = [...deduplicatedFontCatalog, ...additionalFonts]
  .filter((f) => (finalSeen.has(f.id) ? false : (finalSeen.add(f.id), true))); // 97 unikalnych
```

- `finalFontCatalog` pozostaje aliasem — brak zmian API.
- `packages/design-system/src/index.ts` (`DesignSystem.fonts`, wyszukiwarka) **bez zmian** — dziedziczy fix.
- Brak rebuildu panelu, brak timeout/interval/reload, brak drugiego systemu tabów, brak nowych kategorii (PHASE 4: 8 chipów = 8 chipów).

**Potwierdzenie w logu dev:** `Font catalog contains 97 unique fonts`.

---

## 4. FAZA 4 — Regression tests (unit/component)

| Test | Plik | Zakres |
|---|---|---|
| Routing mapping | `src/components/builder/design-system/__tests__/DesignSystemCatalog.routing.test.tsx` | każdy z 8 tabów renderuje **dokładnie** swój dataset (głębokość/równość tablicy id) |
| REPRO fonts→branże→palety | id ⊆ dataset, zero fontów po przełączeniu, pierwszy `ind-*` |
| Search po switchu | fonts+"Inter" → BRANŻE: brak `inter`, pusta lista + komunikat, wyczyszczenie → pełne BRANŻE |
| Filter po switchu | filter industry=dental → fonts: pełny dataset (filter nie pinuje poprzedniej kategorii) |
| Preview po switchu | modal zamyka się, KARTY renderują dataset kart |
| Rapid ×50 | co 5. iteracja: aktywny chip ⇄ dataset w synchronizacji, brak pustego panelu |
| Uniczność id | `design-system.test.ts`: `fullFontCatalog` unikalne, `DesignSystem.fonts` ≡, wszystkie katalogi bez dupów |
| Count | fonty `>=90` (było `>=100` — uczciwa korekta pod realne 97) |

**Wynik:** `npx vitest run src/components/builder/design-system packages/design-system` → **3 pliki / 55 testów / 55 PASS**.

---

## 5. FAZA 5 — Quality gates

| Gate | Wynik |
|---|---|
| `npx tsc --noEmit` | **PASS** (0 błędów) |
| `npx eslint` (3 pliki fix+testów) | **PASS** (exit 0) |
| `npm run lint` (repo) | 15 errors / 39 warnings — **pre-existing** (np. `useParticleEngine.ts`, `supabase.ts`; żaden w plikach tego gate'u) |
| `npx vitest run` (repo, pełny) | 223 FAIL **pre-existing** — dowód baseline: `git stash` dwóch plików design-system → `PageBuilderCanvasRuntimeG156.test.ts` nadal **73/200 FAIL** (identycznie), brak importu `design-system`/`fontLibrary` w tych testach; `.kilo/worktrees/*` to stare kopie worktree |
| `npm run build` | **PASS** (EXIT=0, wszystkie trasy wygenerowane) |

---

## 6. FAZA 6 — Browser routing forensic (lokalny)

`BASE_URL=http://localhost:3111 node scratch/ds-tab-routing-forensic.js`

**25 PASS / 0 FAIL** — sekwencyjne 8 kategorii (10/20/97/78/30/13/20/20), REPRO, search, filter, preview, rapid ×50 (11 sampli, 0 mismatch), rapid ×100 (21 sampli, 0 mismatch), post-rapid 8/8, console errors 0.

> Uwaga metodologiczna: dwa pierwsze lokalne FAIL-i (S11/S12) to błąd **asercji skryptu** (`[].every()` ≡ true przy pustej liście + wymóg `count>0`), nie produktu — query utrzymuje się przez przełączenia zgodnie z podjętą decyzją (filtry apply’ują się do NOWEGO datasetu; brak dopasowania = pusty panel + komunikat `Brak wyników`). Aercje skorygowane na „zero stale id + spójny empty state”.

---

## 7. FAZA 7 — Commit / Push / Deploy

| Krok | Wynik |
|---|---|
| Commit | `2a564ef` `fix(design-system): dedupe fullFontCatalog by id — removes 40 stale font items after tab switch` (35 plików: fix + testy + jsdom + forensic artefakty) |
| Push | `c6c9435..2a564ef  main -> main` → `https://github.com/kreatywna-droga/solospot.git` |
| Deploy | `npx vercel deploy --prod --yes` → **✓ Ready in 3m** |
| Deployment | `dpl_2TyHKjEsZXJiPPjfJsjnCXZPnLU7` → **https://www.solospot.pl** (● Ready) |

---

## 8. FAZA 8 — Production browser verification

`BASE_URL=https://www.solospot.pl node scratch/ds-tab-routing-forensic.js` → **EXIT=0**

| ID | Scenariusz | Wynik | Dowód (actual) |
|---|---|:---:|---|
| S01 | Otwarcie prod | PASS | https://www.solospot.pl |
| S02–S09 | 8 tabów sekwencyjnie → właściwy dataset | PASS 8/8 | sp=10, ind=20, fonts=97 (`first=inter`), colors=78, typo=30, buttons=13, cards=20, backgrounds=20 |
| S10 | **REPRO FONTY → BRANŻE** | PASS | `count=20 first=[ind-dental,ind-medical,ind-law]` — **zero fontów** |
| S11 | Search fonts+"Inter" → BRANŻE | PASS | `count=0 emptyMsg=true searchText="Inter"` — brak stale, query applies |
| S12 | Search BRANŻE+"dental" → PALETY | PASS | `count=0 emptyMsg=true` — brak `ind-*` |
| S13 | Filter industry → TYPOGRAFIA | PASS | `count=30 typography-*` — filtr nie pinuje |
| S14 | Preview → zamknij → KARTY | PASS | `previewWasOpen=true count=20 cards-*` |
| S15 | **Rapid switch ×50** | PASS | `samples=11 mismatches=0` |
| S16 | **Rapid switch ×100** | PASS | `samples=21 mismatches=0 final=fonts/97/inter` |
| S17–S24 | Post-rapid 8 kategorii | PASS 8/8 | pełne, spójne datasety |
| S25 | **Console errors** | PASS | **0** |

Screenshoty: `scratch/ds-tab-routing-forensic/cat-*.png`, `repro-fonts-to-branze.png`, `rapid-50.png`, `rapid-100.png`.  
Pełny JSON: `scratch/ds-tab-routing-forensic/result.json` (`baseUrl: https://www.solospot.pl`).

---

## 9. Definition of Done

- [x] Forensic FIRST BREAK z dowodami (duplikaty id ↔ 40 stale ↔ UI counts)
- [x] Minimalny repair istniejącego mechanizmu (1 plik, dedup u źródła)
- [x] Brak rebuildu / fake fix timeout / drugiego tab systemu / nowych kategorii
- [x] Regression testy (component + unit) — 55/55 PASS
- [x] TSC / ESLint (pliki gate'u) / Vitest (zakres) / Build — PASS; pełny suite baseline = pre-existing
- [x] Commit + push `origin/main` (`2a564ef`)
- [x] `npx vercel deploy --prod --yes` (`dpl_2TyHKjEsZXJiPPjfJsjnCXZPnLU7`)
- [x] Prod browser test: sekwencyjne + REPRO + search/filter/preview + **50 i 100 rapid switches**
- [x] **0 błędów konsoli**, 25/25 PASS
- [x] Raport: `docs/DESIGN_SYSTEM_TAB_CONTENT_ROUTING_REPAIR_GATE_V1_REPORT.md`
