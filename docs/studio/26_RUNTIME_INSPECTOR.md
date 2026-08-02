# C16.26 — WEB FACTOR Studio Runtime Inspector

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 26_RUNTIME_INSPECTOR.md  
> **Status:** Draft  
> **Zależności:** 03_CANVAS_ENGINE.md, 07_INSPECTOR.md, 15_PERFORMANCE.md

---

## 1. Cel

Runtime Inspector to panel, który pokazuje metryki wydajności, SEO, accessibility i runtime dla każdej sekcji na stronie. To jest funkcja, której nie ma Wix Studio ani Framer — i może być kluczową przewagą dla profesjonalnych użytkowników.

---

## 2. Koncepcja

```
Klikasz sekcję → w Inspectorze widzisz zakładkę "Runtime" (obok "Properties"):

┌──────────────────────────────────────────────────────┐
│  RUNTIME                                              │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ▼ PERFORMANCE                                       │
│  Render Time:    12ms        ● ● ● ○ ○ ○           │
│  Hydration:      8ms         ● ● ● ● ○ ○           │
│  Total:          20ms        ● ● ● ● ○ ○           │
│  Re-renders:     3           ● ● ● ● ● ○           │
│                                                      │
│  ▼ BUNDLE                                            │
│  JS Bundle:      4.2 KB     ● ● ● ● ● ●            │
│  CSS:            1.1 KB     ● ● ● ● ● ●            │
│  Images:         2 assets   ● ● ● ● ● ○            │
│  Lazy Loaded:    Yes        ✓                        │
│                                                      │
│  ▼ SEO                                               │
│  SEO Score:      92/100     ● ● ● ● ● ○            │
│  Heading Order:  ✓ H1 → H2                          │
│  Alt Texts:      2/2 ✓                              │
│  Meta Desc:      ✓ Exists                           │
│  Open Graph:     ✓ Complete                         │
│  Canonical:      ✓ Set                              │
│                                                      │
│  ▼ ACCESSIBILITY                                     │
│  A11y Score:     85/100     ● ● ● ● ○ ○            │
│  ARIA Labels:    3/3 ✓                              │
│  Contrast:       ✓ Pass                             │
│  Keyboard Nav:   ✓ Works                            │
│  Screen Reader:  ✓ Tested                           │
│                                                      │
│  ▼ WEB VITALS                                       │
│  LCP:            1.2s       ● ● ● ● ● ●            │
│  CLS:            0.02       ● ● ● ● ● ●            │
│  INP:            40ms       ● ● ● ● ● ●            │
│  FCP:            0.8s       ● ● ● ● ● ●            │
│  TTFB:           120ms      ● ● ● ● ● ●            │
│                                                      │
│  ▼ RECOMMENDATIONS                                   │
│  ⚠ Hero image could be optimized to WebP            │
│    (saves ~120KB)                                    │
│  ⚠ Add lazy loading to Gallery images               │
│    (improves LCP by ~0.3s)                           │
│  ✓ All headings are in correct order                 │
│  ✓ ARIA labels properly set                          │
│                                                      │
│  [Run Full Audit] [Export Report]                    │
└──────────────────────────────────────────────────────┘
```

---

## 3. Metryki

### 3.1 Performance

```typescript
interface PerformanceMetrics {
  // Render
  renderTime: number;         // ms
  hydrationTime: number;      // ms
  totalTime: number;          // render + hydration
  
  // Bundle
  jsSize: number;             // bytes
  cssSize: number;            // bytes
  imageCount: number;
  imageTotalSize: number;     // bytes
  isLazyLoaded: boolean;
  isHydrated: boolean;
  
  // Runtime
  reRenderCount: number;
  domNodes: number;
  eventListeners: number;
}
```

### 3.2 SEO

```typescript
interface SEOMetrics {
  score: number;              // 0-100
  
  // Structure
  hasH1: boolean;
  hasH2: boolean;
  headingOrder: 'CORRECT' | 'WRONG' | 'MISSING';
  headingText: string[];
  
  // Images
  totalImages: number;
  imagesWithAlt: number;
  imagesMissingAlt: number;
  
  // Meta
  hasMetaDescription: boolean;
  metaDescriptionLength: number;
  hasOpenGraph: boolean;
  ogImageExists: boolean;
  ogTitleExists: boolean;
  ogDescriptionExists: boolean;
  
  // Technical
  hasCanonical: boolean;
  hasRobotsMeta: boolean;
  hasSchemaMarkup: boolean;
  hasSitemap: boolean;
  
  // Content
  textToHtmlRatio: number;     // %
  wordCount: number;
  readabilityScore: number;    // 0-100
}
```

### 3.3 Accessibility

