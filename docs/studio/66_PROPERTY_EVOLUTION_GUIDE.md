# Property Evolution Guide — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 66_PROPERTY_EVOLUTION_GUIDE.md  
> **Status:** Evolution Roadmap  
> **Zależności:** 61_PROPERTY_DESIGN_GUIDELINES.md, 65_ARCHITECTURE_PRINCIPLES.md  
>  
> **Proces:** Strategia Ewolucji Właściwości Wizualnych Buildera

---

## 1. Cel Strategii Ewolucji Właściwości

Dla każdego subsystemu stylów wizualnych w WEB FACTOR Studio zdefiniowano 3-etapową ścieżkę rozwoju (MVP ➔ Faza 2 ➔ Wizja Długoterminowa). Takie podejście zapobiega przeładowaniu pierwszych wersji subsystemów przy jednoczesnym zagwarantowaniu, że architektura danych poradzi sobie z najnowocześniejszymi funkcjami edytorów klasy Wix Studio czy Webflow.

---

## 2. Ścieżki Ewolucji Subsystemów Wizualnych

### 2.1 Border (Obramowania)
```
MVP (Jednolite Border) ➔ Per Edge (Niezależne Krawędzie) ➔ Responsive Border ➔ Variables & Design Tokens ➔ Keyframe Animations
```
* **MVP (Sprint 5B.3):** Szerokość (`borderWidth`), styl (`borderStyle`), kolor (`borderColor`) jednolicie dla całego elementu.
* **Faza 2:** Niezależne obramowania dla krawędzi: `borderTop`, `borderRight`, `borderBottom`, `borderLeft`.
* **Wizja Długoterminowa:** Opakowanie w `ResponsiveValue`, zmienne kolorów i tokeny Design Systemu, gradientowe obramowania (`border-image`) oraz animowany transition przy hoverze.

### 2.2 Radius (Zaokrąglenia)
```
MVP (Jednolity Radius) ➔ Individual Corners (4 Narożniki) ➔ Responsive Radius ➔ Design System Tokens
```
* **MVP (Sprint 5B.4):** Pojedynczy `borderRadius` z obsługą jednostek (`px`, `%`, `rem`).
* **Faza 2:** Niezależna edycja 4 narożników (`topLeft`, `topRight`, `bottomRight`, `bottomLeft`).
* **Wizja Długoterminowa:** Promienie eliptyczne (`rx/ry`), powiązanie z tokenami Design Systemu (np. `radius.md = 8px`).

### 2.3 Background (Tła)
```
MVP (Solid Color / Image) ➔ Gradients (Linear/Radial) ➔ Multiple Overlays ➔ Video Backgrounds ➔ Tokens
```
* **MVP:** Jednolity kolor tła (`backgroundColor`) oraz prosty obrazek tła (`backgroundImage`, `backgroundSize`).
* **Faza 2:** Gradienty liniowe i radialne z wizualnym edytorem punktów kolorów (Gradient Stops).
* **Wizja Długoterminowa:** Nakładanie wielu warstw tła (Multiple Backgrounds), tła wideo w pętli z nakładką przyciemniającą (Overlay Color) oraz dynamiczne zmienne kolorów.

### 2.4 Typography (Typografia)
```
MVP (Font, Size, Weight, Color) ➔ LineHeight & LetterSpacing ➔ TextTransform & Alignment ➔ Custom Web Fonts & Tokens
```
* **MVP:** Podstawowy wybór kroju pisma (`fontFamily`), rozmiaru (`fontSize`), wagi (`fontWeight`) oraz koloru.
* **Faza 2:** Interlinia (`lineHeight`), odstępy między literami (`letterSpacing`), wyrównanie tekstu (`textAlign`) oraz przekształcenia (`textTransform: uppercase/capitalize`).
* **Wizja Długoterminowa:** Dynamiczne ładowanie Google Fonts / Custom Fonts z podglądem w czasie rzeczywistym, tokeny typograficzne (`text.heading-1`) oraz obsługa wycinków tekstu (Text Truncate / Ellipsis).

### 2.5 Shadow (Cienie)
```
MVP (BoxShadow Presets & Basic Offset) ➔ Multiple Shadows ➔ Inset Shadows ➔ Tokens & Hover Transitions
```
* **MVP:** Zdefiniowane gotowe presety cieni (Soft, Medium, Hard) oraz podstawowa edycja `offsetX`, `offsetY`, `blur`, `color`.
* **Faza 2:** Wielokrotne warstwy cieni oraz wsparcie dla cieni wewnętrznych (`inset`).
* **Wizja Długoterminowa:** Tokeny cieni w Design Systemie oraz płynna animacja cienia podczas najechania myszą (Elevation Effect).

### 2.6 Effects (Efekty i Przezroczystość)
```
MVP (Opacity) ➔ MixBlendMode ➔ CSS Filters (Blur, Contrast) ➔ Backdrop Filters (Glassmorphism)
```
* **MVP:** Przezroczystość elementu (`opacity: 0..1`).
* **Faza 2:** Tryby mieszania warstw (`mixBlendMode`) oraz filtry CSS (`blur`, `brightness`, `contrast`).
* **Wizja Długoterminowa:** Efekty rozmycia tła (`backdrop-filter` — Glassmorphism), filtrowanie kolorów i maskowanie kształtem.
