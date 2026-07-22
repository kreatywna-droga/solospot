---
Status: REVIEW
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_4_COMMERCE_RUNTIME/07_TAX_ENGINE.md
---

# SPRINT 5: STORE EXPERIENCE LAYER
## Specyfikacja Kontraktu — 01_THEME_RUNTIME_ENGINE.md
*Definicja silnika szablonów (Theme Runtime Engine), manifestów motywów, rejestru komponentów, izolacji motywów od bazy danych oraz zdarzeń renderowania.*

---

### 1. Manifest Motywu (Theme Manifest)

Motywy są w pełni spakowanymi jednostkami, zdefiniowanymi za pomocą pliku manifestu. Każdy motyw posiada własną listę obsługiwanych komponentów, układów stron (layouts) oraz tokenów projektowych (design tokens).

```typescript
export interface DesignTokens {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  borderRadius: string;
}

export interface ThemeManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  tokens: DesignTokens;
  layouts: string[]; // np. ["default", "product_detail", "checkout"]
  components: Record<string, {
    name: string;
    type: 'layout' | 'widget' | 'atom';
  }>;
}
```

---

### 2. Izolacja i Bezpieczeństwo Motywów (Theme Isolation Guardrails)

Motywy działają w środowisku izolowanym i **nie mogą** bezpośrednio łączyć się z bazą danych, wykonywać zapytań SQL, ani importować funkcji administracyjnych z platformy. 
Wszelkie dane są wstrzykiwane przez system szablonów jako `props` lub przekazywane za pośrednictwem kontrolowanego kontekstu wykonawczego (`StorefrontRenderContext`).

---

### 3. Rejestr Komponentów i Rozwiązywanie Szablonów (Component Registry & Resolver)

Silnik `ThemeResolver` odpowiada za załadowanie motywu wybranego przez Tenanta oraz udostępnienie jego komponentów do renderera.

```typescript
export interface ThemeComponent {
  name: string;
  type: 'layout' | 'widget' | 'atom';
  // Prosta abstrakcja funkcji renderującej zwracającej string/HTML
  render(props: Record<string, any>): string;
}

export class ComponentRegistry {
  private readonly components = new Map<string, ThemeComponent>();

  public register(componentName: string, component: ThemeComponent): void;
  public resolve(componentName: string): ThemeComponent;
}
```

---

### 4. Architektura Theme Runtime Engine

Główna klasa `ThemeRuntime` koordynuje cały cykl ładowania i przygotowania motywu dla danego tenanta.

```typescript
export class ThemeRuntime {
  public async loadTheme(tenantId: string, manifest: ThemeManifest): Promise<void>;
  public async getThemeManifest(tenantId: string): Promise<ThemeManifest>;
  public async renderComponent(tenantId: string, componentName: string, props: Record<string, any>): Promise<string>;
}
```

#### Przepływ ładowania motywu:
1. **Tenant Context** ➔ Identyfikacja aktywnego motywu w konfiguracji tenanta.
2. **Validate Manifest** ➔ Sprawdzenie poprawności schematu manifestu motywu.
3. **Registry Check** ➔ Rejestracja komponentów i tokenów.
4. **Theme.Loaded** ➔ Emisja zdarzenia do Event Busa o załadowaniu motywu.

---

### 5. Zdarzenia Systemowe Szablonów (Theme Events)

Do EventBusa wysyłane są następujące zdarzenia telemetryczne:
* **`Theme.Loaded`**: Motyw został pomyślnie załadowany i zainicjalizowany dla tenanta.
* **`Theme.ComponentResolved`**: Renderer odnalazł i pobrał określony komponent szablonu.
* **`Theme.RenderStarted`**: Rozpoczęcie renderowania komponentu/widoku strony.
* **`Theme.RenderCompleted`**: Zakończenie generowania kodu HTML strony.
* **`Theme.Failed`**: Wystąpienie krytycznego błędu ładowania lub renderowania motywu.

---

### 6. Kontrakt Testowy (Test Contract)

Implementacja silnika szablonów w pliku `theme-runtime.test.ts` musi zweryfikować:

1. **Poprawność ładowania manifestu motywu**:
   * Walidacja struktury manifestu, tokenów kolorów oraz zarejestrowanych komponentów.
2. **Rejestracja i renderowanie komponentu (Happy Path)**:
   * Wywołanie `renderComponent("header", { title: "Sklep" })` zwraca poprawny kod HTML i publikuje zdarzenie `Theme.RenderCompleted`.
3. **Walidację błędu renderowania**:
   * Próba wyrenderowania niezarejestrowanego komponentu rzuca `ComponentNotFoundException` i publikuje `Theme.Failed`.
4. **Ochronę przed nieautoryzowanym dostępem (Tenant Isolation)**:
   * Próba renderowania motywu przypisanego do innego tenanta wyzwala `TenantSecurityException`.
