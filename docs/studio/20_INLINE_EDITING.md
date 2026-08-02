# C16.20 — WEB FACTOR Studio Inline Editing

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 20_INLINE_EDITING.md  
> **Status:** Draft  
> **Zależności:** 03_CANVAS_ENGINE.md, 04_SELECTION_SYSTEM.md

---

## 1. Cel

Inline Editing pozwala użytkownikowi edytować tekst bezpośrednio na canvasie — double-click, pisz, Enter. Dokładnie jak w Wix Studio, Framer czy Canvie.

**Problem obecnego rozwiązania:** Kliknij → Inspector → znajdź pole → wpisz → Enter.  
**Rozwiązanie:** Double-click na tekście → edycja w miejscu.

---

## 2. Flow

```
1. Użytkownik double-kliknie na tekście w canvasie
    ↓
2. PreviewFrame wysyła: ELEMENT_DBLCLICK { sectionId, field: 'title' }
    ↓
3. BuilderCanvas odbiera → przełącza w tryb INLINE_EDIT
    ↓
4. Nad tekstem pojawia się contentEditable div (lub textarea)
    ↓
5. Użytkownik pisze / kasuje / formatuje
    ↓
6. Enter (lub kliknięcie poza) → dispatch(UPDATE_PROPS)
    ↓
7. Preview odświeża się z nowym tekstem
```

---

## 3. Implementacja

### 3.1 Wykrywanie double-click

```typescript
// W PreviewFrame (iframe → builder)
interface InlineEditMessage {
  messageType: 'ELEMENT_DBLCLICK';
  sectionId: string;
  field: string;              // 'title' | 'subtitle' | 'ctaText' | 'content'
  textContent: string;        // aktualny tekst
  boundingBox: BoundingBox;   // pozycja dla overlay
  styles?: {
    fontSize: string;
    fontFamily: string;
    color: string;
    textAlign: string;
    // ... inne style dla overlay
  };
}
```

### 3.2 Inline Edit Overlay

```
Po double-clicku:

┌──────────────────────────────────────┐
│  Hero Banner                          │
│                                       │
│  ┌───────────────────────────────┐   │
│  │ [Edytowalny tekst]            │   │
│  │ Witaj w naszym sklepie!      │   │
│  │                               │   │
│  │ ── kursor ──                  │   │
│  └───────────────────────────────┘   │
│                                       │
│  [✓] [×]                             │
└──────────────────────────────────────┘
```

### 3.3 ContentEditable

```typescript
function InlineEditor({
  sectionId,
  field,
  initialText,
  boundingBox,
  styles,
  onComplete,
  onCancel,
}: InlineEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { dispatch } = useBuilder();
  
  useEffect(() => {
    // Focus + zaznacz cały tekst
    if (ref.current) {
      ref.current.focus();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === 'Escape') {
      onCancel?.();
    }
  };
  
  const commitEdit = () => {
    const text = ref.current?.textContent ?? initialText;
    dispatch({
      type: 'UPDATE_PROPS',
      pageId: selectedPageId,
      sectionId,
      props: { [field]: text },
    });
    onComplete?.();
  };
  
  return (
    <div
      className="inline-editor"
      style={{
        position: 'absolute',
        left: boundingBox.x,
        top: boundingBox.y,
        width: boundingBox.width,
        minHeight: boundingBox.height,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        color: styles.color,
        textAlign: styles.textAlign,
        // ... pozostałe style
      }}
    >
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        className="outline-none bg-transparent"
      >
        {initialText}
      </div>
    </div>
  );
}
```

### 3.4 Rich Text Toolbar (podstawowy)

```
Po zaznaczeniu tekstu (selection) pojawia się mini toolbar:

[Bold] [Italic] [Link] [H2] [Bullet List]

Pozycja: nad zaznaczonym tekstem (jak medium-editor)
```

```typescript
function InlineToolbar({ selection }: { selection: Selection }) {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  return (
    <div
      className="inline-toolbar"
      style={{
        position: 'absolute',
        left: rect.left + rect.width / 2,
        top: rect.top - 40,
        transform: 'translateX(-50%)',
      }}
    >
      <button onClick={() => document.execCommand('bold')}>
        <Bold />
      </button>
      <button onClick={() => document.execCommand('italic')}>
        <Italic />
      </button>
      <button onClick={() => document.execCommand('insertUnorderedList')}>
        <List />
      </button>
      <button onClick={() => {
        const url = prompt('Link URL:');
        if (url) document.execCommand('createLink', false, url);
      }}>
        <Link />
      </button>
    </div>
  );
}
```

---

## 4. Obsługa różnych typów pól

```typescript
// Różne typy pól obsługują inline edit inaczej

interface InlineEditHandler {
  field: string;
  type: 'text' | 'heading' | 'paragraph' | 'link' | 'list' | 'button';
  format?: 'plain' | 'rich' | 'markdown';
  selectOnFocus: boolean;
  multiline: boolean;
  maxLength: number;
  placeholder: string;
}

// Mapowanie pól w schema
const INLINE_EDITABLE_FIELDS: Record<string, InlineEditHandler[]> = {
  'hero.basic': [
    { field: 'title', type: 'heading', format: 'plain', selectOnFocus: true, multiline: false, maxLength: 200, placeholder: 'Wpisz nagłówek...' },
    { field: 'subtitle', type: 'paragraph', format: 'plain', selectOnFocus: true, multiline: false, maxLength: 500, placeholder: 'Wpisz podtytuł...' },
    { field: 'ctaText', type: 'button', format: 'plain', selectOnFocus: true, multiline: false, maxLength: 50, placeholder: 'CTA text...' },
  ],
  'features.grid': [
    { field: 'title', type: 'heading', format: 'plain', selectOnFocus: true, multiline: false, maxLength: 200, placeholder: 'Nagłówek sekcji...' },
    { field: 'description', type: 'paragraph', format: 'rich', selectOnFocus: false, multiline: true, maxLength: 1000, placeholder: 'Opis...' },
  ],
};
```

---

## 5. Pliki

```
src/components/builder/canvas/
├── InlineEditor.tsx              — główny edytor inline
├── InlineToolbar.tsx             — mini toolbar (bold, italic, link)
├── InlineEditProvider.tsx        — provider stanu inline edit
└── hooks/
    └── useInlineEdit.ts          — hook do inline edycji
```

