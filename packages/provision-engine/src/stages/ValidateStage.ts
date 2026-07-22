import { ProvisionStage } from '../ProvisionStage';
import { ProvisionContext } from '../ProvisionContext';

export class ValidateStage implements ProvisionStage {
  readonly name = 'validate';

  constructor(
    private readonly isTenantExists: (tenantId: string) => Promise<boolean> = async () => false
  ) {}

  async execute(context: ProvisionContext): Promise<ProvisionContext> {
    const { tenantId, storeId, storeName, templateId, mode } = context.request;

    if (!tenantId || tenantId.trim() === '') {
      throw new Error('Validation failed: Missing tenantId');
    }
    if (!storeId || storeId.trim() === '') {
      throw new Error('Validation failed: Missing storeId');
    }
    if (!storeName || storeName.trim() === '') {
      throw new Error('Validation failed: Missing storeName');
    }
    if (!templateId || templateId.trim() === '') {
      throw new Error('Validation failed: Missing templateId');
    }
    if (!['LIVE', 'DEVELOPMENT', 'SANDBOX'].includes(mode)) {
      throw new Error(`Validation failed: Invalid mode "${mode}"`);
    }

    const exists = await this.isTenantExists(tenantId);
    if (exists) {
      throw new Error(`Validation failed: Tenant "${tenantId}" already exists`);
    }

    return context;
  }

  async rollback(context: ProvisionContext): Promise<ProvisionContext> {
    return context;
  }
}
