import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';
import { TenantResolver } from '../../platform-core/src/tenant/TenantResolver';
import { StoreRuntimeEngine } from '../../runtime-composition/src/StoreRuntimeEngine';
import { ThemeResolver } from './ThemeResolver';
import { ThemeRuntime } from './ThemeRuntime';
import { RendererEngine, StorefrontRenderContext } from './RendererEngine';

export interface StorefrontRequest {
  host: string;
  path: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
}

export interface StorefrontResponse {
  statusCode: number;
  headers: Record<string, string>;
  html: string;
  cacheStatus: 'HIT' | 'MISS' | 'BYPASS';
}

export interface SEOMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  ogImage?: string;
  jsonLdSchema?: Record<string, any>;
}

export interface ResolvedPage {
  routeType: 'home' | 'products_list' | 'product_detail' | 'cart' | 'checkout' | 'account';
  title: string;
  seo: SEOMetadata;
  data: Record<string, any>;
}

export class StorefrontRuntime {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;
  private readonly tenantResolver: TenantResolver;
  private readonly storeRuntimeEngine: StoreRuntimeEngine;
  private readonly themeResolver: ThemeResolver;
  private readonly themeRuntime: ThemeRuntime;
  private readonly rendererEngine: RendererEngine;

  // Runtime Instances Cache
  private readonly activeStoreRuntimes = new Map<string, any>();

  // L2 Page Cache: tenantId:path -> cache payload
  private readonly pageCache = new Map<string, { html: string; expiresAt: number }>();
  private readonly defaultTtlMs = 3600 * 1000; // 1 hour default

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
    tenantResolver: TenantResolver;
    storeRuntimeEngine: StoreRuntimeEngine;
    themeResolver: ThemeResolver;
    themeRuntime: ThemeRuntime;
    rendererEngine: RendererEngine;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;
    this.tenantResolver = options.tenantResolver;
    this.storeRuntimeEngine = options.storeRuntimeEngine;
    this.themeResolver = options.themeResolver;
    this.themeRuntime = options.themeRuntime;
    this.rendererEngine = options.rendererEngine;

