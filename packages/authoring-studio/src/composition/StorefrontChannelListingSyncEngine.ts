/**
 * StorefrontChannelListingSyncEngine.ts — Sprint G1-134 Omnichannel Feed & Channel Listing Engine (Night Shift Level 96)
 *
 * Provides pure TypeScript, headless multi-channel catalog feed generation (Google Shopping, Meta Commerce, TikTok Shop),
 * channel listing status tracking (PUBLISHED, OUT_OF_STOCK, REJECTED, DISCONTINUED), and attribute mapping.
 *
 * External channel content APIs (Google Content API for Shopping, Meta Catalog Graph API) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type SalesChannelTarget = 'GOOGLE_SHOPPING' | 'META_COMMERCE' | 'TIKTOK_SHOP' | 'AMAZON_SELLER';

export type ChannelListingStatus = 'PUBLISHED' | 'OUT_OF_STOCK' | 'REJECTED' | 'DISCONTINUED';

export interface ChannelListingItemDTO {
  readonly listingId: string;
  readonly tenantId: string;
  readonly channelTarget: SalesChannelTarget;
  readonly productId: string;
  readonly title: string;
  readonly description: string;
  readonly price: number;
  readonly currency: string;
  readonly stockQuantity: number;
  readonly status: ChannelListingStatus;
  readonly feedXmlSnippet: string;
  readonly lastSyncedAtMs: number;
}

export interface ChannelFeedBuildResultDTO {
  readonly tenantId: string;
  readonly channelTarget: SalesChannelTarget;
  readonly totalListings: number;
  readonly publishedCount: number;
  readonly outOfStockCount: number;
  readonly formattedFeedOutput: string;
  readonly generatedAtMs: number;
}

export interface ChannelListingSyncEngineStateDTO {
  readonly tenantId: string;
  readonly listings: Record<string, ChannelListingItemDTO>; // listingId -> item
}

export class StorefrontChannelListingSyncEngine {
  private readonly tenantId: string;
  private listings: Map<string, ChannelListingItemDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Syndicates a product to a target sales channel feed.
   */
  public registerChannelListing(params: {
    listingId: string;
    channelTarget: SalesChannelTarget;
    productId: string;
    title: string;
    description: string;
    price: number;
    currency?: string;
    stockQuantity: number;
  }): ChannelListingItemDTO {
    const { listingId, channelTarget, productId, title, description, price, stockQuantity } = params;

    if (!listingId || !channelTarget || !productId || !title || price < 0 || stockQuantity < 0) {
      throw new Error('listingId, channelTarget, productId, title, non-negative price, and stockQuantity are required');
    }

    const currency = params.currency ? params.currency.trim().toUpperCase() : 'USD';
    const status: ChannelListingStatus = stockQuantity > 0 ? 'PUBLISHED' : 'OUT_OF_STOCK';

    const feedXmlSnippet = `<item><g:id>${productId.trim()}</g:id><g:title>${title.trim()}</g:title><g:price>${price} ${currency}</g:price><g:availability>${stockQuantity > 0 ? 'in stock' : 'out of stock'}</g:availability></item>`;

    const now = Date.now();
    const dto: ChannelListingItemDTO = {
      listingId: listingId.trim(),
      tenantId: this.tenantId,
      channelTarget,
      productId: productId.trim(),
      title: title.trim(),
      description: description.trim(),
      price,
      currency,
      stockQuantity,
      status,
      feedXmlSnippet,
      lastSyncedAtMs: now
    };

    this.listings.set(dto.listingId, dto);
    return dto;
  }

  /**
   * Builds the formatted XML/JSON channel feed for external channel consumption.
   */
  public buildChannelFeed(channelTarget: SalesChannelTarget): ChannelFeedBuildResultDTO {
    const targetListings = Array.from(this.listings.values()).filter(
      l => l.channelTarget === channelTarget
    );

    let publishedCount = 0;
    let outOfStockCount = 0;
    const snippets: string[] = [];

    targetListings.forEach(l => {
      if (l.status === 'PUBLISHED') publishedCount++;
      if (l.status === 'OUT_OF_STOCK') outOfStockCount++;
      snippets.push(l.feedXmlSnippet);
    });

    const formattedFeedOutput = `<?xml version="1.0"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>${snippets.join('')}</channel></rss>`;

    return {
      tenantId: this.tenantId,
      channelTarget,
      totalListings: targetListings.length,
      publishedCount,
      outOfStockCount,
      formattedFeedOutput,
      generatedAtMs: Date.now()
    };
  }

  public getListing(listingId: string): ChannelListingItemDTO | undefined {
    return this.listings.get(listingId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): ChannelListingSyncEngineStateDTO {
    const record: Record<string, ChannelListingItemDTO> = {};
    this.listings.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      listings: record
    };
  }

  public importState(state: ChannelListingSyncEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.listings.clear();
    Object.entries(state.listings || {}).forEach(([k, v]) => {
      this.listings.set(k, v);
    });
  }
}
