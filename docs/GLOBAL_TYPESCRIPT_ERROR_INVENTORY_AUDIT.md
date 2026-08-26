# GLOBAL TYPESCRIPT ERROR INVENTORY — INDEPENDENT AUDIT

> **Rola:** Agent 2 — Independent Code Evidence Auditor
> **Tryb:** 🔵 READ-ONLY (bez żadnych poprawek)
> **Przedmiot audytu:** `docs/GLOBAL_TYPESCRIPT_ERROR_INVENTORY.md` (Agent 1)
> **Źródło prawdy:** Aktualny kod repo + świeże `npx tsc --noEmit` + `git status`
> **Data:** 13 sierpnia 2026 r.

---

## 1. Audit Scope

Audyt wykonywany **wyłącznie dla BASELINE (TASK G0)**:

- Weryfikacja świeżego wykonania `npx tsc --noEmit`.
- Porównanie liczby błędów (Agent 1: 16) z rzeczywistą.
- Weryfikacja manifestu (FILE, LINE, COLUMN, TS CODE, MESSAGE).
- Weryfikacja kompletności (odwrotnie: czy wszystkie świeże błędy są w inwentarzu).
- Weryfikacja grupowania, root cause clusters, sprint attribution, klasyfikacji Prod/Test.
- Weryfikacja Documentation Drift tylko w dokumentach wskazanych przez Agenta 1.
- Weryfikacja Freeze (`git status`).

**Nie naprawiono żadnego błędu. Nie zmieniono kodu, testów, konfiguracji ani dokumentacji Agenta 1.**

---

## 2. Fresh Execution Evidence

### 2.1 Środowisko (Agent 2)

| Narzędzie | Wersja |
|---|---|
| `node --version` | `v24.15.0` |
| `npm --version` | `11.12.1` |
| `npx --version` | `11.12.1` |
| `typescript` (z `node_modules`) | `5.9.3` |

**Uwaga środowiskowa:** Agent 1 w sekcji "Execution Evidence" podał `Node.js v22.14.0, npm v10.9.2, npx v10.9.2`. Aktualne środowisko to `Node v24.15.0 / npm 11.12.1 / npx 11.12.1`. Rozbieżność nie zmienia wyniku kompilatora (patrz poniżej), ale dowody środowiskowe Agenta 1 nie odpowiadają rzeczywistym wersjom hosta.

### 2.2 Wyczyszczenie cache

Przed wykonaniem usunięto przyrostowy cache TypeScript (nie jest śledzony przez git — potwierdzone przez `git check-ignore tsconfig.tsbuildinfo`):
- `tsconfig.tsbuildinfo`
- `packages/authoring-studio/tsconfig.tsbuildinfo`
- `packages/authoring-studio/tsconfig.s27.tsbuildinfo`
- `packages/authoring-studio/tsconfig.s38.tsbuildinfo`
- `packages/authoring-studio/tsconfig.s28.audit.tmp.tsbuildinfo`
- `packages/authoring-studio/tsconfig.s29.audit.tmp.tsbuildinfo`

### 2.3 Wynik świeżego wykonania

| Wykonanie | Komenda | Kod wyjścia | Liczba błędów (indywidualnych headrów) | Raw lines |
|---|---|---|---|---|
| RUN 1 | `npx tsc --noEmit` | 1 | **407** | 455 |
| RUN 2 | `node ./node_modules/typescript/bin/tsc --noEmit` | 1 | **407** | 455 |
| RUN 3 (potwierdzający) | `npx tsc --noEmit` | 1 | **407** | — |

> ⚠️ **TRZY niezależne świeże wykonania dają dokładnie 407 błędów, kod wyjścia 1 (Failure).**
> Agent 1 twierdzi: **16 błędów, kod wyjścia 1.**

Pełny świeży output (455 linii, 407 headrerów błędów) zapisano niezależnie:
`%TEMP%\opencode\g0_a2_fresh_tsc.txt`.

---

## 3. Error Count Verification

| Metryka | AGENT 1 CLAIM | AGENT 2 FRESH RESULT | Wynik |
|---|---|---|---|
| Całkowita liczba błędów | **16** | **407** | ❌ MISMATCH |

```
AGENT 1 CLAIM:   N = 16
AGENT 2 FRESH:   M = 407
N != M  →  BLOCKING FINDING
```

