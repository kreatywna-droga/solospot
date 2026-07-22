import { AIIntent, AIProjectPlan } from './AIOchestrator';

export class ProjectPlanner {
  parseType(prompt: string): string {
    const lower = prompt.toLowerCase();

    if (lower.includes('furniture') || lower.includes('meble') || lower.includes('furniture store')) {
      return 'furniture';
    }
    if (lower.includes('fashion') || lower.includes('fashion store') || lower.includes('ubrania') || lower.includes('clothing')) {
      return 'fashion';
    }
    if (lower.includes('electronics') || lower.includes('elektronika') || lower.includes('tech')) {
      return 'electronics';
    }
    if (lower.includes('food') || lower.includes('jedzenie') || lower.includes('restaurant')) {
      return 'food';
    }

    return 'generic';
  }

  getTemplateType(projectType: string): 'storefront' | 'theme' | 'component' | 'page' {
    return 'storefront';
  }

  generateFromPrompt(prompt: string): AIProjectPlan {
    const type = this.parseType(prompt);
    const plan: AIProjectPlan = {
      pages: [],
      components: [],
      themeTokens: {}
    };

    plan.pages = this.getDefaultPages();

    if (type === 'furniture') {
      plan.components.push({ id: 'product-grid', type: 'widget' });
      plan.components.push({ id: 'room-planner', type: 'section' });
      plan.themeTokens = { primary: '#8b4513', secondary: '#deb887' };
    } else if (type === 'fashion') {
      plan.components.push({ id: 'product-carousel', type: 'widget' });
      plan.themeTokens = { primary: '#ff69b4', secondary: '#000000' };
    } else if (type === 'electronics') {
      plan.components.push({ id: 'spec-table', type: 'widget' });
      plan.themeTokens = { primary: '#007bff', secondary: '#6c757d' };
    } else if (type === 'food') {
      plan.components.push({ id: 'menu-display', type: 'widget' });
      plan.themeTokens = { primary: '#28a745', secondary: '#ffc107' };
    }

    return plan;
  }

  private getDefaultPages(): Array<{ name: string; slug: string; sections: string[] }> {
    return [
      { name: 'Home', slug: '/', sections: ['hero', 'features', 'products'] },
      { name: 'Products', slug: '/products', sections: ['product-grid'] },
      { name: 'About', slug: '/about', sections: ['content'] },
      { name: 'Contact', slug: '/contact', sections: ['contact-form'] }
    ];
  }
}