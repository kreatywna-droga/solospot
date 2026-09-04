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
  BuilderNode,
  NodeType,
  NodeStyles,
  NodeResponsive,
  CompiledDocument,
  CompiledPage,
  CompiledSection,
  CompiledBranding,
} from './BuilderDocument';

export {
  createBuilderDocument,
  createBuilderPage,
  createBuilderNode,
  createSectionNode,
  compile,
  touchDocument,
} from './BuilderDocument';

// C17.1 Phase 1 — Hierarchical NodeTree API
export {
  findNode,
  findNodeInDocument,
  findNodeInTree,
  getNode,
  getParent,
  getChildren,
  insertNode,
  removeNode,
  moveNode,
  duplicateNode,
  updateNode,
  setNodeProps,
  setNodeStyles,
  setNodeLocked,
  setNodeHidden,
  generateNodeId,
  isDescendant,
  hasNodeId,
  cloneNodeWithNewIds,
  nodeTree,
} from './NodeTree';

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
  DEFAULT_SELECTION,
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
export { sectionTree, findNode as findNodeInSectionTree } from './SectionTree';

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

export type { SnapResult, SnapInput, Rect, SelectionBox } from './CanvasState';
export { GridSystem } from './GridSystem';
export {
  createInitialSelection,
  reduceSelection,
  buildBreadcrumbs,
  selectParent,
  isLocked,
  isHidden,
  isSelected,
  isLastClicked,
  isContainer,
  getNextSiblingId,
  getPrevSiblingId,
  computeSelectionBox,
} from './SelectionEngine';
export type { DragCommandOptions } from './DragEngine';
export { createDragCommand, reduceDragState, computeDropTarget, snapDragToGrid } from './DragEngine';
export type { ResizeCommandOptions } from './ResizeEngine';
export { createResizeCommand, reduceResizeState, constrainResize, applyAspectRatio, snapResizeToGrid } from './ResizeEngine';
export { ResponsiveEngine } from './ResponsiveEngine';
export { createAlignCommand, computeAlignment } from './LayoutEngine';
export type { BuilderUXState } from './BuilderUX';
export { createBuilderUX } from './BuilderUX';

// C16.4 — Selection Overlay types & controller
export type {
  HandleType,
  ToolbarActionType,
  ToolbarAction,
  ToolbarPositionResult,
  ToolbarPosition,
  OverlayConfig,
} from './OverlayConstants';
export {
  HANDLE_POSITIONS,
  HANDLE_CURSOR,
  getActiveHandles,
  DEFAULT_OVERLAY_CONFIG,
  TOOLBAR_ACTION_LABEL,
} from './OverlayConstants';

export type {
  OverlayRect,
  OverlayViewport,
} from './OverlayRect';
export {
  createOverlayRect,
  canvasToScreen,
  screenToCanvas,
  overlayRectToScreenRect,
  overlayTransform,
} from './OverlayRect';

export type {
  OverlayState,
} from './OverlayController';
export {
  OverlayController,
  createEmptyOverlayState,
} from './OverlayController';

// C16.7 — Inspector Foundation (Sprint 4A)
export type {
  ValidationResult,
  ValidationError,
  ValidationErrorCode,
  InspectorCategory,
  InspectorGroup,
  PropertyBinding,
} from './InspectorRuntime';
export {
  InspectorRuntime,
} from './InspectorRuntime';

// C16.7 — Property Field Registry (Sprint 4.5)
export type {
  FieldRenderer,
  FieldRendererProps,
  PropertyFieldRegistry,
} from './PropertyRegistry';
export {
  createPropertyFieldRegistry,
} from './PropertyRegistry';

// C16.7 — Property Metadata (Sprint 4.5)
export type {
  PropertyMetadata,
} from './ComponentRegistry';

// C16.31 — Layout Property Types (Sprint 5A)
export type {
  DisplayMode,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  AlignItems,
  AlignContent,
  AlignSelf,
  FlexContainerProps,
  FlexChildProps,
  SpacingValue,
  SpacingProps,
  CSSUnit,
  SizeValue,
  SizeProps,
  PositionType,
  PositionProps,
  OverflowMode,
  OverflowProps,
} from './LayoutTypes';

