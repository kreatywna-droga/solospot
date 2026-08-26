# DevTools API Reference — Web Factor Authoring Studio v1.1 (Sprint S1)

## Overview

Sprint S1 introduces Developer Experience & Platform Tooling inside `packages/authoring-studio/src/devtools/`.

All exported interfaces and functions operate strictly on pure data models without DOM, React, or Browser APIs.

---

## DevTools Export Registry

### 1. Studio Diagnostics & Health (`StudioDiagnostics.ts`)
- `DiagnosticSeverity`: Severity levels (`info`, `warning`, `error`, `critical`)
- `StudioDiagnosticItem`: Diagnostic log entry DTO
- `StudioDiagnosticsState`: Health state container (`healthy`, `degraded`, `critical`)
- `createStudioDiagnosticsState(items)`: Creates diagnostic state and computes overall health

### 2. Runtime Inspector (`RuntimeInspector.ts`)
- `RuntimeStateDescriptor`: Inspection payload descriptor (timeline ID, transport mode, currentTimeMs, fps, clips, tracks)
- `inspectRuntimeState(timelineId, mode, time)`: Creates runtime inspection descriptor

### 3. State Snapshot Viewer (`StateSnapshotViewer.ts`)
- `StateSnapshotView`: Serialized entity snapshot DTO for DevTools
- `createStateSnapshotView(type, id, version, payload)`: Creates state snapshot view descriptor

### 4. Event Trace Viewer (`EventTraceViewer.ts`)
- `EventTraceEntry`: Event trace log item
- `EventTraceLog`: Append-only event trace log
- `createEventTraceLog(initial)`: Creates trace log
- `appendEventTrace(log, eventName, module, payload)`: Appends event trace entry immutably

### 5. Dependency Graph Viewer (`DependencyGraphViewer.ts`)
- `GraphNode`: Dependency graph node
- `GraphEdge`: Dependency graph edge
- `DependencyGraphView`: Complete graph data model
- `buildStudioDependencyGraphView()`: Builds studio module dependency graph view

### 6. Documentation Generator (`DocumentationGenerator.ts`)
- `GeneratedDocBundle`: Contains API reference, architecture index, module index, decision index markdown strings
- `generateStudioDocumentation()`: Generates documentation bundle from system metadata

### 7. Code Metrics (`CodeMetrics.ts`)
- `ModuleMetrics`: File counts, test suite counts, export counts
- `PackageStatistics`: Package level statistics and test pass rates
- `DependencyMetrics`: Total dependency nodes and cycle counts
- `computeStudioCodeMetrics()`: Computes full studio code metrics report

### 8. Architecture Validator (`ArchitectureValidator.ts`)
- `ArchitectureCheckRule`: Rule validation result
- `ArchitectureValidationResult`: System architecture compliance report
- `validateStudioArchitecture()`: Automates freeze integrity, public API, circular dependency, layer rule, and SSOT checks

### 9. Developer CLI Contracts (`DeveloperCLIContracts.ts`)
- `CLICommandDescriptor`: Declarative CLI command descriptors (`build`, `validate`, `doctor`, `analyze`, `release`, `docs`)
- `ALL_CLI_COMMANDS`: Array of all available developer CLI command descriptors
