# C16.24 — WEB FACTOR Studio Interactions

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 24_INTERACTIONS.md  
> **Status:** Draft  
> **Zależności:** 11_ANIMATION_ENGINE.md, 04_SELECTION_SYSTEM.md

---

## 1. Cel

Interactions to system IF/WHEN/THEN — użytkownik definiuje zachowanie elementu w odpowiedzi na zdarzenia. To nie są tylko animacje — to w pełni funkcjonalny system interakcji.

**Różnica między Animation a Interactions:**
- **Animation** — jak element się pojawia (fade, slide)
- **Interactions** — co się dzieje, gdy użytkownik coś robi (klik, hover, scroll, klawiatura)

---

## 2. Koncepcja

```
┌──────────────────────────────────────────────────────┐
│  INTERACTION EDITOR                                   │
│                                                       │
│  When: [Hover ▼]                                      │
│    Over: [Button]                                     │
│    ↓                                                   │
│  Then:                                                 │
│    ├── Change Color → [Primary → Accent]              │
│    ├── Scale → [1.0 → 1.1]                            │
│    ├── Show → [Tooltip]                               │
│    └── + Add Action                                   │
│                                                       │
│  ┌────────────────────────────────────────────┐      │
│  │  [Button] ← hover → scale + color change   │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

---

## 3. Typy triggerów

```typescript
type InteractionTrigger =
  // Mouse
  | 'HOVER'            // mouse enter/leave
  | 'CLICK'            // click
  | 'DOUBLE_CLICK'     // double click
  | 'RIGHT_CLICK'      // context menu
  | 'MOUSE_DOWN'
  | 'MOUSE_UP'
  | 'MOUSE_ENTER'
  | 'MOUSE_LEAVE'
  
  // Scroll
  | 'SCROLL_INTO_VIEW'    // element w widoku
  | 'SCROLL_OUT_OF_VIEW'  // element poza widokiem
  | 'SCROLL_PROGRESS'     // scroll progress (0-100%)
  | 'SCROLL_TOP'          // scroll position
  | 'SCROLL_DIRECTION'    // up / down
  
  // Page
  | 'PAGE_LOAD'
  | 'PAGE_UNLOAD'
  | 'PAGE_VISIBLE'        // visibility change
  
  // Keyboard
  | 'KEY_DOWN'
  | 'KEY_UP'
  | 'KEY_PRESS'
  
  // Touch
  | 'TOUCH_START'
  | 'TOUCH_END'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'SWIPE_UP'
  | 'SWIPE_DOWN'
  | 'PINCH'
  
  // Form
  | 'FORM_SUBMIT'
  | 'FORM_FOCUS'
  | 'FORM_BLUR'
  | 'FORM_CHANGE'
  | 'FORM_VALID'
  | 'FORM_INVALID'
  
  // Media
  | 'VIDEO_PLAY'
  | 'VIDEO_PAUSE'
  | 'VIDEO_END'
  | 'VIDEO_PROGRESS'
  
  // Custom
  | 'CUSTOM_EVENT'       // nazwa zdarzenia
  | 'TIMER'              // delay / interval
  | 'CONDITION'          // zmienna → wartość
  | 'ANIMATION_END';     // po zakończeniu innej animacji
```

---

## 4. Typy akcji

```typescript
type InteractionAction =
  // Styling
  | 'CHANGE_STYLE'          // zmień dowolny CSS property
  | 'CHANGE_CLASS'          // dodaj/usuń klasę CSS
  | 'TOGGLE_CLASS'
  | 'ANIMATE'               // uruchom animację
  | 'STOP_ANIMATION'
  
  // Visibility
  | 'SHOW'                  // pokaż element
  | 'HIDE'                  // ukryj element
  | 'TOGGLE_VISIBILITY'     // toggle
  
  // Transform
  | 'MOVE'                  // przesuń o (x, y)
  | 'ROTATE'                // obróć o deg
  | 'SCALE'                 // skaluj
  | 'FLIP'                  // odbicie
  | 'RESIZE'                // zmień rozmiar
  
  // Navigation
  | 'NAVIGATE'              // idź do URL
  | 'SCROLL_TO'             // scroll do elementu
  | 'SCROLL_BY'             // scroll o px
  | 'OPEN_MODAL'            // otwórz modal z treścią
  | 'CLOSE_MODAL'
  | 'OPEN_POPUP'            // nowe okno
  | 'OPEN_DRAWER'
  
  // Content
  | 'CHANGE_TEXT'           // zmień tekst
  | 'CHANGE_IMAGE'          // zmień obrazek
  | 'CHANGE_HTML'           // wstaw HTML
  | 'CHANGE_ATTRIBUTE'      // zmień atrybut
  
  // Form
  | 'SUBMIT_FORM'
  | 'RESET_FORM'
  | 'SET_VALUE'             // ustaw wartość pola
  | 'FOCUS'                 // focus na polu
  | 'VALIDATE'
  
  // Data
  | 'SET_VARIABLE'          // ustaw zmienną
  | 'TOGGLE_VARIABLE'
  | 'API_CALL'              // wykonaj fetch
  | 'SET_COOKIE'
  | 'SET_LOCAL_STORAGE'
  
  // Media
  | 'PLAY_VIDEO'
  | 'PAUSE_VIDEO'
  | 'STOP_VIDEO'
  | 'SEEK_VIDEO'
  | 'PLAY_AUDIO'
  
  // Component
  | 'SHOW_COMPONENT'        // pokaż inny komponent
  | 'HIDE_COMPONENT'
  | 'TOGGLE_COMPONENT'
  | 'REFRESH_COLLECTION'   // odśwież dane z kolekcji
  
  // Advanced
  | 'RUN_JAVASCRIPT'        // custom JS
  | 'TRIGGER_EVENT'         // wyślij custom event
  | 'CONSOLE_LOG'           // debug
  | 'TRACK_EVENT'           // analytics event
  | 'SET_CSS_VARIABLE';     // zmień CSS custom property
