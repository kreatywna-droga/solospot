import { ProvisionStage } from '../ProvisionStage';
import { ProvisionContext, extendProvisionContext } from '../ProvisionContext';

export interface StoreBlueprint {
  readonly template: string;
  readonly branding: {
    readonly primaryColor: string;
    readonly secondaryColor: string;
    readonly font: string;
    readonly description?: string;
  };
  readonly pages: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly sections: ReadonlyArray<{
      readonly id: string;
      readonly type: string;
      readonly properties: Record<string, any>;
    }>;
  }>;
}

export class TemplateStage implements ProvisionStage {
  readonly name = 'template';

  async execute(context: ProvisionContext): Promise<ProvisionContext> {
    const { templateId } = context.request;

    let blueprint: StoreBlueprint;

    if (templateId === 'apparel') {
      blueprint = {
        template: 'apparel',
        branding: {
          primaryColor: '#7c3aed',
          secondaryColor: '#10b981',
          font: 'Inter',
          description: 'Premium Apparel Store template'
        },
        pages: [
          {
            id: 'page_home',
            name: 'Home',
            slug: '',
            sections: [
              { id: 'sec_header', type: 'Header', properties: { title: 'Apparel Shop' } },
              { id: 'sec_hero', type: 'Hero', properties: { heading: 'Premium Trends', text: 'Browse our latest collection' } },
              { id: 'sec_products', type: 'ProductGrid', properties: { limit: 8 } },
              { id: 'sec_footer', type: 'Footer', properties: { copyright: '© 2026 Apparel Shop' } }
            ]
          },
          {
            id: 'page_contact',
            name: 'Contact',
            slug: 'contact',
            sections: [
              { id: 'sec_header', type: 'Header', properties: { title: 'Contact Us' } },
              { id: 'sec_contact_form', type: 'ContactForm', properties: { email: 'support@apparel.io' } },
              { id: 'sec_footer', type: 'Footer', properties: { copyright: '© 2026 Apparel Shop' } }
            ]
          }
        ]
      };
    } else if (templateId === 'digital') {
      blueprint = {
        template: 'digital',
        branding: {
          primaryColor: '#06b6d4',
          secondaryColor: '#f59e0b',
          font: 'Outfit',
          description: 'Modern Digital Products store'
        },
        pages: [
          {
            id: 'page_home',
            name: 'Home',
            slug: '',
            sections: [
              { id: 'sec_header', type: 'Header', properties: { title: 'Digital Marketplace' } },
              { id: 'sec_hero', type: 'Hero', properties: { heading: 'E-Books & Assets', text: 'Instant access to assets' } },
              { id: 'sec_features', type: 'FeatureList', properties: { items: ['High quality', 'Lifetime updates'] } },
              { id: 'sec_footer', type: 'Footer', properties: { copyright: '© 2026 Digital Marketplace' } }
            ]
          }
        ]
      };
    } else {
      blueprint = {
        template: 'default',
        branding: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          font: 'system-ui',
          description: 'Basic Web Factor storefront'
        },
        pages: [
          {
            id: 'page_home',
            name: 'Home',
            slug: '',
            sections: [
              { id: 'sec_header', type: 'Header', properties: { title: context.request.storeName } },
              { id: 'sec_hero', type: 'Hero', properties: { heading: 'Welcome', text: 'Store is ready' } },
              { id: 'sec_footer', type: 'Footer', properties: { copyright: `© 2026 ${context.request.storeName}` } }
            ]
          }
        ]
      };
    }

    return extendProvisionContext(context, {
      metadata: {
        ...context.metadata,
        storeBlueprint: blueprint
      }
    });
  }

  async rollback(context: ProvisionContext): Promise<ProvisionContext> {
    return extendProvisionContext(context, {
      metadata: {
        ...context.metadata,
        storeBlueprint: undefined
      }
    });
  }
}
