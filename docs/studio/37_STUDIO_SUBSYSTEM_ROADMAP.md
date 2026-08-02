# Studio — Subsystem Roadmap

> **Status:** v1.0
> **Cel:** Jedno źródło prawdy o stanie wszystkich subsystemów Studio

---

## 1. Legenda

| Ikona | Znaczenie |
|-------|-----------|
| ⏳ | Nie rozpoczęte |
| ◐ | W trakcie |
| ✅ | Zakończone |
| 🔒 | Freeze (Architecture Freeze — APPROVED) |

---

## 2. Subsystemy Studio

### Szybki przegląd (Quick Status)

| Subsystem | Status | Sprint |
|-----------|--------|--------|
| Studio Shell | 🔒 Frozen | Sprint 1 |
| Builder Core | 🔒 Frozen | Sprint 2 |
| Component Registry | 🔒 Frozen | Sprint 3 |
| Canvas (iframe) | 🔒 Frozen | Sprint 4 + 5C |
| **Layout Engine** | **🔒 Frozen** | **Sprint 5A** |
| Grid | 🔒 Frozen | Sprint 5B.1 |
| **Overflow** | **🔒 Frozen** | **Sprint 5B.2** |
| **Border** | **🔒 Frozen** | **Sprint 5B.3** |
| **Radius** | **🔒 Frozen** | **Sprint 5B.4** |
| **Drag & Drop** | **🔒 Frozen** | **Sprint 6A** |
| **Smart Guides** | **🔒 Frozen** | **Sprint 6B** |
| Inspector 2.0 | 📝 Planned | Sprint 7 |
| Constraint Engine | 📝 Planned | Sprint 9 |
| Responsive Engine | 📝 Planned | Sprint 10 |

### Szczegółowy przegląd (Detailed View)

| # | Subsystem | Specification | Domain Model | Builder Core | React UI | Registry | Integration Review | Architecture Freeze | Sprint |
|---|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Studio Shell | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Sprint 1 |
| 2 | Builder Core | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Sprint 2 |
| 3 | Component Registry | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Sprint 3 |
| 4 | Canvas (iframe) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 | Sprint 4 + 5C |
| **5** | **Layout Engine** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** | **🔒** | **Sprint 5A** |
| **5B.1** | **Grid** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** | **🔒** | **Sprint 5B.1** |
| **5B.2** | **Overflow** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** | **🔒** | **Sprint 5B.2** |
| **5B.3** | **Border** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** | **🔒** | **Sprint 5B.3** |
| **5B.4** | **Radius** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** | **🔒** | **Sprint 5B.4** |
| **6** | **Drag & Drop** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** | **🔒** | **Sprint 6A** |
| **7** | **Smart Guides** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** | **🔒** | **Sprint 6B** |
| 8 | Inspector 2.0 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Sprint 7 |
| 9 | Constraint Engine | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Sprint 9 |
| 10 | Responsive Engine | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Sprint 10 |

---

## 3. Milestone'y

```
Sprint  1- 3  →  MILESTONE A: Studio działa.               [✅]
Sprint  4- 6  →  MILESTONE B: Można budować strony.        [◐]
Sprint  7-10  →  MILESTONE C: Konkurencja dla Wix Studio.  [⏳]
Sprint 11-14  →  MILESTONE D: Profesjonalny builder.       [⏳]
Sprint 15-21  →  MILESTONE E: Nowa generacja builderów.    [⏳]
Sprint 22-25  →  MILESTONE F: WEB FACTOR Platform.         [⏳]
```

---

## 4. Szczegółowy status Layout Engine

| Komponent | Subsystem | Specification | Domain Model | Builder Core | React UI | Registry | Review | Freeze |
|-----------|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Spacing | Layout Engine | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| Size | Layout Engine | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| Position | Layout Engine | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| Flex | Layout Engine | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| Grid | Layout Engine | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| **Overflow** | **Layout Engine** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** | **🔒** |
| **Border** | **Layout Engine** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** | **🔒** |
| **Radius** | **Layout Engine** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** | **🔒** |

---

## 5. Dokumenty Studio (dokumentacja)

