# Connector API Specification (Sprint S9)

## Overview

Public API reference for Sprint S9 Real Connector Providers and Asset Synchronization.

## Connectors List

### 1. `LocalFileConnector`
- `openProject(path: string): StorageOperationResult`
- `saveProject(doc: BuilderDocument, path: string): StorageOperationResult`
- `saveProjectAs(doc: BuilderDocument, newPath: string): StorageOperationResult`

### 2. `GoogleDriveConnector`
- `upload(request: CloudStorageUploadRequest): CloudStorageUploadResult`
- `download(request: StorageOperationRequest): StorageOperationResult`

### 3. `GitConnector`
- `commit(request: GitCommitRequest): GitOperationResult`
- `push(remote?: string): GitOperationResult`
- `pull(remote?: string): GitOperationResult`
- `getBranchMetadata(): GitBranchMetadata`

### 4. `Cloud Storage (Dropbox / OneDrive / Generic)`
- Implement `CloudStorageConnectorContract` for uniform remote file management.

### 5. `Asset Synchronization`
- `AssetSyncManager.syncAssets(assets: ReadonlyArray<SyncableAsset>): SyncResult`
- `TemplateSync.syncTemplates(templates: ReadonlyArray<SyncableTemplate>): SyncResult`
- `PresetSync.syncPresets(presets: ReadonlyArray<SyncablePreset>): SyncResult`
