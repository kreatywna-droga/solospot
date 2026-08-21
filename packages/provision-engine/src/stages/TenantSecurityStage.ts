import { ProvisionStage } from '../ProvisionStage';
import { ProvisionContext, extendProvisionContext } from '../ProvisionContext';
import { TenantSecurityManager } from '../../../tenant-admin/src/TenantSecurityManager';
import { Organization } from '../../../platform-identity/src/PlatformIdentity';

export class TenantSecurityStage implements ProvisionStage {
  readonly name = 'tenant-security-stage';
  private readonly securityManager: TenantSecurityManager;

  constructor(securityManager?: TenantSecurityManager) {
    this.securityManager = securityManager ?? new TenantSecurityManager();
  }

  async execute(context: ProvisionContext): Promise<ProvisionContext> {
    const { tenantId, storeId } = context.request;
    const tier = (context.request.metadata?.tier as any) || 'FREE';

    const org: Organization = {
      id: tenantId,
      name: `Storefront Org ${storeId}`,
      slug: tenantId,
      ownerId: `user-${tenantId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Layer 3: Execute Tenant Security Creation Workflow
    const result = this.securityManager.createTenant({
      organization: org,
      tier,
      capabilities: Array.from(context.resolvedCapabilities || ['BASIC_STORE']),
      primaryDomain: `${tenantId}.webfactor.io`,
    });

    return extendProvisionContext(context, {
      metadata: {
        ...context.metadata,
        tenantOrgCreated: true,
        tenantAuditLogId: result.auditLog.id,
        tenantContextId: result.context.tenantId,
      },
    });
  }

  async rollback(context: ProvisionContext): Promise<ProvisionContext> {
    const { tenantId } = context.request;
    this.securityManager.deleteTenant(tenantId, 'Provision pipeline stage rollback');

    return extendProvisionContext(context, {
      metadata: {
        ...context.metadata,
        tenantOrgRolledBack: true,
      },
    });
  }
}
