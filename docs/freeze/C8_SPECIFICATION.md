# C8 Specification — Media Manager

---

## 2. Status

### C8.1-C8.4 Core — CERTIFIED ✅

Wszystkie silniki domenowe Media Managera są zaimplementowane, przetestowane i gotowe do użycia.

| Moduł | Status | Plik |
|-------|--------|------|
| Media Domain | ✅ | `AssetTypes.ts`, `AssetLibrary.ts` |
| Upload Engine | ✅ | `UploadEngine.ts` |
| Processing Pipeline | ✅ | `ProcessingPipeline.ts` |
| CDN & Storage | ✅ | `AssetStorage.ts`, `providers/LocalAssetStorage.ts`, `providers/S3AssetStorage.ts`, `providers/R2AssetStorage.ts` |

**Walidacja:**
- `tsc --noEmit` clean
- 21/21 testów `asset-manager-core` zielonych
- 142/142 testów `builder-core` + `asset-manager-core` zielonych

### C8.5-C8.8 — PENDING 🟡

UI i integracja z Builderem w trakcie implementacji.

| Moduł | Status | Plik |
|-------|--------|------|
| Media Library UI | 🟡 | `src/components/media/MediaLibrary.tsx` |
| Image Editor | 🟡 | `src/components/media/ImageEditor.tsx` |
| Builder Integration | 🟡 | `src/components/media/AssetPicker.tsx` |
| Certification (UI tests) | 🟡 | `__tests__/media-certification.test.ts` |

### C8 Production Complete — Blokery końcowe

1. [ ] Media Library UI — pełna funkcjonalność (upload, drag & drop, bulk actions)
2. [ ] Image Editor — crop, resize, rotate, flip, focus point
3. [ ] Builder Integration — AssetPicker w PropsPanel, drag & drop na canvas
4. [ ] Runtime Integration — AssetResolver w Preview Pipeline
5. [ ] E2E Tests — Playwright: Upload → Builder → Preview → Publish
6. [ ] Golden Flow — pełny flow z nowymi funkcjami C8

---

## 1. Cel

Zbudować kompletny system zarządzania zasobami multimedialnymi (obrazy, filmy, dokumenty) dla WEB FACTOR, z integracją z Builderem, Preview Pipeline, Runtime i Commerce.

**Według Product Definition:** Platforma musi obsługiwać media na poziomie profesjonalnych edytorów (Webflow, Shopify). Użytkownik może:
- Przesyłać media (drag & drop, batch)
- Organizować w folderach i kolekcjach
- Edytować zdjęcia (crop, resize, rotate)
- Używać w Buildera (przeciąganie na canvas, wybór z panelu)
- Publikować i hostować przez CDN

---

## 2. Zakres

### 2.1 W zakresie (In Scope)

| Moduł | Opis |
|-------|------|
| C8.1 Media Domain | Dokumenty, foldery, metadata, kolekcje, tagi, wyszukiwanie, uprawnienia |
| C8.2 Upload Engine | Drag & drop, batch upload, progress, retry, chunk upload, cancel, background |
| C8.3 Asset Processing | Thumbnails, WebP/AVIF, compression, EXIF, metadata, validation |
| C8.4 CDN & Storage | Local, S3, Cloudflare R2, signed URLs, cache, versioning |
| C8.5 Media Library UI | Folder tree, search, filters, grid/list, preview, bulk actions |
| C8.6 Image Editor | Crop, resize, rotate, flip, focus point |
| C8.7 Builder Integration | Asset picker w PropsPanel, drag na canvas, preview, AssetResolver |
| C8.8 Certification | Golden Flow, performance, tenant isolation, cache invalidation |

### 2.2 Poza zakresem (Out of Scope)

| Moduł | Powód |
|-------|-------|
| Video Editing | Zaawansowany — C9+ |
| AI Background Removal | Zaawansowany — C9+ |
| Collaborative Media | Wymaga WebSocket/CRDT — C9+ |

---

## 3. Architektura

### 3.1 Warstwy

```
Media UI (React components)
    │
    ▼
MediaProvider (React state + dispatch)
    │
    ▼
MediaContext (asset-manager-core)
    │
    ├── MediaDocument (immutable)
    ├── MediaCommands (mutations)
    ├── UploadEngine (upload logic)
    ├── ProcessingPipeline (thumbnails, formats)
    ├── StorageAdapter (local/S3/R2)
    └── CDNService (signed URLs, cache)
    │
    ▼
Builder Integration (AssetResolver, AssetReference)
    │
    ▼
PreviewRuntimeAdapter → PreviewPipeline → AssetResolver
```