    // Register Storefront events
    const storefrontEvents = [
      'Storefront.RequestReceived',
      'Storefront.RouteMatched',
      'Storefront.PageResolved',
      'Storefront.CacheHit',
      'Storefront.ResponseSent',
    ];
    for (const evt of storefrontEvents) {
      EventRegistry.register(evt);
    }
  }

  /**
   * Matches route from path.
   */
  public matchRoute(path: string): { routeType: ResolvedPage['routeType']; params: Record<string, string> } | null {
    const cleanPath = path.split('?')[0].replace(/\/+$/, '') || '/';

    if (cleanPath === '/') {
      return { routeType: 'home', params: {} };
    }
    if (cleanPath === '/products') {
      return { routeType: 'products_list', params: {} };
    }
    if (cleanPath === '/cart') {
      return { routeType: 'cart', params: {} };
    }
    if (cleanPath === '/checkout') {
      return { routeType: 'checkout', params: {} };
    }
    if (cleanPath === '/account') {
      return { routeType: 'account', params: {} };
    }

    const productMatch = cleanPath.match(/^\/product\/([^/]+)$/);
    if (productMatch) {
      return { routeType: 'product_detail', params: { slug: productMatch[1] } };
    }

    return null;
  }

  /**
   * Resolves page data and generates SEO properties.
   */
  public resolvePage(
    routeType: ResolvedPage['routeType'],
    params: Record<string, string>,
    shopName: string,
    host: string,
    path: string
  ): ResolvedPage {
    const canonicalUrl = `https://${host}${path}`;

    switch (routeType) {
      case 'home':
        return {
          routeType,
          title: `Główna - ${shopName}`,
          seo: {
            title: `Główna - ${shopName}`,
            description: `Witaj w sklepie ${shopName}. Zobacz nasze najlepsze produkty.`,
            canonicalUrl,
            robots: 'index, follow',
            jsonLdSchema: {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              'name': shopName,
              'url': `https://${host}`,
            },
          },
          data: {},
        };
      case 'products_list':
        return {
          routeType,
          title: `Produkty - ${shopName}`,
          seo: {
            title: `Produkty - ${shopName}`,
            description: `Lista produktów w sklepie ${shopName}. Znajdź coś dla siebie.`,
            canonicalUrl,
            robots: 'index, follow',
          },
          data: {},
        };
      case 'product_detail': {
        const slug = params.slug || 'product';
        const productName = slug
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return {
          routeType,
          title: `${productName} - ${shopName}`,
          seo: {
            title: `${productName} - ${shopName}`,
            description: `Kup ${productName} w sklepie ${shopName}. Najwyższa jakość gwarantowana.`,
            canonicalUrl,
            robots: 'index, follow',
            jsonLdSchema: {
              '@context': 'https://schema.org',
              '@type': 'Product',
              'name': productName,
              'description': `Kup ${productName} w najlepszej cenie.`,
            },
          },
          data: { slug },
        };
      }
      case 'cart':
        return {
          routeType,
          title: `Koszyk - ${shopName}`,
          seo: {
            title: `Koszyk - ${shopName}`,
            description: 'Podsumowanie Twojego koszyka zakupowego.',
            canonicalUrl,
            robots: 'noindex, nofollow',
          },
          data: {},
        };
      case 'checkout':
        return {
          routeType,
          title: `Kasa - ${shopName}`,
          seo: {
            title: `Kasa - ${shopName}`,
            description: 'Sfinalizuj swoje zamówienie.',
            canonicalUrl,
            robots: 'noindex, nofollow',
          },
          data: {},
        };
      case 'account':
        return {
          routeType,
          title: `Konto - ${shopName}`,
          seo: {
            title: `Konto - ${shopName}`,
            description: 'Twój profil klienta.',
            canonicalUrl,
            robots: 'noindex, nofollow',
          },
          data: {},
        };
    }
  }

  /**
   * Generates SEO meta tags block.
   */
  private generateSEOTags(seo: SEOMetadata): string {
    return `
<meta name="description" content="${seo.description}" />
<link rel="canonical" href="${seo.canonicalUrl}" />
<meta name="robots" content="${seo.robots}" />
${seo.ogImage ? `<meta property="og:image" content="${seo.ogImage}" />` : ''}
${seo.jsonLdSchema ? `<script type="application/ld+json">${JSON.stringify(seo.jsonLdSchema)}</script>` : ''}
    `.trim();
  }

  /**
   * Handles a public HTTP request for a storefront tenant.
   */
  public async handleRequest(req: StorefrontRequest, correlationId?: string): Promise<StorefrontResponse> {
    const cid = correlationId || `sf_req_${Date.now()}`;

    // Publish event: Storefront.RequestReceived
    await this.eventBus.publish({
      eventId: `evt_sf_recv_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Storefront.RequestReceived',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId: 'system',
      payload: { path: req.path, host: req.host },
    });

    try {
      // 1. Resolve Tenant Context
      const tenantContext = await this.tenantResolver.resolve({
        headers: {
          host: req.host,
          ...req.headers,
          'x-correlation-id': cid,
        },
        url: `http://${req.host}${req.path}`,
      });

      const tenantId = tenantContext.tenantId;

      // 2. Check L2 Cache (only for cacheable pages)
      const routeInfo = this.matchRoute(req.path);
      if (!routeInfo) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          html: '<h1>404 Not Found</h1>',
          cacheStatus: 'BYPASS',
        };
      }

      // Publish event: Storefront.RouteMatched
      await this.eventBus.publish({
        eventId: `evt_sf_route_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Storefront.RouteMatched',
        timestamp: new Date().toISOString(),
        correlationId: cid,
        tenantId,
        payload: { routeType: routeInfo.routeType },
      });

      const isCacheable = ['home', 'products_list', 'product_detail'].includes(routeInfo.routeType);
      const cacheKey = `${tenantId}:${req.path}`;

      if (isCacheable) {
        const cached = this.pageCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          // Publish event: Storefront.CacheHit
          await this.eventBus.publish({
            eventId: `evt_sf_cache_${Math.random().toString(36).substr(2, 9)}`,
            eventType: 'Storefront.CacheHit',
            timestamp: new Date().toISOString(),
            correlationId: cid,
            tenantId,
            payload: { path: req.path },
          });

          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=3600',
            },
            html: cached.html,
            cacheStatus: 'HIT',
          };
        }
      }

      // 3. Resolve active StoreRuntime
      let storeRuntime = this.activeStoreRuntimes.get(tenantId);
      if (!storeRuntime) {
        storeRuntime = await this.storeRuntimeEngine.createRuntimeFromTenantContext(tenantContext, cid);
        this.activeStoreRuntimes.set(tenantId, storeRuntime);
      }

      // 4. Resolve active Theme Manifest via ThemeResolver
      const themeId = storeRuntime.runtimeSnapshot?.theme?.id || 'default-theme';
      const manifest = await this.themeResolver.resolveTheme(tenantId, themeId);

      // 5. Load Theme on ThemeRuntime
      await this.themeRuntime.loadTheme(tenantId, manifest, cid);

      // 6. Resolve Page SEO & Data
      const pageInfo = this.resolvePage(routeInfo.routeType, routeInfo.params, tenantContext.slug, req.host, req.path);

      // Publish event: Storefront.PageResolved
      await this.eventBus.publish({
        eventId: `evt_sf_page_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Storefront.PageResolved',
        timestamp: new Date().toISOString(),
        correlationId: cid,
        tenantId,
        payload: { title: pageInfo.title },
      });

      // 7. Construct Storefront Render Context
      const renderContext: StorefrontRenderContext = {
        tenantId,
        shopName: tenantContext.slug,
        locale: tenantContext.metadata?.locale || 'pl_PL',
        currency: tenantContext.metadata?.currency || 'PLN',
        themeId,
        tokens: manifest.tokens,
        page: {
          title: pageInfo.title,
          type: routeInfo.routeType,
          data: pageInfo.data,
        },
      };

      // 8. Prepare Layout Template (with seo_tags slot)
      const layoutTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>{{page_title}}</title>
  <!-- seo_tags -->
  <!-- tokens_styles -->