export {
  DEFAULT_SPACING,
  DEFAULT_SIZE_WIDTH,
  DEFAULT_SIZE_HEIGHT,
  VALID_CSS_UNITS,
  spacingToCSS,
  sizeToCSS,
  positionToCSS,
  displayToCSS,
  overflowToCSS,
  validateSpacingValue,
  validateSizeValue,
  validatePosition,
  validateZIndex,
  validateGap,
  validateOverflow,
  validateOverflowProps,
} from './LayoutTypes';

// C16.49 — Border Property Types (Sprint 5B.3)
export type {
  BorderStyle,
  BorderWidthValue,
  BorderProps,
} from './BorderTypes';

export {
  DEFAULT_BORDER_WIDTH,
  DEFAULT_BORDER_COLOR,
  VALID_BORDER_STYLES,
  borderToCSS,
  validateBorderStyle,
  validateBorderWidthValue,
  validateBorderColor,
  validateBorderProps,
} from './BorderTypes';

// C16.53 — Radius Property Types (Sprint 5B.4)
export type {
  RadiusMode,
  RadiusUnit,
  RadiusValue,
  RadiusProps,
} from './RadiusTypes';

export {
  DEFAULT_RADIUS_MODE,
  DEFAULT_RADIUS_VALUE,
  VALID_RADIUS_UNITS,
  radiusToCSS,
  validateRadiusValue,
  validateRadiusProps,
} from './RadiusTypes';

// C16.19 — Smart Guide Types (Sprint 6B)
export type {
  GuideSource,
  GuideType,
  GuideOrientation,
  GuidePriority,
  ElementBounds,
  ContainerBounds,
  SmartGuide,
  SnapGuidance,
  SmartGuideConfig,
  CalculatorInput,
  GuideCalculator,
  AggregatedGuideResult,
} from './SmartGuideTypes';

export {
  GUIDE_PRIORITY,
  DEFAULT_SNAP_THRESHOLD,
  MAX_DISTANCE_GUIDE_RANGE,
  DEFAULT_SMART_GUIDE_CONFIG,
  createElementBounds,
  createContainerBounds,
  createSmartGuide,
} from './SmartGuideTypes';

export { SmartGuideEngine } from './SmartGuideEngine';
export type { GuideCalculator as GuideCalculatorType, CalculatorInput as CalculatorInputType, AggregatedGuideResult as AggregatedGuideResultType } from './SmartGuideEngine';

// C16.38 — Grid Property Types (Sprint 5B.1)
export type {
  GridUnit,
  TrackSize,
  TrackBreadcrumb,
  TrackList,
  GridAutoFlow,
  GridJustifyContent,
  GridAlignContent,
  GridJustifyItems,
  GridAlignItems,
  GridContainerProps,
  GridSpanValue,
  GridSelfAlignment,
  GridItemProps,
} from './GridTypes';

export {
  DEFAULT_GRID_AUTO_COLUMNS,
  DEFAULT_GRID_AUTO_ROWS,
  DEFAULT_GRID_AUTO_FLOW,
  DEFAULT_SINGLE_COLUMN_TRACK,
  VALID_GRID_UNITS,
  VALID_GRID_AUTO_FLOWS,
  VALID_GRID_CONTENT_ALIGNMENT,
  VALID_GRID_ITEM_ALIGNMENT,
  trackBreadcrumbToCSS,
  trackListToCSS,
  gridSpanToCSS,
  gridContainerToCSS,
  gridItemToCSS,
  gridToCSS,
  validateTrackSize,
  validateTrackBreadcrumb,
  validateTrackList,
  validateGridSpan,
  validateGridAreaName,
  validateGridAutoFlow,
  validateGridContentAlignment,
  validateGridItemAlignment,
  validateGridLineNumber,
  validateGridContainerProps,
  validateGridItemProps,
} from './GridTypes';

// Animation Engine Domain Types (PM29)
export type {
  AnimationTimeline,
  AnimationClip,
  PropertyAnimationTrack,
  AnimationKeyframe,
  AnimationTrigger,
  PlaybackOptions,
  ResponsiveAnimationTimeline,
  EasingCurve,
  FillMode,
  AnimationDirection,
  TriggerType,
} from './animation/AnimationTypes';

export { AnimationValidator } from './animation/AnimationValidator';
export { AnimationSerializer } from './animation/AnimationSerializer';

// Animation Runtime Foundation (PM30)
export { EasingEngine } from './animation/EasingEngine';
export { TimelineEvaluator } from './animation/TimelineEvaluator';
export { PlaybackController } from './animation/PlaybackController';
export type { PlaybackState } from './animation/PlaybackController';

