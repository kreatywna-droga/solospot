# G1-06-A ERROR CLUSTER IDENTIFICATION REPORT (SKORYGOWANY)

> **Rola:** Agent 1 — Technical Investigator & Identification Lead  
> **Tryb:** 🔵 READ-ONLY / ANALYSIS ONLY (CODE CHANGES = 0, TEST CHANGES = 0, CONFIG CHANGES = 0)  
> **Przedmiot identyfikacji:** Wybór i szczegółowa analiza następnego logicznego klastra błędów po formalnym zamknięciu G1-05  
> **Aktualny stan bazowy (baseline):** **377 błędów TypeScript** (`npx tsc --noEmit --incremental false`)  
> **Status rewizji:** Rewizja v2 po Focused Delta Audit G1-06-B (korekta przewidywanej delty i uwzględnienie błędów maskowanych TS7006)  
> **Data:** 14 sierpnia 2026 r.  

---

## 1. Podsumowanie wykonawcze (Executive Summary)

Po formalnym zamknięciu klastra **G1-05** (redukcja z 380 do 377 błędów, potwierdzona przez G1-05-F PASS), kompilator TypeScript wykazuje dokładnie **377 błędów**.

W ramach zadania **TASK G1-06-A** przeprowadzono inwentaryzację i kategoryzację błędów w projekcie.  
Jako najbardziej spójny, bezpieczny i naturalny kolejny krok wyznaczono klaster **14 błędów TS2307** dotyczących niepoprawnych ścieżek importów względnych w 7 plikach testowych `packages/authoring-studio/src/experience/__tests__/`.

### Kluczowe ustalenia i korekta delty (po audycie G1-06-B):
- **Bezpośredni cel naprawy:** 14 błędów **TS2307** (błędne ścieżki importów w 7 plikach testowych).
- **Równolegle eliminowane błędy maskowane:** 5 błędów **TS7006** (callback `(c) => ...` implicit `any` wynikający z braku typowania `session`).
- **Rzeczywista przewidywana delta:** **−19** (spadek z **377 do 358**).
- **Błędy rezydualne pozostające w tych 7 plikach:** **6 błędów** (4 × TS2739 + 2 × TS2322), które nie są powiązane z importami i będą przedmiotem kolejnych klastrów.

---

## 2. Metodyka i weryfikacja stanu kompilatora (Fresh tsc Evidence)

| Parametr audytowy | Wartość / Wynik |
|---|---|
| Komenda weryfikacyjna | `npx tsc --noEmit --incremental false` |
| Cache TS | Wyłączony (`--incremental false`) |
| **Globalny licznik błędów (baseline)** | **377** |
| Wybrany klaster do naprawy | **14 × TS2307** (`experience/__tests__` relative imports) |
| Błędy maskowane eliminowane równolegle | **5 × TS7006** (przywrócenie pełnego typowania parametrów callbacków) |
| **Przewidywany stan po naprawie** | **358** (377 − 19 = 358) |
| Zmodyfikowane pliki podczas identyfikacji | **0** (`CODE: 0`, `TEST: 0`, `CONFIG: 0`) |

---

## 3. Szczegółowa inwentaryzacja 7 plików testowych (25 błędów łącznie)

Katalog `packages/authoring-studio/src/experience/__tests__/` zawiera 7 plików testowych, w których przed naprawą importów występuje łącznie **25 błędów**:

```
+------------------------------------+--------+--------+--------+--------+-------+
| Plik testowy                       | TS2307 | TS7006 | TS2739 | TS2322 | RAZEM |
+------------------------------------+--------+--------+--------+--------+-------+
| InspectorToCanvas.test.ts          |   2    |   2    |   1    |   0    |   5   |
| LiveEditing.test.ts                |   2    |   0    |   1    |   0    |   3   |
| Playback.test.ts                   |   2    |   0    |   0    |   0    |   2   |
| PreviewIntegration.test.ts         |   2    |   0    |   0    |   0    |   2   |
| Seek.test.ts                       |   2    |   0    |   0    |   0    |   2   |
| TimelineToCanvas.test.ts           |   2    |   3    |   1    |   2    |   8   |
| UndoRedoRender.test.ts             |   2    |   0    |   1    |   0    |   3   |
+------------------------------------+--------+--------+--------+--------+-------+
| SUMA                               |  14    |   5    |   4    |   2    |  25   |
+------------------------------------+--------+--------+--------+--------+-------+
```

---

## 4. Inwentaryzacja 14 błędów TS2307 (Bezpośredni zakres naprawy)

