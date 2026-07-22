import { MarketplaceListing } from './MarketplaceListing';
import { MarketplaceQuery, MarketplaceSearchResult } from './MarketplaceQuery';

export interface MarketplaceCatalog {
  addListing(listing: MarketplaceListing): Promise<void>;
  getListing(id: string): Promise<MarketplaceListing | undefined>;
  search(query: MarketplaceQuery): Promise<MarketplaceSearchResult>;
}