// Animation Interpolation Engine (PM31)
export { AnimationInterpolator } from './animation/AnimationInterpolator';
export { AnimationColorInterpolator } from './animation/AnimationColorInterpolator';
export { AnimationTransformInterpolator } from './animation/AnimationTransformInterpolator';
export { AnimationUnitParser } from './animation/AnimationUnitParser';
export { AnimationInterpolation } from './animation/AnimationInterpolation';
export type { ParsedUnit } from './animation/AnimationUnitParser';
export type { RGBAColor } from './animation/AnimationColorInterpolator';


// Animation Runtime Contracts & Engine (PM30)
export type {
  PlaybackStatus,
  RuntimePlaybackDirection,
  RuntimeFrame,
  RuntimeTrack,
  RuntimeEvaluationResult,
  RuntimeState,
  InterpolationType,
  InterpolationResult,
  PropertyInterpolator,
  RuntimeInterpolationContext,
  RuntimeFrameBatch,
  RuntimeTick,
  RuntimePlaybackSnapshot,
  RuntimeEvaluationContext,
} from './animation/AnimationRuntimeTypes';
export { AnimationPlaybackController } from './animation/AnimationPlaybackController';
export type { PlaybackControllerConfig } from './animation/AnimationPlaybackController';
export { AnimationTimelineEvaluator } from './animation/AnimationTimelineEvaluator';
export {
  easeLinear,
  easeIn,
  easeOut,
  easeInOut,
  resolveEasing,
} from './animation/AnimationEasing';
export type { EasingName } from './animation/AnimationEasing';
export { AnimationRuntimeBridge } from './animation/AnimationRuntimeBridge';
export type { AnimationRuntimeBridgeConfig } from './animation/AnimationRuntimeBridge';
export { RuntimeFrameAssembler } from './animation/RuntimeFrameAssembler';
export { interpolateFrame } from './animation/RuntimeFrameAssembler';
export { RuntimeFrameCache } from './animation/RuntimeFrameCache';
export type { RuntimeFrameCacheOptions } from './animation/RuntimeFrameCache';
export { RuntimeScheduler } from './animation/RuntimeScheduler';
export type { RuntimeSchedulerConfig } from './animation/RuntimeScheduler';

// Animation Trigger Engine & Event Integration (PM33)
export type { TriggerState, TriggerStateMap } from './animation/AnimationTriggerState';
export {
  createTriggerStateMap,
  createTriggerState,
  transitionTriggerState,
  getTriggerState,
  isTriggerSatisfied,
} from './animation/AnimationTriggerState';

export type { TriggerViewport, AnimationTriggerContext } from './animation/AnimationTriggerContext';
export { createTriggerContext } from './animation/AnimationTriggerContext';

export type { TriggerDecision } from './animation/AnimationTriggerEvaluator';
export {
  shouldStart,
  evaluateTrigger,
  resolveTriggerType,
} from './animation/AnimationTriggerEvaluator';

export { AnimationTriggerEngine } from './animation/AnimationTriggerEngine';
export type {
  TriggerEvaluationResult,
  MultiTriggerEvaluationResult,
} from './animation/AnimationTriggerEngine';

// Runtime Preview Adapter Contract & Bridge (PM34)
export type {
  PreviewTriggerMessageType,
  BasePreviewTriggerMessage,
  ScrollPreviewMessage,
  HoverPreviewMessage,
  ClickPreviewMessage,
  IntersectionPreviewMessage,
  ViewportResizePreviewMessage,
  PreviewTriggerMessage,
} from './animation/AnimationPreviewContract';

export {
  createScrollMessage,
  createHoverMessage,
  createClickMessage,
  createIntersectionMessage,
  createViewportResizeMessage,
} from './animation/AnimationPreviewContract';

export { AnimationRuntimePreviewAdapter } from './animation/AnimationRuntimePreviewAdapter';
export type {
  AdapterProcessingResult,
  TriggerEvaluationReport,
  AdapterTriggerEvaluationResult,
} from './animation/AnimationRuntimePreviewAdapter';

export { AnimationTriggerBridge } from './animation/AnimationTriggerBridge';

export {
  AnimationRuntimePreviewBridge,
} from './animation/AnimationRuntimePreviewBridge';
export type {
  PreviewTriggerFrameResult,
} from './animation/AnimationRuntimePreviewBridge';

// Real Rendering Engine (Sprint S10)
export * from './rendering';

// 100+ Google Fonts Catalog
export * from './fonts/FontCatalog';

