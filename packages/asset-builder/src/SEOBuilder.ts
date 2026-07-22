import { PublishContext } from '../../publish-core/src/PublishContext';
import { PublishArtifact } from '../../publish-core/src/PublishArtifact';

export interface SEOBuilder {
  buildSEOArtifacts(context: PublishContext): Promise<PublishArtifact[]>;
}

export class DefaultSEOBuilder implements SEOBuilder {
  async buildSEOArtifacts(context: PublishContext): Promise<PublishArtifact[]> {
    const { storeConfig, request } = context;
    if (!storeConfig) {
      return [];
    }

    const domain = request.mode === 'PREVIEW' ? 'preview.solospot.pl' : 'store.solospot.pl';
    const baseUrl = `https://${domain}/${request.tenantId}/${request.storeId}`;
    const pages = storeConfig.pages || [];

    const encoder = new TextEncoder();

    // 1. Robots.txt
    const robotsTxt = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml`;
    const robotsArtifact: PublishArtifact = {
      path: 'robots.txt',
      contentType: 'text/plain',
      content: encoder.encode(robotsTxt),
      size: encoder.encode(robotsTxt).byteLength
    };

    // 2. Sitemap.xml
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}/${page.slug === '' ? '' : page.slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${page.slug === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

    const sitemapArtifact: PublishArtifact = {
      path: 'sitemap.xml',
      contentType: 'application/xml',
      content: encoder.encode(sitemapXml),
      size: encoder.encode(sitemapXml).byteLength
    };

    // 3. Web App Manifest (manifest.webmanifest)
    const webAppManifest = {
      name: storeConfig.storeName,
      short_name: storeConfig.storeName,
      start_url: '.',
      display: 'standalone',
      background_color: storeConfig.branding?.primaryColor || '#ffffff',
      theme_color: storeConfig.branding?.primaryColor || '#ffffff',
      description: storeConfig.branding?.description || storeConfig.storeName,
    };

    const manifestStr = JSON.stringify(webAppManifest, null, 2);
    const webAppManifestArtifact: PublishArtifact = {
      path: 'manifest.webmanifest',
      contentType: 'application/manifest+json',
      content: encoder.encode(manifestStr),
      size: encoder.encode(manifestStr).byteLength
    };

    return [robotsArtifact, sitemapArtifact, webAppManifestArtifact];
  }
}
