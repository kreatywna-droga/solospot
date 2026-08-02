# C16.29 — WEB FACTOR Studio Engineering Guidelines

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 29_STUDIO_ENGINEERING_GUIDELINES.md  
> **Status:** Draft  
> **Zależności:** Wszystkie dokumenty C16 — konstytucja dla zespołu

---

## 1. Cel

Ten dokument nie opisuje **co** budować. Opisuje **jak** budować. To jest konstytucja dla każdego programisty pracującego nad WEB FACTOR Studio.

Każdy nowy kod w Studio musi przejść te reguły. Jeśli nie spełnia którejkolwiek — nie trafia do codebase.

---

## 2. Cardinal Rules (nie do negocjacji)

### Rule #1 — Command Pattern is the ONLY mutation path

```
✅ DO:
  dispatch({ type: 'UPDATE_PROPS', pageId, sectionId, props })

❌ DON'T:
  document.pages[0].sections[0].props.title = "New Title"
  doc.pages[0].sections[0].props = { ... }

Uzasadnienie:
- Tylko Command Pattern gwarantuje undo/redo
- Tylko Command Pattern jest serializowalny dla collaboration
- Tylko Command Pattern może być logowany dla telemetrii
- Tylko Command Pattern pozwala AI działać jako użytkownik
```

### Rule #2 — BuilderDocument is IMMUTABLE

```
✅ DO:
  const newDoc = touchDocument({ ...doc, pages: newPages })

❌ DON'T:
  doc.pages.push(newPage)
  doc.version++

Uzasadnienie:
- Immutability → darmowe porównanie referencji (===) dla React
- Immutability → darmowe snapshoty dla history stack
- Immutability → brak side effects przy współpracy
```

### Rule #3 — Every component MUST have a PropSchema

```
✅ DO:
  register({
    type: 'hero.basic',
    schema: [
      { key: 'title', type: 'string', label: 'Title' },
      { key: 'color', type: 'color', label: 'Background' },
    ]
  })

❌ DON'T:
  <div>{props.title}</div>  // bez schema — nie ma inspectora

Uzasadnienie:
- Inspector jest generowany z schema
- AI potrzebuje schema do generowania
- Responsive potrzebuje schema do per-breakpoint values
- API dokumentacji generowane z schema
```

### Rule #4 — Every component MUST be Responsive-safe

```
✅ DO:
  schema: [
    responsiveProp('padding', { desktop: '24px', tablet: '16px', mobile: '12px' })
  ]

❌ DON'T:
  <div style={{ padding: props.padding }}>  // nie działa na mobile

Uzasadnienie:
- Responsywność nie może być after-thought
- Każdy prop może mieć inną wartość na desktop/tablet/mobile
- Auto-responsive AI potrzebuje tej struktury
```

### Rule #5 — Every component MUST use Theme Tokens (not hardcoded colors)

```
✅ DO:
  <div style={{ color: 'var(--color-primary)' }}>

❌ DON'T:
  <div style={{ color: '#7c3aed' }}>

Uzasadnienie:
- One Click Theme Swap nie działa z hardcoded wartościami
- Brand generator nie działa
- User nie może zmienić koloru w jednym miejscu
```

### Rule #6 — Every component MUST be Preview-safe

```
✅ DO:
  function HeroSection(props) {
    return <div>{props.title}</div>  // czysty render, bez side effects
  }

❌ DON'T:
  useEffect(() => { fetch('/api/data') }, [])  // fetch w preview

Uzasadnienie:
- Preview renderuje się w iframe setki razy
- Side effects w preview → crash, performance, niepotrzebne API calls
- Debugowanie w preview musi być przewidywalne
```

### Rule #7 — Every component MUST be Undo-safe

```
✅ DO:
  dispatch({ type: 'UPDATE_PROPS', sectionId, props })

❌ DON'T:
  // bezpośrednia mutacja DOM w builderze

Uzasadnienie:
- Undo musi przywrócić stan sprzed 10 zmian
- Jeśli komponent mutuje coś poza BuilderDocument, undo tego nie cofnie
- Historia opiera się na snapshotach BuilderDocument
```