**FINDING G0-A2-F0 (COUNT MISMATCH — severity: BLOCKING).**
Rzeczywista liczba błędów kompilacji TypeScript w aktualnym repo to **407**, nie 16.
Liczba 407 była w inwentarzu Agenta 1 odrzucona jako "niepotwierdzona naleciałość starych audytów" — świeże wykonanie dowodzi, że liczba **407 była poprawna**, a liczba 16 jest niepoprawna.

**Wniosek dot. pochodzenia liczby 16:** w repo wielokrotnie pojawia się fraza "16 pre-istniejących" (np. `TODO_PM33.md`, `TODO_PM34_ALIGNMENT.md`, `TODO_PM36.md`). Liczba 16 Agenta 1 jest zgodna z tymi **przestarzałymi notami TODO**, a NIE ze świeżym wynikiem kompilatora. Inwentarz najwyraźniej nie został wygenerowany na podstawie świeżego `npx tsc --noEmit`.

---

## 4. Manifest Completeness

### 4.1 Czy każdy błąd wykazany przez Agenta 1 istnieje w świeżym outpuu? — NIE

Dla każdego z 16 zgłoszonych błędów sprawdzono FILE/LINE/COL/TS CODE/MESSAGE w świeżym outputcie:

| # | Claim Agenta 1 | W świeżym outputcie? | Dowód |
|---|---|---|---|
| 1 | `.next/types/validator.ts(567,31)` TS2344 | **0 dopasowań** | validator.ts ma 763 linie; linia 567 = `type __Check = __IsExpected<typeof handler>`; blok walidacji `order/[id]` zawiera `// @ts-ignore`. Rzutowanie `route` w `.next/types/validator.ts:566` nie zgłasza błędu. |
| 2 | `authoring-studio/.../StateConsistency.test.ts(16,8)` TS2307 | **0 dopasowań** | Plik importuje `from '@/test-utils'` (alias `@/*` → `./src/*`), a nie `../../../../src/test-utils`. `src/test-utils/index.ts` istnieje → alias resolvuje. |
| 3 | `authoring-studio/.../DynamicPropertyPanel.test.ts(16,8)` TS2307 | **0 dopasowań** | Import `noop, } from '@/test-utils'` — alias resolvuje poprawnie. |
| 4–5 | `AnimationColorInterpolator.test.ts(7,10)/(7,22)` TS2305 | **0 dopasowań** | `AnimationColorInterpolator.ts` EKSPORTUJE `parseColor` (linia 69) i `interpolateColor` (73). |
| 6–8 | `AnimationInterpolator.test.ts(7,10)/(7,29)/(7,46)` TS2305 | **0 dopasowań** | `AnimationInterpolator.ts` EKSPORTUJE `interpolateNumber`, `interpolateUnit`, `interpolateProperty`. |
| 9–11 | `AnimationTransformInterpolator.test.ts(8,3)/(9,3)/(10,3)` TS2305 | **0 dopasowań** | Moduł EKSPORTUJE `parseTransformFunction`, `parseTransformList`, `interpolateTransform`. |
| 12–14 | `AnimationUnitParser.test.ts(7,10)/(7,21)/(7,41)` TS2724/TS2305 | **0 dopasowań** | Moduł EKSPORTUJE `parseUnit`, `areUnitsCompatible`, `isSupportedUnit`. |
| 15–16 | `builder-core/src/index.ts(402,10)/(409,10)` TS2300 Duplicate `AnimationInterpolation` | **0 dopasowań** | W `index.ts` identyfikator `AnimationInterpolation` występuje DOKŁADNIE RAZ; linia 402 to jedyny export `export { AnimationInterpolation }`. Linia 409 to `PlaybackStatus` wewnątrz bloku `export type { ... }`. Brak duplikatu. |

**Wszystkie 16 błędów = PHANTOM / STALE.**

### 4.2 Czy każdy świeży błąd znajduje się w reportcie Agenta 1? — NIE

- **Agent 1 zweryfikował: 0/16** błędów istnieje w świeżym outputcie (**FINDING G0-A2-F2 — PHANTOM / STALE**).
- **Z 407 świeżych błędów w inwentarzu Agenta 1 jest: 0** (**FINDING G0-A2-F1 — MASSIVE MISSING ERROR FROM INVENTORY**).

**FINDING G0-A2-F1 (severity: BLOCKING).**
Inwentarz pomija **wszystkie 407** rzeczywistych błędów kompilatora, m.in. rzeczywiste błędy w:
`packages/authoring-studio/...` (391 błędów), `src/app/...` (8), `packages/builder-core/src/rendering/...` (7), `packages/commerce-persistence/...` (1).

