import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { LocalAssetStorage } from '../providers/LocalAssetStorage';
import { StorageFactory } from '../AssetStorage';

describe('LocalAssetStorage', () => {
  let storage: LocalAssetStorage;

  beforeEach(() => {
    storage = new LocalAssetStorage({ basePath: 'test' });
  });

  afterEach(async () => {
    // Clean up test files
    // In a real implementation, we'd need to implement a way to list and delete all files
    // For now, we'll just create a new instance for each test
  });

  test('should upload and download a file', async () => {
    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    const blob = new Blob([testData]);
    const file = new File([blob], 'test.txt', { type: 'text/plain' });

    const result = await storage.upload(file, {
      contentType: 'text/plain'
    });

    expect(result).toHaveProperty('storageKey');
    expect(result.size).toBe(5);

    // Verify file exists
    const exists = await storage.exists(result.storageKey);
    expect(exists).toBe(true);

    // Download and verify content
    const downloaded = await storage.download(result.storageKey);
    expect(downloaded).toEqual(testData);

    // Get URL
    const url = await storage.getUrl(result.storageKey);
    expect(typeof url).toBe('string');
    expect(decodeURIComponent(url)).toContain(result.storageKey);

    // Get metadata
    const metadata = await storage.getMetadata(result.storageKey);
    expect(metadata.size).toBe(5);
    expect(metadata.contentType).toBe('text/plain');

    // Delete file
    await storage.delete(result.storageKey);

    // Verify deletion
    const existsAfterDelete = await storage.exists(result.storageKey);
    expect(existsAfterDelete).toBe(false);
  });

  test('should generate URLs with transformation options', async () => {
    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    const blob = new Blob([testData]);
    const file = new File([blob], 'test.png', { type: 'image/png' });

    const result = await storage.upload(file, {
      contentType: 'image/png'
    });

    // Basic URL
    let url = await storage.getUrl(result.storageKey);
    expect(decodeURIComponent(url)).toContain(result.storageKey);

    // URL with width parameter
    url = await storage.getUrl(result.storageKey, { width: 800 });
    expect(url).toContain('w=800');

    // URL with multiple parameters
    url = await storage.getUrl(result.storageKey, { 
      width: 800, 
      height: 600, 
      quality: 85,
      format: 'webp'
    });
    expect(url).toContain('w=800');
    expect(url).toContain('h=600');
    expect(url).toContain('q=85');
    expect(url).toContain('f=webp');
  });

  test('should handle copy and move operations', async () => {
    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    const blob = new Blob([testData]);
    const file = new File([blob], 'test.txt', { type: 'text/plain' });

    const result1 = await storage.upload(file, {
      contentType: 'text/plain'
    });

    const key1 = result1.storageKey;
    const key2 = 'copied.txt';

    // Copy file
    await storage.copy(key1, key2);

    // Verify both exist
    expect(await storage.exists(key1)).toBe(true);
    expect(await storage.exists(key2)).toBe(true);

    // Verify content is the same
    const data1 = await storage.download(key1);
    const data2 = await storage.download(key2);
    expect(data1).toEqual(data2);

    // Move file
    const key3 = 'moved.txt';
    await storage.move(key2, key3);

    // Original should still exist, copy should be gone
    expect(await storage.exists(key1)).toBe(true);
    expect(await storage.exists(key2)).toBe(false);
    expect(await storage.exists(key3)).toBe(true);

    // Cleanup
    await storage.delete(key1);
    await storage.delete(key3);
  });
});

// Test the factory pattern
describe('StorageFactory', () => {
  test('should create local storage', async () => {
    const storage = await StorageFactory.create('local');
    expect(storage).toBeInstanceOf(LocalAssetStorage);
  });

  test('should throw for unsupported storage type', async () => {
    await expect(StorageFactory.create('unsupported'))
      .rejects.toThrow('Unsupported storage type: unsupported');
  });
});