### Rule #8 — Every component MUST be AI-compatible

```
✅ DO:
  Schema-driven, bo AI czyta schema i generuje poprawne props

❌ DON'T:
  Komponent wymagający ręcznej konfiguracji JS

Uzasadnienie:
- AI generuje BuilderCommand[], a nie HTML
- AI musi wiedzieć jakie props akceptuje komponent
- AI musi wiedzieć które props są obowiązkowe
- AI musi wiedzieć jakie wartości są dozwolone (select → options)
```

---

## 3. Coding Standards

### 3.1 File Structure

```
packages/builder-core/src/
├── FeatureName.ts              — model/logic (pure, no React)
├── __tests__/
│   └── FeatureName.test.ts     — testy

src/components/builder/feature-name/
├── FeatureNamePanel.tsx        — panel UI
├── FeatureNameEditor.tsx       — edytor (jeśli potrzebny)
├── FeatureNameOverlay.tsx      — overlay na canvasie (jeśli potrzebny)
├── hooks/
│   └── useFeatureName.ts      — hook
└── __tests__/
    └── FeatureNamePanel.test.tsx
```

### 3.2 Naming Conventions

```
BuilderDocument         — PascalCase dla modeli
builderDocument         — camelCase dla instancji
createBuilderDocument   — factory function: create + Type
useBuilderDocument      — hook: use + Feature
BuilderProvider         — provider: Feature + Provider
BUILDER_DOCUMENT_EVENT  — constants: UPPER_SNAKE_CASE
'ADD_SECTION'           — command types: UPPER_SNAKE_CASE
```

### 3.3 TypeScript

```typescript
// ZAWSZE strict mode
// ZAWSZE explicit return types
// ZAWSZE readonly dla modeli
// ZAWSZE discriminated unions dla commandów

// Przykład:
interface AddSectionCommand {
  readonly type: 'ADD_SECTION';        // discriminant
  readonly pageId: string;
  readonly sectionType: string;
  readonly defaultProps: Record<string, unknown>;
}

type BuilderCommand = AddSectionCommand | RemoveSectionCommand | ...;
```

### 3.4 No any

```typescript
// ❌
function updateProps(props: Record<string, any>) {}

// ✅
function updateProps(props: Record<string, unknown>) {}
// albo lepiej: konkretny typ dla konkretnego use case'a
```

---

## 4. Testing Requirements

### 4.1 Coverage Targets

```
╔══════════════════════════════════════════════════════════╗
║                    COVERAGE TARGETS                      ║
╠══════════════════════════════════════════════════════════╣
║  Model logic       (builder-core)      100%             ║
║  Commands          (builder-core)      100%             ║
║  Reducers          (builder-core)      100%             ║
║  History           (builder-core)      100%             ║
║  SectionTree       (builder-core)      100%             ║
║  ComponentRegistry (builder-core)      100%             ║
║  Price: 0% → BLOCK CI                                  ║
╠══════════════════════════════════════════════════════════╣
║  UI Components     (builder-ui)        80%              ║
║  Hooks             (builder-ui)        90%              ║
║  Price: < 70% → BLOCK CI                               ║
╠══════════════════════════════════════════════════════════╣
║  E2E               (playwright)        Critical paths   ║
╚══════════════════════════════════════════════════════════╝
```

### 4.2 What to test

```typescript
// Model logic — test every function
describe('SectionTree', () => {
  it('should insert section at index', () => { /* ... */ });
  it('should remove section and reorder', () => { /* ... */ });
  it('should handle nested sections', () => { /* ... */ });
  it('should duplicate section with new IDs', () => { /* ... */ });
});

// Every command — test apply + undo
describe('ADD_SECTION command', () => {
  it('should add section to page', () => { /* ... */ });
  it('should create valid SectionNode', () => { /* ... */ });
  it('should touch document (dirty + version)', () => { /* ... */ });
});

// Every reducer — test every action type
describe('reduceCanvasState', () => {
  it('should handle SELECT_SECTION', () => { /* ... */ });
  it('should handle SET_BREAKPOINT', () => { /* ... */ });
  it('should handle BEGIN_DRAG', () => { /* ... */ });
  it('should handle END_DRAG', () => { /* ... */ });
});
```

