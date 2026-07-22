import { MarketplaceTemplate, PlatformVersion } from '../../marketplace-core/src/entities';
import { CompatibilityEngine } from '../../marketplace-core/src/MarketplaceSearchEngine';

export interface ProductPageData {
  template: MarketplaceTemplate;
  compatibility: { compatible: boolean; issues: string[] };
  averageRating: number;
  downloadCount: number;
}

export class ProductPage {
  private compatibilityEngine: CompatibilityEngine;

  constructor(private platform: PlatformVersion) {
    this.compatibilityEngine = new CompatibilityEngine();
  }

  getProductPage(template: MarketplaceTemplate): ProductPageData {
    const compatibility = this.compatibilityEngine.checkCompatibility(template, this.platform);
    const averageRating = this.calculateAverageRating(template.ratings);
    const downloadCount = template.versions.reduce((sum, v) => sum + v.downloads, 0);

    return {
      template,
      compatibility,
      averageRating,
      downloadCount
    };
  }

  getScreenshots(): string[] {
    return [];
  }

  getVersionHistory(): Array<{
    version: string;
    releaseNotes?: string;
    publishedAt: string;
    downloads: number;
  }> {
    return [];
  }

  calculateAverageRating(ratings: Array<{ score: number }>): number {
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
  }

  renderCompatibilityBadge(template: MarketplaceTemplate): string {
    const result = this.compatibilityEngine.checkCompatibility(template, this.platform);

    if (result.compatible) {
      return '✅ Compatible';
    }

    return '⚠️ Incompatible';
  }

  formatPrice(template: MarketplaceTemplate): string {
    if (!template.price || template.price.free) {
      return 'Free';
    }
    return `${template.price.amount} ${template.price.currency}`;
  }
}