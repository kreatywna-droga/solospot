/**
 * G1-185: Package Lifecycle Validator
 *
 * Tracks package lifecycle states (DRAFT → ACTIVE → DEPRECATED → REMOVED),
 * validates transitions, maintains history, and detects stale packages.
 *
 * HONESTY BOUNDARY: This is a state-tracking and audit tool.
 * It does NOT modify package files or trigger deployment pipelines.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PackageLifecycleState = 'DRAFT' | 'ACTIVE' | 'DEPRECATED' | 'REMOVED';

export interface PackageLifecycleRecord {
  readonly packageName: string;
  readonly state: PackageLifecycleState;
  readonly createdAtMs: number;
  readonly activatedAtMs?: number;
  readonly deprecatedAtMs?: number;
  readonly removedAtMs?: number;
  readonly reason?: string;
}

export interface LifecycleTransition {
  readonly from: PackageLifecycleState;
  readonly to: PackageLifecycleState;
  readonly timestampMs: number;
  readonly reason?: string;
}

export interface LifecycleReport {
  readonly timestamp: string;
  readonly totalPackages: number;
  readonly byState: Record<PackageLifecycleState, number>;
  readonly packages: ReadonlyArray<PackageLifecycleRecord>;
}

// ---------------------------------------------------------------------------
// Valid Transitions
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: ReadonlyMap<PackageLifecycleState, ReadonlySet<PackageLifecycleState>> = new Map([
  ['DRAFT',     new Set(['ACTIVE'])],
  ['ACTIVE',    new Set(['DEPRECATED', 'REMOVED'])],
  ['DEPRECATED', new Set(['REMOVED'])],
  ['REMOVED',   new Set()],
]);

// ---------------------------------------------------------------------------
// Package Lifecycle Validator
// ---------------------------------------------------------------------------

export class PackageLifecycleValidator {
  private _records: Map<string, PackageLifecycleRecord> = new Map();
  private _history: Map<string, LifecycleTransition[]> = new Map();

  /**
   * Register a new package in DRAFT state.
   */
  registerPackage(packageName: string): void {
    const record: PackageLifecycleRecord = {
      packageName,
      state: 'DRAFT',
      createdAtMs: Date.now(),
    };
    this._records.set(packageName, record);
  }

  /**
   * Transition a package from DRAFT to ACTIVE.
   */
  activatePackage(packageName: string, reason?: string): boolean {
    const record = this._records.get(packageName);
    if (!record || record.state !== 'DRAFT') return false;

    this._transition(packageName, 'ACTIVE', reason);
    return true;
  }

  /**
   * Transition a package from ACTIVE to DEPRECATED.
   */
  deprecatePackage(packageName: string, reason: string): boolean {
    const record = this._records.get(packageName);
    if (!record || record.state !== 'ACTIVE') return false;

    this._transition(packageName, 'DEPRECATED', reason);
    return true;
  }

  /**
   * Transition a package from ACTIVE or DEPRECATED to REMOVED.
   */
  removePackage(packageName: string, reason: string): boolean {
    const record = this._records.get(packageName);
    if (!record || (record.state !== 'ACTIVE' && record.state !== 'DEPRECATED')) return false;

    this._transition(packageName, 'REMOVED', reason);
    return true;
  }

  /**
   * Return the current state of a package.
   */
  getPackageState(packageName: string): PackageLifecycleState | undefined {
    return this._records.get(packageName)?.state;
  }

  /**
   * Check if a state transition is valid according to the lifecycle rules.
   */
  validateTransition(from: PackageLifecycleState, to: PackageLifecycleState): boolean {
    return VALID_TRANSITIONS.get(from)?.has(to) ?? false;
  }

  /**
   * Return the full transition history for a package.
   */
  getTransitionHistory(packageName: string): ReadonlyArray<LifecycleTransition> {
    return this._history.get(packageName) ?? [];
  }

  /**
   * Generate a lifecycle report for all registered packages.
   */
  getLifecycleReport(): LifecycleReport {
    const byState: Record<PackageLifecycleState, number> = {
      DRAFT: 0,
      ACTIVE: 0,
      DEPRECATED: 0,
      REMOVED: 0,
    };

    for (const record of this._records.values()) {
      byState[record.state]++;
    }

    return {
      timestamp: new Date().toISOString(),
      totalPackages: this._records.size,
      byState,
      packages: Array.from(this._records.values()),
    };
  }

  /**
   * Find packages that have been in their current state longer than the threshold.
   * Uses createdAtMs for DRAFT, activatedAtMs for ACTIVE, deprecatedAtMs for DEPRECATED,
   * removedAtMs for REMOVED.
   */
  findStalePackages(thresholdMs: number): ReadonlyArray<PackageLifecycleRecord> {
    const now = Date.now();
    const stale: PackageLifecycleRecord[] = [];

    for (const record of this._records.values()) {
      const timestamp = this.getRelevantTimestamp(record);
      if (timestamp !== undefined && now - timestamp > thresholdMs) {
        stale.push(record);
      }
    }

    return stale;
  }

  // ── Private helpers ──

  private _transition(packageName: string, newState: PackageLifecycleState, reason?: string): void {
    const record = this._records.get(packageName);
    if (!record) return;

    const oldState = record.state;
    const now = Date.now();

    // Record transition
    const transitions = this._history.get(packageName) ?? [];
    transitions.push({ from: oldState, to: newState, timestampMs: now, reason });
    this._history.set(packageName, transitions);

    // Update state-specific timestamp
    const updates: Partial<PackageLifecycleRecord> = { state: newState };
    if (newState === 'ACTIVE') (updates as { activatedAtMs: number }).activatedAtMs = now;
    if (newState === 'DEPRECATED') (updates as { deprecatedAtMs: number }).deprecatedAtMs = now;
    if (newState === 'REMOVED') (updates as { removedAtMs: number }).removedAtMs = now;
    if (reason !== undefined) (updates as { reason: string }).reason = reason;

    this._records.set(packageName, { ...record, ...updates });
  }

  private getRelevantTimestamp(record: PackageLifecycleRecord): number | undefined {
    switch (record.state) {
      case 'DRAFT':     return record.createdAtMs;
      case 'ACTIVE':    return record.activatedAtMs;
      case 'DEPRECATED': return record.deprecatedAtMs;
      case 'REMOVED':   return record.removedAtMs;
      default:          return undefined;
    }
  }
}