---

## 5. Performance Budgets

```
╔══════════════════════════════════════════════════════════╗
║                 PERFORMANCE BUDGETS                       ║
╠══════════════════════════════════════════════════════════╣
║  Studio JS bundle           < 500 KB (gzipped)          ║
║  Core runtime JS            < 100 KB (gzipped)          ║
║  Per-section render time    < 5ms                       ║
║  Full page compile          < 500ms                     ║
║  Undo/Redo restore          < 50ms                      ║
║  Canvas interaction latency < 16ms (60fps)               ║
║  Preview update latency     < 100ms                     ║
║  History stack max entries  50 (default)                ║
║  Component registry max     1000+                       ║
╚══════════════════════════════════════════════════════════╝
```

---

## 6. Architecture Principles

### 6.1 Dependency Direction

```
✅ CORRECT:
  builder-core → (nobody)
  builder-ui   → builder-core
  runtime-core → builder-core (compile only)
  publish-core → runtime-core

❌ WRONG:
  builder-core → runtime-core
  builder-core → publish-core
  runtime-core → builder-ui
```

### 6.2 Module Boundaries

```
Każdy moduł w builder-core:
1. Ma swój plik (FeatureName.ts)
2. Eksportuje public API przez index.ts
3. Nie importuje z React
4. Nie importuje z runtime-core
5. Nie importuje z publish-core
6. Jest w 100% testowalny bez DOM
```

### 6.3 State Management

```
BuilderContext (builder-core) — pure state machine
    ↑
BuilderProvider (builder-ui) — React adapter
    ↑
useBuilder() — hook dla komponentów

Zasada:
- Logika stanu → builder-core (pure)
- UI → builder-ui (React)
- Most → BuilderProvider (tylko dispatch + subscribe)
```

### 6.4 New Feature Checklist

```
□ 1. Model + logic w builder-core (pure, testable)
□ 2. Command type w BuilderCommands.ts
□ 3. Handler w BuilderContext.ts
□ 4. CanvasAction w CanvasState.ts (jeśli potrzebne)
□ 5. React component w builder-ui
□ 6. Provider / hook w BuilderProvider.tsx
□ 7. Komponent zarejestrowany w ComponentRegistry (jeśli komponent)
□ 8. PropSchema (jeśli komponent)
□ 9. Tests (100% dla core, 80% dla UI)
□ 10. Storybook story (jeśli UI component)
```

---

## 7. Code Review Checklist

### 7.1 Architecture

```
□ Czy zmiana przechodzi przez Command Pattern?
□ Czy BuilderDocument pozostaje immutable?
□ Czy nowa funkcja jest w builder-core (nie runtime-core)?
□ Czy nowy komponent ma PropSchema?
□ Czy nowy komponent używa Theme Tokens?
□ Czy nowy komponent wspiera Responsive?
```

### 7.2 Safety

```
□ Czy jest Preview-safe? (brak side effects w render)
□ Czy jest Undo-safe? (undo przywraca stan)
□ Czy jest AI-compatible? (schema-driven)
□ Czy jest serializowalny? (JSON.stringify bez błędów)
```

### 7.3 Performance

```
□ Czy bundle size się nie zwiększył o > 5KB?
□ Czy nie ma niepotrzebnych re-renderów?
□ Czy lazy loading jest tam gdzie trzeba?
□ Czy obrazki mają srcset?
```

### 7.4 Quality

```
□ Czy są testy?
□ Czy coverage >= wymagany?
□ Czy TypeScript strict mode?
□ Czy nie ma 'any'?
□ Czy eslint przechodzi?
□ Czy są komentarze dla złożonej logiki?
```

