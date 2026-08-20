import { ProvisionStage } from '../ProvisionStage';
import { ProvisionContext, extendProvisionContext } from '../ProvisionContext';
import { TenantContextBuilder } from '../../../platform-core/src/tenant/TenantContextBuilder';

export class PlatformContextStage implements ProvisionStage {
  readonly name = 'platform-context-stage';

  async execute(context: ProvisionContext): Promise<ProvisionContext> {
    const { tenantId } = context.request;
    const tier = (context.request.metadata?.tier as any) || 'FREE';

    if (context.request.metadata?.simulatedPlatformContextFailure) {
      throw new Error('Simulated PlatformContextStage failure during pipeline execution');
    }

    // Layer 4: Build & DeepFreeze Tenant Context (SSOT Validation)
    const tenantContext = new TenantContextBuilder()
      .setTenantId(tenantId)
      .setSlug(tenantId)
      .setStatus('ACTIVE')
      .setDomains({ primary: `${tenantId}.webfactor.io` })
      .setPlan({ tier, limits: { maxUsers: tier === 'ENTERPRISE' ? 500 : 10 } })
      .setCapabilities(context.resolvedCapabilities || ['BASIC_STORE'])
      .setMetadata({
        cacheKey: `tenant:${tenantId}`,
        lastRefresh: new Date().toISOString(),
        ttlSeconds: 300,
      })
      .build();

    return extendProvisionContext(context, {
      metadata: {
        ...context.metadata,
        platformContextBuilt: true,
        tenantContextFrozen: Object.isFrozen(tenantContext),
        primaryDomain: tenantContext.domains.primary,
      },
    });
  }

  async rollback(context: ProvisionContext): Promise<ProvisionContext> {
    return extendProvisionContext(context, {
      metadata: {
        ...context.metadata,
        platformContextRolledBack: true,
      },
    });
  }
}
