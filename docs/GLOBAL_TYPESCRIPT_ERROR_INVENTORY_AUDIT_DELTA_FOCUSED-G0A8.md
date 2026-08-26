# GLOBAL TYPESCRIPT ERROR INVENTORY — FOCUSED DELTA AUDIT (G0-A8)

> **Rola:** Agent 2 — Independent Code Evidence Auditor
> **Tryb:** 🔵 READ-ONLY (bez żadnych poprawek kodu)
> **Przedmiot audytu:** Active inventory `docs/GLOBAL_TYPESCRIPT_ERROR_INVENTORY.md` (rewizja **G0-A7**, Agent 1)
> **Zakres:** FOCUSED DELTA AUDIT — wyłącznie **G0-A6-F5 / G0-A7** (rachunek klastrów RC1–RC5 + UNCLASSIFIED oraz split PROD/TEST)
> **Źródło prawdy:** Świeży `node ./node_modules/typescript/bin/tsc --noEmit` (ten sam drzewo, tylko zmiana dokumentacyjna) + pliki repo + `git status`
> **Data:** 13 sierpnia 2026 r.

---

## 1. Fresh Execution Evidence

| Wykonanie | Komenda | Kod wyjścia | Liczba nagłówków błędów |
|---|---|---|---|
| FRESH RUN 1 | `node .../tsc --noEmit` | 1 (potwierdzone wcześniej) | **407** |
| FRESH RUN 2 | `node .../tsc --noEmit` (po usunięciu `tsconfig.tsbuildinfo`) | 2 (artefakt pipeline `&`) | **407** |

- **407 błędów potwierdzone po raz 9-ty z rzędu** (w tym 4/4 rundy: G0-A2, G0-A4, G0-A6, G0-A8).
- Exit code 2 jest artefaktem wywołania przez powłokę, potwierdzonym wcześniej jako niestabilny; count = 407 deterministyczny.
- Cache `tsconfig*.tsbuildinfo` usunięty przed uruchomieniem.

### 1.1 Subsystem totals (fresh, cross-verified)

| Subsystem | Actual (fresh) |
|---|---|
| Authoring Studio | **391** |
| Builder Core | **7** |
| src/app | **8** |
| Commerce Engine | **0** |
| Commerce Persistence | **1** |
| **SUMA** | **407** ✅ |

---

## 2. Verification Matrix (Architect's G0-A8 Checklist)

| # | Weryfikowany warunek | Wartość w dokumentacji | Actual (fresh tsc) | Wynik |
|---|---|---|---|---|
| 1 | **RC1 + RC2 + RC3 + RC4 + RC5 + UNCLASSIFIED = 407** | 73+62+47+0+167+58 = **407** (linie 17/132) | 407 | ✅ PASS |
| 2 | **RC1 = 73** | linia 98: **73** | kompilator: 25 (LayoutFieldCatalog) + 48 (kaskada paneli) | ✅ PASS |
| 3 | **RC2 = 62** | linia 103: **62** | kompilator | ✅ PASS |
| 4 | **RC3 = 47** | linia 108: **47** | kompilator | ✅ PASS |
| 5 | **RC4 = 0** | linia 113: **0** (poprawka F1) | 0 × TS2344 | ✅ PASS |
| 6 | **RC5 = 167** | linia 118: **167** | TEST total = **167** | ✅ PASS |
| 7 | **UNCLASSIFIED = 58** | linia 126: **58** | 56 (AS-prod reszta) + 1 (BC-prod) + 1 (app-prod) = **58** | ✅ PASS |
| 8 | **PRODUCTION = 240** | linia 142: **240** | 238 (AS) + 1 (BC) + 1 (app) = **240** | ✅ PASS |
| 9 | **TEST = 167** | linia 143: **167** | 153 (AS) + 6 (BC) + 7 (app) + 1 (commerce) = **167** | ✅ PASS |
| 10 | **PRODUCTION + TEST = 407** | linia 145: 240+167 = **407** | 240 + 167 = 407 | ✅ PASS |

**Wniosek cząstkowy:** Raporty §5 §6, §2, §3 dynamiczne totals — **w 100% zgodne** z kompilatorem.

---

