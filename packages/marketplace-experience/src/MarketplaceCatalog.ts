import { MarketplaceSearchEngine } from '../../marketplace-core/src/MarketplaceSearchEngine';
import { MarketplaceSearchResult, MarketplaceSearchQuery, MarketplaceTemplate } from '../../marketplace-core/src/entities';

export class MarketplaceCatalog {
  constructor(private readonly searchEngine: MarketplaceSearchEngine) {}

  async search(query: MarketplaceSearchQuery): Promise<MarketplaceSearchResult> {
    return this.searchEngine.search(query);
  }

  async listTemplates(): Promise<MarketplaceTemplate[]> {
    return this.searchEngine.listTemplates();
  }

  async getFeatured(): Promise<MarketplaceTemplate[]> {
    return this.searchEngine.getFeatured();
  }

  async getByCategory(category: string): Promise<MarketplaceTemplate[]> {
    return this.searchEngine.getByCategory(category);
  }

  async getFreeTemplates(): Promise<MarketplaceTemplate[]> {
    const results = await this.searchEngine.search({ price: 'free', limit: 50 });
    return results.templates;
  }

  async getPopular(limit: number = 10): Promise<MarketplaceTemplate[]> {
    const results = await this.searchEngine.search({ sortBy: 'popular', limit });
    return results.templates;
  }

  async getRecent(limit: number = 10): Promise<MarketplaceTemplate[]> {
    const results = await this.searchEngine.search({ sortBy: 'recent', limit });
    return results.templates;
  }
}

export interface CatalogFilter {
  search?: string;
  tags?: string[];
  categories?: string[];
  authorId?: string;
  priceRange?: 'free' | 'paid';
  sortBy?: 'popular' | 'recent' | 'rating' | 'name';
}