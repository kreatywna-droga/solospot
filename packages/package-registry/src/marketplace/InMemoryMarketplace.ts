import { MarketplaceCatalog } from './MarketplaceCatalog';
import { MarketplaceListing } from './MarketplaceListing';
import { MarketplaceQuery, MarketplaceSearchResult } from './MarketplaceQuery';
import { PackageRegistry } from '../PackageRegistry';

import { PackageManifest } from '../PackageManifest';

export class InMemoryMarketplace implements MarketplaceCatalog {
  private readonly listings = new Map<string, MarketplaceListing>();

  constructor(private readonly registry: PackageRegistry) {}

  async addListing(listing: MarketplaceListing): Promise<void> {
    this.listings.set(listing.id, listing);
  }

  async getListing(id: string): Promise<MarketplaceListing | undefined> {
    return this.listings.get(id);
  }

  async search(query: MarketplaceQuery): Promise<MarketplaceSearchResult> {
    let items = Array.from(this.listings.values());

    // 1. Text filter (title, description, author)
    if (query.text) {
      const lower = query.text.toLowerCase();
      items = items.filter(
        item =>
          item.title.toLowerCase().includes(lower) ||
          item.description.toLowerCase().includes(lower) ||
          item.author.toLowerCase().includes(lower)
      );
    }

    // 2. Types/Categories/Tags/Publisher/License filter
    if (query.categories && query.categories.length > 0) {
      items = items.filter(item => query.categories!.includes(item.category));
    }

    if (query.tags && query.tags.length > 0) {
      items = items.filter(item => item.tags.some(t => query.tags!.includes(t)));
    }

    if (query.publisher) {
      items = items.filter(item => item.publisher === query.publisher);
    }

    if (query.license) {
      items = items.filter(item => item.license === query.license);
    }

    // 3. Registry cross-reference filters (types/capabilities)
    const matchedManifests = new Map<string, PackageManifest>();
    // Pre-cache type/capabilities checks from registry to keep performance high
    for (const item of items) {
      const entry = await this.registry.getPackage(item.id, 'latest');
      if (entry) {
        matchedManifests.set(item.id, entry.manifest);
      }
    }

    if (query.types && query.types.length > 0) {
      items = items.filter(item => {
        const manifest = matchedManifests.get(item.id);
        return manifest && query.types!.includes(manifest.type);
      });
    }

    if (query.capabilities && query.capabilities.length > 0) {
      items = items.filter(item => {
        const manifest = matchedManifests.get(item.id);
        return manifest && manifest.capabilities.some(c => query.capabilities!.includes(c));
      });
    }

    // 4. Sort
    if (query.sort === 'popular' || query.sort === 'downloads') {
      items.sort((a, b) => b.downloads - a.downloads);
    } else if (query.sort === 'rating') {
      items.sort((a, b) => b.rating - a.rating);
    } else if (query.sort === 'newest') {
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    // 5. Pagination
    const total = items.length;
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total,
      suggestions: []
    };
  }
}
