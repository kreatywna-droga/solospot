# Builder Traceability Matrix — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 62_BUILDER_TRACEABILITY_MATRIX.md  
> **Status:** Active Quality Control Matrix  
> **Zależności:** 37_STUDIO_SUBSYSTEM_ROADMAP.md, 99_IMPLEMENTATION_CHECKLIST.md  
>  
> **Proces:** Macierz Śledzenia Wymagań (Requirement Traceability Matrix)

---

## 1. Macierz Śledzenia Wymagań i Architektury (Traceability Matrix)

Niniejszy dokument umożliwia pełne prześledzenie drogi dowolnego subsystemu — od pierwotnego wymagania biznesowego/produktowego, poprzez decyzje architektoniczne (ADR), specyfikacje, aż po kod źródłowy, testy i formalne zamrożenie.

| # | Subsystem | Wymaganie Biznesowe | ADR / Standard | Specyfikacja (Docs) | Plik Implementacji (Code) | Zestaw Testów | Status Freeze |
|---|-----------|---------------------|----------------|--------------------|---------------------------|---------------|---------------|
| 1 | **Studio Shell** | Req-Fnd-01 (Wix UX) | ADR-SHELL-001 | `01_STUDIO_ARCHITECTURE.md` | `BuilderShell.tsx` | `shell.test.ts` | 🔒 APPROVED (Dok 01) |
| 2 | **Builder Core** | Req-Fnd-02 (Immutability) | DR-CMD-001 | `02_BUILDER_CORE.md` | `BuilderDocument.ts` | `core.test.ts` | 🔒 APPROVED (Dok 02) |
| 3 | **Component Registry** | Req-Fnd-03 (Extensibility) | ADR-REG-001 | `08_COMPONENT_SYSTEM.md` | `ComponentRegistry.ts` | `registry.test.ts` | 🔒 APPROVED (Dok 08) |
| 4 | **Layout Engine** | Req-Layout-01 (Flexbox) | ADR-LAYOUT-001 | `31_LAYOUT_PROPERTY_SPECIFICATION.md` | `FlexField.tsx`, `LayoutTypes.ts` | `layout.test.ts` | 🔒 APPROVED (Dok 35) |
| 5 | **Grid Engine** | Req-Layout-02 (CSS Grid) | ADR-GRID-001 | `38_GRID_PROPERTY_SPECIFICATION.md` | `GridField.tsx`, `GridSystem.ts` | `grid.test.ts` | 🔒 APPROVED (Dok 42) |
| 6 | **Overflow Engine** | Req-Visual-01 (Clipping) | DR-OVERFLOW-002 | `44_OVERFLOW_PROPERTY_SPECIFICATION.md` | `OverflowField.tsx` | `overflow.test.ts` | 🔒 APPROVED (Sprint 5B.2) |
| 7 | **Border Engine** | Req-Visual-02 (Obramowania) | ADR-VISUAL-001 | `50_BORDER_PROPERTY_SPECIFICATION.md` | `BorderField.tsx`, `BorderTypes.ts` | `border.test.ts` | 🚧 In Progress (Dok 54) |
| 8 | **Radius Engine** | Req-Visual-03 (Zaokrąglenia) | ADR-VISUAL-001 | `51_RADIUS_PROPERTY_SPECIFICATION.md` | `RadiusTypes.ts` (Planned) | `radius.test.ts` (Plan) | 📝 Spec Approved (Dok 52) |
| 9 | **Canvas Completion** | Req-Canvas-01 (WYSIWYG) | C6.2-C / ADR-CANVAS | `53_CANVAS_COMPLETION_SPECIFICATION.md` | `BuilderCanvas.tsx` | `canvas.test.ts` (Plan) | 📝 Spec Approved (Dok 58) |
