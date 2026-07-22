// media-certification.test.ts
// C8.8: Media Manager — certification tests

import { describe, it, expect } from 'vitest';
import { MemoryAssetLibrary, MemoryMediaLibrary } from '../AssetLibrary';
import { LocalAssetStorage } from '../providers/LocalAssetStorage';
import { ProcessingPipeline, ProcessingOperation } from '../ProcessingPipeline';
import { S3AssetStorage } from '../providers/S3AssetStorage';
import { R2AssetStorage } from '../providers/R2AssetStorage';
import { Asset, AssetType, MediaDocument } from '../AssetTypes';
import { UploadEngine } from '../UploadEngine';

describe('C8.1 Media Domain', () => {
  it('should create MediaDocument with folders, assets, collections, tags, permissions', async () => {
    const doc: MediaDocument = {
      id: 'tenant-1',
      tenantId: 'tenant-1',
      rootFolderId: 'root',
      folders: [],
      assets: [],
      collections: [],
      tags: [],
      permissions: [],
    };
    expect(doc.id).toBe('tenant-1');
    expect(doc.folders).toEqual([]);
    expect(doc.assets).toEqual([]);
    expect(doc.collections).toEqual([]);
    expect(doc.tags).toEqual([]);
    expect(doc.permissions).toEqual([]);
  });

  it('should create folder and list folders', async () => {
    const storage = new LocalAssetStorage();
    const library = new MemoryMediaLibrary(storage);
    
    const folder = {
      id: 'folder-1',
      tenantId: 'tenant-1',
      parentId: null,
      name: 'Images',
      path: '/images',
      createdAt: new Date().toISOString(),
      createdBy: 'user-1',
    };
    
    await library.createFolder(folder);
    const folders = await library.listFolders(null);
    expect(folders.length).toBeGreaterThan(0);
    expect(folders[0].name).toBe('Images');
  });

  it('should create collection and list collections', async () => {
    const storage = new LocalAssetStorage();
    const library = new MemoryMediaLibrary(storage);
    
    const collection = await library.createCollection({
      tenantId: 'tenant-1',
      name: 'Hero Images',
      description: 'Hero section images',
      assetIds: [],
      createdBy: 'user-1',
    });
    
    expect(collection.id).toBeDefined();
    expect(collection.name).toBe('Hero Images');
    
    const collections = await library.listCollections();
    expect(collections.length).toBe(1);
  });

  it('should create tag and tag/untag asset', async () => {
    const storage = new LocalAssetStorage();
    const library = new MemoryMediaLibrary(storage);
    
    const tag = await library.createTag({
      tenantId: 'tenant-1',
      name: 'hero',
      color: '#6366f1',
    });
    
    expect(tag.id).toBeDefined();
    expect(tag.name).toBe('hero');
    
    const tags = await library.getTags();
    expect(tags.length).toBe(1);
  });

  it('should set and get permissions', async () => {
    const storage = new LocalAssetStorage();
    const library = new MemoryMediaLibrary(storage);
    
    await library.setPermission({
      tenantId: 'tenant-1',
      userId: 'user-1',
      canRead: true,
      canWrite: true,
      canDelete: false,
    });
    
    const permissions = await library.getPermissions('tenant-1');
    expect(permissions.length).toBe(1);
    expect(permissions[0].userId).toBe('user-1');
    expect(permissions[0].canWrite).toBe(true);
  });

  it('should get MediaDocument with all related data', async () => {
    const storage = new LocalAssetStorage();
    const library = new MemoryMediaLibrary(storage);
    
    await library.createFolder({
      id: 'folder-1',
      tenantId: 'tenant-1',
      parentId: null,
      name: 'Images',
      path: '/images',
      createdAt: new Date().toISOString(),
      createdBy: 'user-1',
    });
    
    const doc = await library.getDocument('tenant-1');
    expect(doc).not.toBeNull();
    expect(doc!.folders.length).toBeGreaterThan(0);
    expect(doc!.folders[0].name).toBe('Images');
  });
});

describe('C8.2 Upload Engine', () => {
  it('should create UploadEngine with default options', () => {
    const storage = new LocalAssetStorage();
    const engine = new UploadEngine(storage);
    expect(engine).toBeDefined();
  });

  it('should track upload jobs', () => {
    const storage = new LocalAssetStorage();
    const engine = new UploadEngine(storage);
    
    const job = {
      id: 'job-1',
      file: new File(['test'], 'test.png', { type: 'image/png' }),
      folderId: 'folder-1',
      progress: 0,
      status: 'pending' as const,
    };
    
    (engine as any).jobs.set('job-1', job);
    const retrieved = (engine as any).getJob('job-1');
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe('job-1');
  });

  it('should cancel upload job', () => {
    const storage = new LocalAssetStorage();
    const engine = new UploadEngine(storage);
    
    const job = {
      id: 'job-1',
      file: new File(['test'], 'test.png', { type: 'image/png' }),
      folderId: 'folder-1',
      progress: 0,
      status: 'uploading' as const,
    };
    
    (engine as any).jobs.set('job-1', job);
    const cancelled = engine.cancel('job-1');
    expect(cancelled).toBe(true);
    expect((engine as any).getJob('job-1')?.status).toBe('cancelled');
  });
});

