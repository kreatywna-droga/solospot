# C10 Specification — Marketplace Authoring

**Epic:** C10 — Marketplace Authoring  
**Baseline:** v3.2  
**Status:** SPECIFICATION  
**Date:** 2026-07-19  

---

## 1. Cel

Umożliwienie twórcom (developerom, projektantom, agencjom) tworzenie, publikację i monetyzację własnych pakietów template, komponentów i motywów poprzez Marketplace Authoring Studio.

---

## 2. Scope

### 2.1 Włączone
- Template Package System (manifest, build, publish)
- Component Package System (isolated, versioned)
- Theme Package System (CSS-in-JS, design tokens)
- Marketplace Registry (discover, search, rate)
- Template Authoring Studio (WYSIWYG + code view)
- Versioning i semantic versioning
- Monetyzacja (free, paid, freemium)

### 2.2 Niewłączone
- Marketplace dla gotowych sklepów (to storefront hosting)
- Marketplace dla danych produktowych

---

## 3. Architecture

### 3.1 Nowe pakiety

| Pakiet | Ścieżka | Odpowiedzialność |
|--------|---------|------------------|
| `template-package` | `packages/template-package` | Template manifest, build pipeline, validation |
| `component-package` | `packages/component-package` | Component manifest, bundling, tree-shaking |
| `theme-package` | `packages/theme-package` | Theme manifest, design tokens, CSS generation |
| `marketplace-registry` | `packages/marketplace-registry` | Package discovery, search, ratings |
| `authoring-studio` | `packages/authoring-studio` | Template Authoring Studio UI |

### 3.2 Extension Points

| Punkt | Mechanizm | Opis |
|-------|-----------|------|
| Package Validator | `PackageValidator` interface | Custom validation for packages |
| Build Hook | `BuildHook` interface | Pre/post build transformations |
| Marketplace Hook | `MarketplaceHook` interface | Pre-publish validation, moderation |
| Asset Resolver | `AssetResolver` interface | Custom asset resolution for packages |

---

## 4. Template Package System

### 4.1 Manifest Schema

```json
{
  "name": "string",
  "version": "semver",
  "description": "string",
  "author": { "name": "string", "email": "string" },
  "license": "string",
  "price": { "amount": "number", "currency": "string" } | null,
  "tags": ["string"],
  "previewUrl": "string",
  "screenshots": ["string"],
  "dependencies": { "package-name": "semver-range" },
  "commerceFeatures": ["checkout", "products", "inventory"],
  "uiCapabilities": ["media-library", "component-editor"],
  "runtime": "template-runtime",
  "assetResolver": "custom-resolver"
}
```

### 4.2 Build Pipeline

```
Template Source
    ↓
TemplatePackageBuilder
    ↓
Validate manifest.json
    ↓
Extract pages, sections, components
    ↓
Resolve dependencies (package-registry)
    ↓
Bundle static assets
    ↓
Generate preview build
    ↓
Create PackageArtifact (zip)
```

### 4.3 Publish Flow

```
TemplatePackage.create()
    ↓
PackageValidator.validate()
    ↓
MarketplaceRegistry.submit()
    ↓
[Optional: Manual Review]
    ↓
MarketplaceRegistry.publish()
    ↓
Package becomes discoverable
```

---

## 5. Component Package System

### 5.1 Isolated Component Registry

Każdy pakiet komponentu ma własny `ComponentRegistry` izolowany w kontekście pakietu.

```typescript
// packages/component-package/src/ComponentPackage.ts
export interface ComponentPackage {
  registry: ComponentRegistry;
  manifest: ComponentPackageManifest;
  build(): Promise<PackageArtifact>;
}
```

### 5.2 Composition Rules

- Komponenty mogą importować tylko `runtime-core` (StoreConfig, RuntimeContext)
- Komponenty NIE mogą importować `commerce-engine` bezpośrednio
- Commerce dostępny przez `CommerceData` w propsach

---

## 6. Theme Package System

### 6.1 Design Tokens

```typescript
export interface ThemeTokens {
  colors: { primary: string; secondary: string; background: string; };
  typography: { fontFamily: string; fontSizeBase: string; };
  spacing: { xs: string; sm: string; md: string; lg: string; };
  breakpoints: { sm: string; md: string; lg: string; };
}
```

### 6.2 CSS Generation

Theme Package generuje CSS z design tokenów. CSS injectowany przez `ThemeRuntime`.

---

## 7. Marketplace Registry

### 7.1 API

```
GET  /api/marketplace/packages?query=...&tag=...
GET  /api/marketplace/packages/:slug
POST /api/marketplace/packages/:slug/publish
POST /api/marketplace/packages/:slug/rate
GET  /api/marketplace/packages/:slug/reviews
```

### 7.2 Features

- Search by tag, author, price
- Rating system (1-5 stars)
- Review system
- Dependency resolution
- Version checking (semver)
- Preview URL generation

---

## 8. Template Authoring Studio

### 8.1 Features

- Page builder WYSIWYG
- Component palette (drag & drop)
- Theme switcher
- Live commerce preview
- Export to Template Package
- Code view (JSON + React)

### 8.2 Integration Points

- `BuilderDocument` → `TemplatePackage`
- `MediaDocument` → asset resolution
- `CommerceDataResolver` → live product preview

---

## 9. Monetyzacja

### 9.1 Model cenowy

- Free (publiczny)
- Paid (jednorazowa opłata)
- Freemium (podstawowy darmowy, premium płatny)

### 9.2 Revenue Share

- Twórca: 70%
- Platforma: 30%

### 9.3 Checkout Flow

```
User kliknął "Kup"
    ↓
CheckoutTransaction rozpoczynany
    ↓
PaymentGateway przetwarza płatność
    ↓
License key generowany
    ↓
Package dostępny w User Library
```

---

## 10. Testy

### 10.1 Golden Flows

- Template Authoring → Export → Package → Marketplace
- User kupuje pakiet → pobiera → instaluje → renderuje
- Komponent w pakiecie → działa w sklepie
- Theme w pakiecie → stosuje się do sklepu

### 10.2 Test Coverage Target

- `template-package`: 90%
- `component-package`: 85%
- `theme-package`: 85%
- `marketplace-registry`: 80%
- `authoring-studio`: 70%

---

## 11. Open Questions

1. Czy marketplace ma własny backend dla przechowywania pakietów?
2. Czy pakiety są przechowywane w CDN?
3. Czy istnieje limit rozmiaru pakietu?
4. Jakie są limity API marketplace?

---

## 12. Next Steps

1. Stworzyć `template-package` (C10.1)
2. Stworzyć `component-package` (C10.2)
3. Stworzyć `theme-package` (C10.3)
4. Stworzyć `marketplace-registry` (C10.4)
5. Stworzyć `authoring-studio` (C10.5)