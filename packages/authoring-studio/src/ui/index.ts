/**
 * UI Foundation & Components Barrel Export — Sprint S2 & Sprint S3 Interactive Studio UI
 *
 * Layout System, Theme System, Command System, Workspace Preferences, React Workspace Shell, Timeline UI, Inspector UI, Preview UI, Assets UI, Command Palette UI.
 */

export * from './DockManager';
export * from './WorkspaceLayout';
export * from './PanelRegistry';
export * from './WorkspacePresets';
export * from './ThemeContracts';
export * from './DesignTokens';
export * from './IconRegistry';
export * from './CommandPalette';
export * from './CommandRegistry';
export * from './UserSettings';
export * from './KeyboardProfiles';
export * from './LayoutPersistence';

// Sprint S3 React Component Exports
export * from './components/shell/PanelHost';
export * from './components/shell/DockLayoutHost';
export * from './components/shell/WorkspaceHost';
export * from './components/shell/StudioShell';

export * from './components/timeline/TimelineRuler';
export * from './components/timeline/TimelinePlayhead';
export * from './components/timeline/TimelineSelectionOverlay';
export * from './components/timeline/TimelineTrackView';
export * from './components/timeline/TimelineCanvas';

export * from './components/inspector/PropertyInspector';
export * from './components/inspector/AnimationInspector';
export * from './components/inspector/MultiSelectionInspector';

export * from './components/preview/PreviewCanvas';
export * from './components/preview/PreviewControls';
export * from './components/preview/PlaybackToolbar';

export * from './components/assets/AssetBrowserPanel';
export * from './components/assets/AssetSearchPanel';
export * from './components/assets/AssetCollectionsView';
export * from './components/assets/MediaLibraryPanel';

export * from './components/command/GlobalSearch';
export * from './components/command/QuickActions';
export * from './components/command/CommandPaletteDialog';

export * from './ProfessionalShortcutsHandler';
export * from './components/timeline/GraphEditor';
export * from './components/preview/MotionPathEditor';
export * from './components/preview/CanvasObjectManipulator';
export * from './components/preview/OnionSkinOverlay';

// Sprint S4 Runtime Integration
export * from './runtime/index';

// Sprint S21 & S22 Professional Viewport & Selection UX
export * from './components/viewport/ZoomControls';
export * from './components/viewport/MultiViewportContainer';
export * from './components/viewport/RulersGuides';
export * from './components/selection/SelectionOverlay';
