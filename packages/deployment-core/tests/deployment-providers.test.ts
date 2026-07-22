import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  DeployProvider, 
  DeployRequest, 
  LocalProvider, 
  StaticExportProvider,
  DefaultDeploymentRegistry
} from '../src';
import { AssetManifest } from '../../asset-builder/src/AssetTypes';
import { PublishArtifact } from '../../publish-core/src/PublishArtifact';

async function safeCleanup(dirPath: string) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

function runDeployProviderContractTests(
  providerName: string,
  createProvider: () => DeployProvider,
  getTestDestination: () => string
) {
  describe(`Deployment Provider Contract Tests: ${providerName}`, () => {
    let provider: DeployProvider;
    let testDest: string;

    const mockManifest: AssetManifest = {
      version: '1.0.0',
      buildId: 'build-test-123',
      runtimeVersion: '1.0.0',
      assets: [],
      pages: [],
      integrity: {},
      generatedAt: new Date().toISOString()
    };

    const mockArtifacts: PublishArtifact[] = [
      {
        path: 'index.html',
        contentType: 'text/html',
        content: '<html>Home</html>',
        size: 17,
        hash: 'hash-html'
      },
      {
        path: 'assets/styles.css',
        contentType: 'text/css',
        content: 'body { color: red; }',
        size: 20,
        hash: 'hash-css'
      }
    ];

    beforeEach(async () => {
      provider = createProvider();
      testDest = getTestDestination();
      await safeCleanup(testDest);
    });

    afterEach(async () => {
      await safeCleanup(testDest);
    });

    it('should successfully deploy all artifacts and manifest', async () => {
      const request: DeployRequest = {
        target: {
          type: provider.type,
          destination: testDest
        },
        artifacts: mockArtifacts,
        manifest: mockManifest,
        correlationId: 'test-correlation-123'
      };

      const result = await provider.deploy(request);
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.deployedArtifactsCount).toBe(2);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);

      // Verify files physically exist
      const file1Exists = await fs.access(path.join(testDest, 'index.html')).then(() => true).catch(() => false);
      const file2Exists = await fs.access(path.join(testDest, 'assets/styles.css')).then(() => true).catch(() => false);
      expect(file1Exists).toBe(true);
      expect(file2Exists).toBe(true);

      const file1Content = await fs.readFile(path.join(testDest, 'index.html'), 'utf-8');
      expect(file1Content).toBe('<html>Home</html>');
    });

    it('should overwrite existing files on redeploy', async () => {
      const target = {
        type: provider.type,
        destination: testDest
      };

      const request1: DeployRequest = {
        target,
        artifacts: mockArtifacts,
        manifest: mockManifest,
        correlationId: 'corr-1'
      };

      await provider.deploy(request1);

      const modifiedArtifacts = [
        {
          path: 'index.html',
          contentType: 'text/html',
          content: '<html>Home v2</html>',
          size: 20,
          hash: 'hash-html-v2'
        }
      ];

      const request2: DeployRequest = {
        target,
        artifacts: modifiedArtifacts,
        manifest: mockManifest,
        correlationId: 'corr-2'
      };

      const result = await provider.deploy(request2);
      expect(result.success).toBe(true);

      const content = await fs.readFile(path.join(testDest, 'index.html'), 'utf-8');
      expect(content).toBe('<html>Home v2</html>');
    });

    if (createProvider().capabilities.includes('ROLLBACK')) {
      it('should rollback deployed files successfully', async () => {
        const request: DeployRequest = {
          target: {
            type: provider.type,
            destination: testDest
          },
          artifacts: mockArtifacts,
          manifest: mockManifest,
          correlationId: 'corr-rollback'
        };

        await provider.deploy(request);

        expect(provider.rollback).toBeDefined();
        const rollbackResult = await provider.rollback!(request);
        expect(rollbackResult.success).toBe(true);

        const file1Exists = await fs.access(path.join(testDest, 'index.html')).then(() => true).catch(() => false);
        expect(file1Exists).toBe(false);
      });
    }

    it('should fail gracefully on invalid destination', async () => {
      const request: DeployRequest = {
        target: {
          type: provider.type,
          destination: ''
        },
        artifacts: mockArtifacts,
        manifest: mockManifest,
        correlationId: 'corr-invalid'
      };

      const result = await provider.deploy(request);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
}

// Run LocalProvider Contract Tests
runDeployProviderContractTests(
  'LocalProvider',
  () => new LocalProvider(),
  () => path.join(__dirname, 'temp_local_deploy')
);

// Run StaticExportProvider Contract Tests
runDeployProviderContractTests(
  'StaticExportProvider',
  () => new StaticExportProvider(),
  () => path.join(__dirname, 'temp_static_deploy')
);

describe('DeploymentRegistry', () => {
  it('should register, retrieve, and resolve providers correctly', () => {
    const registry = new DefaultDeploymentRegistry();
    const local = new LocalProvider();
    
    registry.register('local', local);
    expect(registry.get('local')).toBe(local);
    expect(registry.get('LOCAL')).toBe(local); // case-insensitive

    const resolved = registry.resolve({ type: 'local', destination: 'foo' });
    expect(resolved).toBe(local);

    registry.unregister('local');
    expect(registry.get('local')).toBeUndefined();
  });

  it('should throw error when resolving unregistered provider', () => {
    const registry = new DefaultDeploymentRegistry();
    expect(() => registry.resolve({ type: 'ftp', destination: 'foo' })).toThrow(
      'Deployment provider not found for target type: ftp'
    );
  });
});