Wszystkie 7 plików posiada po 2 błędy `TS2307` wynikające z nieuwzględnienia poziomu katalogu `__tests__/`:
1. `'../rendering/CanvasRenderSurface'` → docelowo [`'../../rendering/CanvasRenderSurface'`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/rendering/CanvasRenderSurface.ts) (plik istnieje).
2. `'./RealtimeEditingSession'` → docelowo [`'../RealtimeEditingSession'`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/experience/RealtimeEditingSession.ts) (plik istnieje).

| Lp. | Plik | Linia:Kolumna | Kod | Pełny komunikat kompilatora TypeScript |
|:---:|---|:---:|:---:|---|
| 1 | `packages/authoring-studio/src/experience/__tests__/InspectorToCanvas.test.ts` | `3:37` | `TS2307` | `Cannot find module '../rendering/CanvasRenderSurface' or its corresponding type declarations.` |
| 2 | `packages/authoring-studio/src/experience/__tests__/InspectorToCanvas.test.ts` | `4:40` | `TS2307` | `Cannot find module './RealtimeEditingSession' or its corresponding type declarations.` |
| 3 | `packages/authoring-studio/src/experience/__tests__/LiveEditing.test.ts` | `3:37` | `TS2307` | `Cannot find module '../rendering/CanvasRenderSurface' or its corresponding type declarations.` |
| 4 | `packages/authoring-studio/src/experience/__tests__/LiveEditing.test.ts` | `4:40` | `TS2307` | `Cannot find module './RealtimeEditingSession' or its corresponding type declarations.` |
| 5 | `packages/authoring-studio/src/experience/__tests__/Playback.test.ts` | `3:37` | `TS2307` | `Cannot find module '../rendering/CanvasRenderSurface' or its corresponding type declarations.` |
| 6 | `packages/authoring-studio/src/experience/__tests__/Playback.test.ts` | `4:40` | `TS2307` | `Cannot find module './RealtimeEditingSession' or its corresponding type declarations.` |
| 7 | `packages/authoring-studio/src/experience/__tests__/PreviewIntegration.test.ts` | `3:37` | `TS2307` | `Cannot find module '../rendering/CanvasRenderSurface' or its corresponding type declarations.` |
| 8 | `packages/authoring-studio/src/experience/__tests__/PreviewIntegration.test.ts` | `4:40` | `TS2307` | `Cannot find module './RealtimeEditingSession' or its corresponding type declarations.` |
| 9 | `packages/authoring-studio/src/experience/__tests__/Seek.test.ts` | `3:37` | `TS2307` | `Cannot find module '../rendering/CanvasRenderSurface' or its corresponding type declarations.` |
| 10 | `packages/authoring-studio/src/experience/__tests__/Seek.test.ts` | `4:40` | `TS2307` | `Cannot find module './RealtimeEditingSession' or its corresponding type declarations.` |
| 11 | `packages/authoring-studio/src/experience/__tests__/TimelineToCanvas.test.ts` | `4:37` | `TS2307` | `Cannot find module '../rendering/CanvasRenderSurface' or its corresponding type declarations.` |
| 12 | `packages/authoring-studio/src/experience/__tests__/TimelineToCanvas.test.ts` | `5:40` | `TS2307` | `Cannot find module './RealtimeEditingSession' or its corresponding type declarations.` |
| 13 | `packages/authoring-studio/src/experience/__tests__/UndoRedoRender.test.ts` | `3:37` | `TS2307` | `Cannot find module '../rendering/CanvasRenderSurface' or its corresponding type declarations.` |
| 14 | `packages/authoring-studio/src/experience/__tests__/UndoRedoRender.test.ts` | `4:40` | `TS2307` | `Cannot find module './RealtimeEditingSession' or its corresponding type declarations.` |

---

## 5. Analiza 5 błędów maskowanych TS7006 (Eliminowanych automatycznie)

W 2 plikach występuje 5 błędów `TS7006`:
- `InspectorToCanvas.test.ts(51,53): error TS7006: Parameter 'c' implicitly has an 'any' type.`
- `InspectorToCanvas.test.ts(61,53): error TS7006: Parameter 'c' implicitly has an 'any' type.`
- `TimelineToCanvas.test.ts(76,49): error TS7006: Parameter 'c' implicitly has an 'any' type.`
- `TimelineToCanvas.test.ts(81,53): error TS7006: Parameter 'c' implicitly has an 'any' type.`
- `TimelineToCanvas.test.ts(86,55): error TS7006: Parameter 'c' implicitly has an 'any' type.`

