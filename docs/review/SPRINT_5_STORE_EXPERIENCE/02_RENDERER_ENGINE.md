---
Status: REVIEW
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_5_STORE_EXPERIENCE/01_THEME_RUNTIME_ENGINE.md
---

# SPRINT 5: STORE EXPERIENCE LAYER
## Specyfikacja Kontraktu — 02_RENDERER_ENGINE.md
*Definicja silnika renderującego (Renderer Engine), kompilacji szablonów, wstrzykiwania zmiennych CSS (Design Tokens), bezpiecznego kontekstu renderowania (StorefrontRenderContext) oraz izolacji tenantów podczas generowania HTML.*

---

### 1. Bezpieczny Kontekst Renderowania (Storefront Render Context)

Aby zachować pełne bezpieczeństwo i uniemożliwić motywom bezpośrednie połączenie z bazą danych (zasada *Theme Isolation Guardrails*), wszystkie dane potrzebne do wyrenderowania strony są przekazywane przez silnik w postaci ustrukturyzowanego i zamrożonego kontekstu `StorefrontRenderContext`.

```typescript
export interface StorefrontRenderContext {
  tenantId: string;
  shopName: string;
  locale: string;
  currency: string;
  themeId: string;
  tokens: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    fontFamily: string;
    borderRadius: string;
  };
  page: {
    title: string;
    type: 'home' | 'product' | 'cart' | 'checkout';
    data: Record<string, any>; // np. produkt, lista produktów, stan koszyka
  };
}
```

---

### 2. Silnik Renderujący (Renderer Engine)

Klasa `RendererEngine` przetwarza layout strony (szablon HTML z oznaczonymi kontenerami/slotami na komponenty) i składa finalną odpowiedź dla przeglądarki, wstrzykując design tokens jako zmienne CSS oraz renderując przypisane widżety.

#### Sposób zapisu slotów w szablonie (Layout Template):
Szablony layoutów używają zapisu slotów w formacie `<!-- slot:nazwa_slotu -->` lub prostego parsera tagów, np:
```html
<!DOCTYPE html>
<html>
<head>
  <title>{{page_title}}</title>
  <!-- tokens_styles -->
</head>
<body>
  <div id="app">
    <!-- slot:header -->
    <main>
      <!-- slot:main_content -->
    </main>
    <!-- slot:footer -->
  </div>
</body>
</html>
```

---

### 3. API Silnika Renderującego

```typescript
export class RendererEngine {
  public async renderPage(
    context: StorefrontRenderContext,
    layoutTemplate: string,
    slots: Record<string, { componentName: string; props: Record<string, any> }>
  ): Promise<string>;
}
```

#### Przepływ przetwarzania (Render Pipeline):
1. **Tenant Validation**: Weryfikacja spójności `tenantId` w kontekście ze stanem platformy.
2. **Tokens Injection**: Wygenerowanie bloku `<style>` zawierającego zmienne CSS zdefiniowane w tokenach (np. `--primary-color`, `--font-family`) i wstrzyknięcie go w miejsce `<!-- tokens_styles -->`.
3. **Template Interpolation**: Podmiana zmiennych globalnych takich jak `{{page_title}}`.
4. **Slots Resolution**: Dla każdego zdefiniowanego slotu (np. `<!-- slot:header -->`), silnik odwołuje się do `ThemeRuntime` w celu dynamicznego wyrenderowania komponentu i wstrzykuje wyjściowy HTML.
5. **Event Emission**: Emisja zdarzeń `Theme.RenderStarted` i `Theme.RenderCompleted`.

---

### 4. Izolacja Wielodostępności (Tenant Isolation)

* Niedopuszczalne jest wstrzyknięcie komponentów zarejestrowanych dla innego tenanta. Silnik renderujący odpytuje wyłącznie `ThemeRuntime` powiązany z `tenantId` przekazanym w bezpiecznym kontekście.
* Jeśli którykolwiek z komponentów rzuci błąd podczas renderowania, silnik przechwytuje go za pomocą wbudowanego mechanizmu "Error Boundary" dla widżetów, zapobiegając awarii całej witryny (zastępuje uszkodzony komponent komunikatem błędu i loguje incydent).

---

### 5. Kontrakt Testowy (Test Contract)

Implementacja silnika renderującego w pliku `renderer-engine.test.ts` musi zweryfikować:

1. **Poprawność wstrzykiwania design tokens**:
   * Zmienne CSS takie jak `--primary-color: #3B82F6` są wstrzykiwane jako tag `<style>` w nagłówku strony.
2. **Szczęśliwą ścieżkę składania strony (Happy Path)**:
   * Podmiana zmiennych typu `{{page_title}}` oraz zastąpienie slotów `<!-- slot:header -->` wyjściowym HTML wyrenderowanych komponentów.
3. **Widget Error Boundary**:
   * Jeśli komponent w slocie rzuca błąd, cała strona nadal się renderuje, a w miejscu uszkodzonego komponentu pojawia się bezpieczny komunikat awaryjny (np. `<!-- Widget Render Error -->`).
4. **Weryfikację błędu spójności tenanta**:
   * Próba wyrenderowania strony, gdzie dane kontekstu i komponenty pochodzą z różnych tenantów, kończy się błędem bezpieczeństwa.
