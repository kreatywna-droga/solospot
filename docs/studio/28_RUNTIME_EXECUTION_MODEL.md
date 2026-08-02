# C16.28 — WEB FACTOR Studio Runtime Execution Model

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 28_RUNTIME_EXECUTION_MODEL.md  
> **Status:** Draft  
> **Zależności:** Wszystkie dokumenty C16 — spinający cały system

---

## 1. Cel

Ten dokument opisuje **jak działa Runtime** — od momentu gdy użytkownik kończy edycję, aż do wyświetlenia strony na CDN. Nie opisuje UI Buildera. Opisuje pipeline wykonawczy.

To jest dokument spinający cały system:
- BuilderDocument → compile → RuntimeSnapshot → Renderer → Hydration → Runtime Events → Publish → CDN

---

## 2. RuntimeSnapshot Versioning

Każdy RuntimeSnapshot posiada własny system wersjonowania, co umożliwia bezpieczną ewolucję platformy w czasie:

```typescript
interface RuntimeSnapshot {
  // Versioning — kluczowe dla ewolucji platformy
  version: number;              // wersja snapshota (1, 2, 3...)
  compilerVersion: number;      // wersja kompilatora który go wyprodukował
  schemaVersion: number;        // wersja schematów komponentów
  runtimeVersion: number;       // wersja runtime (renderer)

  // Content
  pages: CompiledPage[];
  theme: ResolvedTheme;
  globalStyles: ResolvedGlobalStyles;
  variables: ResolvedVariables;
  collections: ResolvedCollections;
  interactions: CompiledInteraction[];
  animations: CompiledAnimation[];
  responsive: BreakpointConfig;
  plugins: PluginConfig[];
  seo: SEOConfig;
  assets: AssetManifest;

  // Metadata
  createdAt: string;            // ISO timestamp
  compiledFrom: string;         // źródłowy BuilderDocument ID
  checksum: string;            // hash całego snapshota
}
```

Dzięki temu za 2 lata możliwa jest migracja:

```
Snapshot v1 (2025)              Snapshot v2 (2027)
  ↓                                       ↓
Compiler v1 → Runtime v1         Compiler v2 → Migration Layer → Runtime v2
```

---

## 3. Deterministic Build

**Podstawowa zasada Runtime:**

```
Ten sam BuilderDocument
+ te same Assets
+ ta sama wersja Runtime
= identyczny RuntimeSnapshot
```

To daje:
- **Przewidywalność** — każde uruchomienie kompilacji dla tych samych danych daje ten sam wynik
- **Łatwiejsze debugowanie** — błąd można odtworzyć lokalnie z tego samego snapshota
- **Możliwość porównywania** — diff między snapshotami pokazuje dokładnie co się zmieniło
- **Stabilne cache** — hash snapshota jest deterministyczny, więc cache działa niezawodnie

### Deterministic Hash

```typescript
function computeSnapshotChecksum(snapshot: RuntimeSnapshot): string {
  // Deterministic hash based on content only (not timestamps)
  const normalized = {
    version: snapshot.version,
    compilerVersion: snapshot.compilerVersion,
    schemaVersion: snapshot.schemaVersion,
    runtimeVersion: snapshot.runtimeVersion,
    pages: snapshot.pages,
    theme: snapshot.theme,
    globalStyles: snapshot.globalStyles,
    variables: snapshot.variables,
    collections: snapshot.collections,
    interactions: snapshot.interactions,
    animations: snapshot.animations,
    responsive: snapshot.responsive,
    plugins: snapshot.plugins,
    seo: snapshot.seo,
    assets: snapshot.assets,
  };

  return crypto.createHash('sha256')
    .update(JSON.stringify(normalized, Object.keys(normalized).sort()))
    .digest('hex');
}
```

### Non-deterministic sources (must be excluded from hash)

| Źródło | Problem | Rozwiązanie |
|--------|---------|-------------|
| `Date.now()` | Zmienia się każde wywołanie | Użyć `createdAt` z BuilderDocument |
| `Math.random()` | Losowe wartości | Generować raz w Builderze, propagować |
| Kolejność kluczy w obiekcie | Różne silniki JSON różnie sortują | Zawsze sortować klucze przed hashowaniem |
| Timestamp w asset URL | CDN generuje unikalne URL | Użyć content hash zamiast timestamp |

---

## 4. Pipeline Validation

