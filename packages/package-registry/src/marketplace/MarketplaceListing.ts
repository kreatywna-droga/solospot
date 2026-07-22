export interface MarketplaceListing {
  readonly id: string; // packageId
  readonly title: string;
  readonly description: string;
  readonly author: string;
  readonly publisher: string;
  readonly icon?: string;
  readonly banner?: string;
  readonly category: string;
  readonly tags: ReadonlyArray<string>;
  readonly rating: number;
  readonly downloads: number;
  readonly license: string;
  readonly price: number; // 0 for free
  readonly visibility: 'public' | 'private';
  readonly createdAt: string;
  readonly updatedAt: string;
}
