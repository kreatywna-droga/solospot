# C16.15 — WEB FACTOR Studio Performance

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 15_PERFORMANCE.md  
> **Status:** Draft  
> **Zależności:** 03_CANVAS_ENGINE.md, 07_INSPECTOR.md, 08_COMPONENT_SYSTEM.md

---

## 1. Cele wydajnościowe

| Miernik | Target | Mierzony |
|---------|--------|----------|
| Time to Interactive (Studio UI) | < 2s | First paint → gotowy do edycji |
| Time to First Preview | < 1s | compile() + iframe render |
| Prop edit → preview update | < 50ms | dispatch → PreviewChannel → iframe re-render |
| History stack memory | < 50MB | 100 snapshotów |
| Component Panel scroll (1000+) | 60fps | Virtual scroll |
| Drag & drop response | < 16ms (60fps) | RequestAnimationFrame |
| Canvas zoom/pan | 60fps | GPU compositing |
| Bundle size (initial) | < 200KB gzip | Code splitting |
| Memory usage (typical session) | < 200MB | Heap snapshot |

---

## 2. Strategie optymalizacji

### 2.1 Code Splitting

```typescript
// Lazy loading modułów
const BuilderCanvas = dynamic(() => import('./canvas/BuilderCanvas'), {
  loading: () => <CanvasSkeleton />,
  ssr: false,
});

const InspectorPanel = dynamic(() => import('./inspector/InspectorPanel'), {
  loading: () => <InspectorSkeleton />,
});

const AIPanel = dynamic(() => import('./ai/AIPanel'), {
  loading: () => null,
  ssr: false,
});
```

### 2.2 Virtual Scrolling

```typescript
// ComponentPanel z 1000+ komponentami
// react-window lub @tanstack/virtual

function ComponentVirtualList({ items }: { items: ComponentDescriptor[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,  // 72px na kartę
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map(virtualItem => (
          <ComponentCard
            key={items[virtualItem.index].type}
            descriptor={items[virtualItem.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### 2.3 Preview Performance

```typescript
// Optymalizacja preview w iframe

// 1. Tylko różnicowe update
function sendPreviewUpdate(doc: BuilderDocument, prevDoc?: BuilderDocument) {
  if (prevDoc) {
    const diff = computeDiff(prevDoc, doc);
    // Wyślij tylko zmienione sekcje
    diff.changedSections.forEach(section => {
      preview.send(createSectionUpdate(section.pageId, section.id, section.props));
    });
  } else {
    // Pełny update tylko przy pierwszym razie
    preview.send(createDocumentUpdate(doc));
  }
}

// 2. Debounce fast edits
function debouncePreviewUpdate(doc: BuilderDocument) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    sendPreviewUpdate(doc, lastSentDoc);
    lastSentDoc = doc;
  }, 16); // ~60fps
}

// 3. Batch updates
function batchPreviewUpdates(updates: SectionUpdateMessage[]) {
  if (updates.length > 1) {
    preview.send({
      messageType: 'BATCH_SECTION_UPDATE',
      updates,
    });
  }
}
```

### 2.4 Immutable Updates

```typescript
// BuilderContext używa immutable update pattern
// Dzięki temu React może szybko porównywać referencje

const [ctx, setCtx] = useState<BuilderContext>(initialCtx);

const dispatch = useCallback((command: BuilderCommand) => {
  setCtx(prev => prev.dispatch(command));
}, []);

// React.memo na komponentach
const SectionBlock = React.memo(({ node, isSelected }: SectionBlockProps) => {
  // Renderuje się tylko gdy node lub isSelected się zmieni
});
```

### 2.5 Canvas Optimization

```typescript
// 1. Canvas używa transform zamiast top/left
// GPU compositing zamiast layout thrashing

// 2. Selection overlay jest w osobnej warstwie
.overlay {
  position: absolute;
  pointer-events: none;
  transform: translate3d(x, y, 0);
  will-change: transform;
}