## 3. 🔴 BLOCKING: Sectie 4.1 nadal zawiera przestarzały split `224/167`

Architect's G0-A8 wprost wymaga: *"Czy w aktywnym inventory nie pozostały stare wartości: … **224/167** …"*

| Linia | Treść w aktywnym inventory (G0-A7) | Actual (fresh tsc) |
|---|---|---|
| **73** | `Pakiety Testowe Inspectora, Timeline, Viewport & Navigation (__tests__): **167 błędów**` | **153** błędów testowych w `packages/authoring-studio` |
| **75** | `(Podsumowanie Authoring Studio: **224 produkcyjne + 167 testowych = 391 błędów**)` | **238 produkcyjnych + 153 testowych = 391** |

Dowód (fresh tsc):
```
AS_TOTAL: 391
AS_TEST:  153     ← w §4.1 błędnie 167
AS_PROD:  238     ← w §4.1 błędnie 224
```

**Wniosek:** przestarzała para **`224/167`** **NADAL POZOSTAJE w aktywnym inventory** (linie 73 i 75). Split w §4.1 nie został skorygowany z `224 prod + 167 test` na `238 prod + 153 test`, mimo poprawnego rachunku klastrów w §5 (§5 stale bilansuje 407, a 167 testów w RC5 jest poprawnych **całościowo w repo**, nie wewnątrz authoring-studio).

---

## 4. Dodatkowe niespójności kompozycyjne (pole z §3)

### 4.1 §4.2 — Builder Core misclassification

| Linia | Treść w inventory (G0-A7) | Actual (fresh tsc) |
|---|---|---|
| **78** | `packages/builder-core/src/rendering/: **7 błędów** … *(Kategoria: PRODUCTION)*` | 7 błędów **łącznie**: **1 PROD** (`FrameRenderer.ts:30:74` TS2345) + **6 TEST** (`rendering/__tests__/`: ExportRenderer×1, RenderingEngine×2, RenderPipeline×1, SceneComposer×2) |

- §4.2 klasyfikuje **wszystkie 7 jako `PRODUCTION`** — błędnie.
- Poprawnie: **1 PROD + 6 TEST** (zgodne z §6, które implikuje 6 testów BC w koszyku TEST=167).

### 4.2 §5 UNCLASSIFIED — komponenty rozbicia przestarzałe (total 58 poprawny)

| Linia | Treść w inventory (G0-A7) | Poprawna kompozycja |
|---|---|---|
| **123** | `authoring-studio/ (50 błędów produkcyjnych w pozostałych modułach domenowych)` | AS-prod reszta = **56** (238 − 73 − 62 − 47) |
| **124** | `builder-core/src/rendering/ (7 błędów produkcyjnych w renderingu)` | **1 PROD** (FrameRenderer.ts) + pozostałe 6 to TEST |

- Total **UNCLASSIFIED = 58** jest **poprawny** (56+1+1 = 58) i bilansuje się z RC-prod = 240.
- Komponenty rozbicia (50 / 7 prod) są przestarzałe i wewnętrznie sprzeczne z §4.2 (7 = 1prod+6test) oraz z §6.

### 4.3 Sprzeczność liczb bul i klastrów (AS-prod)

- §4.1 bullet sums: 25+45+58+32+12+52 = **224** — suma bulletów przestarzała (actual AS-prod = 238).
- §5 RC klastry: RC1(73)+RC2(62)+RC3(47) = **182** + UNCL-prod (58) = 240 ✅.
- §4.1 (224/167) przeczy §5 (§5 bilansuje 240/167). **To jest ta sama stara para `224/167`, którą Architect nakazał usunąć.**

---

## 5. Freeze Verification

- `git status --porcelain`: 415 → **416** wpisy. Jedyny nowy wpis w rundzie G0-A7 = **`docs/G0-A7_F5_CLUSTER_ACCOUNTING_REPAIR_REPORT.md`** (dokument).
- Wszystkie ` M` w `.ts/.tsx/.json` to **pre-existing WIP** (identyczny zestaw jak w G0-A2/A4/A6) — **nie zmienione przez Agent 1 w rundach G0-A5…G0-A7**.
- `tsconfig.tsbuildinfo` — git-ignored (`git check-ignore` → OK), odtworzony przez tsc.
- **CODE CHANGES = 0 | TEST CHANGES = 0 | CONFIG CHANGES = 0** ✅

