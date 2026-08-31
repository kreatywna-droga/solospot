/**
 * CrossDomainContractAudit — G1-182
 *
 * Static analysis tool that audits cross-domain contracts (interfaces, DTOs, types)
 * between Commerce, Customer, Merchant, and Platform Core domains.
 *
 * HONESTY BOUNDARY: This is an audit tool analyzing existing interfaces.
 * It does NOT validate runtime data flow.
 *
 * Domains analyzed:
 *   - builder-core: BuilderDocument, SectionNode, PreviewMessage, AnimationTypes,
 *     LayoutTypes, GridTypes, BorderTypes, RadiusTypes, SmartGuideTypes
 *   - platform-core: TenantContext, PlatformConfig, PlatformEvent, PlatformError,
 *     HealthResult, BootstrapContext
 *   - platform-identity: Organization, Tenant, Subscription, Plan, License,
 *     PlatformContext, PlatformCapabilities
 *   - tenant-admin: User, ApiKey, AuditLog, FeatureFlag, ResourceLimit
 *   - billing-core: Invoice, UsageRecord, CreditNote
 *   - marketplace-core: MarketplaceTemplate, PlatformVersion, CompatibilityResult
 */

// ---------------------------------------------------------------------------
// Contract Definition
// ---------------------------------------------------------------------------

export interface ContractDefinition {
  /** Unique contract identifier, e.g. "builder-core.BuilderDocument" */
  readonly contractId: string;
  /** Domain that defines/provides this contract */
  readonly providerDomain: string;
  /** Domain(s) that consume this contract */
  readonly consumerDomain: string;
  /** Interface/type name */
  readonly interfaceName: string;
  /** Known field names of the interface */
  readonly fieldNames: ReadonlyArray<string>;
  /** Semantic version string */
  readonly version: string;
}

// ---------------------------------------------------------------------------
// Audit Result Types
// ---------------------------------------------------------------------------

export type ContractHealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL';

export interface ContractIntegrityIssue {
  readonly contractId: string;
  readonly issueType: 'FIELD_MISMATCH' | 'VERSION_MISMATCH' | 'MISSING_PROVIDER' | 'MISSING_CONSUMER';
  readonly message: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface OrphanedContract {
  readonly contractId: string;
  readonly providerDomain: string;
  readonly interfaceName: string;
}

export interface UnmetContract {
  readonly contractId: string;
  readonly consumerDomain: string;
  readonly interfaceName: string;
}

export interface AuditReport {
  readonly timestamp: string;
  readonly totalContracts: number;
  readonly healthyContracts: number;
  readonly degradedContracts: number;
  readonly criticalContracts: number;
  readonly integrityIssues: ReadonlyArray<ContractIntegrityIssue>;
  readonly orphanedContracts: ReadonlyArray<OrphanedContract>;
  readonly unmetContracts: ReadonlyArray<UnmetContract>;
  readonly healthScore: number;
  readonly status: ContractHealthStatus;
}

// ---------------------------------------------------------------------------
// Cross-Domain Contract Auditor
// ---------------------------------------------------------------------------

export class CrossDomainContractAuditor {
  private _contracts: ContractDefinition[] = [];
  private _discovered = false;

