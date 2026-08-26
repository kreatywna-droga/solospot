# Typography Engine & Text API Reference — Sprint S17

## 1. Text Domain Model DTOs

### `TextNode`
```typescript
interface TextNode {
  readonly id: string;
  readonly type: 'text';
  readonly name: string;
  readonly content: string;
  readonly style: TextStyle;
  readonly bounds: TextBoundingBox;
  readonly rotationDeg: number;
  readonly locked: boolean;
  readonly visible: boolean;
}
```

### `TextStyle`
```typescript
interface TextStyle {
  readonly fontFamily: string;
  readonly fontSize: number;       // Size in pixels (>= 1)
  readonly fontWeight: FontWeight;
  readonly fontStyle: 'normal' | 'italic' | 'oblique';
  readonly fill: string;           // Hex / RGBA color string
  readonly letterSpacing: number;  // Character spacing in px
  readonly lineHeight: number;     // Multiplier (e.g. 1.2, 1.5)
  readonly align: TextAlignment;   // 'left' | 'center' | 'right' | 'justify'
  readonly direction: TextDirection;
  readonly overflow: TextOverflow;
  readonly opacity: number;
}
```

---

## 2. TypographyEngine API Methods

- **`estimateCharWidth(fontSize, letterSpacing)`**: Estimates average character width without DOM.
- **`computeWordWrap(content, fontSize, letterSpacing, maxWidthPx)`**: Wraps text into lines based on container width.
- **`computeLayoutMetrics(node)`**: Calculates complete layout metrics (`lines`, `baselinePx`, `xOffset`, `yOffset`, `totalHeightPx`).
- **`computeAutoFitBounds(node)`**: Computes auto-fit bounding box dimensions for text content.

---

## 3. TextEditingEngine API Methods

- **`createText(id, content, x, y, customStyle)`**: Creates new `TextNode` DTO.
- **`updateContent(node, newContent)`**: Updates text content and recalculates layout metrics.
- **`updateStyle(node, styleDelta)`**: Updates typography style properties.
- **`resizeTextBox(node, width, height)`**: Resizes text bounding box bounds.
- **`setAlignment(node, align)`**: Sets text alignment (`left`, `center`, `right`, `justify`).
- **`duplicateText(node, offsetX, offsetY)`**: Duplicates text node downstream.