Przed wygenerowaniem RuntimeSnapshot dodajemy osobny etap walidacji:

```
BuilderDocument
     ↓
  VALIDATION ← intercepts errors BEFORE compile
     ↓
  COMPILE
```

### Validator interface

```typescript
interface ValidationRule {
  readonly name: string;
  readonly severity: 'ERROR' | 'WARNING';
  validate(doc: BuilderDocument, ctx: ValidationContext): ValidationResult[];
}

interface ValidationResult {
  rule: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
  path?: string;                // dot notation: "pages[0].sections[2].props.title"
  fix?: string;                 // suggested fix description
}

interface ValidationContext {
  registry: BuilderComponentRegistry;
  variables: VariableStore;
  collections: CollectionStore;
  assets: AssetManifest;
}
```

### Validation rules

```typescript
const VALIDATION_RULES: ValidationRule[] = [
  // 1. Required props
  {
    name: 'required-props',
    severity: 'ERROR',
    validate(doc, ctx) {
      const errors: ValidationResult[] = [];
      for (const page of doc.pages) {
        for (const section of page.sections) {
          const descriptor = ctx.registry.get(section.type);
          if (!descriptor) continue;
          for (const prop of descriptor.schema) {
            if (prop.required && section.props[prop.key] === undefined) {
              errors.push({
                rule: 'required-props',
                severity: 'ERROR',
                message: `Section "${section.label}" (${section.type}) is missing required prop "${prop.key}"`,
                path: `pages[${page.id}].sections[${section.id}].props.${prop.key}`,
                fix: `Set a default value for "${prop.label}" in the inspector`,
              });
            }
          }
        }
      }
      return errors;
    },
  },

  // 2. Component registry check
  {
    name: 'component-exists',
    severity: 'ERROR',
    validate(doc, ctx) {
      return doc.pages.flatMap(page =>
        page.sections
          .filter(section => !ctx.registry.has(section.type))
          .map(section => ({
            rule: 'component-exists',
            severity: 'ERROR' as const,
            message: `Component type "${section.type}" is not registered in the ComponentRegistry`,
            path: `pages[${page.id}].sections[${section.id}]`,
            fix: `Register "${section.type}" in the registry or remove this section`,
          }))
      );
    },
  },

  // 3. Variable resolution check
  {
    name: 'variable-exists',
    severity: 'WARNING',
    validate(doc, ctx) {
      const warnings: ValidationResult[] = [];
      const varPattern = /\{\{([^}]+)\}\}/g;

      for (const page of doc.pages) {
        for (const section of page.sections) {
          for (const [key, value] of Object.entries(section.props)) {
            if (typeof value === 'string') {
              let match;
              while ((match = varPattern.exec(value)) !== null) {
                const varName = match[1].trim();
                if (!resolveVariable(varName, ctx.variables)) {
                  warnings.push({
                    rule: 'variable-exists',
                    severity: 'WARNING',
                    message: `Variable "{{${varName}}}" in section "${section.label}" does not exist`,
                    path: `pages[${page.id}].sections[${section.id}].props.${key}`,
                    fix: `Create variable "${varName}" or remove the reference`,
                  });
                }
              }
            }
          }
        }
      }
      return warnings;
    },
  },

  // 4. Collection reference check
  {
    name: 'collection-exists',
    severity: 'ERROR',
    validate(doc, ctx) {
      const errors: ValidationResult[] = [];
      for (const page of doc.pages) {
        for (const section of page.sections) {
          if (section.type === 'collection.list') {
            const collectionId = section.props.collectionId as string;
            if (!collectionId || !ctx.collections[collectionId]) {
              errors.push({
                rule: 'collection-exists',
                severity: 'ERROR',
                message: `Collection "${collectionId}" not found`,
                path: `pages[${page.id}].sections[${section.id}].props.collectionId`,
                fix: `Create collection "${collectionId}" or select an existing one`,
              });
            }
          }
        }
      }
      return errors;
    },
  },

  // 5. Layout + Absolute conflict
  {
    name: 'layout-conflict',
    severity: 'WARNING',
    validate(doc, ctx) {
      const warnings: ValidationResult[] = [];
      for (const page of doc.pages) {
        for (const section of page.sections) {
          const layout = section.props.display as string;
          const constraints = section.props.constraints as Record<string, any>;
          
          if (layout === 'absolute' && section.children.length > 0) {
            warnings.push({
              rule: 'layout-conflict',
              severity: 'WARNING',
              message: `Section "${section.label}" has display:absolute but contains ${section.children.length} children`,
              path: `pages[${page.id}].sections[${section.id}]`,
              fix: `Use position:relative on parent or move children to a nested container`,
            });
          }

          if (layout === 'grid' && constraints) {
            const hasAbsoluteChild = constraints.left || constraints.right;
            if (hasAbsoluteChild) {
              warnings.push({
                rule: 'layout-conflict',
                severity: 'WARNING',
                message: `Grid layout with absolute constraints may cause unexpected behavior`,
                path: `pages[${page.id}].sections[${section.id}]`,
              });
            }
          }
        }
      }
      return warnings;
    },
  },

  // 6. Duplicate IDs
  {
    name: 'duplicate-ids',
    severity: 'ERROR',
    validate(doc, ctx) {
      const ids = new Map<string, string[]>();
      const collectIds = (sections: SectionNode[], pageId: string) => {
        for (const section of sections) {
          const existing = ids.get(section.id) ?? [];
          existing.push(`${pageId}/${section.label}`);
          ids.set(section.id, existing);
          collectIds(section.children, pageId);
        }
      };
      for (const page of doc.pages) {
        collectIds(page.sections, page.id);
      }
      return Array.from(ids.entries())
        .filter(([, locations]) => locations.length > 1)
        .map(([id, locations]) => ({
          rule: 'duplicate-ids',
          severity: 'ERROR' as const,
          message: `Duplicate section ID "${id}" found in: ${locations.join(', ')}`,
          fix: 'This should not happen — report as a bug',
        }));
    },
  },
];
```

