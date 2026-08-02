# C16.9 — WEB FACTOR Studio Asset System

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 09_ASSET_SYSTEM.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 02_UI_LAYOUT.md

---

## 1. Cel

Asset System to biblioteka mediów i zasobów dostępna w Studio. Użytkownik zarządza obrazkami, video, ikonami, fontami i innymi assetami z jednego miejsca.

**Obecnie:** Asset manager istnieje w `packages/asset-manager-core/`.
**Docelowo:** Pełna integracja z panelem Assets w Studio, drag & drop na canvas, asset picker w Inspectorze.

---

## 2. Typy assetów

```typescript
type AssetType = 
  | 'IMAGE'     // JPG, PNG, WebP
  | 'SVG'       // SVG (inline lub plik)
  | 'VIDEO'     // MP4, WebM
  | 'LOTTIE'    // Lottie animation (JSON)
  | 'ICON'      // Ikona (Lucide, FontAwesome)
  | 'FONT'      // Font (Google Fonts, custom)
  | 'GIF'       // Animowany GIF
  | 'AUDIO'     // MP3, WAV
  | 'DOCUMENT'  // PDF, DOC
  | 'OTHER';    // Inne

interface Asset {
  id: string;
  type: AssetType;
  name: string;
  url: string;
  thumbnail?: string;       // miniaturka
  size: number;             // rozmiar w bajtach
  width?: number;           // dla obrazków
  height?: number;          // dla obrazków
  duration?: number;        // dla video/audio
  format: string;           // "png", "mp4", "woff2", etc.
  tags: string[];
  createdAt: string;
  updatedAt: string;
  source: 'UPLOAD' | 'MARKETPLACE' | 'AI' | 'URL';
  isPublic: boolean;
  metadata?: Record<string, unknown>;
}
```

---

## 3. Panel Assets (lewy sidebar)

### 3.1 Layout

```
┌──────────────────────────────────┐
│ ASSETS                    [+ Add]│
│ [🔍 Search assets...]            │
├──────────────────────────────────┤
│ [All] [Images] [Videos] [Icons]  │
│ [SVGs] [Fonts] [Lottie]         │
├──────────────────────────────────┤
│                                  │
│  Grid View:                      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │img │ │img │ │svg │ │icon│   │
│  │    │ │    │ │    │ │    │   │
│  └────┘ └────┘ └────┘ └────┘   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │vid │ │lott│ │gif │ │font│   │
│  │    │ │ie  │ │    │ │    │   │
│  └────┘ └────┘ └────┘ └────┘   │
│                                  │
│  ── Upload Area (drag & drop) ── │
│  Drop files here or click to     │
│  upload                          │
└──────────────────────────────────┘
```

### 3.2 Widoki

- **Grid View** — siatka miniaturek (domyślny)
- **List View** — lista z nazwą, typem, rozmiarem
- **Detail View** — podgląd pojedynczego assetu

### 3.3 Filtry

- Typ (Image, Video, SVG, Icon, Font, Lottie)
- Data (Today, This week, This month, Custom)
- Rozmiar (Small < 100KB, Medium < 1MB, Large > 1MB)
- Tagi
- Źródło (Upload, Marketplace, AI, URL)

---

## 4. Asset Upload

### 4.1 Upload methods

```
1. Drag & Drop    — przeciągnij pliki do panelu
2. File picker    — kliknij "+" i wybierz pliki
3. URL import     — wklej URL obrazka
4. AI generate    — generuj obrazek przez AI (DALL-E, Stable Diffusion)
5. Marketplace    — pobierz z marketplace
6. Bulk upload    — upload wielu plików naraz
```

### 4.2 Proces uploadu

```typescript
async function uploadAsset(file: File): Promise<Asset> {
  // 1. Walidacja (typ, rozmiar)
  validateFile(file);
  
  // 2. Generuj thumbnail
  const thumbnail = await generateThumbnail(file);
  
  // 3. Upload do storage (R2 / S3)
  const url = await uploadToStorage(file);
  
  // 4. Zapisz w bazie
  const asset = await saveAsset({
    type: detectType(file),
    name: file.name,
    url,
    thumbnail,
    size: file.size,
    format: file.name.split('.').pop(),
    tags: [],
  });
  
  // 5. Optimize (WebP conversion, resize)
  optimizeAsset(asset.id);
  
  return asset;
}
```

### 4.3 Obsługiwane formaty

| Typ | Formaty | Max rozmiar |
|-----|---------|-------------|
| Image | PNG, JPG, WebP, AVIF | 10MB |
| SVG | SVG | 1MB |
| Video | MP4, WebM | 100MB |
| GIF | GIF | 10MB |
| Lottie | JSON | 5MB |
| Font | WOFF2, WOFF, TTF | 5MB |
| Audio | MP3, WAV, OGG | 50MB |

