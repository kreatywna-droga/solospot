# Package Manifest Specification

*Wersja 1.0*
*Status: REVIEW*
*Autor: AI Engineering Team*

Ten dokument opisuje specyfikację pliku `manifest.json`, który musi posiadać każdy **Package** wdrażany w systemie WEB FACTOR.

## Struktura pliku `manifest.json`

```json
{
  "$schema": "https://webfactor.pl/schemas/package-manifest.v1.json",
  "id": "theme-fashion-premium",
  "type": "theme",
  "name": "Fashion Premium Theme",
  "version": "1.0.0",
  "engine": {
    "type": "commerce",
    "version": "^1.0.0"
  },
  "requires": {
    "modules": [
      "catalog-core",
      "checkout-simple"
    ],
    "capabilities": [
      "seo-dynamic",
      "lazy-loading-images"
    ]
  },
  "configurations": {
    "colors": {
      "primary": "hsl(20, 90%, 50%)",
      "secondary": "hsl(200, 10%, 20%)"
    },
    "layout": "sidebar-left"
  }
}
```

### Opis pól:
1. `id`: Unikalny identyfikator pakietu w rejestrze platformy.
2. `type`: Typ pakietu (`theme`, `profile`, `module`, `integration`, `workflow`, `capability`, `language`, `ai_agent`).
3. `engine`: Zgodność z typem silnika i wersją (wspiera regułę *One Engine Philosophy*).
4. `requires`: Lista pakietów zależnych i capabilities wymaganych do poprawnego renderowania.
5. `configurations`: Domyślne dane inicjujące schemat konfiguracji sklepu.