| # | Dokument | Status | Sprint |
|---|----------|--------|--------|
| 00 | STUDIO_VISION.md | ✅ | Sprint 0 |
| 01 | STUDIO_ARCHITECTURE.md | ✅ | Sprint 0 |
| 02 | UI_LAYOUT.md | ✅ | Sprint 0 |
| 03 | CANVAS_ENGINE.md | ✅ | Sprint 0 |
| 04 | SELECTION_SYSTEM.md | ✅ | Sprint 0 |
| 05 | DRAG_DROP_ENGINE.md | ✅ | Sprint 0 |
| 06 | LAYOUT_ENGINE.md | ✅ | Sprint 0 |
| 07 | INSPECTOR.md | ✅ | Sprint 0 |
| 08 | COMPONENT_SYSTEM.md | ✅ | Sprint 0 |
| 09 | ASSET_SYSTEM.md | ✅ | Sprint 0 |
| 10 | DESIGN_SYSTEM.md | ✅ | Sprint 0 |
| 11 | ANIMATION_ENGINE.md | ✅ | Sprint 0 |
| 12 | RESPONSIVE_ENGINE.md | ✅ | Sprint 0 |
| 13 | AI_ASSISTANT.md | ✅ | Sprint 0 |
| 14 | HISTORY_ENGINE.md | ✅ | Sprint 0 |
| 15 | PERFORMANCE.md | ✅ | Sprint 0 |
| 16 | PLUGIN_API.md | ✅ | Sprint 0 |
| 17 | STUDIO_GOLDEN_FLOW.md | ✅ | Sprint 0 |
| 18 | CONSTRAINT_ENGINE.md | ✅ | Sprint 0 |
| 19 | SMART_GUIDES.md | ✅ | Sprint 0 |
| 20 | INLINE_EDITING.md | ✅ | Sprint 0 |
| 21 | GLOBAL_STYLES.md | ✅ | Sprint 0 |
| 22 | VARIABLES.md | ✅ | Sprint 0 |
| 23 | COLLECTIONS.md | ✅ | Sprint 0 |
| 24 | INTERACTIONS.md | ✅ | Sprint 0 |
| 25 | COLLABORATION.md | ✅ | Sprint 0 |
| 26 | RUNTIME_INSPECTOR.md | ✅ | Sprint 0 |
| 27 | WORLD_CLASS_FEATURES.md | ✅ | Sprint 0 |
| 28 | RUNTIME_EXECUTION_MODEL.md | ✅ | Sprint 0 |
| 29 | STUDIO_ENGINEERING_GUIDELINES.md | ✅ | Sprint 0 |
| 30 | PRODUCT_EVOLUTION.md | ✅ | Sprint 0 |
| 31 | LAYOUT_PROPERTY_SPECIFICATION.md | ✅ | Sprint 5A |
| 32 | RESPONSIVE_VALUE_MODEL.md | ✅ | Sprint 5A |
| 33 | LAYOUT_COMMANDS.md | ✅ | Sprint 5A |
| 34 | SPRINT5A_INTEGRATION_REVIEW.md | ✅ | Sprint 5A |
| 35 | LAYOUT_ENGINE_ARCHITECTURE_FREEZE.md | ✅ | Sprint 5A |
| 36 | STUDIO_ENGINEERING_PROCESS.md | ✅ | Sprint 5A |
| 37 | STUDIO_SUBSYSTEM_ROADMAP.md | ✅ | Sprint 5A |
| 38 | GRID_PROPERTY_SPECIFICATION.md | ✅ | Sprint 5B.1 |
| 39 | GRID_DOMAIN_MODEL.md | ✅ | Sprint 5B.1 |
| 40 | GRID_COMMANDS.md | ✅ | Sprint 5B.1 |
| 41 | SPRINT5B1_INTEGRATION_REVIEW.md | ✅ | Sprint 5B.1 |
| 42 | GRID_ENGINE_ARCHITECTURE_FREEZE.md | ✅ | Sprint 5B.1 |
| 44 | OVERFLOW_PROPERTY_SPECIFICATION.md | ✅ | Sprint 5B.2 |
| 45 | OVERFLOW_COMMANDS.md | ✅ | Sprint 5B.2 |
| 46 | SPRINT5B2_INTEGRATION_REVIEW.md | ✅ | Sprint 5B.2 |
| 47 | OVERFLOW_ARCHITECTURE_FREEZE.md | ✅ | Sprint 5B.2 |
| 48 | ADR_VISUAL_001_BORDER_RADIUS_ARCHITECTURE.md | ✅ | Sprint 5B.3 |
| 49 | BORDER_PROPERTY_SPECIFICATION.md | ✅ | Sprint 5B.3 |
| 50 | BORDER_COMMANDS.md | ✅ | Sprint 5B.3 |
| 51 | SPRINT5B3_INTEGRATION_REVIEW.md | ✅ | Sprint 5B.3 |
| 52 | BORDER_ARCHITECTURE_FREEZE.md | ✅ | Sprint 5B.3 |
| 53 | RADIUS_PROPERTY_SPECIFICATION.md | ✅ | Sprint 5B.4 |
| 54 | RADIUS_COMMANDS.md | ✅ | Sprint 5B.4 |
| 55 | SPRINT5B4_INTEGRATION_REVIEW.md | ✅ | Sprint 5B.4 |
| 56 | RADIUS_ARCHITECTURE_FREEZE.md | ✅ | Sprint 5B.4 |
| 99 | IMPLEMENTATION_CHECKLIST.md | ✅ | — |

---

## 6. Podsumowanie

| Status | Ilość subsystemów |
|--------|:---:|
| 🔒 Architecture Freeze | 11 (Studio Shell, Builder Core, Component Registry, Canvas, Layout Engine, Grid, Overflow, Border, Radius, Drag & Drop, Smart Guides) |
| 🚧 W trakcie | 0 |
| ⏳ Nie rozpoczęte | 3 (Inspector 2.0, Constraints, Responsive) |
| **Razem** | **14** |

