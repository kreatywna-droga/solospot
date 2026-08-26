/**
 * AuditTrail.ts — PM46 Immutable Audit Trail (ETAP 4)
 *
 * DECISION-098: Audit Trail jest niezmiennym źródłem informacji o operacjach użytkownika.
 *
 * Immutable audit entries, log models, categories, and retention policies.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type AuditCategory = 'security' | 'user_action' | 'system_event' | 'configuration_change';

export interface AuditEntry {
  readonly entryId: string;
  readonly category: AuditCategory;
  readonly action: string;
  readonly userId: string;
  readonly resourceId?: string;
  readonly details: Record<string, unknown>;
  readonly timestamp: number;
}

export interface AuditRetentionPolicy {
  readonly policyId: string;
  readonly retentionDays: number; // e.g. 90, 365
}

export interface AuditLogState {
  readonly entries: ReadonlyArray<AuditEntry>;
}

export function createAuditLogState(initialEntries: ReadonlyArray<AuditEntry> = []): AuditLogState {
  return { entries: [...initialEntries] };
}

/**
 * Appends an immutable audit entry to the audit log state.
 * DECISION-098: Preserves audit log immutability.
 */
export function appendAuditEntry(
  state: AuditLogState,
  category: AuditCategory,
  action: string,
  userId: string,
  details: Record<string, unknown> = {},
  resourceId?: string
): AuditLogState {
  const entry: AuditEntry = {
    entryId: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    category,
    action,
    userId,
    resourceId,
    details,
    timestamp: Date.now(),
  };

  return {
    entries: [...state.entries, entry],
  };
}