---

## 8. Git & Review Process

### 8.1 Branch Naming

```
feature/C16-{sprint}-{feature-name}
fix/C16-{sprint}-{bug-description}
refactor/C16-{sprint}-{what}
docs/C16-studio-{document-name}
```

### 8.2 PR Requirements

```
Title: [C16.{sprint}] Brief description

Description:
- What: co zmienia ten PR
- Why: dlaczego
- How: jak
- Checklist: engineering guidelines checklist

Labels:
- area: {canvas|inspector|layout|...}
- priority: {p0|p1|p2}
```

### 8.3 Review Requirements

```
✅ Minimum 1 review dla każdego PR
✅ Autor nie może mergować własnego PR
✅ Wszystkie checklist items muszą być checked
❌ PR z czerwonymi testami → blocked
❌ PR coverage < threshold → blocked
❌ PR z 'any' → blocked
```

---

## 9. Decision Records (DR)

Każda decyzja architektoniczna musi być udokumentowana:

```
### DR-{NUM}-{TITLE}
**Status:** {Proposed | Accepted | Deprecated}
**Date:** {YYYY-MM-DD}
**Author:** {name}

**Context:**
{Why was this decision needed?}

**Decision:**
{What was decided?}

**Consequences:**
{What are the trade-offs?}

**Alternatives considered:**
{What else was considered and why rejected?}
```

---

## 10. Summary — The Studio Constitution

```
┌─────────────────────────────────────────────────────────────────────┐
│                      STUDIO CONSTITUTION                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ARTICLE 1: COMMAND PATTERN                                         │
│  All mutations MUST go through dispatch(command).                   │
│  No direct mutations of BuilderDocument.                            │
│                                                                     │
│  ARTICLE 2: IMMUTABILITY                                            │
│  BuilderDocument is ALWAYS immutable.                               │
│  Mutations return a NEW document reference.                         │
│                                                                     │
│  ARTICLE 3: SCHEMA-DRIVEN                                           │
│  Every component MUST have PropSchema.                              │
│  No hardcoded props without schema.                                 │
│                                                                     │
│  ARTICLE 4: RESPONSIVE-BY-DEFAULT                                   │
│  Every prop CAN be responsive.                                      │
│  Every component MUST support breakpoints.                          │
│                                                                     │
│  ARTICLE 5: THEME TOKENS                                            │
│  Every color MUST use CSS custom properties.                        │
│  No hardcoded colors. No hardcoded fonts.                           │
│                                                                     │
│  ARTICLE 6: PREVIEW SAFETY                                          │
│  Components MUST be pure render functions.                          │
│  No side effects in preview.                                        │
│                                                                     │
│  ARTICLE 7: UNDO SAFETY                                             │
│  Every mutation MUST be reversible.                                 │
│  Undo MUST restore exact previous state.                            │
│                                                                     │
│  ARTICLE 8: AI COMPATIBILITY                                        │
│  All features MUST work with AI-generated commands.                 │
│  AI is another Studio user.                                         │
│                                                                     │
│  ARTICLE 9: DEPENDENCY DIRECTION                                    │
│  builder-core ← builder-ui ← runtime-core ← publish-core            │
│  NEVER import against the direction.                                │
│                                                                     │
│  ARTICLE 10: TESTABILITY                                            │
│  Core logic: 100% coverage.                                         │
│  UI: 80% coverage.                                                  │
│  Untested code = not merged.                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 11. Pliki

```
docs/studio/
├── 29_STUDIO_ENGINEERING_GUIDELINES.md   — ten dokument
└── decisions/
    ├── DR-001-command-pattern.md
    ├── DR-002-immutable-document.md
    ├── DR-003-canvas-iframe.md
    ├── DR-004-schema-driven-inspector.md
    ├── DR-005-constraint-engine-separate.md
    ├── DR-006-variables-collections-resolver.md
    ├── DR-007-collaboration-via-commands.md
    └── ...
```

