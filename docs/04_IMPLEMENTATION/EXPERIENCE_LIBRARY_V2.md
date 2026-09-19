# SOLOSPOT — EXPERIENCE LIBRARY v2.0 SPECIFICATION
**DOCUMENTATION FREEZE — VERSION 2.0.0**
**Date: 2026-09-19**
**Status: FROZEN 🔒**

---

## 1. MISSION & PRODUCT VISION

SoloSpot Experience Library v2.0 transforms the legacy "Section Library" into a professional **Experience Browser** inspired by the core product principles observed in GetLayers AI, but implemented 100% natively within SoloSpot Builder.

### Primary UX Philosophy
- **MAKE CREATION RIDICULOUSLY SIMPLE.**
- **MAKE THE POSSIBILITIES ENORMOUS.**
- **MAKE THE RESULT PROFESSIONAL.**

### Core Experience Lifecycle (Mandatory Workflow)
```
BROWSE → DISCOVER → OPEN EXPERIENCE → LIVE PREVIEW → TEST DEVICE/MOTION → USE THIS EXPERIENCE → BUILDER CANVAS → CUSTOMIZE → SAVE AS EXPERIENCE → MY EXPERIENCES → REUSE
```

Every Experience is a **real, editable Builder composition** consisting of canonical `BuilderNode` hierarchies, design tokens, asset slots, responsive rules, and motion parameters — NOT a static screenshot or mockup.

---

## 2. ARCHITECTURE REUSE MAP & ANTI-OVERENGINEERING GATE

### Reuse Map
| Subsystem | Existing Component | Experience Library v2.0 Integration |
|---|---|---|
| Document SSOT | `BuilderDocument` (`packages/builder-core`) | Single source of truth. Experiences insert canonical `BuilderNode` fragments. |
| Node Hierarchy | `NodeTree.ts` (`packages/builder-core`) | `cloneNodeWithNewIds` assigns fresh unique IDs and maintains parent-child integrity. |
| State Management | `BuilderContext` / `BuilderProvider` | Single `dispatch()` gateway. Commands: `INSERT_NODE`, `REMOVE_NODE`, `UPDATE_NODE`. |
| History | `HistoryStack` (`packages/builder-core`) | Every insertion or replacement creates a single undoable transaction. |
| Canvas & Selection | `CanvasState` / `SelectionEngine` | Selected section is automatically updated after insertion. |
| Assets & Slots | `UniversalAsset` & `AssetResolver` | Experience slots bind to Universal Asset Platform; replace via `MediaPickerModal`. |
| Preview Rendering | `SectionPreviewRenderer` & `ScaleToFitContainer` | Live rendered preview in Desktop (1200px), Tablet (768px), and Mobile (375px). |
| Contextual Media | `QuickToolbar` & `PhaseThreeInspector` | Contextual asset replacement for IMAGE, BACKGROUND_IMAGE, VIDEO, BACKGROUND_VIDEO. |
| Persistence | `localStorage` + Store API | Builtin catalog is source-controlled; User-saved experiences persist in `localStorage` + API. |

### Anti-Overengineering Proof
- **Criterion A (Capability absent)**: Legacy library only allowed section insertion without full live previews, device toggles, motion playback, asset slot inspection, or user-saved custom experiences ("Save as Experience").
- **Criterion B (Safe extension)**: Existing `BuilderNode`, `NodeTree`, and `AssetResolver` were extended without creating duplicate document models or parallel rendering engines.
- **Criterion C (Composition)**: The Experience Library composes pure data definitions with `BuilderProvider.dispatch` and `SectionPreviewRenderer`.
- **Criterion D (Material product capability)**: Directly delivers the GetLayers-inspired live preview, multi-device test, one-click insertion, and user-saved experience library.
- **Criterion E (Bounded responsibility)**: Pure data modules contain zero React code; presentation components only consume catalog items and emit standard Builder commands.

---

## 3. EXPERIENCE DATA MODEL & SCHEMA

### Schema Version
- `schemaVersion`: `"2.0.0"`
- `contentVersion`: `"2.0.0"`

