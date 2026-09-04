import { describe, it, expect, beforeEach } from 'vitest';
import { AssetService } from '../../../../src/lib/assets/AssetService';
import { AssetRepository, clearInMemoryAssets } from '../../../../src/lib/assets/AssetRepository';
import { resolveImageUrl } from '../../../../src/lib/assets/resolveImageUrl';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  compile,
} from '../../../builder-core/src/BuilderDocument';
import type { IAssetStorageProvider, StorageUploadResult } from '../../../../src/lib/assets/AssetStorage';

class LifecycleStorage implements IAssetStorageProvider {
  public files: Map<string, Uint8Array> = new Map();

  async upload(buffer: Uint8Array, storagePath: string): Promise<StorageUploadResult> {
    this.files.set(storagePath, buffer);
    return {
      storagePath,
      publicUrl: `https://cdn.solospot.pl/${storagePath}`,
      size: buffer.length,
    };
  }

  async delete(storagePath: string): Promise<void> {
    this.files.delete(storagePath);
  }

  async getPublicUrl(storagePath: string): Promise<string> {
    return `https://cdn.solospot.pl/${storagePath}`;
  }
}

describe('Stage 10 — End-to-End Asset Builder Lifecycle', () => {
  let service: AssetService;
  let storage: LifecycleStorage;

  beforeEach(() => {
    clearInMemoryAssets();
    storage = new LifecycleStorage();
    service = new AssetService(new AssetRepository(), storage);
  });

  it('completes full pipeline: UPLOAD -> VALIDATE -> STORE -> PERSIST -> LIST -> SELECT -> INSERT -> SAVE -> RELOAD -> RENDER', async () => {
    const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);

    // 1. UPLOAD & VALIDATE & STORE
    const asset = await service.uploadAsset('tenant-prod', 'store-prod', {
      name: 'autumn-collection.jpg',
      size: jpegBytes.length,
      type: 'image/jpeg',
      buffer: jpegBytes,
    });

    expect(asset.id).toBeDefined();
    expect(asset.publicUrl).toContain('autumn-collection.jpg');

    // 2. LIST ASSETS
    const list = await service.listAssets('tenant-prod', 'store-prod');
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(asset.id);

    // 3. BUILDER DOCUMENT & SECTION INSERTION
    const heroNode = createSectionNode({
      id: 'sec_hero_promo',
      type: 'hero',
      label: 'Hero Promo',
      props: {
        title: 'Kolekcja Jesienna 2026',
        image: '',
      },
      order: 0,
    });

    const page = createBuilderPage({
      id: 'page_home_prod',
      slug: '/',
      name: 'Strona Główna',
      isHome: true,
      sections: [heroNode],
    });

    const doc = createBuilderDocument({
      id: 'store-prod',
      tenantId: 'tenant-prod',
      pages: [page],
    });

    // 4. SELECT & INSERT
    const updatedHero = {
      ...heroNode,
      props: {
        ...heroNode.props,
        image: asset.publicUrl,
      },
    };

    const docUpdated = {
      ...doc,
      pages: [
        {
          ...page,
          sections: [updatedHero],
        },
      ],
    };

    // 5. COMPILE (SAVE TO STORE CONFIG PATCH)
    const compiled = compile(docUpdated);
    const savedHero = compiled.pages[0].sections[0];
    expect(savedHero.props.image).toBe(asset.publicUrl);

    // 6. SIMULATE RELOAD FROM STORE CONFIG
    const reloadedImage = savedHero.props.image;
    expect(reloadedImage).toBeDefined();

    // 7. RESOLVE FOR RUNTIME (VERIFY ZERO [object Object] REGRESSION)
    const resolvedUrl = resolveImageUrl(reloadedImage);
    expect(resolvedUrl).toBe(asset.publicUrl);
    expect(resolvedUrl).not.toContain('[object Object]');
    expect(resolvedUrl.startsWith('https://cdn.solospot.pl/')).toBe(true);
  });
});
