import type { AssetProvider, AssetSearchOptions, AssetSearchResult, LicenseOptions } from '../AssetProviderContract';
import type { UniversalAsset } from '../AssetTypes';

export class ShutterstockProvider implements AssetProvider {
  readonly id = 'shutterstock' as const;
  readonly name = 'Shutterstock Premium';

  async search(options: AssetSearchOptions): Promise<AssetSearchResult> {
    const params = new URLSearchParams({
      query: options.query || '',
      type: options.type || 'image',
      page: String(options.page || 1),
      limit: String(options.limit || 20),
    });

    if (options.category) params.set('category', options.category);
    if (options.orientation) params.set('orientation', options.orientation);

    const res = await fetch(`/api/assets/shutterstock/search?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`ShutterstockProvider search failed with status ${res.status}`);
    }

    const data = await res.json();
    return {
      assets: data.assets || [],
      total: data.total || 0,
      page: data.page || 1,
      totalPages: data.totalPages || 1,
      provider: 'shutterstock',
    };
  }

  async getDetails(assetId: string): Promise<UniversalAsset> {
    const searchRes = await this.search({ query: assetId, limit: 1 });
    if (searchRes.assets.length > 0) {
      return searchRes.assets[0];
    }
    throw new Error(`Asset ${assetId} not found in Shutterstock provider`);
  }

  async getPreview(assetId: string): Promise<string> {
    const details = await this.getDetails(assetId);
    return details.previewUrl;
  }

  async license(assetId: string, options: LicenseOptions): Promise<UniversalAsset> {
    const details = await this.getDetails(assetId).catch(() => ({
      id: assetId,
      provider: 'shutterstock' as const,
      providerAssetId: assetId,
      type: 'image' as const,
      previewUrl: '',
      sourceUrl: '',
      title: 'Shutterstock Asset',
      author: 'Shutterstock Contributor',
    }));

    const res = await fetch('/api/assets/shutterstock/license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId,
        tenantId: options.tenantId,
        storeId: options.storeId,
        projectId: options.projectId,
        nodeId: options.nodeId,
        type: details.type,
        previewUrl: details.previewUrl,
        sourceUrl: details.sourceUrl,
        title: details.title,
        author: details.author,
      }),
    });

    if (!res.ok) {
      throw new Error(`ShutterstockProvider licensing failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.asset;
  }
}
