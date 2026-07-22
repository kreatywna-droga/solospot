import { AssetBuilder } from './AssetBuilder';
import { AssetHasher } from './AssetHasher';
import { AssetOptimizer } from './AssetOptimizer';
import { SEOBuilder } from './SEOBuilder';
import { PublishContext } from '../../publish-core/src/PublishContext';
import { PublishArtifact } from '../../publish-core/src/PublishArtifact';
import { createAssetManifest, createManifestArtifact } from './AssetManifest';
import { AssetManifestEntry, PageManifestEntry, AssetType } from './AssetTypes';

export interface AssetPipeline {
  readonly builder: AssetBuilder;
  readonly hasher: AssetHasher;
  readonly optimizer?: AssetOptimizer;
  readonly seoBuilder?: SEOBuilder;
  
  process(context: PublishContext): Promise<PublishArtifact[]>;
}

export class DefaultAssetPipeline implements AssetPipeline {
  readonly builder: AssetBuilder;
  readonly hasher: AssetHasher;
  readonly optimizer?: AssetOptimizer;
  readonly seoBuilder?: SEOBuilder;

  constructor(params: {
    builder: AssetBuilder;
    hasher: AssetHasher;
    optimizer?: AssetOptimizer;
    seoBuilder?: SEOBuilder;
  }) {
    this.builder = params.builder;
    this.hasher = params.hasher;
    this.optimizer = params.optimizer;
    this.seoBuilder = params.seoBuilder;
  }

  async process(context: PublishContext): Promise<PublishArtifact[]> {
    const rawArtifacts = await this.builder.build(context);

    const seoArtifacts = this.seoBuilder
      ? await this.seoBuilder.buildSEOArtifacts(context)
      : [];

    const allRawArtifacts = [...context.artifacts, ...rawArtifacts, ...seoArtifacts];

    const optimizedArtifacts: PublishArtifact[] = [];
    for (const artifact of allRawArtifacts) {
      if (this.optimizer) {
        optimizedArtifacts.push(await this.optimizer.optimize(artifact));
      } else {
        optimizedArtifacts.push(artifact);
      }
    }

    const processedArtifacts: PublishArtifact[] = [];
    const assetsEntries: AssetManifestEntry[] = [];
    const pagesEntries: PageManifestEntry[] = [];

    const pages = context.storeConfig?.pages || [];

    for (const artifact of optimizedArtifacts) {
      const isHtml = artifact.contentType === 'text/html';
      const isStaticRoute = artifact.path === 'robots.txt' || artifact.path === 'sitemap.xml' || artifact.path === 'manifest.webmanifest';

      if (isHtml) {
        const matchedPage = pages.find(p => 
          (p.slug === '' && artifact.path === 'index.html') || 
          (`${p.slug}/index.html` === artifact.path)
        );

        pagesEntries.push({
          id: matchedPage?.id || `page_${artifact.path}`,
          slug: matchedPage?.slug ?? artifact.path.replace('/index.html', ''),
          name: matchedPage?.name || artifact.path,
          path: artifact.path
        });

        processedArtifacts.push(artifact);
      } else if (isStaticRoute) {
        processedArtifacts.push(artifact);
      } else {
        const hash = this.hasher.hash(artifact.content);
        const fingerprintedPath = this.hasher.fingerprint(artifact.path, hash);
        
        let type: AssetType = 'other';
        if (artifact.contentType.includes('css')) type = 'stylesheet';
        else if (artifact.contentType.includes('javascript')) type = 'javascript';
        else if (artifact.contentType.includes('image')) type = 'image';
        else if (artifact.contentType.includes('font')) type = 'font';

        assetsEntries.push({
          path: fingerprintedPath,
          originalPath: artifact.path,
          type,
          contentType: artifact.contentType,
          size: artifact.size,
          hash
        });

        processedArtifacts.push({
          ...artifact,
          path: fingerprintedPath,
          hash
        });
      }
    }

    const manifest = createAssetManifest({
      assets: assetsEntries,
      pages: pagesEntries,
      runtimeVersion: '1.0.0',
    });

    const manifestArtifact = createManifestArtifact(manifest);
    processedArtifacts.push(manifestArtifact);

    return processedArtifacts;
  }
}
