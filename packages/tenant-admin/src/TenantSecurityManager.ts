import { Organization } from '../../platform-identity/src/PlatformIdentity';
import { OrganizationManager } from './OrganizationManager';
import { TenantContextBuilder } from '../../platform-core/src/tenant/TenantContextBuilder';
import { TenantContext } from '../../platform-core/src/tenant/TenantTypes';
import { AuditLogger } from '../../security/src/AuditLogger';
import { AuditLog } from './TenantAdminDomain';

export interface TenantCreationOptions {
  organization: Organization;
  tier?: 'FREE' | 'GROWTH' | 'ENTERPRISE';
  limits?: Record<string, number>;
  capabilities?: string[];
  primaryDomain?: string;
}

export interface TenantSecurityResult {
  organization: Organization;
  context: TenantContext;
  auditLog: AuditLog;
}

export class TenantSecurityManager {
  private orgManager: OrganizationManager;
  private auditLogger: AuditLogger;

  constructor(orgManager?: OrganizationManager, auditLogger?: AuditLogger) {
    this.orgManager = orgManager ?? new OrganizationManager();
    this.auditLogger = auditLogger ?? new AuditLogger();
  }

  public createTenant(options: TenantCreationOptions): TenantSecurityResult {
    const { organization, tier = 'FREE', limits = { maxUsers: 10 }, capabilities = ['BASIC_STORE'], primaryDomain } = options;

    if (!organization || !organization.id || !organization.slug || !organization.name) {
      throw new Error('Organization id, slug, and name are required');
    }

    // Step 1: Save organization in OrganizationManager (LAYER 1)
    const savedOrg = this.orgManager.create(organization);

    try {
      // Step 2: Validate and build frozen TenantContext via TenantContextBuilder (LAYER 2)
      const domainName = primaryDomain || `${organization.slug}.webfactor.io`;
      const context = new TenantContextBuilder()
        .setTenantId(organization.id)
        .setSlug(organization.slug)
        .setStatus('ACTIVE')
        .setDomains({ primary: domainName })
        .setPlan({ tier, limits })
        .setCapabilities(capabilities)
        .setMetadata({
          cacheKey: `tenant:${organization.id}`,
          lastRefresh: new Date().toISOString(),
          ttlSeconds: 300,
        })
        .build();

      // Step 3: Record security audit entry in AuditLogger (LAYER 3)
      const auditLog: AuditLog = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        organizationId: organization.id,
        action: 'TENANT_CREATED',
        resource: 'tenant_security_manager',
        details: {
          slug: organization.slug,
          tier,
          capabilitiesCount: capabilities.length,
          primaryDomain: domainName,
        },
        timestamp: new Date().toISOString(),
      };
      this.auditLogger.log(auditLog);

      return {
        organization: savedOrg,
        context,
        auditLog,
      };
    } catch (error) {
      // Rollback LAYER 1 mutation if LAYER 2 or LAYER 3 fails
      this.orgManager.delete(organization.id);
      throw error;
    }
  }

  public updateTenantStatus(organizationId: string, status: 'ACTIVE' | 'SUSPENDED' | 'MAINTENANCE', reason: string): TenantSecurityResult {
    const org = this.orgManager.get(organizationId);
    if (!org) {
      throw new Error(`Organization with id '${organizationId}' not found`);
    }

    const updatedOrg = this.orgManager.update(organizationId, { status: status.toLowerCase() as any }) || org;

    const context = new TenantContextBuilder()
      .setTenantId(org.id)
      .setSlug(org.slug)
      .setStatus(status)
      .setDomains({ primary: `${org.slug}.webfactor.io` })
      .setPlan({ tier: 'FREE', limits: { maxUsers: 10 } })
      .setCapabilities(['BASIC_STORE'])
      .setMetadata({
        cacheKey: `tenant:${org.id}`,
        lastRefresh: new Date().toISOString(),
        ttlSeconds: 300,
      })
      .build();

    const auditLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organizationId,
      action: 'TENANT_STATUS_UPDATED',
      resource: 'tenant_security_manager',
      details: { status, reason },
      timestamp: new Date().toISOString(),
    };
    this.auditLogger.log(auditLog);

    return {
      organization: updatedOrg,
      context,
      auditLog,
    };
  }

  public deleteTenant(organizationId: string, reason: string): boolean {
    const org = this.orgManager.get(organizationId);
    if (!org) return false;

    const deleted = this.orgManager.delete(organizationId);
    if (deleted) {
      this.auditLogger.critical(organizationId, 'TENANT_DELETED', { reason });
    }
    return deleted;
  }

  public getOrganizationManager(): OrganizationManager {
    return this.orgManager;
  }

  public getAuditLogger(): AuditLogger {
    return this.auditLogger;
  }
}
