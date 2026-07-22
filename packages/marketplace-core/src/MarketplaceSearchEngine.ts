import { 
  MarketplaceTemplate, 
  MarketplaceSearchQuery, 
  MarketplaceSearchResult, 
  PlatformVersion, 
  CompatibilityResult 
} from './entities';

export class MarketplaceSearchEngine {
  private templates: Map<string, MarketplaceTemplate> = new Map();
  private slugIndex: Map<string, string> = new Map();

  addTemplate(template: MarketplaceTemplate): void {
    this.templates.set(template.id, template);
    this.slugIndex.set(template.slug, template.id);
  }

  removeTemplate(id: string): boolean {
    const template = this.templates.get(id);
    if (template) {
      this.slugIndex.delete(template.slug);
      return this.templates.delete(id);
    }
    return false;
  }

  async search(query: MarketplaceSearchQuery): Promise<MarketplaceSearchResult> {
    let results = Array.from(this.templates.values());

    if (query.query) {
      const searchTerm = query.query.toLowerCase();
      results = results.filter(t => 
        t.name.toLowerCase().includes(searchTerm) ||
        t.description.toLowerCase().includes(searchTerm) ||
        t.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(t => 
        query.tags!.some((tag: string) => t.tags.includes(tag))
      );
    }

    if (query.categories && query.categories.length > 0) {
      results = results.filter(t => 
        query.categories!.some((cat: string) => t.categories.includes(cat))
      );
    }

    if (query.authorId) {
      results = results.filter(t => t.author.id === query.authorId);
    }

    if (query.type) {
      results = results.filter(t => this.getTemplateType(t) === query.type);
    }

    if (query.price === 'free') {
      results = results.filter(t => !t.price || t.price.amount === 0);
    } else if (query.price === 'paid') {
      results = results.filter(t => t.price && t.price.amount > 0);
    }

    const sorted = this.sortResults(results, query.sortBy || 'popular');

    const start = query.offset || 0;
    const end = start + (query.limit || 20);
    const paged = sorted.slice(start, end);

    return {
      total: sorted.length,
      templates: paged
    };
  }

  async listTemplates(): Promise<MarketplaceTemplate[]> {
    return Array.from(this.templates.values());
  }

  async getFeatured(): Promise<MarketplaceTemplate[]> {
    const results = await this.search({ limit: 10, sortBy: 'popular' });
    return results.templates;
  }

  async getByCategory(category: string, limit: number = 20): Promise<MarketplaceTemplate[]> {
    const results = await this.search({ categories: [category], limit });
    return results.templates;
  }

  async getTemplate(id: string): Promise<MarketplaceTemplate | null> {
    return this.templates.get(id) || null;
  }

  async getTemplateBySlug(slug: string): Promise<MarketplaceTemplate | null> {
    const id = this.slugIndex.get(slug);
    return id ? this.templates.get(id) || null : null;
  }

  private getTemplateType(template: MarketplaceTemplate): string {
    return 'storefront';
  }

  private sortResults(templates: MarketplaceTemplate[], sortBy: string): MarketplaceTemplate[] {
    switch (sortBy) {
      case 'name':
        return [...templates].sort((a, b) => a.name.localeCompare(b.name));
      case 'recent':
        return [...templates].sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case 'rating':
        return [...templates].sort((a, b) => {
          const avgA = this.averageRating(a.ratings);
          const avgB = this.averageRating(b.ratings);
          return avgB - avgA;
        });
      case 'popular':
      default:
        return [...templates].sort((a, b) => 
          this.totalDownloads(b) - this.totalDownloads(a)
        );
    }
  }

  private averageRating(ratings: { score: number }[]): number {
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
  }

  private totalDownloads(template: MarketplaceTemplate): number {
    return template.versions.reduce((sum, v) => sum + v.downloads, 0);
  }
}

export class CompatibilityEngine {
  checkCompatibility(
    template: MarketplaceTemplate, 
    platform: PlatformVersion
  ): CompatibilityResult {
    const issues: string[] = [];
    const compat = template.compatibility;

    if (compat.builder && !this.satisfies(platform.builder, compat.builder)) {
      issues.push(`Builder version ${platform.builder} does not satisfy ${compat.builder}`);
    }

    if (compat.runtime && !this.satisfies(platform.runtime, compat.runtime)) {
      issues.push(`Runtime version ${platform.runtime} does not satisfy ${compat.runtime}`);
    }

    if (compat.componentApi && !this.satisfies(platform.componentApi, compat.componentApi)) {
      issues.push(`Component API version ${platform.componentApi} does not satisfy ${compat.componentApi}`);
    }

    if (compat.themeApi && !this.satisfies(platform.themeApi, compat.themeApi)) {
      issues.push(`Theme API version ${platform.themeApi} does not satisfy ${compat.themeApi}`);
    }

    if (compat.commerceApi && !this.satisfies(platform.commerceApi, compat.commerceApi)) {
      issues.push(`Commerce API version ${platform.commerceApi} does not satisfy ${compat.commerceApi}`);
    }

    return {
      compatible: issues.length === 0,
      issues
    };
  }

  private satisfies(version: string, range: string): boolean {
    const v = this.parseVersion(version);
    const r = this.parseRange(range);
    return this.checkRange(v, r);
  }

  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('.').map(p => parseInt(p, 10));
    return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
  }

  private parseRange(range: string): { op: string; version: { major: number; minor: number; patch: number } } {
    if (range.startsWith('>=')) {
      return { op: '>=', version: this.parseVersion(range.slice(2)) };
    }
    if (range.startsWith('^')) {
      return { op: '^', version: this.parseVersion(range.slice(1)) };
    }
    if (range.startsWith('~')) {
      return { op: '~', version: this.parseVersion(range.slice(1)) };
    }
    return { op: '=', version: this.parseVersion(range) };
  }

  private checkRange(v: { major: number; minor: number; patch: number }, r: { op: string; version: { major: number; minor: number; patch: number } }): boolean {
    switch (r.op) {
      case '=':
        return v.major === r.version.major && v.minor === r.version.minor && v.patch === r.version.patch;
      case '>=':
        return v.major > r.version.major || 
               (v.major === r.version.major && (v.minor > r.version.minor || 
               (v.minor === r.version.minor && v.patch >= r.version.patch)));
      case '^':
        if (r.version.major === 0) {
          return v.major === 0 && v.minor === r.version.minor && v.patch >= r.version.patch;
        }
        return v.major === r.version.major && 
               (v.minor > r.version.minor || 
               (v.minor === r.version.minor && v.patch >= r.version.patch));
      case '~':
        return v.major === r.version.major && 
               v.minor === r.version.minor && 
               v.patch >= r.version.patch;
      default:
        return false;
    }
  }
}