</head>
<body>
  <!-- slot:header -->
  <main>
    <!-- slot:main_content -->
  </main>
  <!-- slot:footer -->
</body>
</html>
      `.trim();

      // Inject SEO
      const seoTagsStr = this.generateSEOTags(pageInfo.seo);
      let pageTemplate = layoutTemplate.replace(/<!--\s*seo_tags\s*-->/g, seoTagsStr);
      pageTemplate = pageTemplate.replace(/\{\{\s*seo_tags\s*\}\}/g, seoTagsStr);

      // Register layout components in the ThemeRuntime
      this.themeRuntime.registerComponent(tenantId, 'header', {
        name: 'Header',
        type: 'atom',
        render: (props) => `<header><h1>${props.title || 'Shop'}</h1></header>`,
      });
      this.themeRuntime.registerComponent(tenantId, 'footer', {
        name: 'Footer',
        type: 'atom',
        render: () => `<footer>All rights reserved.</footer>`,
      });
      this.themeRuntime.registerComponent(tenantId, 'main_content', {
        name: 'MainContent',
        type: 'widget',
        render: (props) => `<section><h2>Welcome!</h2><p>Slug: ${props.slug || 'none'}</p></section>`,
      });

      // Render Page via RendererEngine
      const slots = {
        header: { componentName: 'header', props: { title: tenantContext.slug } },
        main_content: { componentName: 'main_content', props: pageInfo.data },
        footer: { componentName: 'footer', props: {} },
      };

      const finalHtml = await this.rendererEngine.renderPage(renderContext, pageTemplate, slots, cid);

      // 9. Store in L2 Page Cache if cacheable
      if (isCacheable) {
        this.pageCache.set(cacheKey, {
          html: finalHtml,
          expiresAt: Date.now() + this.defaultTtlMs,
        });
      }

      // Publish event: Storefront.ResponseSent
      await this.eventBus.publish({
        eventId: `evt_sf_resp_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Storefront.ResponseSent',
        timestamp: new Date().toISOString(),
        correlationId: cid,
        tenantId,
        payload: { statusCode: 200, cacheStatus: 'MISS' },
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': isCacheable ? 'public, max-age=3600' : 'no-store, must-revalidate',
        },
        html: finalHtml,
        cacheStatus: isCacheable ? 'MISS' : 'BYPASS',
      };
    } catch (err: any) {
      this.logger.error({
        message: `Storefront request processing failed: ${err.message}`,
        correlationId: cid,
      });

      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        html: `<h1>500 Internal Server Error</h1><p>${err.message}</p>`,
        cacheStatus: 'BYPASS',
      };
    }
  }

  /**
   * Invalidates a page in the cache.
   */
  public invalidatePageCache(tenantId: string, path: string): void {
    const cacheKey = `${tenantId}:${path}`;
    this.pageCache.delete(cacheKey);
  }

  /**
   * Cleans up running instances.
   */
  public async disposeAllRuntimes(): Promise<void> {
    for (const [tenantId, runtime] of this.activeStoreRuntimes.entries()) {
      await this.storeRuntimeEngine.disposeRuntime(runtime);
    }
    this.activeStoreRuntimes.clear();
    this.pageCache.clear();
  }
}
