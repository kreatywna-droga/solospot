# Traceability Expansion Guide — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 102_TRACEABILITY_EXPANSION_GUIDE.md  
> **Status:** Governance Standard  
> **Zależności:** 62_BUILDER_TRACEABILITY_MATRIX.md, 96_ARCHITECTURE_COMPLIANCE_MATRIX.md  
>  
> **Proces:** Przewodnik Rozszerzonej Macierzy Śledzenia Wymagań i Zmian

---

## 1. Rozszerzona Ścieżka Śledzenia Powiązań (End-to-End Traceability Chain)

Każde wymaganie biznesowe i funkcyjne w WEB FACTOR Studio może być precyzyjnie śledzone wzdłuż 8-elementowej sieci powiązań:

```
Wymaganie ➔ ADR ➔ Specyfikacja ➔ Implementacja ➔ Testy ➔ Integration Review ➔ Architecture Freeze ➔ Roadmapa
```

---

## 2. Przykładowe Scenariusze Śledzenia Zmian (Change Scenarios)

### Scenariusz A: Zmiana reguły walidacji jednostki w Radius Engine
1. **Wnioskowana Zmiana:** Dodanie wsparcia dla jednostki `rem` w promieniu narożnika.
2. **Weryfikacja Łańcucha:**
   * Specyfikacja: `51_RADIUS_PROPERTY_SPECIFICATION.md` (Zmień regułę walidacji w Sekcji 6).
   * Kontrakty: `52_RADIUS_COMMANDS.md` (Zaktualizuj typ `RadiusUnit`).
   * Implementacja: `RadiusTypes.ts` + `validateRadiusProps()`.
   * Testy: `radius.test.ts` (Dodaj przypadek testowy dla `1.5rem`).
3. **Wynik:** Wszystkie powiązane dokumenty i pliki kodu zostają zaktualizowane atomowo w jednym PR.

### Scenariusz B: Wycofanie właściwości na rzecz Tokenu Design Systemu
1. **Wnioskowana Zmiana:** Zastąpienie sztywnego koloru `borderColor` tokenem `border.color.primary`.
2. **Weryfikacja Łańcucha:**
   * ADR: Utwórz nową decyzję w `77_ADR_INDEX.md` odnoszącą się do `ADR-007`.
   * Wersjonowanie: Podbij `schemaVersion` z `2.1.0` do `2.2.0` wg `73_VERSIONING_POLICY.md`.
