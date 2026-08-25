/**
 * MultiPageNavigationRouterEngine.ts — Sprint G1-57 Multi-Page Navigation & Site Router Engine (Night Shift Level 19)
 *
 * Implements a pure TypeScript, headless multi-page navigation router engine for WEB FACTOR Authoring Studio.
 * Connects page section composition (G1-54), visual builder interaction (G1-55), and canvas runtime (G1-56)
 * to multi-page route management ('/', '/about', '/store', '/cart', '/checkout'), navigation bar links,
 * page route SEO metadata, and multi-page document snapshot SSOT.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot, createVectorWorkspaceState } from '../vector/VectorWorkspaceController';
import {
  PageSectionBlockCompositionEngine,
  PageCompositionDocument,
  PageSectionDTO,
  BlockNodeDTO,
  EcommerceProductBindingDTO,
  ProjectType
} from './PageSectionBlockCompositionEngine';
import { PageBuilderInteractionEngine } from './PageBuilderInteractionEngine';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface RouteSeoMetadataDTO {
  readonly metaTitle?: string;
  readonly metaDescription?: string;
  readonly ogImageUrl?: string;
  readonly keywords?: ReadonlyArray<string>;
}

export interface PageRouteDTO {
  readonly id: string;
  readonly slug: string; // e.g. '/', '/about', '/store', '/cart', '/checkout'
  readonly title: string;
  readonly composition: PageCompositionDocument;
  readonly isHomePage: boolean;
  readonly isSystemPage: boolean;
  readonly seoMetadata?: RouteSeoMetadataDTO;
}

export interface NavigationLinkDTO {
  readonly id: string;
  readonly label: string;
  readonly targetRouteId?: string;
  readonly targetUrl?: string;
  readonly isExternal?: boolean;
}

export interface MultiPageSiteDocument {
  readonly id: string;
  readonly title: string;
  readonly projectType: ProjectType;
  readonly activeRouteId: string;
  readonly routes: ReadonlyArray<PageRouteDTO>;
  readonly navLinks: ReadonlyArray<NavigationLinkDTO>;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface RouterExecutionResult {
  readonly success: boolean;
  readonly siteDocument: MultiPageSiteDocument;
  readonly workspaceState: VectorWorkspaceState;
  readonly activeSnapshot: VectorDocumentSnapshot;
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class MultiPageNavigationRouterEngine {
  /**
   * Initializes a new multi-page site document with default routes and navbar navigation links.
   */
  public static createMultiPageSite(title: string, projectType: ProjectType = 'website'): MultiPageSiteDocument {
    const siteId = `site_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();

    // 1. Create Home Route ('/')
    let homeComp = PageSectionBlockCompositionEngine.createPageComposition(`${title} — Home`, projectType);
    homeComp = PageSectionBlockCompositionEngine.addSection(homeComp, 'navbar', 'navbar_default');
    homeComp = PageSectionBlockCompositionEngine.addSection(homeComp, 'hero', 'hero_default');
    homeComp = PageSectionBlockCompositionEngine.addSection(homeComp, 'features', 'features_grid');
    homeComp = PageSectionBlockCompositionEngine.addSection(homeComp, 'footer', 'footer_default');

    const homeRouteId = 'route_home';
    const homeRoute: PageRouteDTO = {
      id: homeRouteId,
      slug: '/',
      title: 'Home',
      composition: homeComp,
      isHomePage: true,
      isSystemPage: false,
      seoMetadata: { metaTitle: `${title} | Home`, metaDescription: 'Welcome to our official website.' }
    };

    // 2. Create Store/Catalog Route ('/store') for store project types
    const routes: PageRouteDTO[] = [homeRoute];
    const navLinks: NavigationLinkDTO[] = [
      { id: 'link_home', label: 'Home', targetRouteId: homeRouteId }
    ];

    if (projectType === 'ecommerce-store') {
      let storeComp = PageSectionBlockCompositionEngine.createPageComposition(`${title} — Shop`, projectType);
      storeComp = PageSectionBlockCompositionEngine.addSection(storeComp, 'navbar', 'navbar_default');
      storeComp = PageSectionBlockCompositionEngine.addSection(storeComp, 'ecommerce-catalog', 'ecommerce_catalog');
      storeComp = PageSectionBlockCompositionEngine.addSection(storeComp, 'footer', 'footer_default');

      const storeRouteId = 'route_store';
      const storeRoute: PageRouteDTO = {
        id: storeRouteId,
        slug: '/store',
        title: 'Shop Catalog',
        composition: storeComp,
        isHomePage: false,
        isSystemPage: false,
        seoMetadata: { metaTitle: `${title} | Shop Catalog`, metaDescription: 'Browse our full product catalog.' }
      };

      let cartComp = PageSectionBlockCompositionEngine.createPageComposition(`${title} — Cart`, projectType);
      cartComp = PageSectionBlockCompositionEngine.addSection(cartComp, 'navbar', 'navbar_default');
      cartComp = PageSectionBlockCompositionEngine.addSection(cartComp, 'custom', undefined);

      const cartRouteId = 'route_cart';
      const cartRoute: PageRouteDTO = {
        id: cartRouteId,
        slug: '/cart',
        title: 'Cart Summary',
        composition: cartComp,
        isHomePage: false,
        isSystemPage: true,
        seoMetadata: { metaTitle: `${title} | Cart`, metaDescription: 'Your shopping cart items.' }
      };

      let checkoutComp = PageSectionBlockCompositionEngine.createPageComposition(`${title} — Checkout`, projectType);
      checkoutComp = PageSectionBlockCompositionEngine.addSection(checkoutComp, 'navbar', 'navbar_default');
      checkoutComp = PageSectionBlockCompositionEngine.addSection(checkoutComp, 'custom', undefined);

      const checkoutRouteId = 'route_checkout';
      const checkoutRoute: PageRouteDTO = {
        id: checkoutRouteId,
        slug: '/checkout',
        title: 'Checkout',
        composition: checkoutComp,
        isHomePage: false,
        isSystemPage: true,
        seoMetadata: { metaTitle: `${title} | Checkout`, metaDescription: 'Secure checkout and order completion.' }
      };

      routes.push(storeRoute, cartRoute, checkoutRoute);
      navLinks.push(
        { id: 'link_store', label: 'Shop', targetRouteId: storeRouteId },
        { id: 'link_cart', label: 'Cart', targetRouteId: cartRouteId },
        { id: 'link_checkout', label: 'Checkout', targetRouteId: checkoutRouteId }
      );
    } else {
      let aboutComp = PageSectionBlockCompositionEngine.createPageComposition(`${title} — About`, projectType);
      aboutComp = PageSectionBlockCompositionEngine.addSection(aboutComp, 'navbar', 'navbar_default');
      aboutComp = PageSectionBlockCompositionEngine.addSection(aboutComp, 'features', 'features_grid');
      aboutComp = PageSectionBlockCompositionEngine.addSection(aboutComp, 'footer', 'footer_default');

      const aboutRouteId = 'route_about';
      const aboutRoute: PageRouteDTO = {
        id: aboutRouteId,
        slug: '/about',
        title: 'About Us',
        composition: aboutComp,
        isHomePage: false,
        isSystemPage: false,
        seoMetadata: { metaTitle: `${title} | About Us`, metaDescription: 'Learn more about our company and mission.' }
      };

      routes.push(aboutRoute);
      navLinks.push({ id: 'link_about', label: 'About', targetRouteId: aboutRouteId });
    }

    return {
      id: siteId,
      title: title || 'Untitled Site',
      projectType,
      activeRouteId: homeRouteId,
      routes,
      navLinks,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Adds a new page route to the site document.
   */
  public static addPageRoute(
    siteDoc: MultiPageSiteDocument,
    title: string,
    slug: string,
    isSystemPage: boolean = false,
    presetId?: string
  ): MultiPageSiteDocument {
    if (!siteDoc) throw new Error('MultiPageNavigationRouterEngine: Site document is null or undefined');

    const formattedSlug = slug.startsWith('/') ? slug : `/${slug}`;
    const routeId = `route_${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString(36)}`;

    let comp = PageSectionBlockCompositionEngine.createPageComposition(title, siteDoc.projectType);
    comp = PageSectionBlockCompositionEngine.addSection(comp, 'navbar', 'navbar_default');
    if (presetId) {
      comp = PageSectionBlockCompositionEngine.addSection(comp, 'hero', presetId);
    }
    comp = PageSectionBlockCompositionEngine.addSection(comp, 'footer', 'footer_default');

    const newRoute: PageRouteDTO = {
      id: routeId,
      slug: formattedSlug,
      title,
      composition: comp,
      isHomePage: false,
      isSystemPage,
      seoMetadata: { metaTitle: `${siteDoc.title} | ${title}`, metaDescription: `Page for ${title}` }
    };

    const newNavLink: NavigationLinkDTO = {
      id: `link_${routeId}`,
      label: title,
      targetRouteId: routeId
    };

    return {
      ...siteDoc,
      routes: [...siteDoc.routes, newRoute],
      navLinks: [...siteDoc.navLinks, newNavLink],
      updatedAt: Date.now()
    };
  }

  /**
   * Removes a page route by route ID.
   */
  public static removePageRoute(siteDoc: MultiPageSiteDocument, routeId: string): MultiPageSiteDocument {
    if (!siteDoc) return siteDoc;
    const targetRoute = siteDoc.routes.find(r => r.id === routeId);
    if (!targetRoute || targetRoute.isHomePage) return siteDoc; // Cannot remove home page

    const nextRoutes = siteDoc.routes.filter(r => r.id !== routeId);
    const nextNavLinks = siteDoc.navLinks.filter(l => l.targetRouteId !== routeId);
    const nextActiveId = siteDoc.activeRouteId === routeId ? siteDoc.routes[0].id : siteDoc.activeRouteId;

    return {
      ...siteDoc,
      activeRouteId: nextActiveId,
      routes: nextRoutes,
      navLinks: nextNavLinks,
      updatedAt: Date.now()
    };
  }

  /**
   * Switches the active page route context and updates VectorWorkspaceState SSOT.
   */
  public static switchActiveRoute(
    siteDoc: MultiPageSiteDocument,
    workspaceState: VectorWorkspaceState,
    routeId: string
  ): RouterExecutionResult {
    if (!siteDoc) {
      return {
        success: false,
        siteDocument: siteDoc,
        workspaceState,
        activeSnapshot: workspaceState.snapshot,
        error: 'Site document is null'
      };
    }

    const targetRoute = siteDoc.routes.find(r => r.id === routeId);
    if (!targetRoute) {
      return {
        success: false,
        siteDocument: siteDoc,
        workspaceState,
        activeSnapshot: workspaceState.snapshot,
        error: `Route ${routeId} not found`
      };
    }

    const updatedSiteDoc: MultiPageSiteDocument = {
      ...siteDoc,
      activeRouteId: routeId,
      updatedAt: Date.now()
    };

    const activeSnapshot = PageSectionBlockCompositionEngine.toVectorDocumentSnapshot(targetRoute.composition);
    const nextHistoryStack = workspaceState.historyStack.push(activeSnapshot, `Switch Route (${targetRoute.slug})`);

    const syncedState: VectorWorkspaceState = {
      snapshot: activeSnapshot,
      historyStack: nextHistoryStack
    };

    return {
      success: true,
      siteDocument: updatedSiteDoc,
      workspaceState: syncedState,
      activeSnapshot
    };
  }

  /**
   * Updates route SEO metadata (metaTitle, metaDescription, ogImageUrl).
   */
  public static updateRouteMetadata(
    siteDoc: MultiPageSiteDocument,
    routeId: string,
    metadataPatch: Partial<RouteSeoMetadataDTO>
  ): MultiPageSiteDocument {
    if (!siteDoc || !metadataPatch) return siteDoc;

    const nextRoutes = siteDoc.routes.map(r => {
      if (r.id !== routeId) return r;
      return {
        ...r,
        seoMetadata: {
          ...r.seoMetadata,
          ...metadataPatch
        }
      };
    });

    return {
      ...siteDoc,
      routes: nextRoutes,
      updatedAt: Date.now()
    };
  }

  /**
   * Adds a navigation link DTO to the site document.
   */
  public static addNavigationLink(
    siteDoc: MultiPageSiteDocument,
    label: string,
    targetRouteId?: string,
    targetUrl?: string
  ): MultiPageSiteDocument {
    if (!siteDoc || !label) return siteDoc;

    const newLink: NavigationLinkDTO = {
      id: `link_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      label,
      targetRouteId,
      targetUrl,
      isExternal: !!targetUrl
    };

    return {
      ...siteDoc,
      navLinks: [...siteDoc.navLinks, newLink],
      updatedAt: Date.now()
    };
  }

  /**
   * Removes a navigation link DTO by link ID.
   */
  public static removeNavigationLink(siteDoc: MultiPageSiteDocument, linkId: string): MultiPageSiteDocument {
    if (!siteDoc) return siteDoc;
    return {
      ...siteDoc,
      navLinks: siteDoc.navLinks.filter(l => l.id !== linkId),
      updatedAt: Date.now()
    };
  }

  /**
   * Reorders navigation links in the navigation bar.
   */
  public static reorderNavigationLinks(
    siteDoc: MultiPageSiteDocument,
    linkId: string,
    targetIndex: number
  ): MultiPageSiteDocument {
    if (!siteDoc || targetIndex < 0 || targetIndex >= siteDoc.navLinks.length) return siteDoc;

    const currentIdx = siteDoc.navLinks.findIndex(l => l.id === linkId);
    if (currentIdx === -1 || currentIdx === targetIndex) return siteDoc;

    const nextLinks = [...siteDoc.navLinks];
    const [moved] = nextLinks.splice(currentIdx, 1);
    nextLinks.splice(targetIndex, 0, moved);

    return {
      ...siteDoc,
      navLinks: nextLinks,
      updatedAt: Date.now()
    };
  }

  /**
   * Synchronizes active route composition snapshot SSOT.
   */
  public static getActiveRouteSnapshot(siteDoc: MultiPageSiteDocument): VectorDocumentSnapshot {
    if (!siteDoc || !siteDoc.routes || siteDoc.routes.length === 0) {
      return { nodes: [], selectedIds: [], constraintEdges: [] };
    }

    const activeRoute = siteDoc.routes.find(r => r.id === siteDoc.activeRouteId) || siteDoc.routes[0];
    return PageSectionBlockCompositionEngine.toVectorDocumentSnapshot(activeRoute.composition);
  }

  /**
   * Renders multi-page HTML site map & preview markup.
   */
  public static exportMultiPageSiteHtml(siteDoc: MultiPageSiteDocument): string {
    if (!siteDoc || !siteDoc.routes) return '<main class="web-factor-site-empty"></main>';

    const pagesHtml = siteDoc.routes.map(r => {
      const pageMarkup = PageSectionBlockCompositionEngine.exportToHtmlString(r.composition);
      return `
        <article id="route_${r.id}" class="site-route-preview" data-slug="${r.slug}" data-is-active="${r.id === siteDoc.activeRouteId}">
          <header class="route-header">
            <h2>${r.title} (${r.slug})</h2>
            <meta name="title" content="${r.seoMetadata?.metaTitle || r.title}" />
            <meta name="description" content="${r.seoMetadata?.metaDescription || ''}" />
          </header>
          <div class="route-content">
            ${pageMarkup}
          </div>
        </article>
      `.trim();
    }).join('\n\n');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${siteDoc.title} — Multi-Page Site Preview</title>
        <style>
          body { font-family: Inter, sans-serif; margin: 0; padding: 20px; background: #F3F4F6; }
          .site-route-preview { margin-bottom: 40px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
          .route-header { padding: 12px 20px; background: #1E293B; color: white; }
          .route-header h2 { margin: 0; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="web-factor-site-container" data-project-type="${siteDoc.projectType}">
          ${pagesHtml}
        </div>
      </body>
      </html>
    `.trim();
  }
}