**FINDING G0-A2-F2 (severity: BLOCKING).**
Wszystkie 16 pozycji manifestu Agenta 1 to **phantom/stale errors** — żaden nie występuje w świeżym kompilatorze; odpowiadające im eksporty/pliki/ścieżki istnieją i się kompilują.

---

## 5. Error Distribution Verification

### 5.1 Rzeczywisty rozkład błędów (Agent 2, świeże tsc)

| Grupa | Liczba | Udział |
|---|---|---|
| Authoring Studio (`packages/authoring-studio`) | **391** | 96.1% |
| Builder Core (`packages/builder-core`) | **7** | 1.7% |
| Commerce Engine (`packages/commerce-engine`) | **0** | 0.0% |
| src/app (`src/app` + `src/app/api/...`) | **8** | 2.0% |
| Other Packages (`packages/*`) | **1** (commerce-persistence) | 0.2% |
| Other Repository Files | **0** | 0.0% |
| **SUMA** | **407** | 100% |

### 5.2 Porównanie

| Grupa | Agent 1 | Agent 2 (fresh) | Zgodność |
|---|---|---|---|
| Authoring Studio | 2 | 391 | ❌ |
| Builder Core | 13 | 7 | ❌ |
| Commerce Engine | 0 | 0 | ✅ |
| src/app | 1 | 8 | ❌ |
| Other Packages | 0 | 1 | ❌ |
| Other Repo Files | 0 | 0 | ✅ |
| SUMA | 16 | 407 | ❌ |

**FINDING G0-A2-F3 (ERROR DISTRIBUTION MISMATCH — severity: BLOCKING).**
Rozkład grup w inwentarzu Agenta 1 nie odpowiada ani sumie, ani rozmieszczeniu rzeczywistych błędów. Grupa "Builder Core" faktyczna: 7 (wszystkie w `src/rendering/`, NIE w `src/animation/` — Agent 1 przypisał tam 13 błędów). Grupa "Authoring Studio" rzeczywista to 391, nie 2.

---

## 6. Root Cause Verification

Agent 1 zdefiniował 4 klastry przyczyn źródłowych. Każdy zweryfikowano względem kodu:

| Klaster Agenta 1 | Podstawa w kodzie? | Klasyfikacja |
|---|---|---|
| **ROOT CAUSE A:** Next.js 15 `params` Promise mismatch w `order/[id]/route.ts` (TS2344 w validator.ts) | Plik `src/app/api/store/order/[id]/route.ts` **istnieje**; validator.ts line 567 **nie zgłasza** TS2344 (0 dopasowań w fresh). Konieczność zmiany jest spekulacją. | **UNSUPPORTED** (błąd, który miał uzasadniać klaster, nie istnieje) |
| **ROOT CAUSE B:** Duplikat exportu `AnimationInterpolation` w `builder-core/src/index.ts` | W `index.ts` jest **jeden** export `AnimationInterpolation` (linia 402). Nie ma duplikatu. | **INCORRECT** |
| **ROOT CAUSE C:** Test utility relative import path mismatch (`../../../../src/test-utils`) | Testy impoertują przez alias `@/test-utils` (resolvuje się do `./src/test-utils`, który istnieje). Ścieżka z raportu nie występuje w kodzie. | **INCORRECT** |
| **ROOT CAUSE D:** Legacy animation interpolator test imports (11 błędów TS2305/TS2724) | Wszystkie rzekomo brakujące eksporty **ontak istnieją** w modułach (zostały zweryfikowane linia po linii). TSC nie zgłasza żadnych błędów w tych plikach. | **INCORRECT** |

**FINDING G0-A2-F4 (ROOT CAUSE VERIFICATION FAILED — severity: BLOCKING).**
Klastry Agenta 1 nie mają podstawy w aktualnym kodzie. 3 z 4 są **INCORRECT**, 1 **UNSUPPORTED**. Rzeczywiste klastry (np. 391 błędów w Authoring Studio / `null`-pipeline, `SceneGraphModel`/`AnimationTypes` import mismatch, `EasingCurve` union drift, `Layer[]` vs `Record<string, Layer>`, `Boolean` callable w `EditingHistoryBridge.ts`) nie zostały w ogóle zidentyfikowane.

> Uwaga procedama: nie wykonuję pełnej klasyfikacji klastrów naprawczych — to zadanie Agenta 1 po korekcie baselina. Wskazuję jedynie brak podstawy dla istniejących klastrów.

---

## 7. Sprint Attribution Verification

Agent 1 przypisał błędy do S27/S29/S30/S33–S38/PRODUCT/BUILDER-CORE.