// 3. Grid overlay renderuje się tylko gdy włączony
// 4. iframe ma lazyload (nie ładuje się dopóki nie jest potrzebny)
```

---

## 3. Bundle Size

### 3.1 Current bundle

| Pakiet | Size (gzip) |
|--------|-------------|
| builder-core | ~15KB |
| builder-ui (Canvas) | ~25KB |
| builder-ui (Inspector) | ~20KB |
| builder-ui (Panel) | ~15KB |
| builder-ui (AI) | ~10KB |
| UI library (lucide, framer) | ~30KB |
| **Total** | **~115KB** |

### 3.2 Code splitting strategy

```
Route: /studio/[storeId]
├── BuilderApp (shell)              - 15KB
├── CanvasModule (dynamic)          - 25KB
│   ├── BuilderCanvas
│   ├── SelectionOverlay
│   └── PreviewFrame
├── LeftSidebar (dynamic)           - 20KB
│   ├── LayerTree
│   ├── PageList
│   ├── ComponentPanel
│   └── AssetPanel
├── InspectorModule (dynamic)       - 20KB
│   ├── InspectorPanel
│   ├── LayoutSection
│   └── fields/*
├── AnimationModule (dynamic)       - 15KB
│   └── Timeline (only if used)
├── AIAssistant (dynamic)           - 10KB
│   └── AIPanel (only if opened)
└── HistoryModule (dynamic)         - 10KB
    └── HistoryPanel (only if opened)
```

---

## 4. Memory Management

```typescript
// 1. HistoryStack limit
const MAX_HISTORY_ENTRIES = 100;
const MAX_SNAPSHOTS = 50;

// 2. History entries compress
function compressSnapshot(doc: BuilderDocument): string {
  const json = JSON.stringify(doc);
  // Użyj CompressionStream API jeśli dostępne
  return json;
  // W przyszłości: protobuf lub custom binary format
}

// 3. Cleanup starych entry
function cleanupHistory(history: HistoryStack<BuilderDocument>): HistoryStack<BuilderDocument> {
  const now = Date.now();
  const DAY_MS = 86400000;
  
  let cleaned = history;
  
  // Usuń entry starsze niż 7 dni (poza snapshotami)
  cleaned.entries
    .filter(e => now - e.timestamp > 7 * DAY_MS && !e.tags?.includes('snapshot'))
    .forEach(e => cleaned = cleaned.remove(e.id));
    
  return cleaned;
}
```

---

## 5. Network Optimization

```typescript
// 1. API calls caching
const apiCache = new Map<string, { data: any; timestamp: number }>();

async function fetchWithCache(url: string, ttlMs = 5000) {
  const cached = apiCache.get(url);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data;
  }
  
  const res = await fetch(url);
  const data = await res.json();
  apiCache.set(url, { data, timestamp: Date.now() });
  return data;
}

// 2. Save debounce
function debounceSave(doc: BuilderDocument, delay = 2000) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    compileAndSave(doc);
  }, delay);
}

// 3. Preview runtime cached in Service Worker
// iframe ładuje się z SW → instant load po pierwszym razie
```

---

## 6. Monitoring

```typescript
// Performance marks
performance.mark('studio:load:start');

// Przykładowe metryki
const metrics = {
  timeToInteractive: 0,
  previewFirstRender: 0,
  commandExecution: 0,
  historyPush: 0,
};

function measureCommand(command: BuilderCommand) {
  const start = performance.now();
  // execute command
  const duration = performance.now() - start;
  
  if (duration > 100) {
    console.warn(`Slow command: ${command.type} (${duration.toFixed(1)}ms)`);
  }
}

// Raportowanie do Mission Control
function reportPerformanceMetrics() {
  if (process.env.NODE_ENV === 'production') {
    navigator.sendBeacon('/api/telemetry/performance', JSON.stringify({
      metrics,
      timestamp: Date.now(),
      storeId: currentStoreId,
    }));
  }
}
```

---

## 7. Target Devices

| Device | RAM | CPU | Target |
|--------|-----|-----|--------|
| High-end Desktop (M3, i9) | 32GB+ | 8+ cores | ✅ 60fps |
| Mid-range Desktop (i5) | 16GB | 4 cores | ✅ 60fps |
| Low-end Laptop (i3) | 8GB | 2 cores | ✅ 30fps+ |
| High-end Tablet (iPad Pro) | 16GB | M2 | ✅ 30fps+ |
| Mid-range Tablet | 4GB | Snapdragon | ⚠️ 30fps (minimal UI) |

