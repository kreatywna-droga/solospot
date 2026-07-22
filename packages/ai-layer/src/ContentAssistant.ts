import { AuthoringProject } from '../../authoring-studio/src/AuthoringProject';
import { Workspace } from '../../authoring-studio/src/Workspace';
import { DraftManager } from '../../authoring-studio/src/DraftManager';

export interface GeneratedContent {
  headline: string;
  subheading?: string;
  body?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export class ContentAssistant {
  generateForStoreType(storeType: string): GeneratedContent {
    const content: Record<string, GeneratedContent> = {
      furniture: {
        headline: 'Elegant Furniture for Modern Living',
        subheading: 'Discover handcrafted pieces that transform your space',
        body: 'Our collection brings together timeless design with contemporary functionality...',
        seoTitle: 'Modern Furniture Store - Premium Handcrafted Pieces',
        seoDescription: 'Shop elegant furniture for every room. Free delivery on orders over $500.'
      },
      fashion: {
        headline: 'Style That Speaks Volumes',
        subheading: 'Trendy collections for every occasion',
        body: 'From casual wear to statement pieces, find your perfect fit...',
        seoTitle: 'Fashion Boutique - Latest Trends & Styles',
        seoDescription: 'Discover curated fashion collections. New arrivals weekly.'
      },
      electronics: {
        headline: 'Cutting-Edge Technology',
        subheading: 'Latest gadgets and smart devices',
        body: 'Explore our range of innovative electronics...',
        seoTitle: 'Electronics Store - Smart Tech & Gadgets',
        seoDescription: 'Shop the latest electronics. Free shipping on orders over $100.'
      },
      general: {
        headline: 'Welcome to Our Store',
        subheading: 'Quality products for every need',
        body: 'Browse our curated collection of premium products...',
        seoTitle: 'Premium Online Store',
        seoDescription: 'Discover quality products with fast shipping and excellent service.'
      }
    };

    return content[storeType] || content.general;
  }

  applyToPage(project: AuthoringProject, pageId: string, content: GeneratedContent): AuthoringProject {
    const template = project.template as Record<string, { sections: Array<{ id: string; props: Record<string, unknown> }> }>;
    const page = template[pageId];

    if (!page) return project;

    const updatedPage = {
      ...page,
      sections: page.sections.map((s, i) => ({
        ...s,
        props: {
          ...(s.props || {}),
          ...(i === 0 ? { headline: content.headline, subheading: content.subheading } : {}),
          ...(i === 1 && content.body ? { body: content.body } : {})
        }
      }))
    };

    return {
      ...project,
      template: {
        ...project.template,
        [pageId]: updatedPage
      }
    };
  }
}