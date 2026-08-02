# C16.16 — WEB FACTOR Studio Plugin API

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 16_PLUGIN_API.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 08_COMPONENT_SYSTEM.md

---

## 1. Cel

Plugin API umożliwia zewnętrznym deweloperom rozszerzanie Studio o własne:
- Komponenty i bloki
- Paneli UI
- Integracje z zewnętrznymi serwisami
- Automatyzacje i workflowy
- Eksportery i transformery

---

## 2. Architektura pluginów

```
┌────────────────────────────────────────────────────────────┐
│                      STUDIO CORE                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   Plugin Registry                     │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌───────────────┐  │  │
│  │  │ Component   │ │  Panel      │ │  Integration  │  │  │
│  │  │ Plugins     │ │  Plugins    │ │  Plugins      │  │  │
│  │  └─────────────┘ └─────────────┘ └───────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│              │                    │                          │
│              ▼                    ▼                          │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ ComponentRegistry│  │  Extension Points│                │
│  └──────────────────┘  └──────────────────┘                │
│              │                    │                          │
│              ▼                    ▼                          │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Renderer        │  │  UI Slots        │                │
│  └──────────────────┘  └──────────────────┘                │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Plugin Manifest

```typescript
interface PluginManifest {
  id: string;                    // unikalne ID: "wf.analytics"
  name: string;                  // "WEB FACTOR Analytics"
  description: string;           // "Google Analytics 4 integration"
  version: string;               // semver: "1.0.0"
  author: string;                // "WEB FACTOR"
  icon: string;                  // ikona Lucide lub URL
  
  // Minimal engine version
  studioVersion: string;         // ">=2.0.0"
  
  // Permissions
  permissions: PluginPermission[];
  
  // Entry points
  components?: PluginComponent[];
  panels?: PluginPanel[];
  integrations?: PluginIntegration[];
  commands?: PluginCommand[];
  hooks?: PluginHook[];
  
  // Settings schema
  settingsSchema?: PropSchema[];
  
  // Bundle
  entry: string;                 // główny plik JS
  styles?: string;               // opcjonalny CSS
}

type PluginPermission = 
  | 'DOCUMENT_READ'
  | 'DOCUMENT_WRITE'
  | 'ASSETS_READ'
  | 'ASSETS_WRITE'
  | 'API_CALL'                  // wykonywanie fetch
  | 'STORAGE'                   // localStorage / IndexedDB
  | 'NOTIFICATIONS';
```

---

## 4. Extension Points

### 4.1 Component Plugins

```typescript
interface PluginComponent {
  type: string;                  // "plugin.analytics.chart"
  descriptor: ComponentDescriptor;
  renderer: (props: any) => JSX.Element;  // React component
}

// Rejestracja:
registry.register({
  type: 'plugin.analytics.chart',
  label: 'Analytics Chart',
  category: 'Plugin',
  icon: 'BarChart3',
  schema: [
    selectProp({
      key: 'chartType',
      label: 'Chart Type',
      options: [
        { label: 'Bar', value: 'bar' },
        { label: 'Line', value: 'line' },
        { label: 'Pie', value: 'pie' },
      ],
    }),
  ],
  defaultProps: { chartType: 'bar' },
  allowChildren: false,
  tags: ['analytics', 'chart', 'data'],
  previewable: true,
  version: '1.0.0',
  author: 'Analytics Plugin',
});
```

### 4.2 Panel Plugins

```typescript
interface PluginPanel {
  id: string;                    // "analytics-panel"
  label: string;                 // "Analytics"
  icon: string;                  // "BarChart3"
  position: 'LEFT_SIDEBAR' | 'RIGHT_SIDEBAR' | 'BOTTOM' | 'MODAL';
  component: React.ComponentType<PanelProps>;
}

interface PanelProps {
  document: BuilderDocument;
  selectedSection: SectionNode | null;
  dispatch: (command: BuilderCommand) => void;
  assets: Asset[];
  theme: BuilderTheme;
  onClose: () => void;
}

// Przykład: Panel analityczny
function AnalyticsPanel({ document, theme }: PanelProps) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/analytics/pageviews').then(setData);
  }, []);
  
  return (
    <div>
      <h2>Page Views</h2>
      <Chart data={data} />
    </div>
  );
}
```

### 4.3 Integration Plugins

```typescript
interface PluginIntegration {
  id: string;                    // "google-analytics"
  name: string;                  // "Google Analytics 4"
  provider: string;              // "google"
  
