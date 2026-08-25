/**
 * StorefrontSeoMetadataBridgeEngine.ts — Sprint G1-70 Storefront SEO & Metadata Generator Engine (Night Shift Level 32)
 *
 * Implements a pure TypeScript, headless SEO meta tag compiler, Schema.org JSON-LD structured data generator,
 * OpenGraph social preview builder, and automated XML sitemap generator for published WEB FACTOR websites and storefronts.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface SeoMetaTagsDTO {
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl: string;
  readonly robots: string;
}

export interface OpenGraphMetaDTO {
  readonly ogTitle: string;
  readonly ogDescription: string;
  readonly ogImage: string;
  readonly ogUrl: string;
  readonly ogType: string;
}

export interface SchemaOrgJsonLdDTO {
  readonly context: string;
  readonly type: string;
  readonly name: string;
  readonly description: string;
  readonly jsonString: string;
}

export interface XmlSitemapEntryDTO {
  readonly loc: string;
  readonly lastmod: string;
  readonly changefreq: string;
  readonly priority: number;
}

export interface CompiledSeoPackageDTO {
  readonly metaTags: SeoMetaTagsDTO;
  readonly openGraph: OpenGraphMetaDTO;
  readonly jsonLd?: SchemaOrgJsonLdDTO;
  readonly htmlHeadSnippet: string;
}

export interface SeoMetadataConfigDTO {
  readonly siteId: string;
  readonly baseUrl: string;
  readonly defaultTitle: string;
  readonly defaultDescription: string;
  readonly defaultOgImage: string;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontSeoMetadataBridgeEngine {
  /**
   * Creates a default SEO metadata configuration.
   */
  public static createDefaultSeoConfig(siteId = 'default_storefront_site', baseUrl = 'https://my-store.webfactor.io'): SeoMetadataConfigDTO {
    return {
      siteId,
      baseUrl: baseUrl.replace(/\/$/, ''),
      defaultTitle: 'WEB FACTOR Storefront',
      defaultDescription: 'Professional WEB FACTOR website and ecommerce store.',
      defaultOgImage: `${baseUrl}/assets/og-default.png`,
      lastUpdated: Date.now()
    };
  }

  /**
   * Compiles page SEO meta tags, OpenGraph social properties, and HTML head snippet.
   */
  public static generatePageSeoMetadata(
    config: SeoMetadataConfigDTO,
    pagePath: string,
    title?: string,
    description?: string,
    ogImage?: string
  ): CompiledSeoPackageDTO {
    if (!config) throw new Error('StorefrontSeoMetadataBridgeEngine: Config is null');

    const cleanPath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
    const canonicalUrl = `${config.baseUrl}${cleanPath}`;
    const finalTitle = title || config.defaultTitle;
    const finalDesc = description || config.defaultDescription;
    const finalImage = ogImage || config.defaultOgImage;

    const metaTags: SeoMetaTagsDTO = {
      title: finalTitle,
      description: finalDesc,
      canonicalUrl,
      robots: 'index, follow'
    };

    const openGraph: OpenGraphMetaDTO = {
      ogTitle: finalTitle,
      ogDescription: finalDesc,
      ogImage: finalImage,
      ogUrl: canonicalUrl,
      ogType: pagePath === '/' ? 'website' : 'article'
    };

    const htmlHeadSnippet = `
<title>${metaTags.title}</title>
<meta name="description" content="${metaTags.description}">
<link rel="canonical" href="${metaTags.canonicalUrl}">
<meta name="robots" content="${metaTags.robots}">
<meta property="og:title" content="${openGraph.ogTitle}">
<meta property="og:description" content="${openGraph.ogDescription}">
<meta property="og:image" content="${openGraph.ogImage}">
<meta property="og:url" content="${openGraph.ogUrl}">
<meta property="og:type" content="${openGraph.ogType}">
`.trim();

    return {
      metaTags,
      openGraph,
      htmlHeadSnippet
    };
  }

  /**
   * Generates Schema.org Product JSON-LD structured data for Google Rich Results.
   */
  public static generateProductSchemaOrgLd(
    productName: string,
    description: string,
    priceCents: number,
    currencyCode = 'USD',
    inStock = true
  ): SchemaOrgJsonLdDTO {
    const price = (priceCents / 100).toFixed(2);
    const schemaObj = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: productName,
      description,
      offers: {
        '@type': 'Offer',
        priceCurrency: currencyCode,
        price,
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      }
    };

    return {
      context: 'https://schema.org/',
      type: 'Product',
      name: productName,
      description,
      jsonString: JSON.stringify(schemaObj, null, 2)
    };
  }

  /**
   * Generates automated XML Sitemap string for all published site routes.
   */
  public static generateXmlSitemap(config: SeoMetadataConfigDTO, routes: ReadonlyArray<string>): string {
    if (!config || !routes) return '';

    const entries: XmlSitemapEntryDTO[] = routes.map(r => {
      const cleanPath = r.startsWith('/') ? r : `/${r}`;
      return {
        loc: `${config.baseUrl}${cleanPath}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: r === '/' ? 'daily' : 'weekly',
        priority: r === '/' ? 1.0 : 0.8
      };
    });

    const urlXml = entries.map(e => `
  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`.trim()).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlXml}
</urlset>`.trim();
  }

  /**
   * Serializes SEO metadata config to JSON string.
   */
  public static serializeSeoConfig(config: SeoMetadataConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores SEO metadata config from JSON string.
   */
  public static restoreSeoConfig(json: string): SeoMetadataConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid SEO JSON structure');
      }
      return parsed as SeoMetadataConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore SEO config: ${err.message}`);
    }
  }
}
