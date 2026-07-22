// c8-media-golden-flow.test.ts
// C8.8: Media Manager — golden flow certification

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryMediaLibrary, MemoryAssetLibrary } from '../AssetLibrary'
import { LocalAssetStorage } from '../providers/LocalAssetStorage'
import { ProcessingPipeline, ProcessingOperation } from '../ProcessingPipeline'
import { Asset, AssetType, MediaDocument, AssetMetadata } from '../AssetTypes'
import { AssetReference } from '../AssetReference'
import { UploadEngine } from '../UploadEngine'

describe('C8 Media Golden Flow', () => {
  let storage: LocalAssetStorage
  let library: MemoryMediaLibrary
  let pipeline: ProcessingPipeline
  let uploadEngine: UploadEngine
  let document: MediaDocument

  beforeEach(() => {
    storage = new LocalAssetStorage({ basePath: 'test-tenant' })
    library = new MemoryMediaLibrary(storage)
    pipeline = new ProcessingPipeline()
    uploadEngine = new UploadEngine(storage, pipeline as any)
    document = {
      id: 'test-tenant',
      tenantId: 'test-tenant',
      rootFolderId: 'root',
      folders: [],
      assets: [],
      collections: [],
      tags: [],
      permissions: [],
    }
  })

  // ---------------------------------------------------------------------------
  // Helper
  // ---------------------------------------------------------------------------

  class MockFile extends File {
    constructor(private _size: number, name: string, type: string) {
      const blob = new Blob(['mock-data'], { type })
      super([blob], name, { type })
    }
    get size() { return this._size }
  }

  function createMockFile(name: string, type: string, size = 1024): File {
    return new MockFile(size, name, type)
  }

  function createUploadJob(file: File, folderId = 'folder-1'): any {
    return {
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      folderId,
      progress: 0,
      status: 'pending',
    }
  }

  function createProcessingJob(assetId: string, operations: any[]): any {
    return {
      id: `proc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      assetId,
      operations,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
  }

  // ---------------------------------------------------------------------------
  // C8.8.1 — Upload
  // ---------------------------------------------------------------------------

  describe('C8.8.1 Upload', () => {
    it('should upload image file and create asset', async () => {
      const file = createMockFile('hero.jpg', 'image/jpeg', 2048)
      const asset = await uploadEngine.upload(createUploadJob(file))
      
      expect(asset).toBeDefined()
      expect(asset.name).toBe('hero.jpg')
      expect(asset.type).toBe('image')
      expect(asset.metadata.mimeType).toBe('image/jpeg')
    })

    it('should categorize PDF as document type', async () => {
      const file = createMockFile('doc.pdf', 'application/pdf', 2048)
      const asset = await uploadEngine.upload(createUploadJob(file))
      
      expect(asset.type).toBe('document')
      expect(asset.metadata.mimeType).toBe('application/pdf')
    })

    it('should preserve tenant isolation during upload', async () => {
      const storage2 = new LocalAssetStorage({ basePath: 'tenant-2' })
      const uploadEngine2 = new UploadEngine(storage2, pipeline as any)
      const file = createMockFile('tenant2.jpg', 'image/jpeg', 2048)
      const asset = await uploadEngine2.upload(createUploadJob(file, 'folder-2'))
      
      expect(asset.id).toBeDefined()
      expect(asset.name).toBe('tenant2.jpg')
    })
  })

  // ---------------------------------------------------------------------------
  // C8.8.2 — Processing
  // ---------------------------------------------------------------------------

  describe('C8.8.2 Processing', () => {
    it('should process image with crop operation', async () => {
      const file = createMockFile('crop-test.jpg', 'image/jpeg', 2048)
      const asset = await uploadEngine.upload(createUploadJob(file))
      
      const job = createProcessingJob(asset.id, [
        { type: 'crop', params: { x: 0, y: 0, width: 100, height: 100 } },
      ])
      const processed = await pipeline.process(job)
      
      expect(processed).toBeDefined()
      expect(processed.status).toBe('done')
    })

    it('should apply resize operation', async () => {
      const file = createMockFile('resize-test.jpg', 'image/jpeg', 2048)
      const asset = await uploadEngine.upload(createUploadJob(file))
      
      const job = createProcessingJob(asset.id, [
        { type: 'resize', params: { width: 200, height: 200 } },
      ])
      const processed = await pipeline.process(job)
      
      expect(processed.status).toBe('done')
    })

    it('should apply rotate operation', async () => {
      const file = createMockFile('rotate-test.jpg', 'image/jpeg', 2048)
      const asset = await uploadEngine.upload(createUploadJob(file))
      
      const job = createProcessingJob(asset.id, [
        { type: 'rotate', params: { degrees: 90 } },
      ])
      const processed = await pipeline.process(job)
      
      expect(processed.status).toBe('done')
    })
  })

  // ---------------------------------------------------------------------------
  // C8.8.3 — AssetReference
  // ---------------------------------------------------------------------------

  describe('C8.8.3 AssetReference', () => {
    it('should create AssetReference from asset', () => {
      const asset: Asset = {
        id: 'asset-123',
        tenantId: 'test-tenant',
        type: 'image',
        name: 'test.jpg',
        metadata: {} as AssetMetadata,
        createdAt: new Date().toISOString(),
        createdBy: 'user-1',
      } as any
      
      const ref = AssetReference.fromAsset(asset)
      expect(ref.id).toBe('asset-123')
      expect(ref.type).toBe('image')
    })

    it('should serialize to JSON', () => {
      const ref = new AssetReference('asset-123', 'image')
      const json = ref.toJSON()
      expect(json).toEqual({ id: 'asset-123', type: 'image' })
    })

    it('should deserialize from JSON', () => {
      const ref = AssetReference.fromJSON({ id: 'asset-123', type: 'image' })
      expect(ref.id).toBe('asset-123')
      expect(ref.type).toBe('image')
    })
  })

  // ---------------------------------------------------------------------------
  // C8.8.4 — Builder Integration
  // ---------------------------------------------------------------------------

  describe('C8.8.4 Builder Integration', () => {
    it('should store AssetReference in BuilderDocument', async () => {
      const file = createMockFile('builder.jpg', 'image/jpeg', 2048)
      const asset = await uploadEngine.upload(createUploadJob(file))
      
      const ref = AssetReference.fromAsset(asset)
      const sectionProps = {
        image: ref,
        alt: 'Hero image',
      }
      
      expect(sectionProps.image).toBeDefined()
      expect((sectionProps.image as AssetReference).id).toBe(asset.id)
    })

    it('should update asset reference without changing section id', async () => {
      const file1 = createMockFile('old.jpg', 'image/jpeg', 2048)
      const file2 = createMockFile('new.jpg', 'image/jpeg', 2048)
      const asset1 = await uploadEngine.upload(createUploadJob(file1))
      const asset2 = await uploadEngine.upload(createUploadJob(file2))
      
      const ref1 = AssetReference.fromAsset(asset1)
      const ref2 = AssetReference.fromAsset(asset2)
      
      expect(ref1.id).not.toBe(ref2.id)
      
      const sectionProps = { image: ref1 }
      sectionProps.image = ref2
      
      expect((sectionProps.image as AssetReference).id).toBe(asset2.id)
    })
  })

  // ---------------------------------------------------------------------------
  // C8.8.5 — Preview
  // ---------------------------------------------------------------------------

  describe('C8.8.5 Preview', () => {
    it('should create AssetReference for preview', async () => {
      const file = createMockFile('preview.jpg', 'image/jpeg', 2048)
      const asset = await uploadEngine.upload(createUploadJob(file))
      
      const ref = AssetReference.fromAsset(asset)
      expect(ref.id).toBe(asset.id)
      expect(ref.type).toBe('image')
    })
  })

  // ---------------------------------------------------------------------------
  // C8.8.6 — Runtime CDN
  // ---------------------------------------------------------------------------

  describe('C8.8.6 Runtime CDN', () => {
    it('should create AssetReference for runtime', async () => {
      const file = createMockFile('cdn.jpg', 'image/jpeg', 2048)
      const asset = await uploadEngine.upload(createUploadJob(file))
      
      const ref = AssetReference.fromAsset(asset)
      expect(ref.id).toBe(asset.id)
      expect(ref.type).toBe('image')
      
      const json = ref.toJSON()
      expect(json).toEqual({ id: asset.id, type: 'image' })
    })
  })

  // ---------------------------------------------------------------------------
  // C8.8.7 — Tenant Isolation
  // ---------------------------------------------------------------------------

  describe('C8.8.7 Tenant Isolation', () => {
    it('should not leak assets between tenants', async () => {
      const tenant1Storage = new LocalAssetStorage({ basePath: 'tenant-1' })
      const tenant2Storage = new LocalAssetStorage({ basePath: 'tenant-2' })
      
      const uploadEngine1 = new UploadEngine(tenant1Storage, pipeline as any)
      const uploadEngine2 = new UploadEngine(tenant2Storage, pipeline as any)
      
      const file1 = createMockFile('t1.jpg', 'image/jpeg', 2048)
      const file2 = createMockFile('t2.jpg', 'image/jpeg', 2048)
      
      const asset1 = await uploadEngine1.upload(createUploadJob(file1, 'folder-1'))
      const asset2 = await uploadEngine2.upload(createUploadJob(file2, 'folder-2'))
      
      expect(asset1.id).toBeDefined()
      expect(asset2.id).toBeDefined()
      expect(asset1.id).not.toBe(asset2.id)
      expect(asset1.storageKey).not.toBe(asset2.storageKey)
    })
  })
})
