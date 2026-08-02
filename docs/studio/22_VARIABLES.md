# C16.22 — WEB FACTOR Studio Variables

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 22_VARIABLES.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 10_DESIGN_SYSTEM.md

---

## 1. Cel

Variables to system globalnych zmiennych, które mogą być używane w całej stronie. Zmień wartość w jednym miejscu → aktualizuje się wszędzie.

To jest kluczowa przewaga platformy biznesowej nad czystym edytorem stron.

---

## 2. Koncepcja

```
Użytkownik definiuje:

company.name = "WEB FACTOR"
company.phone = "+48 123 456 789"
company.email = "hello@webfactor.com"
company.address = "Warszawa, Poland"
company.logo = "https://..." 

Następnie w dowolnym miejscu w stronie:
{{company.name}}
{{company.phone}}
{{company.email}}

Zmiana w Variables → aktualizacja na całej stronie
```

---

## 3. Typy zmiennych

```typescript
interface VariableDefinition {
  id: string;                    // "company.name"
  label: string;                 // "Company Name"
  description?: string;          // "Official business name"
  type: VariableType;
  defaultValue: any;
  group: string;                 // "Company" | "Social" | "Store"
  icon?: string;                 // ikona Lucide
  required: boolean;
  validation?: VariableValidation;
  isSecret: boolean;             // dla API keys, tokenów
}

type VariableType = 
  | 'TEXT'
  | 'NUMBER'
  | 'EMAIL'
  | 'PHONE'
  | 'URL'
  | 'COLOR'
  | 'IMAGE'
  | 'BOOLEAN'
  | 'DATE';

interface VariableValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;              // regex
  patternMessage?: string;       // "Must be a valid email"
}
```

---

## 4. Predefiniowane zmienne

### 4.1 Store Info
```
store.name          → "Mój Sklep"
store.description   → "Najlepszy sklep w mieście"
store.email         → "sklep@example.com"
store.phone         → "+48 123 456 789"
store.address       → "ul. Główna 1, Warszawa"
store.logo          → "https://..."
store.favicon       → "https://..."
store.currency      → "PLN"
store.locale        → "pl-PL"
```

### 4.2 Company Info
```
company.name        → "WEB FACTOR"
company.taxId       → "NIP 123-456-78-90"
company.regId       → "KRS 123456"
company.email       → "hello@webfactor.com"
company.phone       → "+48 123 456 789"
company.address     → "Warszawa, Poland"
```

### 4.3 Social Media
```
social.facebook     → "https://facebook.com/..."
social.instagram    → "https://instagram.com/..."
social.twitter      → "https://twitter.com/..."
social.youtube      → "https://youtube.com/..."
social.linkedin     → "https://linkedin.com/..."
social.tiktok       → "https://tiktok.com/..."
```

### 4.4 Custom Variables
```
Użytkownik może tworzyć własne:
custom.deliveryPrice   → "15"
custom.freeShippingOver → "200"
custom.defaultVat     → "23"
```

---

## 5. Variables Panel UI

```
┌──────────────────────────────────────────────────────┐
│  VARIABLES                              [+ Add] [×] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ▼ COMPANY                                           │
│  ┌────────────────────────────────────────────────┐  │
│  │ Company Name    [WEB FACTOR              ]     │  │
│  │ Tax ID          [123-456-78-90           ]     │  │
│  │ Email           [hello@webfactor.com     ]     │  │
│  │ Phone           [+48 123 456 789         ]     │  │
│  │ Address         [Warszawa, Poland        ]     │  │
│  │ Logo            [https://...     [Choose]]     │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ▼ SOCIAL MEDIA                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ Facebook   [https://facebook.com/...       ]   │  │
│  │ Instagram  [https://instagram.com/...      ]   │  │
│  │ Twitter    [https://twitter.com/...         ]   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ▼ CUSTOM                                            │
│  ┌────────────────────────────────────────────────┐  │
│  │ Delivery Price  [15] PLN                       │  │
│  │ Free Shipping   [200] PLN                      │  │
│  │ Default VAT     [23] %                         │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  Usage: {{ store.name }} — 15 wystąpień              │
│  [Find in page] [Replace all] [Unlink]              │
└──────────────────────────────────────────────────────┘
```

---

## 6. Użycie w edytorze

### 6.1 Insert Variable

```
W Inspectorze, pole tekstowe ma przycisk:

[Hello, {{ company.name }}!] [🔗 Insert Variable ▼]
                                   ├── Company Name
                                   ├── Company Email
                                   ├── Company Phone
                                   ├── Store Name
                                   └── Custom...

Po wybraniu: "Hello, {{company.name}}!"
```

### 6.2 Variable Picker

```
┌──────────────────────────────────┐
│  INSERT VARIABLE                  │
│  [🔍 Search variables...]        │
├──────────────────────────────────┤
│  ▼ COMPANY                       │
│  ○ Company Name    {{company.name}}      │
│  ○ Company Email   {{company.email}}     │
│  ○ Company Phone   {{company.phone}}     │
│  ▼ SOCIAL                          │
│  ○ Facebook        {{social.facebook}}   │
│  ○ Instagram       {{social.instagram}}  │
├──────────────────────────────────┤
│  Preview: "WEB FACTOR"           │
│  [Insert]                        │
└──────────────────────────────────┘
```

### 6.3 Highlight w canvasie

```
W trybie preview, zmienne są podświetlone:

Hello, [WEB FACTOR] ← kliknięcie → "Ta wartość pochodzi z Variables"
```

---

## 7. Implementacja

```typescript
// Model danych
interface VariableStore {
  variables: Record<string, VariableValue>;
  lastUpdated: number;
}

type VariableValue = string | number | boolean;

// Resolver
function resolveVariables(text: string, variables: Record<string, VariableValue>): string {
  return text.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

// Komenda
{
  type: 'UPDATE_VARIABLE',
  key: 'company.name',
  value: 'WEB FACTOR 2.0',
}

// Hook
function useVariable(key: string): VariableValue | null {
  const { document } = useBuilder();
  const variables = document.variables;
  return variables?.[key] ?? null;
}
```

---

## 8. Kompilacja

```typescript
// Podczas compile(), zmienne są resolvowane
function compileWithVariables(doc: BuilderDocument): CompiledDocument {
  const compiled = compile(doc);
  
  // Resolve variables we wszystkich propsach
  for (const page of compiled.pages) {
    for (const section of page.sections) {
      for (const [key, value] of Object.entries(section.props)) {
        if (typeof value === 'string') {
          section.props[key] = resolveVariables(value, doc.variables);
        }
      }
    }
  }
  
  return compiled;
}
```

---

## 9. Pliki

```
packages/builder-core/src/
├── Variables.ts                 — model + resolver

src/components/builder/variables/
├── VariablesPanel.tsx           — główny panel
├── VariableEditor.tsx           — edytor pojedynczej zmiennej
├── VariablePicker.tsx           — picker do wstawiania
├── VariableUsage.tsx            — gdzie jest używana
└── hooks/
    └── useVariables.ts          — hook
```