### 3.2 Nowe kontrakty

| Export | Pakiet | Typ | Opis |
|--------|--------|-----|------|
| `MediaDocument` | `asset-manager-core` | interface | Główny model zasobów |
| `MediaFolder` | `asset-manager-core` | interface | Folder tree node |
| `MediaAsset` | `asset-manager-core` | interface | Pojedynczy asset |
| `MediaCollection` | `asset-manager-core` | interface | Kolekcja assetów |
| `UploadCommand` | `asset-manager-core` | interface | Komenda uploadu |
| `ProcessingJob` | `asset-manager-core` | interface | Job przetwarzania |
| `AssetReference` | `builder-core` | interface | Odniesienie do assetu w dokumencie |
| `AssetResolver` | `runtime-core` | interface | Rozwiązuje AssetReference na URL |
| `StorageAdapter` | `asset-manager-core` | interface | Adapter przechowywania |
| `CDNService` | `asset-manager-core` | interface | CDN operations |

---

## 4. Szczegółowy opis modułów

### 4.1 C8.1 — Media Domain

**Plik:** `packages/asset-manager-core/src/MediaDocument.ts`

**Odpowiedzialność:** Model domenowy zasobów multimedialnych.

**Kluczowe funkcje:**
- MediaDocument (root)
- MediaFolder (tree structure)
- MediaAsset (file + metadata)
- MediaCollection (grouped assets)
- Tags, Search, Filters
- Permissions (tenant isolation)

**API:**
```typescript
interface MediaDocument {
  readonly id: string;
  readonly tenantId: string;
  readonly rootFolderId: string;
  readonly folders: MediaFolder[];
  readonly assets: MediaAsset[];
  readonly collections: MediaCollection[];
  readonly tags: string[];
}

interface MediaFolder {
  readonly id: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly path: string;
  readonly createdAt: number;
  readonly createdBy: string;
}

interface MediaAsset {
  readonly id: string;
  readonly folderId: string;
  readonly filename: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly width: number;
  readonly height: number;
  readonly url: string;
  readonly thumbnailUrl: string;
  readonly variants: Record<string, string>;
  readonly tags: string[];
  readonly metadata: Record<string, unknown>;
  readonly createdAt: number;
  readonly createdBy: string;
}
```

**Kryteria akceptacji:**
- MediaDocument może przechowywać foldery, assety, kolekcje
- Folder tree działa (parent/children)
- Search i filters działają
- Tenant isolation jest egzekwowana

### 4.2 C8.2 — Upload Engine

**Plik:** `packages/asset-manager-core/src/UploadEngine.ts`

**Odpowiedzialność:** Przesyłanie plików.

**Kluczowe funkcje:**
- Drag & drop upload
- Batch upload (multiple files)
- Progress tracking
- Retry on failure
- Chunk upload (large files)
- Cancel upload
- Background upload

**API:**
```typescript
interface UploadCommand {
  readonly type: 'UPLOAD_FILE' | 'UPLOAD_BATCH' | 'CANCEL_UPLOAD';
  readonly file: File;
  readonly folderId: string;
  readonly onProgress?: (progress: number) => void;
}

interface UploadJob {
  readonly id: string;
  readonly file: File;
  readonly folderId: string;
  readonly progress: number;
  readonly status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
  readonly error?: string;
}
```

**Kryteria akceptacji:**
- Drag & drop upload działa
- Batch upload działa (multiple files)
- Progress jest wyświetlany
- Retry działa przy błędzie
- Cancel działa
- Chunk upload działa dla dużych plików

### 4.3 C8.3 — Asset Processing Pipeline

**Plik:** `packages/asset-manager-core/src/ProcessingPipeline.ts`

**Odpowiedzialność:** Automatyczne przetwarzanie assetów.

**Kluczowe funkcje:**
- Thumbnails generation (multiple sizes)
- Format conversion (WebP, AVIF)
- Compression (lossy/lossless)
- EXIF extraction
- Metadata extraction
- Image validation (dimensions, format)

