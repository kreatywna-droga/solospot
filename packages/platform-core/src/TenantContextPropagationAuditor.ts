/**
 * TenantContextPropagationAuditor — G1-187
 *
 * Audits tenant context propagation chains to ensure multi-tenant isolation
 * is maintained across parent→child context boundaries.
 */

// ---------------------------------------------------------------------------
// Tenant Context
// ---------------------------------------------------------------------------

export interface TenantContext {
  readonly tenantId: string;
  readonly userId?: string;
  readonly roles: ReadonlyArray<string>;
  readonly permissions: ReadonlyArray<string>;
  readonly sessionId?: string;
  readonly requestTimestampMs: number;
  readonly parentId?: string;
}

// ---------------------------------------------------------------------------
// Audit Result Types
// ---------------------------------------------------------------------------

export type PropagationStatus = 'VALID' | 'INVALID' | 'LEAKAGE_DETECTED';

export interface ContextChainLink {
  readonly context: TenantContext;
  readonly depth: number;
}

export interface ChainValidationResult {
  readonly chainId: string;
  readonly status: PropagationStatus;
  readonly mismatchedIndices: number[];
  readonly message: string;
}

export interface ContextLeakageRecord {
  readonly contextA: TenantContext;
  readonly contextB: TenantContext;
  readonly reason: string;
}

export interface PropagationReport {
  readonly generatedAtMs: number;
  readonly totalContexts: number;
  readonly validChains: number;
  readonly invalidChains: number;
  readonly leakageDetected: boolean;
  readonly chainResults: ChainValidationResult[];
  readonly leakageRecords: ContextLeakageRecord[];
  readonly uniqueTenantIds: string[];
  readonly summary: string;
}

// ---------------------------------------------------------------------------
// Tenant Context Propagation Auditor
// ---------------------------------------------------------------------------

export class TenantContextPropagationAuditor {
  private contextCounter = 0;

  /**
   * Creates a tenant context with the given tenantId and optional overrides.
   */
  createContext(
    tenantId: string,
    options?: Partial<Omit<TenantContext, 'tenantId' | 'requestTimestampMs'>>,
  ): TenantContext {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error('tenantId must be a non-empty string');
    }
    return {
      tenantId: tenantId.trim(),
      userId: options?.userId,
      roles: options?.roles ?? [],
      permissions: options?.permissions ?? [],
      sessionId: options?.sessionId,
      requestTimestampMs: Date.now(),
      parentId: options?.parentId,
    };
  }

  /**
   * Validates that a context is well-formed: non-empty tenantId and valid timestamps.
   */
  validateContext(context: TenantContext): boolean {
    if (!context || typeof context !== 'object') return false;
    if (!context.tenantId || context.tenantId.trim().length === 0) return false;
    if (typeof context.requestTimestampMs !== 'number') return false;
    if (!Number.isFinite(context.requestTimestampMs)) return false;
    if (context.requestTimestampMs < 0) return false;
    return true;
  }

  /**
   * Creates a child context inheriting the parent's tenantId.
   */
  propagateContext(
    parentContext: TenantContext,
    childOptions?: Partial<Omit<TenantContext, 'tenantId'>>,
  ): TenantContext {
    if (!this.validateContext(parentContext)) {
      throw new Error('Invalid parent context');
    }
    return {
      tenantId: parentContext.tenantId,
      userId: childOptions?.userId ?? parentContext.userId,
      roles: childOptions?.roles ?? [...parentContext.roles],
      permissions: childOptions?.permissions ?? [...parentContext.permissions],
      sessionId: childOptions?.sessionId ?? parentContext.sessionId,
      requestTimestampMs: childOptions?.requestTimestampMs ?? Date.now(),
      parentId: parentContext.sessionId,
    };
  }

  /**
   * Validates a chain of parent→child contexts all share the same tenantId.
   */
  auditContextChain(contextChain: ContextChainLink[]): ChainValidationResult {
    if (contextChain.length === 0) {
      return {
        chainId: `chain-${++this.contextCounter}`,
        status: 'VALID',
        mismatchedIndices: [],
        message: 'Empty chain is valid',
      };
    }

    const expectedTenantId = contextChain[0].context.tenantId;
    const mismatchedIndices: number[] = [];

    for (let i = 1; i < contextChain.length; i++) {
      if (contextChain[i].context.tenantId !== expectedTenantId) {
        mismatchedIndices.push(i);
      }
    }

    const status: PropagationStatus =
      mismatchedIndices.length > 0 ? 'LEAKAGE_DETECTED' : 'VALID';

    return {
      chainId: `chain-${++this.contextCounter}`,
      status,
      mismatchedIndices,
      message:
        mismatchedIndices.length === 0
          ? 'All contexts share the same tenantId'
          : `TenantId mismatch at indices: ${mismatchedIndices.join(', ')}`,
    };
  }

  /**
   * Finds contexts with mismatched tenantIds (cross-tenant leakage).
   */
  detectContextLeakage(contexts: TenantContext[]): ContextLeakageRecord[] {
    const records: ContextLeakageRecord[] = [];
    for (let i = 0; i < contexts.length; i++) {
      for (let j = i + 1; j < contexts.length; j++) {
        if (contexts[i].tenantId !== contexts[j].tenantId) {
          records.push({
            contextA: contexts[i],
            contextB: contexts[j],
            reason: `TenantId mismatch: "${contexts[i].tenantId}" vs "${contexts[j].tenantId}"`,
          });
        }
      }
    }
    return records;
  }

  /**
   * Generates a deterministic hash of a context based on its fields.
   */
  getContextFingerprint(context: TenantContext): string {
    const parts = [
      context.tenantId,
      context.userId ?? '',
      context.roles.join(','),
      context.permissions.join(','),
      context.sessionId ?? '',
      String(context.requestTimestampMs),
      context.parentId ?? '',
    ];
    return this.simpleHash(parts.join('|'));
  }

  /**
   * Generates a full audit of context propagation patterns.
   */
  generatePropagationReport(contexts: TenantContext[]): PropagationReport {
    const validChains = contexts.filter(c => this.validateContext(c)).length;
    const invalidChains = contexts.length - validChains;
    const leakageRecords = this.detectContextLeakage(contexts);
    const uniqueTenantIds = [...new Set(contexts.map(c => c.tenantId))];

    return {
      generatedAtMs: Date.now(),
      totalContexts: contexts.length,
      validChains,
      invalidChains,
      leakageDetected: leakageRecords.length > 0,
      chainResults: [],
      leakageRecords,
      uniqueTenantIds,
      summary:
        leakageRecords.length === 0
          ? 'No context leakage detected'
          : `Found ${leakageRecords.length} potential leakage(s) across ${uniqueTenantIds.length} tenant(s)`,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      hash = ((hash << 5) - hash + ch) | 0;
    }
    return `fp-${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }
}
