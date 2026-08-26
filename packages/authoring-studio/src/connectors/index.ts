/**
 * Connectors Framework Barrel Export — Sprint S8
 *
 * Declarative connector definitions, lifecycle, permissions, import/export, storage, auth, and transformation.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export * from './ConnectorDefinition';
export * from './ConnectorRegistry';
export * from './ConnectorLifecycle';
export * from './ConnectorPermissions';

export { createImportRequest, createImportResult as createConnectorImportResult } from './ImportConnector';
export type {
    ImportFormat,
    ImportRequest,
    ImportConnectorContract,
    ImportResult as ConnectorImportResult,
} from './ImportConnector';

export * from './ExportConnector';
export * from './ConnectorCapabilities';

export * from './StorageConnector';
export * from './CloudStorageConnector';
export * from './MediaLibraryConnector';


export { createConnectorCredentials, hasValidCredentials, getConnectorCredentials, upsertConnectorCredentials, removeConnectorCredentials, createConnectorCredentialsState } from './ConnectorCredentials';
export type { ConnectorCredentials, ConnectorCredentialsState, ConnectorCredentialType } from './ConnectorCredentials';

export * from './ConnectorSession';
export * from './ConnectorIdentity';

export * from './SyncOperation';
export * from './SyncManifest';
export * from './SyncResult';

export * from './DataTransformer';
export * from './PayloadNormalizer';

// Providers & Real Connectors (Sprint S9)
export * from './providers/LocalFileConnector';
export * from './providers/GoogleDriveConnector';
export * from './providers/GitConnector';
export * from './providers/DropboxConnector';
export * from './providers/OneDriveConnector';
export * from './providers/GenericCloudConnector';

// Asset Synchronization (Sprint S9)
export * from './sync/AssetSyncManager';
export * from './sync/TemplateSync';
export * from './sync/PresetSync';