  // Setup flow
  setupSteps: IntegrationStep[];
  
  // Hooks
  onPublish?: (doc: CompiledDocument) => Promise<void>;
  onSave?: (doc: BuilderDocument) => Promise<void>;
  onPreview?: (doc: BuilderDocument) => Promise<void>;
}

interface IntegrationStep {
  id: string;
  label: string;
  component: React.ComponentType<StepProps>;
}
```

### 4.4 Command Plugins

```typescript
interface PluginCommand {
  id: string;                    // "analytics.export"
  label: string;                 // "Export Analytics Data"
  icon: string;                  // "Download"
  shortcut?: string;             // "Ctrl+Shift+A"
  execute: (context: PluginContext) => Promise<void>;
}
```

### 4.5 Hook Plugins

```typescript
type PluginHook = 
  | { event: 'DOCUMENT_SAVED'; handler: (doc: BuilderDocument) => void }
  | { event: 'SECTION_ADDED'; handler: (section: SectionNode) => void }
  | { event: 'SECTION_REMOVED'; handler: (sectionId: string) => void }
  | { event: 'PROP_UPDATED'; handler: (sectionId: string, key: string, value: any) => void }
  | { event: 'PAGE_ADDED'; handler: (page: BuilderPage) => void }
  | { event: 'PUBLISHING'; handler: (doc: CompiledDocument) => void }
  | { event: 'PUBLISHED'; handler: (url: string) => void }
  | { event: 'CANVAS_READY'; handler: () => void };
```

---

## 5. Plugin Context API

```typescript
interface PluginContext {
  // Core
  document: BuilderDocument;
  dispatch: (command: BuilderCommand) => void;
  
  // Canvas
  canvas: CanvasState;
  selectedSection: SectionNode | null;
  
  // Assets
  assets: AssetManager;
  
  // Theme
  theme: BuilderTheme;
  
  // UI
  notifications: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
  };
  
  // HTTP
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
  
  // Storage
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
}
```

---

## 6. Marketplace Distribution

```typescript
interface MarketplacePlugin {
  manifest: PluginManifest;
  ratings: {
    average: number;
    count: number;
  };
  downloads: number;
  installs: number;
  price: number;                // 0 = free
  revenue?: string;             // "subscription" | "one-time" | "free"
  screenshots: string[];
  documentation: string;
  support: string;
  lastUpdated: string;
}
```

### 6.1 Installation flow

```
1. User znajduje plugin w Marketplace
2. Klik "Install"
3. Pobranie manifestu + sprawdzenie wersji
4. Confirmation dialog (permissions)
5. Pobranie bundle (JS + CSS)
6. Rejestracja w PluginRegistry
7. Plugin dostępny w Studio
```

---

## 7. Security

```typescript
// Plugin sandbox
// Plugins działają w izolowanym środowisku:
// - Osobny iframe dla paneli (opcjonalnie)
// - Ograniczony dostęp do API
// - Rate limiting
// - Content Security Policy

interface PluginSecurity {
  sandbox: boolean;
  maxCallsPerMinute: number;
  allowedOrigins: string[];
  contentSecurityPolicy: string;
  requiresConsent: boolean;     // GDPR
}
```

---

## 8. Implementacja

### 8.1 Pliki

```
packages/plugin-system/
├── src/
│   ├── PluginRegistry.ts       — rejestr pluginów
│   ├── PluginLoader.ts         — ładowanie pluginów
│   ├── PluginSandbox.ts        — sandbox
│   ├── PluginContext.ts        — kontekst dla pluginów
│   ├── PluginPermissions.ts    — zarządzanie uprawnieniami
│   ├── PluginValidator.ts      — walidacja manifestu
│   └── types.ts                — typy

src/components/builder/plugins/
├── PluginManager.tsx           — zarządzanie pluginami
├── PluginCard.tsx              — karta pluginu
├── PluginMarketplace.tsx       — marketplace
├── PluginSettings.tsx          — ustawienia pluginu
└── PluginSandboxFrame.tsx      — iframe sandbox
```