**API:**
```typescript
interface ProcessingJob {
  readonly id: string;
  readonly assetId: string;
  readonly operations: ProcessingOperation[];
  readonly status: 'pending' | 'processing' | 'done' | 'error';
  readonly result?: ProcessingResult;
}

type ProcessingOperation = 
  | { type: 'thumbnail'; width: number; height: number }
  | { type: 'convert'; format: 'webp' | 'avif' | 'jpeg' | 'png' }
  | { type: 'compress'; quality: number }
  | { type: 'extract-exif' }
  | { type: 'validate' };
```

**Kryteria akceptacji:**
- Thumbnails są generowane automatycznie
- WebP/AVIF konwersja działa
- Compression redukuje rozmiar
- EXIF metadata jest wyciągana
- Validation odrzuca nieprawidłowe pliki

### 4.4 C8.4 — CDN & Storage

**Plik:** `packages/asset-manager-core/src/storage/StorageAdapter.ts`

**Odpowiedzialność:** Przechowywanie i dostarczanie assetów.

**Kluczowe funkcje:**
- Local Storage (development)
- S3 Storage (production)
- Cloudflare R2 (production)
- Signed URLs
- Cache headers
- Versioning

**API:**
```typescript
interface StorageAdapter {
  upload(key: string, file: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn: number): Promise<string>;
  getPublicUrl(key: string): string;
}

interface CDNService {
  invalidateCache(key: string): Promise<void>;
  getCacheStatus(key: string): Promise<'hit' | 'miss'>;
}
```

**Kryteria akceptacji:**
- Upload do lokalnego storage działa
- Upload do S3/R2 działa (przełączalny przez config)
- Signed URLs są generowane
- Cache invalidation działa
- Versioning działa

### 4.5 C8.5 — Media Library UI

**Plik:** `src/components/media/MediaLibrary.tsx`

**Odpowiedzialność:** UI biblioteki mediów.

**Kluczowe funkcje:**
- Folder tree (navigacja)
- Search (nazwa, tag, metadata)
- Filters (typ, rozmiar, data)
- Grid/List view toggle
- Preview modal
- Bulk actions (select, delete, move, tag)

**API:**
```typescript
interface MediaLibraryProps {
  tenantId: string;
  onSelect?: (asset: MediaAsset) => void;
  onUpload?: (files: File[]) => void;
}
```

**Kryteria akceptacji:**
- Folder tree renderuje się i działa
- Search filtruje assety
- Grid/List toggle działa
- Preview modal pokazuje asset
- Bulk actions działają

### 4.6 C8.6 — Image Editor

**Plik:** `src/components/media/ImageEditor.tsx`

**Odpowiedzialność:** Podstawowe operacje edycji obrazów.

**Kluczowe funkcje:**
- Crop (free, 1:1, 16:9, 4:3)
- Resize (width, height, maintain aspect ratio)
- Rotate (90, 180, 270)
- Flip (horizontal, vertical)
- Focus point (dla responsywnych obrazów)
- Preview przed zapisaniem

**API:**
```typescript
interface ImageEditorProps {
  asset: MediaAsset;
  onSave: (editedAsset: MediaAsset) => void;
  onCancel: () => void;
}

interface ImageEditOperations {
  crop?: { x: number; y: number; width: number; height: number };
  resize?: { width: number; height: number };
  rotate?: 0 | 90 | 180 | 270;
  flip?: 'horizontal' | 'vertical' | null;
  focusPoint?: { x: number; y: number };
}
```

**Kryteria akceptacji:**
- Crop działa (free + preset ratios)
- Resize działa (zachowuje aspect ratio)
- Rotate działa (90, 180, 270)
- Flip działa
- Focus point działa
- Preview pokazuje zmiany na żywo

### 4.7 C8.7 — Builder Integration

**Plik:** `src/components/builder/sidebar/AssetPicker.tsx`

**Odpowiedzialność:** Integracja Media Manager z Builderem.

**Kluczowe funkcje:**
- Asset picker w PropsPanel (dla props typu `image`)
- Drag & drop assetów bezpośrednio na canvas
- Preview w czasie rzeczywistym
- AssetResolver — zamienia AssetReference na URL
- Pełna zgodność z Preview Pipeline

**API:**
```typescript
interface AssetReference {
  readonly assetId: string;
  readonly variant?: string;
  readonly focusPoint?: { x: number; y: number };
}

interface AssetResolver {
  resolve(reference: AssetReference): Promise<string>;
  resolveVariant(assetId: string, variant: string): Promise<string>;
}
```