### Mechanizm maskowania:
1. Gdy import `RealtimeEditingSession` kończy się błędem `TS2307`, instancja `session` otrzymuje typ niejawny `any`.
2. Wywołania metod `session.renderCurrentFrame()` oraz `session.seek()` zwracają typ `any`, co powoduje, że tablica `.commands` jest typu `any`.
3. Wywołanie `.find((c) => ...)` na tablicy o typie `any` nie dostarcza kompilatorowi informacji o typie parametru `c`, generując błąd `TS7006`.
4. Po poprawieniu ścieżki importu `RealtimeEditingSession`, metody te są w pełni typowane (`PreviewRenderResult`, `.commands: ReadonlyArray<RendererCommand>`), dzięki czemu kompilator prawidłowo wnioskuje typ `c: RendererCommand`, a wszystkie 5 błędów `TS7006` **znika automatycznie bez konieczności jakichkolwiek zmian w tych liniach kodu**.

---

## 6. Analiza 6 błędów rezydualnych (Pozostających po naprawie G1-06)

Po naprawie importów w plikach klastra pozostanie dokładnie **6 błędów** nieobjętych zakresem TS2307:

1. **4 × TS2739 (Brak właściwości `visible, locked` w `SectionNode`):**
   - `InspectorToCanvas.test.ts:17:11`
   - `LiveEditing.test.ts:17:11`
   - `TimelineToCanvas.test.ts:18:11`
   - `UndoRedoRender.test.ts:17:11`
   - *Przyczyna:* Fixture `sampleDoc.pages[0].sections[0]` nie deklaruje wymaganych właściwości `visible: boolean`, `locked: boolean` w modelu `SectionNode`.

2. **2 × TS2322 (Niezgodność typu `EasingCurve`):**
   - `TimelineToCanvas.test.ts:45:54`
   - `TimelineToCanvas.test.ts:46:57`
   - *Przyczyna:* Mock `sampleTimeline` przekazuje `easing: 'linear'` (string) zamiast obiektu `EasingCurve`.

---

## 7. Skutek przewidywany i weryfikacja delty

| Metryka | Stan obecny (Baseline) | Po naprawie G1-06 | Delta |
|---|:---:|:---:|:---:|
| **Błędy TS2307 (importy)** | 14 | 0 | **−14** |
| **Błędy TS7006 (maskowane)** | 5 | 0 | **−5** |
| **Błędy rezydualne w klastrze (TS2739 + TS2322)** | 6 | 6 | 0 |
| **Błędy w `experience/__tests__`** | 25 | 6 | **−19** |
| **Globalna liczba błędów w projekcie** | **377** | **358** | **−19** |

---

## 8. Zakres zmian i dyscyplina architektoniczna

- **CODE:** **0 modyfikacji** (kod produkcyjny w `src/` oraz `packages/*/src/` nietknięty).
- **CONFIG:** **0 modyfikacji** (konfiguracja `tsconfig.json` i tooling nietknięte).
- **TEST:** **7 plików testowych** (wyłącznie aktualizacja 14 linii importów względnych w `experience/__tests__/*.test.ts`).
- **Ryzyko naruszenia SSOT / ADR:** **Brak (Zero)** — pliki importowane (`CanvasRenderSurface.ts`, `RealtimeEditingSession.ts`) istnieją i są w pełni zgodne z architekturą.

---

## 9. Status i rekomendacja końcowa

```
================================================================================
G1-06-A CLUSTER IDENTIFICATION RESULT (SKORYGOWANY):

Wybrany klaster:                 14 × TS2307 (experience/__tests__ relative import paths)
Błędy maskowane (eliminowane):   5 × TS7006 (automatyczne rozwiązanie typowania callbacków)
Błędy rezydualne (pozostające):  6 (4 × TS2739 + 2 × TS2322 w tych samych plikach)
Zakres zmian:                    TEST ONLY (7 plików testowych)
Pliki produkcyjne (CODE):        0 modyfikacji
Pliki konfiguracyjne (CONFIG):   0 modyfikacji
Spójność przyczyny źródłowej:    100% (błędna głębokość ścieżki relatywnej)
Skorygowana przewidywana delta:  377 → 358 (delta −19)

STATUS: G1-06-C = READY FOR AGENT 2
================================================================================
```

🛑 **Zakończono korektę dokumentacji G1-06-A. Brak modyfikacji w kodzie i testach (`CODE: 0, TEST: 0, CONFIG: 0`). Oczekuję na ponowny Focused Delta Audit Agenta 2 (G1-06-D).**
