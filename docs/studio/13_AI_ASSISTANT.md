# C16.13 — WEB FACTOR Studio AI Assistant

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 13_AI_ASSISTANT.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 08_COMPONENT_SYSTEM.md, 10_DESIGN_SYSTEM.md

---

## 1. Cel

AI Assistant to panel po prawej stronie (lub jako osobny drawer), który umożliwia użytkownikowi:
- Generowanie całych stron z promptu
- Modyfikację istniejących sekcji
- Generowanie treści (teksty, obrazy)
- Tłumaczenie i adaptację

---

## 2. Architektura

```
User: "Stwórz landing page dla salonu fryzjerskiego"
    ↓
AI Panel (Chat UI)
    ↓
POST /api/ai/generate { prompt, context }
    ↓
AI Service (LLM + Templates)
    ↓
{
  commands: BuilderCommand[],    // seria komend do wykonania
  sections: SectionNode[],       // wygenerowane sekcje
  theme: Partial<BuilderTheme>,  // dobrane kolory/fonty
  text: string,                  // odpowiedź dla użytkownika
}
    ↓
dispatch(commands)              // wykonaj komendy w builderze
    ↓
User widzi stronę z wygenerowanymi sekcjami
```

---

## 3. Funkcje AI

### 3.1 Generate Page

```typescript
interface AIGeneratePage {
  prompt: string;            // "Stwórz landing dla kawiarni"
  
  // Opcjonalne parametry
  style?: string;            // "modern", "minimal", "bold", "elegant"
  pages?: string[];          // ["home", "menu", "contact", "about"]
  sections?: string[];       // ["hero", "features", "gallery", "pricing"]
  tone?: string;             // "professional", "friendly", "luxury"
  industry?: string;         // "restaurant", "beauty", "tech"
  
  // Constraints
  existingTheme?: BuilderTheme;  // użyj istniejącego theme (lub wygeneruj nowy)
}

interface AIGenerateResult {
  commands: BuilderCommand[];        // komendy do wykonania
  sections: SectionNode[];           // wygenerowane sekcje
  theme: Partial<BuilderTheme>;      // dobrane kolory i fonty
  explanation: string;               // opis co zostało wygenerowane
  suggestions: string[];             // sugestie co dalej
}
```

### 3.2 Modify Section

```typescript
interface AIModifySection {
  prompt: string;            // "Zmień tło na gradient fioletowo-różowy"
  sectionId: string;         // ID sekcji do modyfikacji
  section: SectionNode;      // aktualny stan sekcji (kontekst)
}

interface AIModifyResult {
  commands: BuilderCommand[];        // UPDATE_PROPS lub REPLACE_PROPS
  explanation: string;
}
```

### 3.3 Generate Content

```typescript
interface AIGenerateContent {
  prompt: string;            // "Napisz tekst hero dla sklepu z kawą"
  type: 'HEADING' | 'PARAGRAPH' | 'CTA' | 'PRODUCT_DESC' | 'SEO_TITLE' | 'SEO_DESC';
  context?: {
    brandName?: string;
    tone?: string;
    keywords?: string[];
    existingContent?: string;
  };
}

interface AIGenerateContentResult {
  content: string;
  alternatives?: string[];
}
```

### 3.4 Generate Images

```typescript
interface AIGenerateImage {
  prompt: string;            // "Profesjonalne zdjęcie wnętrza salonu fryzjerskiego"
  style?: string;            // "photorealistic", "illustration", "minimal"
  aspect?: string;           // "16:9", "1:1", "4:3"
  size?: 'small' | 'medium' | 'large';
}

interface AIGenerateImageResult {
  url: string;
  assetId: string;           // zapisany w Asset Manager
}
```

### 3.5 Translate

```typescript
interface AITranslate {
  sectionId: string;
  targetLanguage: string;     // "en", "de", "fr", "es", "pl"
  fields: string[];           // ["title", "subtitle", "ctaText"]
}

interface AITranslateResult {
  commands: BuilderCommand[];
  translations: Record<string, string>;
}
```

### 3.6 Explain & Suggest

```typescript
interface AIExplain {
  sectionId: string;
  aspect: 'DESIGN' | 'ACCESSIBILITY' | 'SEO' | 'PERFORMANCE';
}

interface AIExplainResult {
  analysis: string;
  suggestions: string[];
  autoFix?: BuilderCommand[];
}
```

---

## 4. AI Panel UI

### 4.1 Layout