**Kryteria akceptacji:**
- Asset picker działa w PropsPanel
- Drag & drop z Media Library na canvas działa
- Preview aktualizuje się po wybraniu assetu
- AssetResolver zamienia AssetReference na URL
- Preview Pipeline renderuje obrazy z CDN

### 4.8 C8.8 — Certification

**Plik:** `packages/asset-manager-core/src/__tests__/media-certification.test.ts`

**Odpowiedzialność:** Testy certyfikacyjne C8.

**Kryteria akceptacji:**
- Upload → Builder → Preview → Publish → Runtime (full flow)
- Replace Asset działa
- Delete Asset działa
- Cache Invalidation działa
- Tenant Isolation działa (cross-tenant access blocked)
- Performance: upload < 2s dla 5MB, processing < 1s
- Golden Flow test przechodzi

---

## 5. Integracja z istniejącymi modułami

### 5.1 Builder Integration

**Zmiana:** PropsPanel obsługuje `image` props przez Asset Picker.

**Przed:**
```
PropsPanel → StringField (URL input)
```

**Po:**
```
PropsPanel → ImageField → AssetPicker → MediaLibrary
                                    ↓
                              AssetReference
                                    ↓
                              AssetResolver → CDN URL
```

### 5.2 Preview Pipeline Integration

**Zmiana:** PreviewPipeline używa AssetResolver do renderowania obrazów.

**Przed:**
```
SECTION_UPDATE → props.image = "https://..."
```

**Po:**
```
SECTION_UPDATE → props.image = AssetReference{assetId: "..."}
               → AssetResolver.resolve() → "https://cdn..."
               → render image
```

### 5.3 Commerce Integration

**Zmiana:** ProductDomain może używać MediaAsset dla produktowych zdjęć.

**Przed:**
```typescript
Product {
  image: string; // URL
}
```

**Po:**
```typescript
Product {
  image: AssetReference; // AssetReference
}
```

---

## 6. Test Strategy

### 6.1 Unit Tests

| Moduł | Liczba testów | Priorytet |
|-------|---------------|-----------|
| MediaDocument | 15 | WYSOKI |
| UploadEngine | 12 | WYSOKI |
| ProcessingPipeline | 10 | WYSOKI |
| StorageAdapter | 8 | ŚREDNI |
| CDNService | 8 | ŚREDNI |
| MediaLibrary UI | 10 | ŚREDNI |
| ImageEditor | 8 | ŚREDNI |
| Builder Integration | 10 | WYSOKI |
| **RAZEM** | **71** | — |

### 6.2 Integration Tests

| Test | Opis |
|------|------|
| Upload → Processing → Storage | Plik przesłany → przetworzony → zapisany |
| Asset → Builder → Preview | Asset wybrany → pokaże się w Preview |
| Replace Asset → Preview | Asset zastąpiony → Preview aktualizuje się |
| Tenant Isolation | Tenant A nie widzi assetów Tenant B |

### 6.3 E2E Tests (Playwright)

| Test | Opis |
|------|------|
| Upload flow | Drag & drop → upload → processing → library |
| Image edit flow | Wybierz asset → edytuj → zapisz → preview |
| Builder integration flow | Wybierz asset → przeciągnij na canvas → preview |

---

## 7. Acceptance Criteria

C8 jest ukończone gdy:

1. ✅ Wszystkie moduły z sekcji 4 są zaimplementowane
2. ✅ 71 unit tests przechodzi zielono
3. ✅ 4 integration tests przechodzi zielono
4. ✅ 3 E2E tests przechodzi zielono
5. ✅ `tsc --noEmit` clean
6. ✅ `npm run build` success
7. ✅ Architecture Freeze v3.0 przestrzegane
8. ✅ Nowe kontrakty oznaczone jako `@experimental`
9. ✅ Dokumentacja aktualna
10. ✅ Performance: upload < 2s dla 5MB, processing < 1s
11. ✅ Tenant isolation działa
12. ✅ Golden Flow Media → Builder → Preview → Publish przechodzi

---

## 8. Wersja dokumentu

| Wersja | Data | Zmiany |
|--------|------|--------|
| 1.0 | 2026-07-19 | Pierwsza wersja specyfikacji |

---

## 9. Podpis cyfrowy

Specyfikacja C8 jest gotowa do implementacji po zatwierdzeniu przez architekta.

**Status:** READY FOR REVIEW ✅  
**Data:** 2026-07-19  
**Wersja:** 1.0