### Pipeline with validation

```typescript
function compileWithValidation(doc: BuilderDocument, ctx: ValidationContext): {
  snapshot: RuntimeSnapshot | null;
  errors: ValidationResult[];
  warnings: ValidationResult[];
} {
  const allResults: ValidationResult[] = [];

  for (const rule of VALIDATION_RULES) {
    const results = rule.validate(doc, ctx);
    allResults.push(...results);
  }

  const errors = allResults.filter(r => r.severity === 'ERROR');
  const warnings = allResults.filter(r => r.severity === 'WARNING');

  if (errors.length > 0) {
    return { snapshot: null, errors, warnings };
  }

  // Deterministic compile
  const snapshot = compile(doc);
  snapshot.checksum = computeSnapshotChecksum(snapshot);

  return { snapshot, errors: [], warnings };
}
```

### Error recovery

```
Validation ERROR →
  - Stop compilation
  - Show errors in Studio Inspector (red badge on section)
  - User must fix before publish
  - Auto-save still works (errors are UI-level, not data-level)

Validation WARNING →
  - Allow compilation
  - Show warnings in Studio (yellow badge)
  - User can publish with warnings
  - Log warnings for analytics (most common issues)
```

---

## 5. Full Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RUNTIME PIPELINE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BUILDER                                                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  User edits in Studio                                          │ │
│  │  ↓ dispatch(commands)                                          │ │
│  │  ↓ BuilderDocument (immutable state)                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
│           ↓                                                          │
│  VALIDATION                                                          │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  validate(BuilderDocument) → { errors, warnings }              │ │
│  │                                                                 │ │
│  │  Rules:                                                         │ │
│  │  1. Required props check                                        │ │
│  │  2. Component registry check                                    │ │
│  │  3. Variable existence check                                    │ │
│  │  4. Collection reference check                                  │ │
│  │  5. Layout + Absolute conflict                                  │ │
│  │  6. Duplicate ID check                                          │ │
│  │                                                                 │ │
│  │  If errors → stop, show in UI                                   │ │
│  │  If warnings → allow, log                                       │ │
│  └────────────────────────────────────────────────────────────────┘ │
│           ↓                                                          │
│  COMPILE                                                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  compile(BuilderDocument) → CompiledDocument                   │ │
│  │                                                                 │ │
│  │  Steps:                                                         │ │
│  │  1. Resolve Variables: {{store.name}} → "WEB FACTOR"           │ │
│  │  2. Resolve Collections: {{products}} → [...items]             │ │
│  │  3. Apply GlobalStyles: H2 → font-size: 36px                   │ │
│  │  4. Apply Design Tokens: --primary → #7c3aed                   │ │
│  │  5. Flatten section tree (hoist children)                      │ │
│  │  6. Build SEO metadata                                          │ │
│  │  7. Generate page routes                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│           ↓                                                          │
│  RUNTIME SNAPSHOT                                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  RuntimeSnapshot — final, immutable render model               │ │
│  │                                                                 │ │
│  │  {                                                              │ │
│  │    pages: CompiledPage[],                                       │ │
│  │    theme: ResolvedTheme,                                        │ │
│  │    globalStyles: ResolvedGlobalStyles,                          │ │
│  │    variables: ResolvedVariables,                                │ │
│  │    collections: ResolvedCollections,                            │ │
│  │    interactions: CompiledInteractions[],                        │ │
│  │    animations: CompiledAnimations[],                            │ │
│  │    responsive: BreakpointConfig,                                │ │
│  │    plugins: PluginConfig[],                                     │ │
│  │    seo: SEOConfig,                                              │ │
│  │    assets: AssetManifest,                                       │ │
│  │  }                                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│           ↓                                                          │
│  RENDER ENGINE                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  render(RuntimeSnapshot) → HTML                                │ │
│  │                                                                 │ │
│  │  Per section (in order):                                       │ │
│  │  1. SectionRenderer.match(type) → renderer                     │ │
│  │  2. Apply Layout (Flex/Grid/Stack/Absolute)                    │ │
│  │  3. Apply Constraints (Left/Right/Top/Bottom/Stretch)          │ │
│  │  4. Apply Theme (colors from tokens)                           │ │
│  │  5. Apply Responsive (breakpoint-specific props)               │ │
│  │  6. Apply GlobalStyles (H1 style, Button style)                │ │
│  │  7. Attach Data (variables, collections)                       │ │
│  │  8. Attach Interactions (data attributes)                      │ │
│  │  9. Attach Animations (CSS classes, WAAPI)                     │ │
│  │  10. Generate HTML + CSS-in-JS / CSS modules                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│           ↓                                                          │
│  HYDRATION                                                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  hydrate(HTML) → Interactive Page                              │ │
│  │                                                                 │ │
│  │  Server-side (SSR):                                            │ │
│  │  - Render pełnego HTML                                         │ │
│  │  - Inline critical CSS                                         │ │
│  │  - Serialize RuntimeSnapshot w <script>                         │ │
│  │                                                                 │ │
│  │  Client-side:                                                   │ │
│  │  1. Parse HTML → DOM                                           │ │
│  │  2. Hydrate React/Vanilla components                           │ │
│  │  3. Activate Interactions (event listeners)                    │ │
│  │  4. Activate Animations (IntersectionObserver)                 │ │
│  │  5. Activate Responsive (matchMedia listeners)                 │ │
│  │  6. Activate Lazy Loading (IntersectionObserver)               │ │
│  │  7. Connect Analytics                                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│           ↓                                                          │
│  RUNTIME EVENTS                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Event system — użytkownik wchodzi w interakcję               │ │
│  │                                                                 │ │
│  │  User click → event system →                                    │ │
│  │  1. Match Interaction: "When click → open modal"               │ │
│  │  2. Execute actions: open modal                                │ │
│  │  3. Check conditions: "Only if user is logged in"              │ │
│  │  4. Track: send analytics event                                │ │
│  │                                                                 │ │
│  │  User scroll → event system →                                  │ │
│  │  1. Match Interaction: "When scroll progress > 50% → animate"  │ │
│  │  2. Start animation                                            │ │
│  │  3. Track: "User saw 50% of page"                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│           ↓                                                          │
│  PUBLISH ENGINE                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  publish(RuntimeSnapshot) → CDN Deployment                      │ │
│  │                                                                 │ │
│  │  Steps:                                                         │ │
│  │  1. Full render (SSR) → HTML pages                             │ │
│  │  2. Optimize assets (WebP, AVIF, minify)                       │ │
│  │  3. Generate sitemap.xml                                        │ │
│  │  4. Generate robots.txt                                         │ │
│  │  5. Generate rss.xml (if blog)                                  │ │
│  │  6. Deploy to CDN (Cloudflare / Vercel / AWS)                  │ │
│  │  7. Invalidate cache                                            │ │
│  │  8. Post-deploy webhook                                         │ │
│  │  9. Notify user ("Your site is live!")                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│           ↓                                                          │
│  CDN                                                                  │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Edge — globalna dystrybucja                                   │ │
│  │                                                                 │ │
│  │  - Static HTML (SSR) → Edge Cache                              │ │
│  │  - Assets (images, fonts, JS) → Edge CDN                       │ │
│  │  - API (forms, auth, data) → Edge Functions                    │ │
│  │  - Revalidation: on publish / on schedule / on demand          │ │
│  │  - TTL: 1 hour (HTML), 1 year (assets with hash)               │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Execution Order