| Przypisanie | Dowód w repo | Wynik |
|---|---|---|
| ROOT CAUSE A → PRODUCT / Next.js 15 | Błąd-baza nie istnieje (0 w fresh); przypisanie do nieistniejącego błędu | **UNSUPPORTED** |
| ROOT CAUSE B → S31 / PM31 | Duplikat nie istnieje; przypisanie nieprawdziwego błędu do sprintu | **UNSUPPORTED** |
| ROOT CAUSE C → S30 / PM35 | Nieprawdziwy import path w nieistniejącym błędzie | **UNSUPPORTED** |
| ROOT CAUSE D → S31 / PM31 | Eksporty istnieją; błędy nie występują | **UNSUPPORTED** |

**FINDING G0-A2-F5 (SPRINT ATTRIBUTION UNSUPPORTED — severity: BLOCKING).**
Żadna atrybucja sprintowa nie ma podstawy, ponieważ odnosi się do błędów, które nie istnieją.

---

## 8. Production/Test Classification Verification

| Klasa | Agent 1 | Agent 2 (fresh) |
|---|---|---|
| PRODUCTION | 3 | **240** |
| TEST | 13 | **167** |
| CONFIGURATION | 0 | 0 |
| UNKNOWN | 0 | 0 |
| SUMA | 16 | **407** |

**FINDING G0-A2-F6 (PROD/TEST CLASSIFICATION MISMATCH — severity: BLOCKING).**
Agent 1 zaklasyfikował 13 z 16 błędów jako testowe, a faktyczny bilans to **240 production / 167 test**. Rzeczywiste błędy produkcyjne (np. `packages/authoring-studio/src/layout-inspector/LayoutFieldCatalog.ts` — 25 błędów, `src/ui/components/preview/MotionPathEditor.tsx` — 23 błędy, `src/timeline/TimelineEasingEditor.ts` — 15 błędów, `FrameRenderer.ts`) w ogóle nie występują w inwentarzu. Nie stwierdzono odwrotnego przypisania (test → prod) w inwentarzu tylko dlatego, że żaden błąd w inwentarzu nie istnieje.

---

## 9. Documentation Drift Verification

Zweryfikowano wyłącznie dokumenty wskazane przez Agenta 1:

| Dokument | Twierdzenie (cytat) | Czy istnieje? | Czy zgodne z rzeczywistością (407)? |
|---|---|---|---|
| `RELEASE_MANIFEST_v1.0.md` (linia 44) | `TypeScript Compilation: PASS (0 type errors)` | ✅ istnieje | ❌ Dokument jest stale względem 407 błędów. **DRIFT POTWIERDZONY** (podstawa factu: świeży tsc = 407 błędów). |
| `TODO.md` (linia 37) | `5.5 npx tsc --noEmit — 0 errors` | ✅ istnieje | ❌ Dokument stale. **DRIFT POTWIERDZONY**. |
| "Dawne hipotezy: 407 błędów" | Opinia Agenta 1, że 407 było "niepotwierdzone" | — | ⚠️ **BŁĘDNA interpretacja**: świeże tsc potwierdza dokładnie **407** błędów. Historyczna liczba 407 była poprawna; to liczba 16 jest niepotwierdzona. |

**FINDING G0-A2-F7 (DOC DRIFT: CZĘŚCIOWO POTWIERDZONY, ALE KWALIFIKACJA BŁĘDNA — severity: MINOR).**
Rzeczywiste dokumenty (`RELEASE_MANIFEST_v1.0.md`, `TODO.md`) istnieją i są sprzeczne z aktualnym stanem (PASS/0 vs 407). Skala rozbieżności została przez Agenta 1 zaniżona (16 vs rzeczywiste 407). Odrzucenie historycznej hipotezy "407" było błędne — hipoteza jest zgodna z wynikiem świeżego kompilatora.

---

## 10. Freeze Verification

- `git status` przed i po: **liczba wpisów `--porcelain` = 410** (niezmieniona).
- Cache `.tsbuildinfo` (jedyna operacja usunięcia) **nie jest śledzony przez git** (`git check-ignore` → potwierdzone).
- Nie utworzono/nie zmodyfikowano żadnych plików kodu, testów ani konfiguracji.
- Jedynym nowym plikiem jest wyłącznie niniejszy raport audytowy.

| Zmiana | Stan |
|---|---|
| CODE CHANGES | **0** |
| TEST CHANGES | **0** |
| CONFIG CHANGES | **0** |
| DOCS (raport audytu G0-A2) | 1 plik (wyłącznie dozwolony) |

