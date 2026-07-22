import { DefaultStoreManager, StoreManager } from '../../mission-control-core/src/StoreManagement';
import { CustomerContext } from './CustomerContext';

export interface PublishResult {
  success: boolean;
  deploymentUrl?: string;
  buildId?: string;
  errors: string[];
}

export interface PublishService {
  publish(ctx: CustomerContext): Promise<PublishResult>;
}

export class DefaultPublishService implements PublishService {
  private readonly storeManager: StoreManager;

  constructor(storeManager?: StoreManager) {
    this.storeManager = storeManager || new DefaultStoreManager();
  }

  async publish(ctx: CustomerContext): Promise<PublishResult> {
    if (!ctx.tenantId || !ctx.storeId) {
      throw new Error('Unauthorized: Invalid customer context');
    }

    // Create an AdminContext internally to invoke the store manager's publish logic
    const adminCtx = {
      userId: ctx.userId,
      role: 'OPERATOR' as const,
      permissions: [],
      correlationId: `pub_cust_${Date.now()}`
    };

    try {
      const res = await this.storeManager.publishStore(adminCtx, ctx.tenantId, ctx.storeId);
      return {
        success: res.status === 'SUCCESS' || res.success === true,
        deploymentUrl: res.deploymentUrl,
        buildId: res.buildId || res.metadata?.publishReport?.buildId,
        errors: res.errors || []
      };
    } catch (err: any) {
      return {
        success: false,
        errors: [err.message]
      };
    }
  }
}