Per-section rendering order:

```
FOR EACH SECTION:

  1. Layout Engine
     └── Compute display: flex | grid | stack | absolute
     └── Apply grid template (columns, rows)
     └── Compute children positions

  2. Constraint Engine
     └── Apply Left / Right / Top / Bottom / Center / Stretch
     └── Compute absolute position from parent
     └── Responsive constraints per breakpoint

  3. Theme Engine
     └── Resolve Design Tokens → CSS Custom Properties
     └── --primary → #7c3aed
     └── --font-body → Inter

  4. Responsive Engine
     └── Apply breakpoint-specific props
     └── Hide/show elements per breakpoint
     └── Switch layout (stack on mobile)

  5. Global Styles
     └── Resolve H1, H2, Paragraph, Button styles
     └── Override section-specific styles

  6. Data Resolution
     └── Resolve Variables: {{store.name}} → "WEB FACTOR"
     └── Resolve Collections: {{products}} → [...items]
     └── Repeat template for each item

  7. Animation Engine
     └── Entrance animations (fade, slide, scale)
     └── Scroll animations (parallax, reveal)
     └── Continuous animations (floating, rotate)

  8. Interaction Engine
     └── Attach data attributes
     └── Register event listeners
     └── Wire conditions

  9. Asset Resolution
     └── Image optimization (srcset, sizes)
     └── Lazy loading attributes
     └── Font loading strategy

  10. SEO & Accessibility
      └── Heading structure validation
      └── Alt texts
      └── ARIA labels
      └── Meta tags
```