```

---

## 5. Interaction Editor UI

### 5.1 Lista interakcji dla elementu

```
┌──────────────────────────────────────────────────────┐
│  INTERACTIONS                              [+ Add]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ ① Hover → Scale + Color change               │  │
│  │   When: Mouse Enter                           │  │
│  │   Then: Scale(1.1), Change Color(#7C3AED)    │  │
│  │   When: Mouse Leave                           │  │
│  │   Then: Scale(1.0), Change Color(original)    │  │
│  │                                              │  │
│  │  [Edit] [Duplicate] [Delete] [⏹ Disable]    │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ ② Click → Open modal                          │  │
│  │   When: Click                                  │  │
│  │   Then: Open Modal("product-123")             │  │
│  │                                              │  │
│  │  [Edit] [Duplicate] [Delete]                 │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 5.2 Interaction Builder

```
┌──────────────────────────────────────────────────────┐
│  NEW INTERACTION                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Step 1: When                                         │
│  ┌────────────────────────────────────────────────┐  │
│  │ Trigger: [Hover ▼]                             │  │
│  │   ▼ Options                                    │  │
│  │   □ On enter only                               │  │
│  │   □ On leave only                               │  │
│  │   □ Delay: [0] ms                               │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Step 2: Then                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │ Action 1: [Animate ▼]                          │  │
│  │   Animation: [Scale]                           │  │
│  │   Target: [This Element ▼]                    │  │
│  │   Value: [1.1]                                 │  │
│  │   Duration: [0.3] s                            │  │
│  │   Easing: [Ease Out ▼]                         │  │
│  │                                                │  │
│  │  [+ Add Action]                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Step 3: Conditions (optional)                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ Only when: [Variable ▼] [is ▼] [true ▼]       │  │
│  │ [+ Add Condition]                              │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [Cancel] [Save Interaction]                         │
└──────────────────────────────────────────────────────┘
```

---

## 6. Implementacja

```typescript
interface Interaction {
  id: string;
  name: string;
  enabled: boolean;
  
  // Triggers
  trigger: InteractionTrigger;
  triggerConfig?: {
    key?: string;               // dla KEY_DOWN
    direction?: 'UP' | 'DOWN';  // dla SCROLL
    threshold?: number;         // dla SCROLL_PROGRESS
    delay?: number;             // ms
    repeat?: boolean;
  };
  
  // Conditions
  conditions?: InteractionCondition[];
  
  // Actions
  actions: InteractionActionConfig[];
  
  // Timing
  animation?: {
    duration: number;
    easing: EasingFunction;
    delay: number;
  };
}

interface InteractionCondition {
  type: 'VARIABLE' | 'ELEMENT_STATE' | 'VIEWPORT' | 'DEVICE' | 'USER';
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER' | 'LESS' | 'CONTAINS' | 'IS' | 'IS_NOT';
  value: any;
}

interface InteractionActionConfig {
  type: InteractionAction;
  target: 'SELF' | 'PARENT' | 'CHILD' | 'CLASS' | 'ID' | 'SELECTOR';
  targetValue?: string;       // class name, ID, selector
  properties: Record<string, any>;  // zależne od typu akcji
}
```

---

## 7. Komenda

```typescript
type BuilderCommandType = /* ... */ | 'ADD_INTERACTION' | 'UPDATE_INTERACTION' | 'REMOVE_INTERACTION';

{
  type: 'ADD_INTERACTION',
  pageId: string,
  sectionId: string,
  interaction: Interaction,
}
```

---

## 8. Pliki

```
packages/builder-core/src/
├── Interactions.ts            — model

src/components/builder/interactions/
├── InteractionsPanel.tsx      — panel interakcji
├── InteractionEditor.tsx      — builder interakcji
├── InteractionTriggerSelect.tsx — wybór triggera
├── InteractionActionSelect.tsx  — wybór akcji
├── InteractionConditionEditor.tsx — edytor warunków
├── InteractionList.tsx        — lista interakcji dla elementu
└── hooks/
    └── useInteractions.ts
```