```
┌──────────────────────────────────┐
│  🤖 AI ASSISTANT              [×]│
├──────────────────────────────────┤
│                                  │
│  ┌──────────────────────────┐   │
│  │  Generowanie strony       │   │
│  │                          │   │
│  │  "Stwórz landing page    │   │
│  │   dla salonu             │   │
│  │   fryzjerskiego"         │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌────────────────────────────┐ │
│  │  Wygenerowano 5 sekcji:    │ │
│  │  ✓ Hero                    │ │
│  │  ✓ Usługi                  │ │
│  │  ✓ Galeria                 │ │
│  │  ✓ Opinie                  │ │
│  │  ✓ Kontakt                 │ │
│  │                            │ │
│  │  Kolory: Fiolet + Róż      │ │
│  │  Font: Poppins             │ │
│  │                            │ │
│  │  [🔄 Generuj ponownie]     │ │
│  │  [📝 Edytuj prompt]        │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │  Sugestie                  │ │
│  │  • Zmień tło na gradient   │ │
│  │  • Dodaj galerię zdjęć     │ │
│  │  • Przetłumacz na angielski│ │
│  └────────────────────────────┘ │
│                                  │
├──────────────────────────────────┤
│  [📝 Wpisz komendę...]     [➤] │
└──────────────────────────────────┘
```

### 4.2 Tryby

```
Quick Actions (szybkie przyciski):
┌──────────────────────────────────┐
│  [✨ Generate Page]               │
│  [✏️ Rewrite Text]                │
│  [🎨 Change Style]               │
│  [🌐 Translate to EN]            │
│  [♿ Check Accessibility]         │
│  [🔍 SEO Audit]                  │
└──────────────────────────────────┘

Chat Mode (wolna rozmowa):
┌──────────────────────────────────┐
│  User: Stwórz landing dla        │
│        kawiarni                  │
│  AI: Gotowe! Dodałem hero,       │
│      menu, galerię i kontakt.    │
│  User: Zmień kolor na zielony    │
│  AI: Zmieniłem primary na        │
│      #10B981. Pasuje do kawiarni?│
└──────────────────────────────────┘
```

---

## 5. Context i dane

### 5.1 Co AI wie o stronie

```typescript
interface AIContext {
  // Stan dokumentu
  document: {
    pages: number;
    sections: { type: string; label: string }[];
    theme: BuilderTheme;
  };
  
  // Store info
  store: {
    name: string;
    description: string;
    industry?: string;
    products?: number;
  };
  
  // Selected section (jeśli zaznaczona)
  selectedSection?: {
    type: string;
    label: string;
    props: Record<string, unknown>;
  };
  
  // Historia komend (co użytkownik robił)
  recentCommands: string[];
}
```

### 5.2 Szablony i wzorce

AI używa bazy wzorców:

```typescript
interface AITemplate {
  industry: string;        // "restaurant", "beauty", "tech"
  pages: AIPageTemplate[];
  components: string[];   // rekomendowane komponenty
  theme: {
    colors: string[];     // rekomendowane palety
    fonts: string[];      // rekomendowane fonty
  };
}

interface AIPageTemplate {
  name: string;           // "Home"
  sections: {
    type: string;         // "hero.basic"
    props?: Record<string, unknown>;  // domyślne wartości
    content?: string;     // wygenerowany tekst
  }[];
}
```

---

## 6. Implementacja

### 6.1 Pliki

```
packages/ai-layer/
├── src/
│   ├── AIService.ts          — główny serwis AI
│   ├── AIPromptBuilder.ts    — budowanie promptów
│   ├── AIResponseParser.ts   — parsowanie odpowiedzi
│   ├── AITemplateStore.ts    — baza wzorców
│   ├── AIContextCollector.ts — zbieranie kontekstu
│   └── generators/
│       ├── PageGenerator.ts
│       ├── SectionGenerator.ts
│       ├── ContentGenerator.ts
│       ├── ImageGenerator.ts
│       └── ThemeGenerator.ts

src/components/builder/ai/
├── AIPanel.tsx               — główny panel AI
├── AIChat.tsx                — chat interface
├── AIQuickActions.tsx        — szybkie akcje
├── AIGeneratePageModal.tsx   — modal generowania strony
├── AIModifySection.tsx       — modyfikacja sekcji
├── AIGenerateContent.tsx     — generowanie treści
├── AIImageGenerator.tsx      — generowanie obrazków
├── AITranslate.tsx           — tłumaczenie
├── AIExplain.tsx             — analiza i sugestie
└── hooks/
    └── useAI.ts              — hook do AI
```

### 6.2 API Routes

```
POST /api/ai/generate-page      — generuj stronę
POST /api/ai/modify-section     — modyfikuj sekcję
POST /api/ai/generate-content   — generuj treść
POST /api/ai/generate-image     — generuj obraz
POST /api/ai/translate          — tłumacz
POST /api/ai/explain            — analizuj
POST /api/ai/suggest            — sugestie
```

---

## 7. Security

- Rate limiting (20 requests / hour dla darmowego planu)
- Content filtering (profanity, NSFW)
- Prompt injection protection
- User confirmation przed wykonaniem destructive commands
- Audit log wszystkich AI akcji