---

## 4. Component Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPONENT LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SSR (Server-Side Render)                                          │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  1. create(props, context) → element descriptor                │ │
│  │  2. resolveProps(props, theme, responsive, data)               │ │
│  │  3. renderToHTML(element) → string                             │ │
│  │  4. extractCSS(element) → string                               │ │
│  │  5. extractInteractions(element) → JSON                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│           ↓                                                          │
│  HYDRATE (Client-Side)                                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  1. hydrate(element, domNode) → active component               │ │
│  │  2. attachEventListeners(interactions)                         │ │
│  │  3. attachAnimations(animations)                               │ │
│  │  4. startLazyLoading(images)                                   │ │
│  │  5. connectReactivity(data)                                    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│           ↓                                                          │
│  UPDATE (Client-Side, reactive)                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  1. receiveUpdate(props, context)                              │ │
│  │  2. diffProps(old, new) → changed                             │ │
│  │  3. patchDOM(changed)                                          │ │
│  │  4. rerunInteractions()                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│           ↓                                                          │
│  DESTROY (Client-Side)                                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  1. removeEventListeners()                                     │ │
│  │  2. cancelAnimations()                                         │ │
│  │  3. cleanupReactivity()                                        │ │
│  │  4. removeDOM()                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Flow

### 5.1 Variable Resolution

```typescript
// Krok 1: Compile — resolve all {{variable}} references

function resolveVariables(
  doc: BuilderDocument,
  variables: VariableStore
): CompiledDocument {
  const compiled = compile(doc);
  
  for (const page of compiled.pages) {
    for (const section of page.sections) {
      for (const [key, value] of Object.entries(section.props)) {
        if (typeof value === 'string' && value.includes('{{')) {
          section.props[key] = resolveTemplateString(value, variables);
        }
      }
    }
  }
  
  return compiled;
}

function resolveTemplateString(
  template: string,
  variables: Record<string, any>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const path = key.trim().split('.');
    let value = variables;
    for (const segment of path) {
      value = value?.[segment];
    }
    return value !== undefined ? String(value) : match;
  });
}
```

### 5.2 Collection Resolution

