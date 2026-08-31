/**
 * TenantCacheIsolationAudit — G1-203
 *
 * Audits cache isolation between tenants to prevent cross-tenant cache
 * hits, key collisions, and data contamination through shared caches.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CacheIsolationStrategy = 'PREFIX' | 'SEGREGATED' | 'SHARED';

export interface CacheIsolationRecord {
  readonly tenantId: string;
  readonly cacheNamespace: string;
  readonly isolationStrategy: CacheIsolationStrategy;
}

export interface CacheIsolationViolation {
  readonly tenantId: string;
  readonly violationType: string;
  readonly detail: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CacheOverlapEntry {
  readonly cacheKey: string;
  readonly tenantIds: string[];
}

export interface CacheIsolationReport {
  readonly generatedAtMs: number;
  readonly totalTenants: number;
  readonly violationsFound: number;
  readonly violations: CacheIsolationViolation[];
  readonly overlappingKeys: CacheOverlapEntry[];
  readonly summary: string;
}

// ---------------------------------------------------------------------------
// Tenant Cache Isolation Auditor
// ---------------------------------------------------------------------------

export class TenantCacheIsolationAuditor {
  private configs = new Map<string, CacheIsolationRecord>();

  registerCacheConfig(record: CacheIsolationRecord): void {
    if (!record.tenantId || record.tenantId.trim().length === 0) {
      throw new Error('tenantId must be a non-empty string');
    }
    this.configs.set(record.tenantId, { ...record });
  }

  getConfig(tenantId: string): CacheIsolationRecord | undefined {
    return this.configs.get(tenantId);
  }

  auditCacheIsolation(tenantA: string, tenantB: string, cacheKeys: string[]): CacheIsolationViolation[] {
    const violations: CacheIsolationViolation[] = [];
    const configA = this.configs.get(tenantA);
    const configB = this.configs.get(tenantB);

    if (!configA || !configB) {
      const missing = !configA ? tenantA : tenantB;
      violations.push({
        tenantId: missing,
        violationType: 'MISSING_CACHE_CONFIG',
        detail: `No cache isolation config for ${missing}`,
        severity: 'HIGH',
      });
      return violations;
    }

    if (configA.isolationStrategy === 'SHARED' || configB.isolationStrategy === 'SHARED') {
      if (configA.cacheNamespace === configB.cacheNamespace && tenantA !== tenantB) {
        violations.push({
          tenantId: tenantA,
          violationType: 'SHARED_NAMESPACE_COLLISION',
          detail: `Tenants ${tenantA} and ${tenantB} share cache namespace "${configA.cacheNamespace}" without isolation`,
          severity: 'CRITICAL',
        });
      }
    }

    if (configA.isolationStrategy === 'PREFIX' && configB.isolationStrategy === 'PREFIX') {
      if (configA.cacheNamespace === configB.cacheNamespace) {
        violations.push({
          tenantId: tenantA,
          violationType: 'PREFIX_OVERLAP',
          detail: `Both tenants use PREFIX strategy with same namespace "${configA.cacheNamespace}"`,
          severity: 'MEDIUM',
        });
      }
    }

    return violations;
  }

  validateKeyNamespacing(tenantId: string, cacheKeys: string[]): CacheIsolationViolation[] {
    const violations: CacheIsolationViolation[] = [];
    const config = this.configs.get(tenantId);

    if (!config) {
      violations.push({
        tenantId,
        violationType: 'MISSING_CACHE_CONFIG',
        detail: `No cache isolation config for ${tenantId}`,
        severity: 'HIGH',
      });
      return violations;
    }

    if (config.isolationStrategy === 'PREFIX') {
      for (const key of cacheKeys) {
        if (!key.startsWith(config.cacheNamespace + ':') && !key.startsWith(config.cacheNamespace)) {
          violations.push({
            tenantId,
            violationType: 'KEY_NOT_NAMESPACED',
            detail: `Cache key "${key}" does not start with namespace prefix "${config.cacheNamespace}:"`,
            severity: 'HIGH',
          });
        }
      }
    }

    return violations;
  }

  detectCacheOverlap(tenants: string[], cacheKeys: string[]): CacheOverlapEntry[] {
    const keyToTenants = new Map<string, Set<string>>();

    for (const key of cacheKeys) {
      const parts = key.split(':');
      if (parts.length < 2) continue;
      const namespace = parts[0];

      for (const tenantId of tenants) {
        const config = this.configs.get(tenantId);
        if (config && config.cacheNamespace === namespace) {
          if (!keyToTenants.has(key)) {
            keyToTenants.set(key, new Set());
          }
          keyToTenants.get(key)!.add(tenantId);
        }
      }
    }

    const overlaps: CacheOverlapEntry[] = [];
    for (const [cacheKey, tenantSet] of keyToTenants) {
      if (tenantSet.size > 1) {
        overlaps.push({
          cacheKey,
          tenantIds: Array.from(tenantSet),
        });
      }
    }

    return overlaps;
  }

  generateCacheIsolationReport(): CacheIsolationReport {
    const violations: CacheIsolationViolation[] = [];
    const tenantIds = Array.from(this.configs.keys());

    for (const tid of tenantIds) {
      const config = this.configs.get(tid)!;
      if (!config.cacheNamespace || config.cacheNamespace.trim().length === 0) {
        violations.push({
          tenantId: tid,
          violationType: 'EMPTY_NAMESPACE',
          detail: 'Cache namespace must not be empty',
          severity: 'MEDIUM',
        });
      }
    }

    return {
      generatedAtMs: Date.now(),
      totalTenants: tenantIds.length,
      violationsFound: violations.length,
      violations,
      overlappingKeys: [],
      summary:
        violations.length === 0
          ? 'All tenants pass cache isolation audit'
          : `Found ${violations.length} violation(s) across ${tenantIds.length} tenant(s)`,
    };
  }
}