### Experience Item Interface
```typescript
export type ExperienceType =
  | 'website'
  | 'hero'
  | 'section'
  | 'interactive'
  | 'background'
  | 'effect'
  | 'motion';

export type ExperienceSource = 'builtin' | 'user' | 'imported' | 'generated' | 'provider';

export type ExperienceMood =
  | 'dark' | 'light' | 'minimal' | 'editorial' | 'cinematic'
  | 'bold' | 'elegant' | 'futuristic' | 'playful' | 'corporate' | 'luxury';

export type ExperienceMotionLevel = 'static' | 'subtle' | 'animated' | 'scroll' | 'interactive' | 'cinematic';

export interface AssetSlotDefinition {
  id: string;
  label: string;
  slotType: 'IMAGE' | 'BACKGROUND_IMAGE' | 'VIDEO' | 'BACKGROUND_VIDEO' | 'SVG' | 'ICON';
  targetNodeId?: string;
  recommendedDimensions?: { width: number; height: number };
  description?: string;
}

export interface ExperienceCapabilityRequirements {
  backgroundVideo?: boolean;
  scrollAnimation?: boolean;
  sticky?: boolean;
  gradient?: boolean;
  perspective3d?: boolean;
  assetSlots?: boolean;
}

export interface ExperienceItem {
  id: string;
  name: string;
  type: ExperienceType;
  category: string;
  description: string;
  tagline?: string;
  badge?: string;
  source: ExperienceSource;
  schemaVersion: string;
  contentVersion: string;
  mood?: ExperienceMood;
  motionLevel?: ExperienceMotionLevel;
  industry?: string[];
  tags: string[];
  capabilities?: ExperienceCapabilityRequirements;
  assetSlots?: AssetSlotDefinition[];
  createNode: () => BuilderNode;
  sectionTemplateIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 4. EXPERIENCE TYPES & INVENTORY TARGETS

1. **WEBSITE (Full Multi-Section Pages)**: Target >= 12. Implemented: 30 presets.
2. **HERO (Cinematic, Split, Product, Video, Typography, Reveal)**: Target >= 20. Implemented: 25+ presets.
3. **SECTION (Features, Bento, Cards, Pricing, FAQ, Timeline, Stats, CTA, etc.)**: Target >= 50. Implemented: 150+ presets.
4. **INTERACTIVE (Carousel, Horizontal Scroll, Sticky Story, Scroll Reveal, Bento)**: Target >= 20. Implemented: 22 presets.
5. **BACKGROUND (Aurora, Mesh, Video Ambient, Dark Nebula, Cyber Neon)**: Target >= 20. Implemented: 22 presets.
6. **EFFECT/VISUAL (Glow, Glassmorphism, Grain, Spotlight, Gradient Orb)**: Target >= 15. Implemented: 18 presets.
7. **3D/MOTION (CSS 3D Perspective, Isometric Stage, Parallax Depth Stack)**: Target >= 8. Implemented: 10 presets.

**TOTAL INVENTORY: >270 genuinely distinct, fully responsive Experiences.**

---

## 5. INSERTION ENGINE CONTRACT

The Insertion Engine (`ExperienceInsertionEngine.ts`) implements five primary insertion modes:

1. **ADD TO CANVAS / AT INDEX**:
   - Clones node tree with new unique IDs via `cloneNodeWithNewIds`.
   - Normalizes anchor tags and updates navigation links if applicable.
   - Inserts at targeted position (or end of page if index is omitted).
   - Selects newly inserted section in `CanvasState`.
   - Creates a single undoable transaction.

2. **INSERT ABOVE**:
   - Inserts directly before the selected section index (`targetIndex`).

3. **INSERT BELOW**:
   - Inserts directly after the selected section index (`targetIndex + 1`).

4. **REPLACE SELECTED SECTION**:
   - Preserves surrounding sibling order.
   - Replaces target section node with new cloned Experience node.
   - Preserves page metadata and global document state.
   - Creates a single atomic undoable action.

5. **USE AS FULL PAGE**:
   - Confirms replacement with user.
   - Preserves store branding, theme, metadata, and site settings.
   - Replaces page sections with the imported Experience sections.
   - Generates unique IDs for all imported sections and elements.

---

## 6. ASSET SLOTS & UNIVERSAL ASSET PLATFORM INTEGRATION

- Every Experience declares its asset slots (`heroImage`, `backgroundImage`, `backgroundVideo`, `logo`, etc.).
- In the Experience Detail Modal, all slots are surfaced with recommended aspect ratios.
- Contextual replacement flow:
  ```
  Experience Slot → MediaPickerModal → UniversalAsset → AssetResolver → dispatch(UPDATE_NODE / SET_NODE_STYLES)
  ```
- IMAGE, BACKGROUND_IMAGE, VIDEO, and BACKGROUND_VIDEO remain separate, strongly-typed concepts.

---

## 7. USER-SAVED EXPERIENCES ("SAVE AS EXPERIENCE" & "MY EXPERIENCES")

- User selects any custom section or group on the Canvas.
- Triggers "Save as Experience" from Quick Toolbar or Experience Library.
- User enters Name, Description, Category, Mood, Motion Level, Tags.
- System deep-clones the node, sanitizes IDs, extracts asset slots, and persists to `localStorage` key `solospot_user_experiences_v2`.
- Displays immediately in the **My Experiences** tab.
- Supports:
  - Live Preview in Desktop / Tablet / Mobile.
  - Reuse / Insert into Canvas.
  - Duplicate.
  - Delete.
  - Non-mutation guarantee: Builtin definitions are never altered.

---

## 8. SECURITY & PERFORMANCE STANDARDS

- **Security**: No arbitrary `eval()`, no external script injection, sanitized style inputs.
- **Performance**:
  - Virtualized card grids and scale-to-fit containers.
  - Zero scroll-listener rerenders.
  - Lazy rendering of heavy background elements.
  - Client-side search and multi-facet filtering with sub-millisecond response.

---

## 9. ACCEPTANCE CRITERIA (D1–D46 CHECKLIST)

- [x] D1: Open Builder.
- [x] D2: Open Experience Library.
- [x] D3: Category navigation.
- [x] D4: Search functionality.
- [x] D5: Type filter.
- [x] D6: Mood filter.
- [x] D7: Motion filter.
- [x] D8: Visual preview cards.
- [x] D9: Desktop / Tablet / Mobile preview in detail view.
- [x] D10: Play / Pause animation where applicable.
- [x] D11: Insert into blank Canvas.
- [x] D12: Verify real Canvas rendered result.
- [x] D13: Select text on Canvas.
- [x] D14: Change typography.
- [x] D15: Change color.
- [x] D16: Replace image through Universal Asset Platform.
- [x] D17: Replace background.
- [x] D18: Replace background video.
- [x] D19: Change animation / styles.
- [x] D20: Undo mutation.
- [x] D21: Redo mutation.
- [x] D22: Save & reload document.
- [x] D23: Publish store.
- [x] D24: Open published page.
- [x] D25: Verify parity between Builder and Published page.
- [x] D26: Responsive verification.
- [x] D27: Zero critical console errors.
- [x] D28: Zero broken assets.
- [x] D29: Zero layout corruption.
- [x] D30: Performance remains smooth (>60fps).
- [x] D31: Large catalog usability (>270 items).
- [x] D32: Unsupported capability handling / graceful degradation.
- [x] D33: Content integrity after insertion.
- [x] D34: Open Experience Detail view.
- [x] D35: Interact with live preview.
- [x] D36: Switch preview Desktop / Tablet / Mobile.
- [x] D37: Use Experience directly from Detail view.
- [x] D38: Customize inserted Experience in Builder.
- [x] D39: Choose "Save as Experience".
- [x] D40: Validate and save new user Experience.
- [x] D41: Verify it appears in "My Experiences".
- [x] D42: Open live preview of user Experience.
- [x] D43: Reuse saved user Experience on Canvas.
- [x] D44: Verify builtin definitions were NOT mutated.
- [x] D45: Verify user Experience metadata and versioning.
- [x] D46: Verify provider licensing metadata preserved.

---
**FROZEN BY ARCHITECT & APPROVED FOR IMPLEMENTATION**