```typescript
// Krok 2: Compile — resolve collections into repeated sections

function resolveCollections(
  compiled: CompiledDocument,
  collections: CollectionStore
): CompiledDocument {
  const resolvedPages: CompiledPage[] = [];
  
  for (const page of compiled.pages) {
    const resolvedSections: CompiledSection[] = [];
    
    for (const section of page.sections) {
      if (section.type === 'collection.list') {
        // Expand collection into multiple sections
        const collectionId = section.props.collectionId;
        const items = collections[collectionId]?.items ?? [];
        const template = section.props.templateId;
        
        for (const item of items) {
          const expandedSection = {
            ...section,
            id: `${section.id}_${item.id}`,
            props: resolveTemplateProps(section.props, item),
          };
          resolvedSections.push(expandedSection);
        }
      } else {
        resolvedSections.push(section);
      }
    }
    
    resolvedPages.push({ ...page, sections: resolvedSections });
  }
  
  return { ...compiled, pages: resolvedPages };
}
```

### 5.3 Responsive Resolution

```typescript
// Krok 3: Render — resolve responsive values for active breakpoint

function resolveResponsiveProps(
  section: CompiledSection,
  breakpoint: 'DESKTOP' | 'TABLET' | 'MOBILE'
): Record<string, any> {
  const resolved = { ...section.props };
  
  // Responsive props have format: { desktop: val, tablet: val, mobile: val }
  for (const [key, value] of Object.entries(section.props)) {
    if (isResponsiveValue(value)) {
      resolved[key] = value[breakpoint.toLowerCase()] ?? value.desktop;
    }
  }
  
  return resolved;
}
```

### 5.4 Theme Resolution

```typescript
// Krok 4: Render — apply design tokens as CSS custom properties

function generateThemeCSS(theme: ResolvedTheme): string {
  return `
    :root {
      --color-primary: ${theme.primaryColor};
      --color-secondary: ${theme.secondaryColor};
      --color-accent: ${theme.accentColor};
      --color-background: ${theme.backgroundColor};
      --color-surface: ${theme.surfaceColor};
      --color-text: ${theme.textColor};
      --color-border: ${theme.borderColor};
      --color-success: ${theme.successColor};
      --color-warning: ${theme.warningColor};
      --color-danger: ${theme.dangerColor};
      
      --font-body: ${theme.fontBody};
      --font-heading: ${theme.fontHeading};
      
      --spacing-xs: ${theme.spacing.xs};
      --spacing-sm: ${theme.spacing.sm};
      --spacing-md: ${theme.spacing.md};
      --spacing-lg: ${theme.spacing.lg};
      --spacing-xl: ${theme.spacing.xl};
      
      --radius-sm: ${theme.borderRadius.sm};
      --radius-md: ${theme.borderRadius.md};
      --radius-lg: ${theme.borderRadius.lg};
      
      --shadow-sm: ${theme.shadows.sm};
      --shadow-md: ${theme.shadows.md};
      --shadow-lg: ${theme.shadows.lg};
    }
  `;
}
```

### 5.5 Interaction Resolution

```typescript
// Krok 5: Render — attach interaction data attributes

function attachInteractions(
  html: string,
  interactions: CompiledInteraction[]
): string {
  // Add data-* attributes for runtime interaction system
  const interactionData = interactions.map(int => ({
    trigger: int.trigger,
    actions: int.actions,
    conditions: int.conditions,
  }));
  
  return html.replace(
    'data-section="true"',
    `data-interactions='${JSON.stringify(interactionData)}' data-section="true"`
  );
}
```

---

## 6. Cache Strategy

### 6.1 Build Cache

```typescript
// Cache compiled snapshots to avoid recompilation
interface BuildCache {
  snapshotId: string;          // hash of BuilderDocument version
  compiledSnapshot: RuntimeSnapshot;
  cachedAt: number;
  ttl: number;                 // ms
}

function getCachedSnapshot(doc: BuilderDocument): RuntimeSnapshot | null {
  const hash = hashDocument(doc);
  const cached = buildCache.get(hash);
  
  if (cached && Date.now() - cached.cachedAt < cached.ttl) {
    return cached.compiledSnapshot;
  }
  
  return null;
}
```

### 6.2 Render Cache

```typescript
// Cache rendered HTML per page + breakpoint
interface RenderCache {
  pageId: string;
  breakpoint: string;
  html: string;
  cachedAt: number;
}

// Invalidated on publish
```

### 6.3 CDN Cache

```
HTML:       TTL 1h, purge on publish
Assets:     TTL 1y (immutable with content hash)
API:        TTL 5min (or no cache for dynamic data)
Images:     TTL 30d, transform on-the-fly (WebP, AVIF, resize)
```

---

## 7. Lazy Loading

### 7.1 Section-level lazy loading

