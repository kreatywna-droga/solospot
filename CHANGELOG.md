# Changelog — Web Factor Authoring Studio

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-07

### Added — Core Animation Architecture (PM29–PM34) 🔒
- **PM29 — Domain Layer**: Pure data models for `AnimationTimeline`, `AnimationClip`, `AnimationTrack`, `AnimationKeyframe` (DECISION-044).
- **PM30 — Playback Foundation**: `PlaybackController` interface and state machine (`PlaybackState`, `TransportMode`).
- **PM31 — Interpolation Engine**: `AnimationInterpolator` for linear, step, and cubic-bezier easing curves.
- **PM32 — Runtime Bridge**: `AnimationRuntimeBridge` connecting domain timelines to frame generators.
- **PM33 — Trigger Engine**: Declarative event-driven trigger system (`scroll`, `hover`, `click`, `view`).
- **PM34 — Runtime Preview Adapter**: Passive frame payload adapter for live preview canvas synchronization.

### Added — Authoring Studio & Editor UX (PM35–PM40) 🔒
- **PM35 — Inspector 2.0 Animation Panel**: Keyframe value editing controls and easing function presets (DECISION-043, DECISION-045).
- **PM36 — Timeline Editor**: Track management, keyframe dragging, snapping, multi-selection, and zoom navigation.
- **PM37 — Playback Studio Integration**: Integrated transport bar, playback rate controls, and loop toggles delegating to domain playback interfaces (DECISION-042).
- **PM38 — Animation Preview Runtime**: Live preview canvas adapter with viewport scaling and pan controls.
- **PM39 — Animation Authoring UX**: Keyboard shortcuts, context menus, drag-and-drop keyframe manipulation.
- **PM40 — Productivity Workflow**: Presets library, animation templates, and keyframe clipboard operations.

### Added — Production, Assets, Plugins & Enterprise Platform (PM41–PM46) 🔒
- **PM41 — Production Pipeline**: `AnimationExportPipeline` and `AnimationImportPipeline` operating exclusively on serializable DTOs (DECISION-069–074).
- **PM42 — Asset Management**: `AnimationAssetRegistry`, `AnimationAssetBrowser`, `AnimationAssetSearch`, `AnimationDependencyGraph`, `AnimationAssetReference`, `AnimationSharedLibrary` (DECISION-075–079).
- **PM43 — Plugin SDK & Extension Platform**: `PluginManifest`, `PluginRegistry`, `PluginSandbox`, `PublicExtensionAPI` for safe studio extensions without runtime engine access (DECISION-080–084).
- **PM44 — Cloud Collaboration & Publishing**: `ProjectPublisher`, `CloudSyncModel`, `ConflictResolver`, `WorkspaceModel`, `ReviewThreads`, `DeploymentPipeline`, `SnapshotManager` (DECISION-085–089).
- **PM45 — Automation & AI Workflows**: `WorkflowEngine`, `AutomationRule`, `AIAssistance`, `BatchProcessor`, `JobScheduling`, `StudioEvents`, `Telemetry` (DECISION-090–094).
- **PM46 — Enterprise Services & Observability**: `PolicyEngine`, `FeatureFlags`, `Licensing`, `AuditTrail`, `HealthMonitoring`, `DiagnosticsServices`, `StudioConfiguration` (DECISION-095–099).

### Added — Integration, Release Candidate & Beta Hardening (PM47–PM48, PRS-01) 🚀
- **PM47 — Studio Integration & Release Candidate (RC1)**: `StudioIntegrationCoordinator`, `EndToEndWorkflows`, `BuilderDocumentConsistency`, `ReleaseCandidateValidator`, `PerformanceBaseline` (DECISION-100–103).
- **PM48 — Beta Readiness & Production Hardening**: `EndToEndScenarios`, `ApiCompatibilityReport`, `PerformanceValidation`, `StabilityChecklist`, `DocumentationCompleteness`, `BetaReadinessReport` (DECISION-104–107).
- **PRS-01 — Production Stabilization**: Public API Freeze v1.0, Performance Baseline Audit, Release Manifest v1.0.

### Fixed
- Fixed export path resolution in `ProjectPublisher.ts` importing `DEFAULT_PUBLISH_PROFILE` from `PublishProfiles`.
- Resolved all potential circular dependencies across packages.

### Security
- Isolated Plugin SDK sandbox from DOM, Browser API, and Runtime Execution Engine.
- Immutable audit log append-only state in enterprise governance layer.
