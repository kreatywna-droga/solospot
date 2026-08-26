/**
 * StateSnapshotViewer.ts — Sprint S1 State Snapshot Viewer Model (ETAP 1)
 *
 * State snapshot inspection models and state diff descriptors for DevTools.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface StateSnapshotView {
  readonly snapshotId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly version: number;
  readonly serializedPayload: string;
  readonly capturedAt: number;
}

export function createStateSnapshotView(
  entityType: string,
  entityId: string,
  version: number,
  payload: unknown
): StateSnapshotView {
  return {
    snapshotId: `snap-view-${entityId}-v${version}`,
    entityType,
    entityId,
    version,
    serializedPayload: JSON.stringify(payload),
    capturedAt: Date.now(),
  };
}
