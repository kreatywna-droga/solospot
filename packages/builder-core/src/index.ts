/**
 * builder-core — public API
 *
 * IMPORT RULES:
 *   ✅ builder-core may be imported by: app layer, Builder UI (future)
 *   ❌ runtime-core must NOT import builder-core
 *   ❌ publish-core must NOT import builder-core
 *   ❌ deployment-core must NOT import builder-core
 *
 * The dependency arrow is ONE-WAY:
 *   Builder Core → compile() → Runtime/Publish
 */

// C6.1-A — Core type contracts
export type {
  BuilderDocument,
  BuilderPage,
  BuilderTheme,
  BuilderSEO,
  BuilderMetadata,
  SectionNode,
  CompiledDocument,
  CompiledPage,
  CompiledSection,
  CompiledBranding,
} from './BuilderDocument';

export {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  compile,
  touchDocument,
} from './BuilderDocument';

export type {
  CanvasState,
  CanvasMode,
  CanvasAction,
  DragState,
  ViewportSize,
  ViewportLabel,
} from './CanvasState';

export {
  createCanvasState,
  reduceCanvasState,
  VIEWPORT_PRESETS,
} from './CanvasState';

export type {
  BuilderComponentRegistry,
  ComponentDescriptor,
  PropSchema,
  PropSchemaType,
  PropSchemaBase,
  StringPropSchema,
  NumberPropSchema,
  SelectPropSchema,
  ArrayPropSchema,
  ObjectPropSchema,
} from './ComponentRegistry';

export {
  createBuilderComponentRegistry,
  stringProp,
  textProp,
  colorProp,
  imageProp,
  booleanProp,
  selectProp,
  numberProp,
  arrayProp,
} from './ComponentRegistry';

// C6.1-A/B — Section tree operations
export type { SectionTreeOps } from './SectionTree';
export { sectionTree, findNode } from './SectionTree';

// C6.1-B — Commands & mutations
export type { BuilderCommand, BuilderCommandType } from './BuilderCommands';
export { applyCommandToDocument, commandLabel } from './BuilderCommands';

// C6.1-B — History
export type { HistoryStack, HistoryEntry } from './HistoryStack';
export { createHistoryStack } from './HistoryStack';

// C6.1-C — Preview message types
export type {
  PreviewMessage,
  PreviewMessageType,
  PreviewAck,
  PreviewAckType,
  DocumentUpdateMessage,
  SectionUpdateMessage,
  SectionHighlightMessage,
  ViewportChangeMessage,
  ThemeUpdateMessage,
} from './PreviewMessage';

export {
  createDocumentUpdate,
  createSectionUpdate,
  createSectionHighlight,
  createViewportChange,
  createThemeUpdate,
} from './PreviewMessage';

// C6.1-C — Preview channel
export type { PreviewChannel, MemoryChannelPair } from './PreviewContract';
export { createPostMessageChannel, createMemoryChannel } from './PreviewContract';

// C6.1-C — Preview runtime adapter (isolated runtime-core bridge)
export type { PreviewRenderer, PreviewRuntimeAdapter } from './PreviewRuntimeAdapter';
export { createPreviewRuntimeAdapter } from './PreviewRuntimeAdapter';

// C6.1-D — BuilderContext
export type { BuilderContext } from './BuilderContext';
export { createBuilderContext } from './BuilderContext';

// C7 — Builder Pro
export type {
  ResizeState,
  ResizeHandle,
  SelectionState,
  GridConfig,
  Alignment,
  SmartHandle,
  BreadcrumbItem,
} from './CanvasState';
export { DEFAULT_GRID_CONFIG } from './CanvasState';

export type { SnapResult, SnapInput } from './CanvasState';
export { GridSystem } from './GridSystem';
export type {
  createInitialSelection,
  reduceSelection,
  buildBreadcrumbs,
  selectParent,
  isLocked,
  isHidden,
} from './SelectionEngine';
export type { DragCommandOptions } from './DragEngine';
export { createDragCommand, reduceDragState, computeDropTarget, snapDragToGrid } from './DragEngine';
export type { ResizeCommandOptions } from './ResizeEngine';
export { createResizeCommand, reduceResizeState, constrainResize, applyAspectRatio, snapResizeToGrid } from './ResizeEngine';
export { ResponsiveEngine } from './ResponsiveEngine';
export { createAlignCommand, computeAlignment } from './LayoutEngine';
export type { BuilderUXState } from './BuilderUX';
export { createBuilderUX } from './BuilderUX';
