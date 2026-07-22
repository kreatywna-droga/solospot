import { MarketplaceListing } from './MarketplaceListing';

export interface MarketplaceQuery {
  readonly text?: string;
  readonly types?: ReadonlyArray<string>;
  readonly categories?: ReadonlyArray<string>;
  readonly tags?: ReadonlyArray<string>;
  readonly capabilities?: ReadonlyArray<string>;
  readonly compatibility?: {
    readonly coreVersion?: string;
  };
  readonly publisher?: string;
  readonly license?: string;
  readonly sort?: 'popular' | 'rating' | 'downloads' | 'newest';
  readonly limit?: number;
  readonly offset?: number;
}

export interface MarketplaceSearchResult {
  readonly items: ReadonlyArray<MarketplaceListing>;
  readonly total: number;
  readonly facets?: Record<string, ReadonlyArray<{ name: string; count: number }>>;
  readonly suggestions?: ReadonlyArray<string>;
  readonly nextCursor?: string;
}