```typescript
interface AccessibilityMetrics {
  score: number;              // 0-100
  
  // ARIA
  totalARIALabels: number;
  missingARIALabels: number;
  
  // Contrast
  contrastPassRatio: number;   // pass rate %
  failedContrasts: Array<{ element: string; ratio: number }>;
  
  // Keyboard
  keyboardNavigable: boolean;
  focusVisible: boolean;
  skipLinkExists: boolean;
  
  // Screen Reader
  screenReaderTested: boolean;
  hasAltTexts: boolean;
  hasFormLabels: boolean;
  hasLiveRegion: boolean;
  
  // WCAG
  wcagLevel: 'A' | 'AA' | 'AAA' | 'FAIL';
  violations: WCAGViolation[];
}

interface WCAGViolation {
  rule: string;               // "WCAG 1.1.1"
  description: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  element: string;
  recommendation: string;
}
```

### 3.4 Web Vitals

```typescript
interface WebVitalMetrics {
  LCP: {                    // Largest Contentful Paint
    value: number;           // ms
    rating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
    element: string;         // który element
  };
  
  CLS: {                    // Cumulative Layout Shift
    value: number;           // score
    rating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
    sources: string[];       // które elementy powodują shift
  };
  
  INP: {                    // Interaction to Next Paint
    value: number;           // ms
    rating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
  };
  
  FCP: {                    // First Contentful Paint
    value: number;           // ms
    rating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
  };
  
  TTFB: {                   // Time to First Byte
    value: number;           // ms
    rating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
  };
}
```

---

## 4. Generowanie metryk

### 4.1 Runtime Metrics (w iframe)

```typescript
// PreviewRuntime zbiera metryki i wysyła do Buildera

interface RuntimeMetricsMessage {
  messageType: 'RUNTIME_METRICS';
  sectionId: string;
  metrics: PerformanceMetrics;
}

// W iframe:
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'largest-contentful-paint') {
      // LCP
    }
  }
});
observer.observe({ type: 'largest-contentful-paint', buffered: true });
```

### 4.2 SEO Analysis (server-side)

```typescript
// Po compile(), analizuj SEO
async function analyzeSEO(compiledDoc: CompiledDocument): Promise<SEOMetrics> {
  const page = compiledDoc.pages[0];
  
  // Sprawdź czy jest H1
  const hasH1 = page.sections.some(s => 
    s.props.headingLevel === 'H1' || s.type === 'hero'
  );
  
  // Sprawdź alt texty
  const images = page.sections.filter(s => 
    ['image', 'gallery', 'hero'].includes(s.type)
  );
  const withAlt = images.filter(s => s.props.alt);
  const missingAlt = images.filter(s => !s.props.alt);
  
  return {
    score: calculateSEOScore({ hasH1, imagesWithAlt: withAlt.length, ... }),
    // ...
  };
}
```

### 4.3 Accessibility Audit (axe-core)

```typescript
// Użyj axe-core do analizy accessibility
async function runA11yAudit(html: string): Promise<AccessibilityMetrics> {
  const results = await axe.run(html);
  
  return {
    score: 100 - (results.violations.length * 10),
    violations: results.violations.map(v => ({
      rule: v.id,
      description: v.description,
      severity: v.impact,
      element: v.nodes[0]?.target?.toString() ?? '',
      recommendation: v.help,
    })),
    // ...
  };
}
```

---

## 5. Auto-fix

```typescript
// Runtime Inspector może sugerować i automatycznie naprawiać problemy

interface AutoFixAction {
  type: 'ADD_ALT' | 'FIX_HEADING' | 'ADD_ARIA' | 'OPTIMIZE_IMAGE' | 'ADD_LAZY';
  description: string;
  command: BuilderCommand;      // komenda do wykonania
}

function suggestFixes(metrics: AllMetrics): AutoFixAction[] {
  const fixes: AutoFixAction[] = [];
  
  if (metrics.seo.imagesMissingAlt > 0) {
    fixes.push({
      type: 'ADD_ALT',
      description: 'Dodaj alt text dla obrazków',
      command: { type: 'UPDATE_PROPS', ... },
    });
  }
  
  if (metrics.performance.imageTotalSize > 100000) {
    fixes.push({
      type: 'OPTIMIZE_IMAGE',
      description: 'Zoptymalizuj obrazki (WebP)',
      command: { type: 'OPTIMIZE_ASSETS', ... },
    });
  }
  
  return fixes;
}
```

---

## 6. Pliki

```
packages/builder-core/src/
├── RuntimeMetrics.ts           — typy metryk
├── SEOAnalyzer.ts              — analiza SEO
├── A11yAnalyzer.ts             — analiza accessibility
├── PerformanceAnalyzer.ts      — analiza performance
└── WebVitalsCollector.ts       — kolektor Web Vitals

src/components/builder/runtime/
├── RuntimeInspectorPanel.tsx   — główny panel
├── PerformanceSection.tsx      — sekcja performance
├── SEOSection.tsx              — sekcja SEO
├── A11ySection.tsx             — sekcja accessibility
├── WebVitalsSection.tsx        — sekcja Web Vitals
├── RecommendationsSection.tsx  — rekomendacje i auto-fix
├── AuditRunner.tsx             — runner audytu
└── hooks/
    └── useRuntimeMetrics.ts    — hook do metryk
```

