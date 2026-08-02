# Central Architecture Decision Records (ADR) Index — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 77_ADR_INDEX.md  
> **Status:** Active Central Index  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 62_BUILDER_TRACEABILITY_MATRIX.md  
>  
> **Proces:** Centralny Indeks Decyzji Architektonicznych (ADR Registry)

---

## 1. Wykaz Decyzji Architektonicznych (ADR Index)

| # | Tytuł ADR | Status | Data | Autor | Subsystem | Powiązane Dokumenty | Implementacja (Code) | Architecture Freeze |
|---|-----------|--------|------|-------|-----------|--------------------|----------------------|---------------------|
| **ADR-001** | Architecture Freeze & Modular Shell | APPROVED | 2026-07-15 | Lead Architect | Studio Shell | `01_STUDIO_ARCHITECTURE.md` | `BuilderShell.tsx` | 🔒 Freeze Approved |
| **ADR-002** | Immutable Document & Command Bus | APPROVED | 2026-07-16 | Lead Architect | Builder Core | `02_BUILDER_CORE.md` | `BuilderDocument.ts` | 🔒 Freeze Approved |
| **ADR-003** | Declarative Component & Prop Registry | APPROVED | 2026-07-17 | Lead Architect | Component Registry | `08_COMPONENT_SYSTEM.md` | `ComponentRegistry.ts` | 🔒 Freeze Approved |
| **ADR-004** | Layout Engine & ResponsiveValue | APPROVED | 2026-07-20 | Lead Architect | Layout Engine | `31_LAYOUT_PROPERTY_SPECIFICATION.md` | `FlexField.tsx` | 🔒 Freeze Approved |
| **ADR-005** | CSS Grid Property Model | APPROVED | 2026-07-22 | Lead Architect | Grid Engine | `38_GRID_PROPERTY_SPECIFICATION.md` | `GridField.tsx` | 🔒 Freeze Approved |
| **ADR-006** | Overflow Property Specification | APPROVED | 2026-07-25 | Lead Architect | Overflow Engine | `44_OVERFLOW_PROPERTY_SPECIFICATION.md` | `OverflowField.tsx` | 🔒 Freeze Approved |
| **ADR-007** | Border Engine Architecture Proposal | APPROVED | 2026-07-28 | Lead Architect | Border Engine | `50_BORDER_PROPERTY_SPECIFICATION.md` | `BorderField.tsx` | 🚧 In Progress |
| **ADR-008** | Radius Engine Specification Proposal | APPROVED | 2026-07-30 | Agent 2 | Radius Engine | `51_RADIUS_PROPERTY_SPECIFICATION.md` | `RadiusTypes.ts` (Plan) | 📝 Spec Approved |
| **ADR-009** | Canvas Iframe Bridge & Overlays | APPROVED | 2026-07-30 | Agent 2 | Canvas Completion | `53_CANVAS_COMPLETION_SPECIFICATION.md` | `BuilderCanvas.tsx` | 📝 Spec Approved |

---

## 2. Sekcja dla Przyszłych ADR (Future ADR Placeholder)

```
| ADR-010 | Background Subsystem Architecture | DRAFT | - | Agent 2 | Background | 81_FUTURE_SUBSYSTEM_ROADMAP.md | - | - |
| ADR-011 | Typography Subsystem & Web Fonts | DRAFT | - | Agent 2 | Typography | 81_FUTURE_SUBSYSTEM_ROADMAP.md | - | - |
| ADR-012 | Shadow & Elevation Engine | DRAFT | - | Agent 2 | Shadow | 81_FUTURE_SUBSYSTEM_ROADMAP.md | - | - |
| ADR-013 | CSS Filters & Glassmorphism | DRAFT | - | Agent 2 | Effects | 81_FUTURE_SUBSYSTEM_ROADMAP.md | - | - |
```