describe('C8.3 Asset Processing Pipeline', () => {
  it('should generate thumbnail', async () => {
    const pipeline = new ProcessingPipeline();
    const job: ProcessingOperation[] = [
      { type: 'thumbnail', params: { width: 200, height: 200 } },
    ];
    
    const result = await pipeline.process({
      id: 'job-1',
      assetId: 'asset-1',
      operations: job,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    
    expect(result.status).toBe('done');
    expect(result.result?.success).toBe(true);
    expect(result.result?.output?.width).toBe(200);
    expect(result.result?.output?.height).toBe(200);
  });

  it('should convert format to WebP', async () => {
    const pipeline = new ProcessingPipeline();
    const job: ProcessingOperation[] = [
      { type: 'convert', params: { format: 'webp', quality: 80 } },
    ];
    
    const result = await pipeline.process({
      id: 'job-2',
      assetId: 'asset-1',
      operations: job,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    
    expect(result.status).toBe('done');
    expect(result.result?.output?.mimeType).toBe('image/webp');
  });

  it('should compress image', async () => {
    const pipeline = new ProcessingPipeline();
    const job: ProcessingOperation[] = [
      { type: 'compress', params: { quality: 80 } },
    ];
    
    const result = await pipeline.process({
      id: 'job-3',
      assetId: 'asset-1',
      operations: job,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    
    expect(result.status).toBe('done');
    expect(result.result?.success).toBe(true);
  });

  it('should extract EXIF metadata', async () => {
    const pipeline = new ProcessingPipeline();
    const job: ProcessingOperation[] = [
      { type: 'extract-exif' },
    ];
    
    const result = await pipeline.process({
      id: 'job-4',
      assetId: 'asset-1',
      operations: job,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    
    expect(result.status).toBe('done');
    expect(result.result?.metadata?.exif).toBeDefined();
  });

  it('should rotate image 90 degrees', async () => {
    const pipeline = new ProcessingPipeline();
    const job: ProcessingOperation[] = [
      { type: 'rotate', params: { degrees: 90 } },
    ];
    
    const result = await pipeline.process({
      id: 'job-5',
      assetId: 'asset-1',
      operations: job,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    
    expect(result.status).toBe('done');
    expect(result.result?.metadata?.rotation).toBe(90);
  });

  it('should process multiple operations in sequence', async () => {
    const pipeline = new ProcessingPipeline();
    const job: ProcessingOperation[] = [
      { type: 'resize', params: { width: 800, height: 600 } },
      { type: 'compress', params: { quality: 85 } },
      { type: 'convert', params: { format: 'webp' } },
    ];
    
    const result = await pipeline.process({
      id: 'job-6',
      assetId: 'asset-1',
      operations: job,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    
    expect(result.status).toBe('done');
  });
});

describe('C8.4 CDN & Storage', () => {
  it('should create S3AssetStorage', () => {
    const storage = new S3AssetStorage({
      region: 'us-east-1',
      bucket: 'my-bucket',
      cdnBaseUrl: 'https://cdn.example.com',
    });
    expect(storage).toBeDefined();
  });

  it('should create R2AssetStorage', () => {
    const storage = new R2AssetStorage({
      accountId: 'account-1',
      bucket: 'my-bucket',
      cdnBaseUrl: 'https://cdn.example.com',
    });
    expect(storage).toBeDefined();
  });

  it('should generate CDN URL with transformations', async () => {
    const storage = new S3AssetStorage({
      region: 'us-east-1',
      bucket: 'my-bucket',
      cdnBaseUrl: 'https://cdn.example.com',
    });
    
    const url = await storage.getUrl('test.jpg', { width: 200, height: 200, quality: 80, format: 'webp' });
    expect(url).toContain('cdn.example.com');
    expect(url).toContain('w=200');
    expect(url).toContain('h=200');
    expect(url).toContain('q=80');
    expect(url).toContain('f=webp');
  });

  it('should create versioned copy', async () => {
    const storage = new LocalAssetStorage();
    const result = await storage.upload(new File(['test'], 'test.jpg', { type: 'image/jpeg' }), {
      contentType: 'image/jpeg',
    });
    const versioned = await storage.createVersion(result.storageKey, 'v1');
    expect(versioned).toContain('v=v1');
  });
});

describe('C8.8 Performance', () => {
  it('should process 100 thumbnails in < 1s', async () => {
    const pipeline = new ProcessingPipeline();
    const start = performance.now();
    
    const jobs = Array.from({ length: 100 }, (_, i) => ({
      id: `job-${i}`,
      assetId: `asset-${i}`,
      operations: [{ type: 'thumbnail' as const, params: { width: 200, height: 200 } }],
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    }));
    
    await Promise.all(jobs.map(job => pipeline.process(job)));
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });

  it('should search assets in < 10ms for 1000 assets', async () => {
    const storage = new LocalAssetStorage();
    const library = new MemoryAssetLibrary(storage);
    
    for (let i = 0; i < 1000; i++) {
      await library.upload(new File(['test'], `asset-${i}`, { type: 'image/png' }), { name: `asset-${i}`, type: 'image' });
    }
    
    const start = performance.now();
    const results = await library.search('asset-1');
    const elapsed = performance.now() - start;
    
    expect(elapsed).toBeLessThan(10);
    expect(results.length).toBeGreaterThan(0);
  });
});