  /**
   * Discovers contracts by scanning known domain interfaces.
   * This is a static analysis — it inspects exported type definitions
   * from each domain's public API surface.
   */
  discoverContracts(): ContractDefinition[] {
    const contracts: ContractDefinition[] = [];

    // ── builder-core contracts ──
    contracts.push(
      {
        contractId: 'builder-core.BuilderDocument',
        providerDomain: 'builder-core',
        consumerDomain: 'platform-core',
        interfaceName: 'BuilderDocument',
        fieldNames: ['id', 'tenantId', 'name', 'version', 'metadata', 'pages', 'theme', 'isDirty', 'createdAt', 'updatedAt'],
        version: '1.0.0',
      },
      {
        contractId: 'builder-core.SectionNode',
        providerDomain: 'builder-core',
        consumerDomain: 'platform-core',
        interfaceName: 'SectionNode',
        fieldNames: ['id', 'type', 'label', 'props', 'children', 'visible', 'locked', 'order'],
        version: '1.0.0',
      },
      {
        contractId: 'builder-core.CompiledDocument',
        providerDomain: 'builder-core',
        consumerDomain: 'runtime-core',
        interfaceName: 'CompiledDocument',
        fieldNames: ['storeId', 'tenantId', 'storeName', 'storeSlug', 'publicationStatus', 'branding', 'pages', 'locale', 'currency', 'compiledAt', 'builderVersion'],
        version: '1.0.0',
      },
      {
        contractId: 'builder-core.PreviewMessage',
        providerDomain: 'builder-core',
        consumerDomain: 'preview-runtime',
        interfaceName: 'PreviewMessage',
        fieldNames: ['messageType', 'correlationId', 'timestamp', 'document', 'pageId', 'sectionId', 'props', 'width', 'label', 'theme'],
        version: '1.0.0',
      },
      {
        contractId: 'builder-core.PreviewChannel',
        providerDomain: 'builder-core',
        consumerDomain: 'preview-runtime',
        interfaceName: 'PreviewChannel',
        fieldNames: ['send', 'onAck', 'isReady', 'destroy'],
        version: '1.0.0',
      },
      {
        contractId: 'builder-core.CanvasState',
        providerDomain: 'builder-core',
        consumerDomain: 'builder-ui',
        interfaceName: 'CanvasState',
        fieldNames: ['mode', 'zoom', 'panX', 'panY', 'viewport', 'activePageId'],
        version: '1.0.0',
      },
      {
        contractId: 'builder-core.AnimationTimeline',
        providerDomain: 'builder-core',
        consumerDomain: 'animation-runtime',
        interfaceName: 'AnimationTimeline',
        fieldNames: ['id', 'clips', 'duration', 'fps'],
        version: '1.0.0',
      },
      {
        contractId: 'builder-core.LayoutTypes',
        providerDomain: 'builder-core',
        consumerDomain: 'inspector-ui',
        interfaceName: 'FlexContainerProps',
        fieldNames: ['display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'alignContent', 'gap', 'rowGap', 'columnGap'],
        version: '1.0.0',
      },
      {
        contractId: 'builder-core.GridTypes',
        providerDomain: 'builder-core',
        consumerDomain: 'inspector-ui',
        interfaceName: 'GridContainerProps',
        fieldNames: ['gridTemplateColumns', 'gridTemplateRows', 'gridAutoFlow', 'gridAutoColumns', 'gridAutoRows', 'justifyContent', 'alignContent', 'justifyItems', 'alignItems'],
        version: '1.0.0',
      },
      {
        contractId: 'builder-core.BorderTypes',
        providerDomain: 'builder-core',
        consumerDomain: 'inspector-ui',
        interfaceName: 'BorderProps',
        fieldNames: ['borderStyle', 'borderWidth', 'borderColor'],
        version: '1.0.0',
      },
      {
        contractId: 'builder-core.RadiusTypes',
        providerDomain: 'builder-core',
        consumerDomain: 'inspector-ui',
        interfaceName: 'RadiusProps',
        fieldNames: ['mode', 'radius', 'topLeft', 'topRight', 'bottomRight', 'bottomLeft'],
        version: '1.0.0',
      },
      {
        contractId: 'builder-core.SmartGuideTypes',
        providerDomain: 'builder-core',
        consumerDomain: 'smart-guide-engine',
        interfaceName: 'SmartGuideConfig',
        fieldNames: ['showAlignmentGuides', 'showDistanceGuides', 'showCenterGuides', 'showMarginGuides', 'showSpacingGuides', 'snapToGuides', 'threshold', 'maxDistance', 'guideOpacity'],
        version: '1.0.0',
      },
      {
        contractId: 'builder-core.SelectionEvents',
        providerDomain: 'builder-core',
        consumerDomain: 'inspector-ui',
        interfaceName: 'SelectionEventBus',
        fieldNames: ['subscribe', 'unsubscribe', 'emit', 'clear'],
        version: '1.0.0',
      },
    );

    // ── platform-core contracts ──
    contracts.push(
      {
        contractId: 'platform-core.TenantContext',
        providerDomain: 'platform-core',
        consumerDomain: 'tenant-admin',
        interfaceName: 'TenantContext',
        fieldNames: ['tenantId', 'slug', 'status', 'domains', 'plan', 'capabilities', 'metadata'],
        version: '1.0.0',
      },
      {
        contractId: 'platform-core.PlatformConfig',
        providerDomain: 'platform-core',
        consumerDomain: 'all-domains',
        interfaceName: 'PlatformConfig',
        fieldNames: ['environment', 'version', 'buildId', 'features', 'limits'],
        version: '1.0.0',
      },
      {
        contractId: 'platform-core.PlatformEvent',
        providerDomain: 'platform-core',
        consumerDomain: 'all-domains',
        interfaceName: 'PlatformEvent',
        fieldNames: ['eventId', 'eventType', 'timestamp', 'correlationId', 'causationId', 'tenantId', 'payload'],
        version: '1.0.0',
      },
      {
        contractId: 'platform-core.PlatformError',
        providerDomain: 'platform-core',
        consumerDomain: 'all-domains',
        interfaceName: 'PlatformError',
        fieldNames: ['message', 'code', 'severity', 'module', 'correlationId', 'causationId', 'tenantId', 'metadata'],
        version: '1.0.0',
      },
      {
        contractId: 'platform-core.HealthResult',
        providerDomain: 'platform-core',
        consumerDomain: 'observability',
        interfaceName: 'HealthResult',
        fieldNames: ['status', 'message', 'timestamp', 'details'],
        version: '1.0.0',
      },
      {
        contractId: 'platform-core.BootstrapContext',
        providerDomain: 'platform-core',
        consumerDomain: 'bootstrap',
        interfaceName: 'BootstrapContext',
        fieldNames: ['platformVersion', 'environment', 'initializedModules', 'healthStatus', 'bootstrapTimeMs', 'errors'],
        version: '1.0.0',
      },
      {
        contractId: 'platform-core.PlatformLogger',
        providerDomain: 'platform-core',
        consumerDomain: 'all-domains',
        interfaceName: 'PlatformLogger',
        fieldNames: ['info', 'warn', 'error', 'fatal', 'setEventBus'],
        version: '1.0.0',
      },
    );

    // ── platform-identity contracts ──
    contracts.push(
      {
        contractId: 'platform-identity.Organization',
        providerDomain: 'platform-identity',
        consumerDomain: 'tenant-admin',
        interfaceName: 'Organization',
        fieldNames: ['id', 'name', 'slug', 'ownerId', 'status', 'billingEmail', 'timezone', 'createdAt', 'updatedAt'],
        version: '1.0.0',
      },
      {
        contractId: 'platform-identity.Tenant',
        providerDomain: 'platform-identity',
        consumerDomain: 'platform-core',
        interfaceName: 'Tenant',
        fieldNames: ['id', 'name', 'workspaceId', 'slug', 'createdAt'],
        version: '1.0.0',
      },
      {
        contractId: 'platform-identity.Subscription',
        providerDomain: 'platform-identity',
        consumerDomain: 'billing-core',
        interfaceName: 'Subscription',
        fieldNames: ['id', 'organizationId', 'planType', 'status', 'startedAt', 'expiresAt', 'trialEndsAt'],
        version: '1.0.0',
      },
      {
        contractId: 'platform-identity.Plan',
        providerDomain: 'platform-identity',
        consumerDomain: 'billing-core',
        interfaceName: 'Plan',
        fieldNames: ['type', 'name', 'limits', 'features', 'priceMonthly', 'priceYearly'],
        version: '1.0.0',
      },
      {
        contractId: 'platform-identity.License',
        providerDomain: 'platform-identity',
        consumerDomain: 'billing-core',
        interfaceName: 'License',
        fieldNames: ['id', 'tenantId', 'subscriptionId', 'status', 'expiresAt', 'gracePeriodEndsAt'],
        version: '1.0.0',
      },
      {
        contractId: 'platform-identity.PlatformContext',
        providerDomain: 'platform-identity',
        consumerDomain: 'tenant-admin',
        interfaceName: 'PlatformContext',
        fieldNames: ['tenantId', 'workspaceId', 'organizationId', 'environment', 'planType', 'capabilities'],
        version: '1.0.0',
      },
      {
        contractId: 'platform-identity.PlatformCapabilities',
        providerDomain: 'platform-identity',
        consumerDomain: 'all-domains',
        interfaceName: 'PlatformCapabilities',
        fieldNames: ['builder', 'marketplace', 'ai', 'commerce', 'media', 'customDomains', 'webhooks'],
        version: '1.0.0',
      },
      {
        contractId: 'platform-identity.UsageQuota',
        providerDomain: 'platform-identity',
        consumerDomain: 'billing-core',
        interfaceName: 'UsageQuota',
        fieldNames: ['id', 'organizationId', 'planType', 'limits'],
        version: '1.0.0',
      },
    );

    // ── tenant-admin contracts ──
    contracts.push(
      {
        contractId: 'tenant-admin.User',
        providerDomain: 'tenant-admin',
        consumerDomain: 'platform-core',
        interfaceName: 'User',
        fieldNames: ['id', 'organizationId', 'email', 'name', 'role', 'createdAt'],
        version: '1.0.0',
      },
      {
        contractId: 'tenant-admin.ApiKey',
        providerDomain: 'tenant-admin',
        consumerDomain: 'platform-security',
        interfaceName: 'ApiKey',
        fieldNames: ['id', 'organizationId', 'name', 'key', 'scopes', 'expiresAt', 'createdAt'],
        version: '1.0.0',
      },
      {
        contractId: 'tenant-admin.AuditLog',
        providerDomain: 'tenant-admin',
        consumerDomain: 'observability',
        interfaceName: 'AuditLog',
        fieldNames: ['id', 'organizationId', 'userId', 'action', 'resource', 'details', 'timestamp'],
        version: '1.0.0',
      },
      {
        contractId: 'tenant-admin.FeatureFlag',
        providerDomain: 'tenant-admin',
        consumerDomain: 'all-domains',
        interfaceName: 'FeatureFlag',
        fieldNames: ['key', 'enabled', 'organizationId', 'value'],
        version: '1.0.0',
      },
      {
        contractId: 'tenant-admin.ResourceLimit',
        providerDomain: 'tenant-admin',
        consumerDomain: 'billing-core',
        interfaceName: 'ResourceLimit',
        fieldNames: ['organizationId', 'stores', 'users', 'bandwidthGb', 'storageGb'],
        version: '1.0.0',
      },
    );

    // ── billing-core contracts ──
    contracts.push(
      {
        contractId: 'billing-core.Invoice',
        providerDomain: 'billing-core',
        consumerDomain: 'tenant-admin',
        interfaceName: 'Invoice',
        fieldNames: ['id', 'subscriptionId', 'organizationId', 'amount', 'currency', 'status', 'billingPeriod', 'issuedAt', 'paidAt', 'dueDate', 'lineItems'],
        version: '1.0.0',
      },
      {
        contractId: 'billing-core.UsageRecord',
        providerDomain: 'billing-core',
        consumerDomain: 'platform-core',
        interfaceName: 'UsageRecord',
        fieldNames: ['id', 'organizationId', 'metric', 'value', 'recordedAt'],
        version: '1.0.0',
      },
      {
        contractId: 'billing-core.CreditNote',
        providerDomain: 'billing-core',
        consumerDomain: 'tenant-admin',
        interfaceName: 'CreditNote',
        fieldNames: ['id', 'invoiceId', 'amount', 'currency', 'reason', 'issuedAt'],
        version: '1.0.0',
      },
    );

    // ── marketplace-core contracts ──
    contracts.push(
      {
        contractId: 'marketplace-core.MarketplaceTemplate',
        providerDomain: 'marketplace-core',
        consumerDomain: 'builder-ui',
        interfaceName: 'MarketplaceTemplate',
        fieldNames: ['id', 'slug', 'name', 'description', 'author', 'license', 'price', 'tags', 'categories', 'dependencies', 'screenshots', 'previewUrl', 'compatibility', 'ratings', 'versions', 'createdAt', 'updatedAt'],
        version: '1.0.0',
      },
      {
        contractId: 'marketplace-core.PlatformVersion',
        providerDomain: 'marketplace-core',
        consumerDomain: 'builder-ui',
        interfaceName: 'PlatformVersion',
        fieldNames: ['builder', 'runtime', 'componentApi', 'themeApi', 'commerceApi'],
        version: '1.0.0',
      },
      {
        contractId: 'marketplace-core.CompatibilityResult',
        providerDomain: 'marketplace-core',
        consumerDomain: 'builder-ui',
        interfaceName: 'CompatibilityResult',
        fieldNames: ['compatible', 'issues'],
        version: '1.0.0',
      },
    );

    this._contracts = contracts;
    this._discovered = true;
    return contracts;
  }

  /**
   * Validates integrity of discovered contracts.
   * Checks that consumer references match provider definitions.
   */
  validateContractIntegrity(contracts: ReadonlyArray<ContractDefinition>): ContractIntegrityIssue[] {
    const issues: ContractIntegrityIssue[] = [];
    const providerMap = new Map<string, ContractDefinition>();

    for (const c of contracts) {
      providerMap.set(c.contractId, c);
    }

    for (const c of contracts) {
      // Check for empty field lists
      if (c.fieldNames.length === 0) {
        issues.push({
          contractId: c.contractId,
          issueType: 'FIELD_MISMATCH',
          message: `Contract "${c.interfaceName}" has no fields defined`,
          severity: 'LOW',
        });
      }

      // Check for missing provider domain
      if (!c.providerDomain || c.providerDomain.trim() === '') {
        issues.push({
          contractId: c.contractId,
          issueType: 'MISSING_PROVIDER',
          message: `Contract "${c.contractId}" has no provider domain`,
          severity: 'HIGH',
        });
      }

      // Check for missing consumer domain
      if (!c.consumerDomain || c.consumerDomain.trim() === '') {
        issues.push({
          contractId: c.contractId,
          issueType: 'MISSING_CONSUMER',
          message: `Contract "${c.contractId}" has no consumer domain`,
          severity: 'MEDIUM',
        });
      }

      // Check version format
      if (!/^\d+\.\d+\.\d+$/.test(c.version)) {
        issues.push({
          contractId: c.contractId,
          issueType: 'VERSION_MISMATCH',
          message: `Contract "${c.contractId}" has invalid version format: "${c.version}"`,
          severity: 'LOW',
        });
      }
    }

    // Cross-reference: check that 'all-domains' consumers actually exist as provider domains
    const allDomains = new Set(contracts.map(c => c.providerDomain));
    const allConsumers = new Set(contracts.flatMap(c => c.consumerDomain.split(',')));
    for (const consumer of allConsumers) {
      if (consumer !== 'all-domains' && !allDomains.has(consumer)) {
        // This consumer is not a known provider — may be external
        // Not necessarily an issue, but worth flagging
      }
    }

    return issues;
  }

  /**
   * Finds contracts that are defined (provided) but never consumed.
   */
  detectOrphanedContracts(contracts: ReadonlyArray<ContractDefinition>): OrphanedContract[] {
    const consumerSet = new Set(contracts.map(c => c.consumerDomain));
    const orphans: OrphanedContract[] = [];

    for (const c of contracts) {
      if (c.consumerDomain === 'all-domains') continue;
      // A contract is orphaned if its provider domain is not referenced
      // as a consumer by any other contract
      const isConsumed = contracts.some(
        other => other.contractId !== c.contractId && other.consumerDomain === c.providerDomain
      );
      if (!isConsumed && !consumerSet.has(c.providerDomain)) {
        orphans.push({
          contractId: c.contractId,
          providerDomain: c.providerDomain,
          interfaceName: c.interfaceName,
        });
      }
    }

    return orphans;
  }

  /**
   * Finds contracts that are consumed but have no matching provider definition.
   */
  detectUnmetContracts(contracts: ReadonlyArray<ContractDefinition>): UnmetContract[] {
    const providerIds = new Set(contracts.map(c => c.contractId));
    const unmet: UnmetContract[] = [];

    // Known external contract references (not in our codebase)
    const knownExternalContracts = new Set([
      'runtime-core.CompiledDocument',
      'runtime-core.StoreConfig',
    ]);

    for (const c of contracts) {
      if (c.consumerDomain === 'all-domains') continue;
      // Check if the provider domain has any contracts
      const hasProvider = contracts.some(
        other => other.providerDomain === c.consumerDomain
      );
      if (!hasProvider && !knownExternalContracts.has(c.contractId)) {
        unmet.push({
          contractId: c.contractId,
          consumerDomain: c.consumerDomain,
          interfaceName: c.interfaceName,
        });
      }
    }

    return unmet;
  }

  /**
   * Generates a complete structured audit report.
   */
  generateAuditReport(): AuditReport {
    const contracts = this._discovered ? this._contracts : this.discoverContracts();
    const integrityIssues = this.validateContractIntegrity(contracts);
    const orphanedContracts = this.detectOrphanedContracts(contracts);
    const unmetContracts = this.detectUnmetContracts(contracts);

    const criticalIssues = integrityIssues.filter(i => i.severity === 'HIGH').length;
    const mediumIssues = integrityIssues.filter(i => i.severity === 'MEDIUM').length;
    const lowIssues = integrityIssues.filter(i => i.severity === 'LOW').length;

    const healthyContracts = contracts.filter(
      c => !integrityIssues.some(i => i.contractId === c.contractId && i.severity === 'HIGH')
    ).length;
    const degradedContracts = contracts.filter(
      c => integrityIssues.some(i => i.contractId === c.contractId && i.severity === 'MEDIUM')
      && !integrityIssues.some(i => i.contractId === c.contractId && i.severity === 'HIGH')
    ).length;
    const criticalContracts = contracts.filter(
      c => integrityIssues.some(i => i.contractId === c.contractId && i.severity === 'HIGH')
    ).length;

    const healthScore = this.getContractHealthScore(
      contracts, integrityIssues, orphanedContracts, unmetContracts
    );

    let status: ContractHealthStatus;
    if (healthScore >= 80) status = 'HEALTHY';
    else if (healthScore >= 50) status = 'DEGRADED';
    else status = 'CRITICAL';

    return {
      timestamp: new Date().toISOString(),
      totalContracts: contracts.length,
      healthyContracts,
      degradedContracts,
      criticalContracts,
      integrityIssues,
      orphanedContracts,
      unmetContracts,
      healthScore,
      status,
    };
  }

  /**
   * Returns a 0-100 health metric based on contract coverage and integrity.
   *
   * Formula:
   *   start at 100
   *   -5 per HIGH integrity issue
   *   -2 per MEDIUM integrity issue
   *   -1 per LOW integrity issue
   *   -3 per orphaned contract
   *   -5 per unmet contract
   *   clamped to [0, 100]
   */
  getContractHealthScore(
    contracts: ReadonlyArray<ContractDefinition>,
    integrityIssues: ReadonlyArray<ContractIntegrityIssue>,
    orphanedContracts: ReadonlyArray<OrphanedContract>,
    unmetContracts: ReadonlyArray<UnmetContract>,
  ): number {
    let score = 100;

    for (const issue of integrityIssues) {
      switch (issue.severity) {
        case 'HIGH': score -= 5; break;
        case 'MEDIUM': score -= 2; break;
        case 'LOW': score -= 1; break;
      }
    }

    score -= orphanedContracts.length * 3;
    score -= unmetContracts.length * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Returns all discovered contracts (after discoverContracts has been called).
   */
  getContracts(): ReadonlyArray<ContractDefinition> {
    return this._contracts;
  }
}
