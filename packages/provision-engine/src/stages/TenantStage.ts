import { ProvisionStage } from '../ProvisionStage';
import { ProvisionContext, extendProvisionContext } from '../ProvisionContext';

export class TenantStage implements ProvisionStage {
  readonly name = 'tenant';

  async execute(context: ProvisionContext): Promise<ProvisionContext> {
    const { tenantId, storeId, storeName, mode } = context.request;

    const tenantInfo = {
      tenantId,
      slug: storeName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      domains: {
        primary: `${storeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.solospot.pl`
      },
      plan: {
        tier: mode === 'LIVE' ? 'GROWTH' : 'FREE',
        limits: {
          maxPages: 10,
          maxProducts: 100
        }
      },
      metadata: {
        createdAt: new Date().toISOString()
      }
    };

    return extendProvisionContext(context, {
      metadata: {
        ...context.metadata,
        tenantInfo
      }
    });
  }

  async rollback(context: ProvisionContext): Promise<ProvisionContext> {
    return extendProvisionContext(context, {
      metadata: {
        ...context.metadata,
        tenantInfo: undefined
      }
    });
  }
}
