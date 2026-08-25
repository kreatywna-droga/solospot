export * from './AuthoringProject';
export * from './Workspace';
export * from './DraftManager';
export * from './TemplateAuthor';
export * from './ThemeAuthor';
export * from './ComponentAuthor';
export * from './AssetIntegration';
export * from './LivePreview';
export * from './ValidationCenter';
export * from './MarketplacePublish';

// Inspector 2.0 Animation Panel Integration (PM35)
export * from './inspector/registry/animationPropertyFields';
export * from './inspector/animationDocumentBinding';
export * from './inspector/panels/AnimationPanelAdapter';
export * from './inspector/panels/AnimationPanel';

// Timeline Editor & Playback Studio Integration (PM36 & PM37)
export * from './timeline/index';

// Sprint S24 — Professional Timeline & Keyframe Authoring UX (existing)
// Sprint S25 — Professional Asset Management & Media Library UX (see ./assets/index)
// (assets/index already re-exported above under PM42.)

// Animation Preview Runtime & Live Canvas Synchronization (PM38)
export * from './preview/index';

// Animation Production Features & Export Pipeline (PM41)
export * from './production/index';

// Studio Collaboration & Asset Management (PM42)
export * from './assets/index';

// Plugin SDK & Extension Platform (PM43)
export * from './plugins/index';

// Cloud Collaboration, Publishing & Deployment Platform (PM44)
export * from './cloud/index';

// Automation, AI Workflows & Studio Orchestration (PM45)
export * from './automation/index';

// Enterprise Services, Governance & Observability (PM46)
export * from './enterprise/index';

// Studio Integration, End-to-End Workflows & Release Candidate (PM47)
export * from './integration/index';

// Beta Readiness, Production Hardening & End-to-End Validation (PM48)
export * from './beta/index';

// Developer Experience & Platform Tooling (Sprint S1)
export * from './devtools/index';

// Visual Studio UI Framework & UI Foundation (Sprint S2)
export * from './ui/index';

// Studio Application Features & Production UX (Sprint S5)
export * from './project/index';

// Productivity System & Global Commands (Sprint S6)
export * from './productivity/index';

// Collaboration Workspace & Review System (Sprint S7)
export * from './collaboration/index';

// Connector Framework & External Integrations (Sprint S8)
export * from './connectors/index';

// Professional Layers, Compositing & Scene Graph System (Sprint S19)
export * from './scene/index';

// Professional Masks, Effects & Advanced Compositing System (Sprint S20)
export * from './masks/index';
export * from './effects/index';

// Professional Camera, Viewport & Multi-Canvas System (Sprint S21)
export * from './camera/index';

// Professional Selection, Transform & Interaction System (Sprint S22)
export * from './selection/index';

// Professional Canvas Interaction & Navigation System (Sprint S23)
export * from './navigation/index';
export * from './guides/index';
export * from './interaction/index';

// Sprint S27 — Professional Export, Render Queue & Publishing UX
export * from './export';

// Sprint S28 — Responsive & Adaptive Breakpoint Layout System
export * from './responsive/index';

// Sprint S29 — Layout Constraints & Auto Layout System
export * from './layout/index';

// Sprint S30 — Layout Inspector Domain Layer (headless, S29/S28 orchestration)
export * from './layout-inspector/index';

// Sprint S31 — Live Preview & Responsive Viewport Canvas UX
export * from './viewport-preview/index';

// Sprint S32 — Component Systems, Presets & Slot Composition Subsystem
export * from './components/index';

// Explicit disambiguated re-exports to resolve TS2308 collision across subsystems
export { clearSelection } from './timeline/index';
export type { PublishResult } from './cloud/index';
export type { StudioCommand } from './productivity/index';
export { undo, redo } from './AuthoringProject';
export { updateContainerBounds } from './responsive/index';

// Sprint G1-54 / G1-55 Page Section & Block Composition & Interaction System
export * from './composition/index';