---

## 6. Findings

| ID | Severity | Agent 1 Claim (G0-A7) | Actual Repository Evidence | Required Correction |
|---|---|---|---|---|
| **G0-A8-F1** | 🔴 BLOCKING | §4.1: `224 prod + 167 test = 391` (linie 73, 75) "naprawione" | AS = **238 PROD + 153 TEST = 391** (fresh tsc); para `224/167` nadal w aktywnym inventory | §4.1 → **238 prod / 153 test** (linie 73, 75); usunąć parę `224/167` |
| **G0-A8-F2** | ⚠️ MINOR | §4.2: wszystkie 7 BC = `PRODUCTION` | BC = **1 PROD + 6 TEST** | §4.2 linia 78 → **1 PROD + 6 TEST** |
| **G0-A8-F3** | ⚠️ MINOR | §5 UNCLASSIFIED: komponenty `50 AS` + `7 BC-prod` | Poprawna kompozycja: **56 AS + 1 BC + 1 app** (total 58 OK) | §5 linie 123–124 → **56 / 1 / 1** |

> Komponent totals (§5-ogół), §6 (240/167), §2 (407), §3 (subsystem) — **PASS bez zastrzeżeń**.

---

## 7. Verdict

```
G0-A8 FOCUSED DELTA AUDIT RESULT (G0-A6-F5 / G0-A7)

1. RC1(73)+RC2(62)+RC3(47)+RC4(0)+RC5(167)+UNCL(58) = 407   ✅
2. RC1=73, RC2=62, RC3=47, RC4=0, RC5=167, UNCL=58          ✅
3. PRODUCTION = 240                                          ✅
4. TEST = 167                                                ✅
5. PRODUCTION + TEST = 407                                   ✅
6. Stare wartości w aktywnym inventory:
   - RC5=175     → REMOVED ✅
   - UNCL=50     → REMOVED ✅ (total teraz 58)
   - 232/175     → ABSENT ✅
   - 224/167     → STILL PRESENT (linie 73, 75) 🔴
7. Kod/Testy/Config niezmienione                            ✅
   (jedyny nowy plik = docs/G0-A7_F5_CLUSTER_ACCOUNTING_REPAIR_REPORT.md)

FORMAL DECISION:  G0-A8 = 🔴 HOLD
                  (dokładnie 1 pozostała para stale: §4.1 "224/167")
```

### Dlaczego nie PASS

Rachunek **klastrów i środowisk (§2, §5, §6) jest w 100% deterministyczny i zgodny** z kompilatorem — to fundamentalny postęp G0-A7. Jednak sekcja **§4.1 nadal zawiera przestarzały split `224 produkcyjne + 167 testowych = 391`** (linie 73 oraz 75), co jest **dokładnie parą `224/167`**, którą Architects wymagał usunąć w G0-A8. Realny split authoring-studio to **238 PROD + 153 TEST = 391**. Do tego dwie niespójności kompozycyjne (§4.2 BC: 7→1prod+6test; §5 UNCL: 50/7→56/1/1) wynikające z tej samej starej pary.

### Wąska korekta (wyłącznie F1–F3 powyżej — Agent 1)

1. **§4.1** (linia 73): `Pakiety Testowe … **167** błędów` → **153** błędów testowych w authoring-studio.
2. **§4.1** (linia 75): `224 produkcyjne + 167 testowych = 391` → **238 produkcyjne + 153 testowe = 391**.
3. **§4.2** (linia 78): BC → **1 PROD (`FrameRenderer.ts:30:74` TS2345) + 6 TEST** (`rendering/__tests__/`×6).
4. **§5 UNCLASSIFIED** (linie 123–124): komponenty → **56 AS + 1 BC + 1 app = 58** (total bez zmian).

Po tej 4-linijkowej korekcie Agent 2 wykona **FINAL FOCUSED DELTA AUDIT** wyłącznie dla **G0-A8-F1…F3**.

🛑 **STOP. G0-A8 = HOLD. CZEKAM NA DECYZJĘ ARCHITEKTA.**