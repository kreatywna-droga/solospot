# Sprint S8 — Connector Framework Developer Walkthrough

## Overview

This walkthrough provides a comprehensive guide to the Sprint S8 Connector Framework implementation in the authoring-studio package.

## Architecture Principles

### Core Constraints
- **NO DOM**: No browser DOM manipulation
- **NO React**: No React components or hooks
- **NO Browser API**: No fetch, localStorage, or other browser APIs
- **ZERO Runtime execution**: Pure TypeScript business logic only

### Design Patterns
- Immutable state management (readonly arrays, spread operators)
- Factory functions for object creation
- Pure functions for state transformations
- Interface-based contracts

## Module Structure

```
packages/authoring-studio/src/connectors/
├── ConnectorDefinition.ts      # Core types and factories
├── ConnectorRegistry.ts        # Registration and lookup
├── ConnectorLifecycle.ts       # State machine
├── ConnectorPermissions.ts     # Permission model
├── ImportConnector.ts          # Import contracts
├── ExportConnector.ts          # Export contracts
├── ConnectorCapabilities.ts    # Capability declarations
├── StorageConnector.ts         # Storage contracts
├── MediaLibraryConnector.ts    # Media library contracts
├── CloudStorageConnector.ts    # Cloud storage contracts
├── ConnectorIdentity.ts        # Identity management
├── ConnectorSession.ts         # Session lifecycle
├── ConnectorCredentials.ts     # Credential storage
├── SyncOperation.ts            # Sync DTOs
├── SyncManifest.ts             # Sync manifest
├── SyncResult.ts               # Sync results
├── PayloadNormalizer.ts        # Payload normalization
├── DataTransformer.ts          # Data transformation
└── index.ts                    # Public API
```

## Quick Start

### 1. Creating a Connector

```typescript
import {
  createConnectorDefinition,
  createConnectorRegistry,
  ConnectorLifecycleState,
} from './connectors';

// Define your connector
const myConnector = createConnectorDefinition(
  'my-connector',
  'My Connector',
  '1.0.0',
  ['read', 'write']
);

// Register it
const registry = createConnectorRegistry();
registry.register(myConnector);
```

### 2. Managing Lifecycle

```typescript
import {
  createConnectorLifecycleState,
  transitionTo,
  isConnectorActive,
} from './connectors';

let state = createConnectorLifecycleState();

// Transition through lifecycle
state = transitionTo(state, 'connector-1', 'initializing');
state = transitionTo(state, 'connector-1', 'active');

// Check status
if (isConnectorActive(state, 'connector-1')) {
  // Connector is ready to use
}
```

### 3. Handling Permissions

```typescript
import {
  createConnectorPermissionsConfig,
  grantConnectorAction,
  hasConnectorPermission,
} from './connectors';

let permissions = createConnectorPermissionsConfig('my-connector');
permissions = grantConnectorAction(permissions, 'read');
permissions = grantConnectorAction(permissions, 'write');

if (hasConnectorPermission(permissions, 'read')) {
  // User can read from connector
}
```

### 4. Import/Export Operations

```typescript
import {
  createImportRequest,
  createImportResult,
  createExportRequest,
  createExportResult,
  ImportFormat,
  ExportFormat,
} from './connectors';

// Import
const importRequest = createImportRequest(
  'my-connector',
  'json',
  'file:///data.json',
  { key: 'value' }
);

const importResult = createImportResult(
  'my-connector',
  true,
  'entity-123',
  'animation'
);

// Export
const exportRequest = createExportRequest(
  'my-connector',
  'json',
  'entity-123',
  { animationData: '...' }
);

const exportResult = createExportResult(
  'my-connector',
  true,
  'file:///export.json'
);
```

### 5. Session Management

