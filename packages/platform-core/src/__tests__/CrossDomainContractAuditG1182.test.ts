/**
 * CrossDomainContractAuditG1182.test.ts — G1-182 Cross-Domain Contract Audit
 *
 * HONESTY BOUNDARY: This is an audit tool analyzing existing interfaces.
 * It does NOT validate runtime data flow.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CrossDomainContractAuditor,
  ContractDefinition,
  AuditReport,
  ContractHealthStatus,
} from '../CrossDomainContractAudit';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

function makeContract(overrides: Partial<ContractDefinition> = {}): ContractDefinition {
  return {
    contractId: 'test-domain.TestInterface',
    providerDomain: 'test-domain',
    consumerDomain: 'test-consumer',
    interfaceName: 'TestInterface',
    fieldNames: ['id', 'name'],
    version: '1.0.0',
    ...overrides,
  };
}

function makeMinimalContract(
  id: string,
  overrides: Partial<Pick<ContractDefinition, 'providerDomain' | 'consumerDomain'>> = {},
): ContractDefinition {
  return {
    contractId: id,
    providerDomain: overrides.providerDomain ?? 'domain-a',
    consumerDomain: overrides.consumerDomain ?? 'domain-b',
    interfaceName: id.split('.')[1] ?? id,
    fieldNames: ['key'],
    version: '1.0.0',
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('CrossDomainContractAuditor', () => {
  let auditor: CrossDomainContractAuditor;

  beforeEach(() => {
    auditor = new CrossDomainContractAuditor();
  });

  // ── discoverContracts ──

  describe('discoverContracts()', () => {
    it('returns an array of contracts', () => {
      const contracts = auditor.discoverContracts();
      expect(Array.isArray(contracts)).toBe(true);
      expect(contracts.length).toBeGreaterThan(0);
    });

    it('discovers builder-core contracts', () => {
      const contracts = auditor.discoverContracts();
      const builderCore = contracts.filter(c => c.providerDomain === 'builder-core');
      expect(builderCore.length).toBeGreaterThanOrEqual(10);
    });

    it('discovers platform-core contracts', () => {
      const contracts = auditor.discoverContracts();
      const platformCore = contracts.filter(c => c.providerDomain === 'platform-core');
      expect(platformCore.length).toBeGreaterThanOrEqual(5);
    });

    it('discovers platform-identity contracts', () => {
      const contracts = auditor.discoverContracts();
      const identity = contracts.filter(c => c.providerDomain === 'platform-identity');
      expect(identity.length).toBeGreaterThanOrEqual(5);
    });

    it('discovers tenant-admin contracts', () => {
      const contracts = auditor.discoverContracts();
      const tenantAdmin = contracts.filter(c => c.providerDomain === 'tenant-admin');
      expect(tenantAdmin.length).toBeGreaterThanOrEqual(3);
    });

    it('discovers billing-core contracts', () => {
      const contracts = auditor.discoverContracts();
      const billing = contracts.filter(c => c.providerDomain === 'billing-core');
      expect(billing.length).toBeGreaterThanOrEqual(2);
    });

    it('discovers marketplace-core contracts', () => {
      const contracts = auditor.discoverContracts();
      const marketplace = contracts.filter(c => c.providerDomain === 'marketplace-core');
      expect(marketplace.length).toBeGreaterThanOrEqual(2);
    });

    it('each contract has valid semver version', () => {
      const contracts = auditor.discoverContracts();
      for (const c of contracts) {
        expect(c.version).toMatch(/^\d+\.\d+\.\d+$/);
      }
    });

    it('each contract has non-empty contractId', () => {
      const contracts = auditor.discoverContracts();
      for (const c of contracts) {
        expect(c.contractId.length).toBeGreaterThan(0);
      }
    });

    it('each contract has non-empty interfaceName', () => {
      const contracts = auditor.discoverContracts();
      for (const c of contracts) {
        expect(c.interfaceName.length).toBeGreaterThan(0);
      }
    });

    it('each contract has non-empty providerDomain', () => {
      const contracts = auditor.discoverContracts();
      for (const c of contracts) {
        expect(c.providerDomain.length).toBeGreaterThan(0);
      }
    });

    it('each contract has non-empty consumerDomain', () => {
      const contracts = auditor.discoverContracts();
      for (const c of contracts) {
        expect(c.consumerDomain.length).toBeGreaterThan(0);
      }
    });

    it('each contract has at least one field', () => {
      const contracts = auditor.discoverContracts();
      for (const c of contracts) {
        expect(c.fieldNames.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('BuilderDocument contract exists with expected fields', () => {
      const contracts = auditor.discoverContracts();
      const doc = contracts.find(c => c.contractId === 'builder-core.BuilderDocument');
      expect(doc).toBeDefined();
      expect(doc!.fieldNames).toContain('id');
      expect(doc!.fieldNames).toContain('tenantId');
      expect(doc!.fieldNames).toContain('pages');
      expect(doc!.fieldNames).toContain('theme');
    });

    it('CompiledDocument contract references runtime-core as consumer', () => {
      const contracts = auditor.discoverContracts();
      const compiled = contracts.find(c => c.contractId === 'builder-core.CompiledDocument');
      expect(compiled).toBeDefined();
      expect(compiled!.consumerDomain).toBe('runtime-core');
    });

    it('PlatformEvent contract has all-domains as consumer', () => {
      const contracts = auditor.discoverContracts();
      const event = contracts.find(c => c.contractId === 'platform-core.PlatformEvent');
      expect(event).toBeDefined();
      expect(event!.consumerDomain).toBe('all-domains');
    });

    it('PlatformCapabilities contract has all-domains as consumer', () => {
      const contracts = auditor.discoverContracts();
      const caps = contracts.find(c => c.contractId === 'platform-identity.PlatformCapabilities');
      expect(caps).toBeDefined();
      expect(caps!.consumerDomain).toBe('all-domains');
    });
  });

  // ── validateContractIntegrity ──

  describe('validateContractIntegrity()', () => {
    it('returns empty array for valid contracts', () => {
      const contracts = auditor.discoverContracts();
      const issues = auditor.validateContractIntegrity(contracts);
      expect(issues.length).toBe(0);
    });

    it('detects contract with no fields', () => {
      const bad = makeContract({ contractId: 'test.NoFields', fieldNames: [] });
      const issues = auditor.validateContractIntegrity([bad]);
      expect(issues.some(i => i.issueType === 'FIELD_MISMATCH')).toBe(true);
    });

    it('detects contract with empty provider domain', () => {
      const bad = makeContract({ contractId: 'test.NoProvider', providerDomain: '' });
      const issues = auditor.validateContractIntegrity([bad]);
      expect(issues.some(i => i.issueType === 'MISSING_PROVIDER')).toBe(true);
      expect(issues.find(i => i.issueType === 'MISSING_PROVIDER')!.severity).toBe('HIGH');
    });

    it('detects contract with empty consumer domain', () => {
      const bad = makeContract({ contractId: 'test.NoConsumer', consumerDomain: '' });
      const issues = auditor.validateContractIntegrity([bad]);
      expect(issues.some(i => i.issueType === 'MISSING_CONSUMER')).toBe(true);
      expect(issues.find(i => i.issueType === 'MISSING_CONSUMER')!.severity).toBe('MEDIUM');
    });

    it('detects invalid version format', () => {
      const bad = makeContract({ contractId: 'test.BadVersion', version: 'v1' });
      const issues = auditor.validateContractIntegrity([bad]);
      expect(issues.some(i => i.issueType === 'VERSION_MISMATCH')).toBe(true);
    });

    it('counts multiple issues in a single contract', () => {
      const bad = makeContract({
        contractId: 'test.MultiIssue',
        providerDomain: '',
        consumerDomain: '',
        fieldNames: [],
        version: 'bad',
      });
      const issues = auditor.validateContractIntegrity([bad]);
      expect(issues.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ── detectOrphanedContracts ──

  describe('detectOrphanedContracts()', () => {
    it('returns empty for well-connected contract graph', () => {
      const contracts = [
        makeMinimalContract('domain-a.InterfaceX', { consumerDomain: 'domain-b' }),
        makeMinimalContract('domain-b.InterfaceY', { consumerDomain: 'domain-a' }),
      ];
      const orphans = auditor.detectOrphanedContracts(contracts);
      expect(orphans.length).toBe(0);
    });

    it('detects provider with no consumers', () => {
      const contracts = [
        makeMinimalContract('standalone.InterfaceX', { consumerDomain: 'external-system' }),
      ];
      const orphans = auditor.detectOrphanedContracts(contracts);
      expect(orphans.some(o => o.contractId === 'standalone.InterfaceX')).toBe(true);
    });

    it('ignores all-domains consumer contracts', () => {
      const contracts = [
        makeMinimalContract('domain-a.InterfaceX', { consumerDomain: 'all-domains' }),
      ];
      const orphans = auditor.detectOrphanedContracts(contracts);
      expect(orphans.length).toBe(0);
    });
  });

  // ── detectUnmetContracts ──

  describe('detectUnmetContracts()', () => {
    it('returns empty when all consumers have providers', () => {
      const contracts = [
        makeMinimalContract('domain-a.IfaceA', { providerDomain: 'domain-a', consumerDomain: 'domain-b' }),
        makeMinimalContract('domain-b.IfaceB', { providerDomain: 'domain-b', consumerDomain: 'domain-a' }),
      ];
      const unmet = auditor.detectUnmetContracts(contracts);
      expect(unmet.length).toBe(0);
    });

    it('detects consumer referencing non-existent provider domain', () => {
      const contracts = [
        makeMinimalContract('domain-a.IfaceA', { consumerDomain: 'nonexistent-domain' }),
      ];
      const unmet = auditor.detectUnmetContracts(contracts);
      expect(unmet.some(u => u.consumerDomain === 'nonexistent-domain')).toBe(true);
    });
  });

  // ── generateAuditReport ──

  describe('generateAuditReport()', () => {
    it('returns a valid AuditReport structure', () => {
      const report = auditor.generateAuditReport();
      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.totalContracts).toBeGreaterThan(0);
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
      expect(report.healthScore).toBeLessThanOrEqual(100);
    });

    it('has status matching health score', () => {
      const report = auditor.generateAuditReport();
      if (report.healthScore >= 80) {
        expect(report.status).toBe('HEALTHY');
      } else if (report.healthScore >= 50) {
        expect(report.status).toBe('DEGRADED');
      } else {
        expect(report.status).toBe('CRITICAL');
      }
    });

    it('reports healthyContracts + degradedContracts + criticalContracts = totalContracts', () => {
      const report = auditor.generateAuditReport();
      const sum = report.healthyContracts + report.degradedContracts + report.criticalContracts;
      expect(sum).toBe(report.totalContracts);
    });

    it('integrityIssues is an array', () => {
      const report = auditor.generateAuditReport();
      expect(Array.isArray(report.integrityIssues)).toBe(true);
    });

    it('orphanedContracts is an array', () => {
      const report = auditor.generateAuditReport();
      expect(Array.isArray(report.orphanedContracts)).toBe(true);
    });

    it('unmetContracts is an array', () => {
      const report = auditor.generateAuditReport();
      expect(Array.isArray(report.unmetContracts)).toBe(true);
    });
  });

  // ── getContractHealthScore ──

  describe('getContractHealthScore()', () => {
    it('returns 100 for empty issues on valid contracts', () => {
      const contracts = auditor.discoverContracts();
      const score = auditor.getContractHealthScore(contracts, [], [], []);
      expect(score).toBe(100);
    });

    it('deducts 5 points per HIGH severity issue', () => {
      const score = auditor.getContractHealthScore(
        [],
        [
          { contractId: 'c1', issueType: 'MISSING_PROVIDER', message: '', severity: 'HIGH' },
          { contractId: 'c2', issueType: 'MISSING_PROVIDER', message: '', severity: 'HIGH' },
        ],
        [],
        [],
      );
      expect(score).toBe(90);
    });

    it('deducts 2 points per MEDIUM severity issue', () => {
      const score = auditor.getContractHealthScore(
        [],
        [
          { contractId: 'c1', issueType: 'MISSING_CONSUMER', message: '', severity: 'MEDIUM' },
        ],
        [],
        [],
      );
      expect(score).toBe(98);
    });

    it('deducts 1 point per LOW severity issue', () => {
      const score = auditor.getContractHealthScore(
        [],
        [
          { contractId: 'c1', issueType: 'FIELD_MISMATCH', message: '', severity: 'LOW' },
        ],
        [],
        [],
      );
      expect(score).toBe(99);
    });

    it('deducts 3 points per orphaned contract', () => {
      const score = auditor.getContractHealthScore(
        [],
        [],
        [{ contractId: 'o1', providerDomain: 'd', interfaceName: 'I' }],
        [],
      );
      expect(score).toBe(97);
    });

    it('deducts 5 points per unmet contract', () => {
      const score = auditor.getContractHealthScore(
        [],
        [],
        [],
        [{ contractId: 'u1', consumerDomain: 'd', interfaceName: 'I' }],
      );
      expect(score).toBe(95);
    });

    it('clamps to 0 when many issues accumulate', () => {
      const highIssues = Array.from({ length: 25 }, (_, i) => ({
        contractId: `c${i}`,
        issueType: 'MISSING_PROVIDER' as const,
        message: '',
        severity: 'HIGH' as const,
      }));
      const score = auditor.getContractHealthScore([], highIssues, [], []);
      expect(score).toBe(0);
    });

    it('clamps to 100 (no negative scores)', () => {
      const score = auditor.getContractHealthScore([], [], [], []);
      expect(score).toBe(100);
    });
  });

  // ── getContracts ──

  describe('getContracts()', () => {
    it('returns empty array before discoverContracts is called', () => {
      const contracts = auditor.getContracts();
      expect(contracts.length).toBe(0);
    });

    it('returns discovered contracts after discoverContracts is called', () => {
      auditor.discoverContracts();
      const contracts = auditor.getContracts();
      expect(contracts.length).toBeGreaterThan(0);
    });

    it('returns same reference on repeated calls', () => {
      auditor.discoverContracts();
      const first = auditor.getContracts();
      const second = auditor.getContracts();
      expect(first).toBe(second);
    });
  });
});