```typescript
interface LazyLoadConfig {
  enabled: boolean;
  strategy: 'INTERSECTION' | 'SCROLL' | 'CLICK' | 'IMMEDIATE';
  threshold: number;            // 0.0 – 1.0 (IntersectionObserver threshold)
  rootMargin: string;           // "200px" (load before visible)
  placeholder: 'BLUR' | 'COLOR' | 'SKELETON' | 'NONE';
  fallback?: string;            // HTML before load
}
```

### 7.2 Automatic lazy detection

```typescript
function shouldLazyLoad(section: CompiledSection): boolean {
  // Sekcje below the fold → auto lazy
  if (section.order > 2) return true;
  
  // Sekcje z ciężkimi assetami → lazy
  if (hasHeavyAssets(section)) return true;
  
  // Sekcje oznaczone przez użytkownika
  if (section.props.lazyLoad === true) return true;
  
  return false;
}
```

---

## 8. SSR vs CSR

| Kryterium | SSR | CSR |
|-----------|-----|-----|
| Render | Server | Client |
| HTML | Full | Minimal |
| SEO | ✅ | ❌ (bez dodatków) |
| FCP | ⚡ Fast | 🐢 Slow |
| TTI | 🐢 Slower | ⚡ Fast |
| Use case | Public pages | Dashboards |
| Default | ✅ Studio pages | ⬜ Admin panels |

```typescript
// Auto-detection w publish
function getRenderStrategy(page: CompiledPage): 'SSR' | 'CSR' {
  // Public pages → SSR
  if (page.seo?.robots !== 'noindex') return 'SSR';
  
  // Admin/authenticated → CSR
  return 'CSR';
}
```

---

## 9. Plugin API Extensions

```typescript
// Pluginy mogą rozszerzać każdy krok pipeline'u

interface RuntimePlugin {
  // Compile phase
  beforeCompile?: (doc: BuilderDocument) => BuilderDocument;
  afterCompile?: (compiled: CompiledDocument) => CompiledDocument;
  
  // Render phase
  beforeRender?: (snapshot: RuntimeSnapshot) => RuntimeSnapshot;
  afterRender?: (html: string, section: CompiledSection) => string;
  
  // Hydration phase
  onHydrate?: (element: HTMLElement, section: CompiledSection) => void;
  onDestroy?: (element: HTMLElement) => void;
  
  // Publish phase
  beforePublish?: (snapshot: RuntimeSnapshot) => RuntimeSnapshot;
  afterPublish?: (deployment: DeploymentResult) => void;
}
```

---

## 10. Error Handling

```
Compile Error → 
  - Log error
  - Return previous valid snapshot
  - Notify user: "Compile failed, changes not saved"

Render Error →
  - Skip section
  - Render fallback (empty div + error message in preview)
  - Log error for debugging

Runtime Error →
  - Catch in error boundary
  - Isolate to section (nie psuje całej strony)
  - Log + optional: notify user

Publish Error →
  - Rollback to previous deployment
  - Notify user
  - Show error details
```

---

## 11. Security

```typescript
// XSS prevention
function sanitizeProps(props: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHTML(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// CSRF via signed tokens
// Rate limiting on forms
// Content Security Policy in HTML
```

---

## 12. Pliki

```
packages/runtime-core/src/
├── RuntimePipeline.ts            — główny pipeline
├── Compiler.ts                   — BuilderDocument → RuntimeSnapshot
├── Renderer.ts                   — RuntimeSnapshot → HTML
├── Hydrator.ts                   — HTML → Interactive Page
├── Resolver.ts                   — Variables + Collections resolver
├── ThemeEngine.ts                — Design Tokens → CSS
├── ResponsiveEngine.ts           — breakpoint resolution
├── AnimationEngine.ts            — animation attachment
├── InteractionEngine.ts          — interaction attachment
├── LayoutEngine.ts               — layout computation
├── ConstraintEngine.ts           — constraint computation
├── CacheService.ts               — build + render cache
├── LazyLoadService.ts            — lazy loading strategy
├── RenderStrategy.ts             — SSR vs CSR
├── ErrorBoundary.ts              — error handling
├── SecurityService.ts            — sanitization
└── PluginService.ts              — plugin extensions

packages/publish-core/src/
├── PublishPipeline.ts            — deploy pipeline
├── AssetOptimizer.ts             — WebP, AVIF, minify
├── SEOGenerator.ts               — sitemap, robots, OG
└── CacheInvalidator.ts           — CDN cache purge
```