```typescript
import {
  createConnectorSession,
  isSessionActive,
  getActiveSession,
  revokeSession,
} from './connectors';

// Create session
const session = createConnectorSession(
  'my-connector',
  Date.now() + 3600000, // expires in 1 hour
  { userId: 'user-123' }
);

// Check if active
if (isSessionActive(session)) {
  // Session is valid
}

// Revoke when done
const newState = revokeSession(state, session.sessionId);
```

### 6. Sync Operations

```typescript
import {
  createSyncOperation,
  createSyncManifest,
  createSyncResult,
  SyncOperationType,
  SyncStatus,
} from './connectors';

// Create sync manifest
const manifest = createSyncManifest(
  'my-connector',
  [
    createSyncOperation(SyncOperationType.PUSH, 'entity-1'),
    createSyncOperation(SyncOperationType.PULL, 'entity-2'),
  ]
);

// Execute sync
const result = createSyncResult(
  'my-connector',
  SyncStatus.COMPLETED,
  2, // total
  2, // succeeded
  0, // failed
  0  // skipped
);
```

## Testing

All modules include comprehensive unit tests. Run tests with:

```bash
npx vitest run packages/authoring-studio/src/connectors/__tests__/
```

### Test Coverage
- ConnectorRegistry: 6 tests
- ConnectorLifecycle: 6 tests
- ConnectorPermissions: 5 tests
- ConnectorSessionIdentity: 7 tests
- ImportExportConnector: 7 tests

**Total: 31 unit tests**

## Best Practices

### 1. Always Use Factory Functions
```typescript
// ✅ Good
const state = createConnectorLifecycleState();

// ❌ Bad
const state = { connectors: new Map() };
```

### 2. Maintain Immutability
```typescript
// ✅ Good
const newState = { ...state, connectors: new Map(state.connectors) };

// ❌ Bad
state.connectors.set('id', connector);
```

### 3. Use Readonly Types
```typescript
// ✅ Good
interface MyState {
  readonly items: ReadonlyArray<string>;
}

// ❌ Bad
interface MyState {
  items: string[];
}
```

### 4. Handle Errors Explicitly
```typescript
// ✅ Good
const result = createImportResult(
  'connector',
  false,
  undefined,
  undefined,
  'Error message'
);

// ❌ Bad
const result = { success: false };
```

## Common Patterns

### Pattern 1: State Transitions
Always use the transition functions instead of modifying state directly:

```typescript
import { transitionTo, createConnectorLifecycleState } from './connectors';

let state = createConnectorLifecycleState();
state = transitionTo(state, 'connector-1', 'active');
```

### Pattern 2: Permission Checks
Check permissions before operations:

```typescript
if (hasConnectorPermission(permissions, 'write')) {
  // Perform write operation
}
```

### Pattern 3: Session Validation
Always validate sessions before use:

```typescript
const activeSession = getActiveSession(sessionState, connectorId);
if (activeSession && isSessionActive(activeSession)) {
  // Use session
}
```

## Troubleshooting

### Issue: isolatedModules Error
**Solution**: Ensure all exports use type-only imports/exports where appropriate:

```typescript
// ✅ Good
import type { ConnectorDefinition } from './ConnectorDefinition';

// ❌ Bad
import { ConnectorDefinition } from './ConnectorDefinition';
```

### Issue: Naming Conflicts
**Solution**: Use namespace-specific names:

```typescript
// ✅ Good
import { ImportResult } from './ImportConnector';
import { ExportResult } from './ExportConnector';

// ❌ Bad
import { Result } from './ImportConnector';
```

## Next Steps

1. **Integration**: Connect with Sprint S6 productivity features
2. **Collaboration**: Integrate with Sprint S7 collaboration features
3. **UI Components**: Build React components for connector management
4. **Runtime**: Implement actual connector execution in builder-core

## References

- [Sprint S8 Delta Implementation Report](./S8_DELTA_IMPLEMENTATION_REPORT.md)
- [Architecture Compliance Matrix](../96_ARCHITECTURE_COMPLIANCE_MATRIX.md)
- [Code Evidence Audit Protocol v2.8](../../AGENTS.md)