---

## 5. Asset Picker (w Inspectorze)

### 5.1 UI

```
[Choose Image ▼]
┌──────────────────────────────────┐
│ [🔍 Search...]                   │
│ [Recent] [All] [Upload] [URL]    │
├──────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│ │    │ │    │ │    │ │    │   │
│ │img1│ │img2│ │svg1│ │img3│   │
│ └────┘ └────┘ └────┘ └────┘   │
│                                  │
│ Selected: logo.png (120KB)       │
│ [  Apply  ] [  Cancel  ]        │
└──────────────────────────────────┘
```

### 5.2 Integracja z Inspector field types

```typescript
// Schema dla asset pickera
imageProp({
  key: 'logo',
  label: 'Logo',
  required: false,
  description: 'Wybierz logo z biblioteki',
  assetTypes: ['IMAGE', 'SVG'],    // tylko te typy
})
```

---

## 6. Font Manager

### 6.1 Zarządzanie fontami

```
Fonts:
┌──────────────────────────────────┐
│ [Google Fonts ▼] [+ Add Custom] │
├──────────────────────────────────┤
│  ✓ Inter (400, 500, 600, 700)   │
│  ✓ Poppins (300, 400, 600, 700) │
│  ○ Playfair Display              │
│  ○ JetBrains Mono                │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│  + Custom Font (upload WOFF2)   │
└──────────────────────────────────┘

Kliknięcie → aktywacja fontu
Aktywne fonty są dostępne w Typography panelu
```

### 6.2 Google Fonts integration

```typescript
async function loadGoogleFont(fontName: string, weights: number[]) {
  const url = `https://fonts.googleapis.com/css2?family=${fontName}:wght@${weights.join(';')}`;
  const link = document.createElement('link');
  link.href = url;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}
```

---

## 7. Integracja z AI

### 7.1 Generowanie assetów

```
AI Generate:
┌──────────────────────────────────┐
│ [🤖 Generate Image]              │
│                                  │
│ Prompt:                          │
│ "Professional hero image with    │
│  abstract purple gradient and    │
│  geometric shapes"               │
│                                  │
│ Style: [Modern ▼]                │
│ Aspect: [16:9 ▼]                 │
│                                  │
│ [Generate]                       │
├──────────────────────────────────┤
│                                  │
│  ┌─────────────────────────┐    │
│  │  Generated preview       │    │
│  │                          │    │
│  └─────────────────────────┘    │
│                                  │
│ [Use] [Regenerate] [Download]   │
└──────────────────────────────────┘
```

### 7.2 AI Image Generation API

```typescript
async function generateImage(prompt: string, options: {
  style?: string;
  aspectRatio?: string;
  size?: 'small' | 'medium' | 'large';
}): Promise<Asset> {
  const response = await fetch('/api/ai/generate-image', {
    method: 'POST',
    body: JSON.stringify({ prompt, ...options }),
  });
  const { imageUrl } = await response.json();
  
  return {
    id: generateId(),
    type: 'IMAGE',
    name: `AI_${Date.now()}.webp`,
    url: imageUrl,
    // ...
  };
}
```

---

## 8. Implementacja

### 8.1 Pliki

```
src/components/builder/assets/
├── AssetPanel.tsx               — główny panel Assets
├── AssetGrid.tsx                — grid view
├── AssetList.tsx                — list view
├── AssetCard.tsx                — karta assetu
├── AssetDetail.tsx              — podgląd szczegółowy
├── AssetUploader.tsx            — uploader (drag & drop + file picker)
├── AssetSearch.tsx              — wyszukiwarka
├── AssetFilters.tsx             — filtry
├── FontManager.tsx              — zarządzanie fontami
├── AIImageGenerator.tsx         — AI generowanie obrazków
├── AssetPicker.tsx              — picker dla Inspectora (już istnieje)
└── hooks/
    ├── useAssets.ts             — hook do zarządzania assetami
    ├── useAssetUpload.ts        — hook do uploadu
    └── useAssetSearch.ts        — hook do wyszukiwania
```

### 8.2 Integracja z istniejącym kodem

```
packages/asset-manager-core/   ← już istnieje
packages/asset-builder/        ← już istnieje

src/components/media/          ← istniejący AssetPicker
  └── AssetPicker.tsx          ← rozszerzyć o nowe typy
```

---

## 9. Performance

- Lazy loading miniaturek (Intersection Observer)
- WebP auto-conversion przy uploadzie
- CDN dla assetów (Cloudflare R2 / Images)
- Caching w Service Worker
- Progressive loading (blur placeholder → full)