---

## 11. Findings

| ID | Severity | Agent 1 Claim | Rzeczywiste Dowody Repozytorium | Wymagana Korekta |
|---|---|---|---|---|
| **G0-A2-F0** | 🔴 BLOCKING | Łącznie **16** błędów TS w repo | Świeży `npx tsc --noEmit` ×3: **407** błędów, exit 1. Liczba 16 odpowiada przestarzałym notom TODO, nie kompilatorowi. | Przebudowanie inwentarza w 100% na świeżym outputcie tsc |
| **G0-A2-F1** | 🔴 BLOCKING | Inventory "complete" | **0 z 407** prawdziwych błędów znajduje się w inwentarzu. | Dodanie wszystkich 407 błędów (FILE/LINE/COL/CODE/MSG) |
| **G0-A2-F2** | 🔴 BLOCKING | 16 pozycji manifestu "complete" | **16 z 16** pozycji to phantom/stale — żadna nie występuje w kompilatorze (eksporty istnieją, aliasy resolvują, brak duplikatów). | Usunięcie wszystkich falszywych pozycji |
| **G0-A2-F3** | 🔴 BLOCKING | Distribution: AS=2, BC=13, app=1, reszta 0 | Fresh: AS=391, BC=7, app=8, Other=1, CE=0. Suma 407. | Korekta grup oraz sum do 407 |
| **G0-A2-F4** | 🔴 BLOCKING | 4 Root Cause Clusters | 3 INCORRECT (B: brak duplikatu; C: importy przez alias OK; D: eksporty istnieją); 1 UNSUPPORTED (A). Prawdziwe klastry niezidentyfikowane. | Reklasyfikacja klastrów na bazie rzeczywistych 407 błędów |
| **G0-A2-F5** | 🔴 BLOCKING | Sprint attribution "potwierdzone" | Wszystkie atrybucje odnoszą się do nieistniejących błędów | Przywrócenie atrybucji tylko dla zweryfikowanych błędów |
| **G0-A2-F6** | 🔴 BLOCKING | Prod=3, Test=13 | Fresh: Prod=**240**, Test=**167** | Poprawa klasyfikacji na podstawie prawdziwego manifestu |
| **G0-A2-F7** | 🟡 MINOR | Drift: "PASS/0 vs 16"; odrzucenie hipotezy 407 | Dokumenty `RELEASE_MANIFEST_v1.0.md`, `TODO.md` stale → **407**; hipoteza 407 **potwierdzona**. | Podtrzymanie driftu wg 407; anulowanie odrzucenia hipotezy 407 |

---

## 12. Verdict

```
GLOBAL TYPESCRIPT BASELINE — INDEPENDENT AUDIT RESULT

Fresh npx tsc --noEmit (x3):   FAIL  — 407 errors, exit code 1
Agent 1 claimed errors:         16
Errors matching fresh tsc:      0 / 16    (ALL PHANTOM)
Real errors present in report:  0 / 407   (NONE CAPTURED)
Distribution match:             NO
Root cause basis:               INCORRECT/UNSUPPORTED
Sprint attribution:             UNSUPPORTED
Prod/Test classification:       MISMATCH
Freeze (code/test/config):      UNCHANGED ✅

FORMAL DECISION:  G0-A2 = 🔴 HOLD
                   GLOBAL TYPESCRIPT BASELINE NOT VERIFIED
```

### Uzasadnienie HOLD

1. Świeży, powtarzalny `npx tsc --noEmit` zgłasza **407** błędów — nie 16.
2. Inwentarz Agenta 1 jest **niekompletny** (pomija 407 prawdziwych błędów) i jednocześnie **fałszowy** (16/16 pozycji to phantom/stale).
3. Grupowanie, root cause clusters, atrybucje sprintowe i klasyfikacja Prod/Test **nie mają podstawy** w aktualnym repo.
4. Jedyny istotny aspekt zweryfikowany pozytywnie to **Freeze** — Agent 2 nie zmienił kodu/testów/konfiguracji.

### Następny krok (wg protokołu)

Agent 1 → poprawa `GLOBAL_TYPESCRIPT_ERROR_INVENTORY.md` na podstawie świeżego outputu (407 błędów).
Agent 2 → **FOCUSED DELTA AUDIT** wyłącznie dla Finding IDs: **F0, F1, F2, F3, F6** (F4/F5 zależą od F1; F7 kwalifikacja).

🛑 **STOP. G0-A2 = HOLD. CZEKAM NA DECYZJĘ ARCHITEKTA.**