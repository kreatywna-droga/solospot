import { ProvisionStage } from '../ProvisionStage';
import { ProvisionContext, extendProvisionContext } from '../ProvisionContext';
import { StoreConfig } from '../../../runtime-core/src/RuntimeContext';

export class StoreConfigStage implements ProvisionStage {
  readonly name = 'store-config';

  async execute(context: ProvisionContext): Promise<ProvisionContext> {
    const blueprint = context.metadata.storeBlueprint as any;
    if (!blueprint) {
      throw new Error('StoreConfigStage failed: storeBlueprint is not defined in metadata');
    }

    const capabilities = (context.metadata.capabilities as string[]) || [];

    const storeConfig: StoreConfig = {
      storeId: context.request.storeId,
      storeName: context.request.storeName,
      publicationStatus: 'DRAFT',
      template: blueprint.template,
      branding: {
        primaryColor: blueprint.branding.primaryColor,
        secondaryColor: blueprint.branding.secondaryColor,
        font: blueprint.branding.font,
        description: blueprint.branding.description
      },
      pages: blueprint.pages.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sections: p.sections.map((s: any) => ({
          id: s.id,
          type: s.type,
          properties: s.properties
        }))
      })),
      capabilities
    };

    return extendProvisionContext(context, {
      storeConfig
    });
  }

  async rollback(context: ProvisionContext): Promise<ProvisionContext> {
    return extendProvisionContext(context, {
      storeConfig: undefined
    });
  }
}
